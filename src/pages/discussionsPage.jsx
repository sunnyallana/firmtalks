import React, { useState, useEffect, useRef } from 'react';
import { SignInButton, useAuth } from '@clerk/clerk-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Alert,
  AlertTitle,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme
} from '@mui/material';
import {
  Link as LinkIcon,
  MessageSquare,
  ThumbsUp,
  Clock,
  Edit2,
  Trash2,
  ArrowRight,
  Send,
  Share2
} from 'lucide-react';
import {
  LinkedIn as LinkedInIcon,
  WhatsApp as WhatsAppIcon,
  Twitter as TwitterIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import MessageIcon from '@mui/icons-material/Message';
import { DiscussionForm } from '../components/discussions/discussion-form';
import { io } from 'socket.io-client';
import { Pagination } from '@mui/material';
import MarkdownRenderer from '../components/markdown-renderer';
import removeMarkdown from 'remove-markdown';

const defaultAvatar = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

export function DiscussionsPage() {
  const { getToken, userId, isSignedIn } = useAuth();
  const [discussions, setDiscussions] = useState([]);
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingDiscussion, setEditingDiscussion] = useState(null);
  const theme = useTheme();
  const [socket, setSocket] = useState(null);
  const { discussionId } = useParams();
  const [searchParams] = useSearchParams();
  const viewFirst = searchParams.get('viewFirst') === 'true';
  const [sortType, setSortType] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);
  
    newSocket.on('new-discussion', (newDiscussion) => {
      setTotalItems(prev => prev + 1);
      if (currentPage === 1) {
        setDiscussions(prev => [newDiscussion, ...prev.slice(0, itemsPerPage - 1)]);
      }
    });
  
    newSocket.on('update-discussion', (updatedDiscussion) => {
      setDiscussions(prev => prev.map(d => 
        d._id === updatedDiscussion._id ? updatedDiscussion : d
      ));
    });
  
    newSocket.on('delete-discussion', (deletedId) => {
      setTotalItems(prev => prev - 1);
      setDiscussions(prev => {
        const updated = prev.filter(d => d._id !== deletedId);
        if (updated.length === 0 && currentPage > 1) {
          setCurrentPage(prevPage => prevPage - 1);
        }
        return updated;
      });   
      fetchDiscussions();
    });

    newSocket.on('like-update', (data) => {
      if (data.targetModel === 'Discussion') {
        setDiscussions(prev => {
          const updated = prev.map(d => 
            d._id === data.targetId ? { ...d, likesCount: data.likesCount } : d
          );
          
          if (sortType === 'likes') {
            return updated.sort((a, b) => b.likesCount - a.likesCount);
          }
          return updated;
        });
      }
    });

    newSocket.on('new-reply', ({ discussionId }) => {
      setDiscussions(prev => prev.map(d => 
        d._id === discussionId ? { ...d, repliesCount: d.repliesCount + 1 } : d
      ));
    });
  
    newSocket.on('delete-reply', ({ discussionId }) => {
      setDiscussions(prev => prev.map(d => 
        d._id === discussionId ? { ...d, repliesCount: d.repliesCount - 1 } : d
      ));
    });
  
    return () => newSocket.disconnect();
  }, [currentPage, itemsPerPage, sortType]);

  useEffect(() => {
    fetchDiscussions();
  }, [sortType, currentPage, itemsPerPage]);


  const fetchDiscussions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `http://localhost:3000/api/discussions?sort=${sortType}&page=${currentPage}&limit=${itemsPerPage}`
      );
      if (!response.ok) throw new Error(`Error fetching discussions: ${response.status}`);
      const data = await response.json();

      setTotalItems(data.totalItems);

      let processedDiscussions = data.discussions || [];
      
      if (viewFirst && discussionId) {
        const selectedDiscussionIndex = processedDiscussions.findIndex(d => d._id === discussionId);
        if (selectedDiscussionIndex !== -1) {
          const selectedDiscussion = processedDiscussions.splice(selectedDiscussionIndex, 1)[0];
          processedDiscussions.unshift(selectedDiscussion);
        }
      }

      setDiscussions(processedDiscussions);
      setError(null);
    } catch (error) {
      console.error('Error fetching discussions:', error);
      setError('Failed to load discussions. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitDiscussion = async (data) => {
    if (!isSignedIn) {
      setError('Please sign in to create a discussion');
      return;
    }
  
    try {
      setIsLoading(true);
      const token = await getToken();
      
      let url = 'http://localhost:3000/api/discussions';
      let method = 'POST';
      
      if (editingDiscussion) {
        url = `http://localhost:3000/api/discussions/${editingDiscussion._id}`;
        method = 'PUT';
      }

      setCurrentPage(1);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          tags: data.tags,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${editingDiscussion ? 'updating' : 'creating'} discussion: ${response.status}`);
      }

      const result = await response.json();
      
      setShowNewDiscussion(false);
      setEditingDiscussion(null);
      setCurrentPage(1);
      setError(null);
    } catch (err) {
      setError(err.message || `Failed to ${editingDiscussion ? 'update' : 'create'} discussion. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDiscussion = (discussion) => {
    setEditingDiscussion(discussion);
    setShowNewDiscussion(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteDiscussion = async (id) => {
    if (!isSignedIn) return;
    if (window.confirm('Are you sure you want to delete this discussion?')) {
      try {
        const token = await getToken();
        const response = await fetch(`http://localhost:3000/api/discussions/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Error deleting discussion:', error);
        setError(error.message || 'Failed to delete discussion. Please try again.');
      }
    }
  };

  const handleLikeDiscussion = async (id) => {
    if (!isSignedIn) return setError('Please sign in to like discussions');

    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/discussions/discussions/${id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
    } catch (error) {
      console.error('Error liking discussion:', error);
      setError('Failed to like discussion. Please try again.');
    }
  };

  const cancelEdit = () => {
    setEditingDiscussion(null);
    setShowNewDiscussion(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Discussions
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              select
              label="Sort by"
              value={sortType}
              onChange={(e) => {
                setSortType(e.target.value);
                setCurrentPage(1);
              }}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="recent">Most Recent</MenuItem>
              <MenuItem value="likes">Most Likes</MenuItem>
            </TextField>
            
            {isSignedIn ? (
              <Button
                variant={showNewDiscussion ? "outlined" : "contained"}
                startIcon={showNewDiscussion ? null : <AddCircleIcon />}
                onClick={() => {
                  if (editingDiscussion) {
                    cancelEdit();
                  } else {
                    setShowNewDiscussion(!showNewDiscussion);
                  }
                }}
                sx={{
                  whiteSpace: 'nowrap',
                  minWidth: { xs: 'auto', sm: 164 },
                  px: { xs: 2, sm: 3 }
                }}
              >
                <Box component="span" sx={{ 
                  display: { xs: showNewDiscussion ? 'none' : 'block', sm: 'block' },
                  mr: { xs: 0, sm: 1 }
                }}>
                  {showNewDiscussion ? 'Cancel' : 'New Discussion'}
                </Box>
              </Button>
            ) : (
              <SignInButton mode="modal">
                <Button 
                  variant="contained" 
                  sx={{
                    whiteSpace: 'nowrap',
                    minWidth: { xs: 'auto', sm: 220 },
                    px: { xs: 2, sm: 3 }
                  }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>
                    Sign In to start discussion
                  </Box>
                  <Box component="span" sx={{ display: { xs: 'block', sm: 'none' } }}>
                    Sign In
                  </Box>
                </Button>
              </SignInButton>
            )}
            </Box>
        </Box>

        {/* Pagination Controls Top */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <TextField
            select
            label="Items per page"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            sx={{ minWidth: 120 }}
          >
            {[5, 10, 20, 50].map((size) => (
              <MenuItem key={size} value={size}>{size}</MenuItem>
            ))}
          </TextField>
          
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(e, page) => {
                window.scrollTo(0, 0);
                setCurrentPage(page);
              }}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
          
          {totalItems > 0 && (
            <Typography variant="body2" color="text.secondary">
              Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
            </Typography>
          )}
        </Box>


        {showNewDiscussion && (
          <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              {editingDiscussion ? 'Edit Discussion' : 'Create New Discussion'}
            </Typography>
            <DiscussionForm 
              onSubmit={handleSubmitDiscussion} 
              initialValues={editingDiscussion}
              isEditing={editingDiscussion !== null}
            />
          </Paper>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}

        {isLoading && discussions.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : discussions.length === 0 ? (
          <Paper sx={{ py: 8, textAlign: 'center', borderRadius: 2 }}>
            <MessageIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No discussions found
            </Typography>
            <Typography color="text.secondary">
              {isSignedIn ? 'Be the first to start a conversation!' : 'Sign in to start the first discussion!'}
            </Typography>
          </Paper>
        ) : (
          <DiscussionList
            expandedDiscussionId={discussionId}
            discussions={discussions} 
            onDeleteDiscussion={handleDeleteDiscussion}
            onEditDiscussion={handleEditDiscussion}
            onLikeDiscussion={handleLikeDiscussion}
            currentUserId={userId}
            socket={socket}
          />
        )}

        {/* Pagination Controls Bottom */}
        {!isLoading && discussions.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(e, page) => setCurrentPage(page)}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        )}

      </Box>
    </Container>
  );
}

export function DiscussionList({ expandedDiscussionId, discussions, onDeleteDiscussion, onEditDiscussion, onLikeDiscussion, currentUserId, socket}) {
  const { getToken, isSignedIn } = useAuth();
  const [discussion, setDiscussion] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [replyErrors, setReplyErrors] = useState({});
  const [editingReply, setEditingReply] = useState(null);
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [replySort, setReplySort] = useState('recent');
  const replySortRef = useRef(replySort);
  const [originalReplies, setOriginalReplies] = useState([]);
  const [replyPage, setReplyPage] = useState(1);
  const [totalReplyPages, setTotalReplyPages] = useState(1);
  const [isLoadingMoreReplies, setIsLoadingMoreReplies] = useState(false);
  const replyLimit = 10;

  useEffect(() => {
    replySortRef.current = replySort;
  }, [replySort]);
  

  const handleShareMenuOpen = (event, discussion) => {
    setAnchorEl(event.currentTarget);
    setSelectedDiscussion(discussion);
  };
  
  const handleShareMenuClose = () => {
    setAnchorEl(null);
    setSelectedDiscussion(null);
  };

  const handleSocialShare = (platform) => {
    if (!selectedDiscussion) return;
  
    const discussionUrl = `${window.location.origin}/discussions/${selectedDiscussion._id}?viewFirst=true`;
    const shareText = encodeURIComponent(`Check out this discussion: ${selectedDiscussion.title}`);
    
    let url = '';
    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${shareText}%0A%0A${encodeURIComponent(discussionUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(discussionUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(discussionUrl)}`;
        break;
      default:
        return;
    }
  
    window.open(url, '_blank', 'noopener,noreferrer');
    handleShareMenuClose();
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/discussions/${selectedDiscussion._id}?viewFirst=true`;
    navigator.clipboard.writeText(url);
    handleShareMenuClose();
  };
  
  useEffect(() => {
    if (expandedDiscussionId) {
      setReplyPage(1);
      fetchDiscussionDetail(expandedDiscussionId, 1);
    } else {
      setDiscussion(null);
      setOriginalReplies([]);
      setTotalReplyPages(1);
    }
  }, [expandedDiscussionId]);

  useEffect(() => {
    if (discussion && originalReplies.length > 0) {
      const sortedReplies = sortReplies([...originalReplies], replySort);
      setDiscussion(prev => ({...prev, replies: sortedReplies}));
    }
  }, [replySort, originalReplies]);


  useEffect(() => {
    if (!socket) return;

    const handleDiscussionUpdate = (updatedDiscussion) => {
      if (expandedDiscussionId === updatedDiscussion._id) {
        setDiscussion(prev => ({
          ...prev,
          ...updatedDiscussion,
          replies: prev?.replies || []
        }));
      }
    };

    const handleLikeUpdate = (data) => {
      if (data.targetModel === 'Reply' && expandedDiscussionId === data.discussionId) {
        setOriginalReplies(prev => {
          return prev.map(reply => 
            reply._id === data.targetId ? { ...reply, likesCount: data.likesCount } : reply
          );
        });
        
        setDiscussion(prev => {
          if (!prev) return null;
          const updatedReplies = prev.replies.map(reply => 
            reply._id === data.targetId ? { ...reply, likesCount: data.likesCount } : reply
          );
          const sortedReplies = sortReplies(updatedReplies, replySortRef.current);
          return { ...prev, replies: sortedReplies };
        });
      }
    };

    const handleNewReply = ({ discussionId, reply }) => {
      if (expandedDiscussionId === discussionId) {
        setOriginalReplies(prev => [...prev, reply]);
        
        setDiscussion(prev => {
          if (!prev) return null;
          const newReplies = [...prev.replies, reply];
          const sortedReplies = sortReplies(newReplies, replySortRef.current);
          return { ...prev, replies: sortedReplies, repliesCount: prev.repliesCount + 1 };
        });
      }
    };

    const handleUpdateReply = ({ discussionId, reply }) => {
      if (expandedDiscussionId === discussionId) {
        setOriginalReplies(prev => {
          return prev.map(r => r._id === reply._id ? reply : r);
        });
        
        setDiscussion(prev => {
          if (!prev) return null;
          return {
            ...prev,
            replies: prev.replies.map(r => r._id === reply._id ? reply : r)
          };
        });
      }
    };

    const handleDeleteReply = ({ discussionId, replyId }) => {
      if (expandedDiscussionId === discussionId) {
        setOriginalReplies(prev => {
          return prev.filter(r => r._id !== replyId);
        });
        
        setDiscussion(prev => {
          if (!prev) return null;
          return {
            ...prev,
            replies: prev.replies.filter(r => r._id !== replyId),
            repliesCount: prev.repliesCount - 1
          };
        });
      }
    };

    socket.on('new-reply', handleNewReply);
    socket.on('update-reply', handleUpdateReply);
    socket.on('delete-reply', handleDeleteReply);
    socket.on('like-update', handleLikeUpdate);
    socket.on('update-discussion', handleDiscussionUpdate);

    return () => {
      socket.off('new-reply', handleNewReply);
      socket.off('update-reply', handleUpdateReply);
      socket.off('delete-reply', handleDeleteReply);
      socket.off('like-update', handleLikeUpdate);
      socket.off('update-discussion', handleDiscussionUpdate);
    };
  }, [socket, expandedDiscussionId]);



  // Fetch full discussion details
  const fetchDiscussionDetail = async (id, page = 1) => {
    setIsLoadingDetail(true);
    try {
      const response = await fetch(`http://localhost:3000/api/discussions/${id}?replyPage=${page}&replyLimit=${replyLimit}`);
      if (!response.ok) throw new Error(`Error fetching discussion: ${response.status}`);
      const data = await response.json();
      
      // Handle paginated replies structure
      const replies = data.replies.items || [];
      
      if (page === 1) {
        // First page - replace all replies
        setOriginalReplies(replies);
      } else {
        // Subsequent pages - append to existing replies
        setOriginalReplies(prev => [...prev, ...replies]);
      }
      
      // Set total pages from pagination data
      setTotalReplyPages(data.replies.pagination.totalPages || 1);
      
      // Update the discussion with sorted replies
      const allReplies = page === 1 ? replies : [...originalReplies, ...replies];
      const sortedReplies = sortReplies(allReplies, replySort);
      
      setDiscussion(prev => {
        // If it's the first page or no previous discussion, use the new data
        if (page === 1 || !prev) {
          return {...data, replies: sortedReplies};
        }
        // Otherwise, update existing discussion with new replies
        return {...prev, replies: sortedReplies};
      });
    } catch (error) {
      console.error('Error fetching discussion details:', error);
      setReplyErrors(prev => ({...prev, [id]: 'Failed to load discussion details'}));
    } finally {
      setIsLoadingDetail(false);
      setIsLoadingMoreReplies(false);
    }
  };

  // Load more replies function
  const handleLoadMoreReplies = () => {
    if (isLoadingMoreReplies || replyPage >= totalReplyPages) return;
    
    setIsLoadingMoreReplies(true);
    const nextPage = replyPage + 1;
    setReplyPage(nextPage);
    fetchDiscussionDetail(expandedDiscussionId, nextPage);
  };


  const handleViewClick = (id) => {
    if (expandedDiscussionId === id) {
      navigate('/discussions');
    } else {
      navigate(`/discussions/${id}`);
    }
  };

  const handleLikeReply = async (replyId) => {
    if (!isSignedIn || !discussion) return;

    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/discussions/replies/${replyId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to like reply');
      }

      const result = await response.json();
      
    } catch (error) {
      console.error('Error liking reply:', error);
      setReplyErrors(prev => ({...prev, [discussion._id]: 'Failed to like reply'}));
    }
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!isSignedIn || !discussion || !replyContent.trim()) return;

    try {
      const token = await getToken();
      let url = `http://localhost:3000/api/discussions/${discussion._id}/replies`;
      let method = 'POST';
      let body = { content: replyContent };

      if (editingReply) {
        url = `http://localhost:3000/api/discussions/${discussion._id}/replies/${editingReply._id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${editingReply ? 'update' : 'post'} reply`);
      }

      const newReply = await response.json();
      
      setReplyContent('');
      setEditingReply(null);
      setReplyErrors({});
    } catch (error) {
      console.error('Error posting reply:', error);
      setReplyErrors(prev => ({...prev, [discussion._id]: error.message || 'Failed to post reply'}));
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!isSignedIn || !discussion) return;

    if (window.confirm('Are you sure you want to delete this reply?')) {
      try {
        const token = await getToken();
        const response = await fetch(`http://localhost:3000/api/discussions/${discussion._id}/replies/${replyId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete reply');
        }

      } catch (error) {
        console.error('Error deleting reply:', error);
        setReplyErrors(prev => ({...prev, [discussion._id]: 'Failed to delete reply'}));
      }
    }
  };

  const handleEditReply = (reply) => {
    setEditingReply(reply);
    setReplyContent(reply.content);
  };

  const cancelReplyEdit = () => {
    setEditingReply(null);
    setReplyContent('');
  };

  const sortReplies = (replies, sortType) => {
    if (!replies) return [];
    
    if (sortType === 'recent') {
      return [...replies].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortType === 'likes') {
      return [...replies].sort((a, b) => b.likesCount - a.likesCount);
    }
    return replies;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {discussions.map((discussionItem) => {
        const createdAtDate = discussionItem.createdAt ? new Date(discussionItem.createdAt) : null;
        const formattedDate = createdAtDate && !isNaN(createdAtDate)
          ? formatDistanceToNow(createdAtDate, { addSuffix: true })
          : 'Invalid date';

        const isExpanded = expandedDiscussionId === discussionItem._id;
        const isAuthor = currentUserId && (
          (discussionItem.author?.clerkId === currentUserId) || 
          (discussionItem.author?._id === currentUserId)
        );

        return (
          <Paper
            key={discussionItem._id}
            elevation={1}
            sx={{
              p: 3,
              borderRadius: 2,
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: 3,
                transform: 'translateY(-2px)',
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography 
                variant="h6" 
                component="h3" 
                color="primary.main" 
                gutterBottom
                sx={{ cursor: 'pointer' }}
                onClick={() => handleViewClick(discussionItem._id)}
              >
                {discussionItem.title}
              </Typography>

                <Box>
                <Tooltip title="Share this discussion">
                  <IconButton
                    size="small"
                    onClick={(e) => handleShareMenuOpen(e, discussionItem)}
                    sx={{ color: 'text.secondary' }}
                  >
                    <Share2 size={18} />
                  </IconButton>
                </Tooltip>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleShareMenuClose}
                  onClick={handleShareMenuClose}
                  sx={{ '& .MuiPaper-root': { maxWidth: 400 } }}
                >

                  <MenuItem onClick={handleCopyLink}>
                    <ListItemIcon>
                      <LinkIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Copy discussion link</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => handleSocialShare('whatsapp')}>
                    <ListItemIcon>
                      <WhatsAppIcon fontSize="small" style={{ color: '#25D366' }} />
                    </ListItemIcon>
                    <ListItemText>Share on WhatsApp</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => handleSocialShare('linkedin')}>
                    <ListItemIcon>
                      <LinkedInIcon fontSize="small" style={{ color: '#0A66C2' }} />
                    </ListItemIcon>
                    <ListItemText>Share on LinkedIn</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => handleSocialShare('twitter')}>
                    <ListItemIcon>
                      <TwitterIcon fontSize="small" style={{ color: '#1DA1F2' }} />
                    </ListItemIcon>
                    <ListItemText>Share on Twitter</ListItemText>
                  </MenuItem>
                </Menu>

                  {isAuthor && (
                  <>
                  <Tooltip title="Edit discussion">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditDiscussion(discussionItem);
                      }}
                    >
                      <Edit2 size={18} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete discussion">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDiscussion(discussionItem._id);
                      }}
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </Tooltip>
                  </>
                  )}
                </Box>
              
            </Box>
            
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                my: 2,
                color: 'text.secondary',
                fontSize: '0.875rem'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <MessageSquare size={16} />
                <Typography variant="body2">
                  {discussionItem.repliesCount || 0} replies
                </Typography>
              </Box>
              <Tooltip title={isSignedIn ? "Like this discussion" : "Sign in to like"}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    cursor: isSignedIn ? 'pointer' : 'default',
                    '&:hover': {
                      color: isSignedIn ? theme.palette.primary.main : 'inherit'
                    }
                  }}
                  onClick={() => isSignedIn && onLikeDiscussion(discussionItem._id)}
                >
                  <ThumbsUp 
                    size={16} 
                    fill={discussionItem.liked ? theme.palette.primary.main : 'none'} 
                    color={discussionItem.liked ? theme.palette.primary.main : 'inherit'}
                  />
                  <Typography variant="body2">
                    {discussionItem.likesCount || 0} likes
                  </Typography>
                </Box>
              </Tooltip>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Clock size={16} />
                <Typography variant="body2">
                  {formattedDate}
                </Typography>
              </Box>
            </Box>
            
            {/* Content Preview - Only show when not expanded */}
            {!isExpanded && (
              <Typography 
                variant="body1"
                sx={{ 
                  my: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  cursor: 'pointer'
                }}
                onClick={() => handleViewClick(discussionItem._id)}
              >
                {removeMarkdown(discussionItem.content || '')}
              </Typography>
            )}
            
            <Divider sx={{ my: 1.5 }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  src={discussionItem.author?.profileImageUrl || defaultAvatar}
                  alt={discussionItem.author?.username || 'User'}
                  sx={{ width: 28, height: 28 }}
                />
                <Typography variant="body2" color="text.secondary">by</Typography>
                <Typography
                  variant="body2"
                  color="primary.main"
                  sx={{ fontWeight: 'medium' }}
                  component={Link}
                  to={`/users/${discussionItem.author?.clerkId}`}
                >
                  {discussionItem.author?.username || 'Unknown User'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                  {discussionItem.tags?.length > 0 && discussionItem.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      sx={{
                        bgcolor: theme.palette.action.hover,
                        color: theme.palette.text.secondary,
                        fontSize: '0.75rem'
                      }}
                    />
                  ))}
                </Box>
              </Box>
              <Button
                endIcon={<ArrowRight size={16} />}
                size="small"
                color="primary"
                variant="text"
                onClick={() => handleViewClick(discussionItem._id)}
                sx={{ textTransform: 'none' }}
              >
                {isExpanded ? 'Hide replies' : 'Show replies'}
              </Button>
            </Box>
            
            {/* Expanded Content and Replies */}
            {isExpanded && (
              <Box sx={{ mt: 3 }}>
                {isLoadingDetail ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : discussion ? (
                  <>
                    {/* Full Discussion Content */}
                    <Box sx={{ mb: 3 }}>
                      <MarkdownRenderer>
                        {discussion.content}
                      </MarkdownRenderer>
                    </Box>
                                        
                    <Divider sx={{ mb: 3 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Replies ({discussion.repliesCount || 0})
                      </Typography>
                      <TextField
                        select
                        label="Sort by"
                        value={replySort}
                        onChange={(e) => setReplySort(e.target.value)}
                        sx={{ minWidth: 120 }}
                      >
                        <MenuItem value="recent">Most Recent</MenuItem>
                        <MenuItem value="likes">Most Likes</MenuItem>
                      </TextField>
                    </Box>
                                        
                    {replyErrors[discussion._id] && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {replyErrors[discussion._id]}
                      </Alert>
                    )}
                    
                    {/* Reply Form */}
                    {isSignedIn && (
                      <Box component="form" onSubmit={handleSubmitReply} sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            maxRows={4}
                            placeholder="Add your reply... (Markdown supported)"
                            helperText="Markdown formatting supported"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            sx={{ mb: 1 }}
                          />
                          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                            <Button
                              type="submit"
                              variant="contained"
                              endIcon={<Send size={16} />}
                              disabled={!replyContent.trim()}
                            >
                              {editingReply ? 'Update' : 'Reply'}
                            </Button>
                            {editingReply && (
                              <Button
                                variant="text"
                                onClick={cancelReplyEdit}
                                sx={{ mt: 1 }}
                              >
                                Cancel
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    )}
                    
                    {/* List of Replies */}
                    {discussion.replies && discussion.replies.length > 0 ? (
                      <>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {discussion.replies.map((reply) => {
                          const replyDate = new Date(reply.createdAt);
                          const replyFormatted = !isNaN(replyDate)
                            ? formatDistanceToNow(replyDate, { addSuffix: true })
                            : 'Invalid date';
                            const isReplyAuthor = currentUserId && (
                              (reply.author?.clerkId === currentUserId) || 
                              (reply.author?._id === currentUserId)
                            );
                          
                          return (
                            <Paper
                              key={reply._id}
                              sx={{
                                p: 2,
                                borderRadius: 1,
                                bgcolor: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.divider}`
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <Avatar
                                    src={reply.author?.profileImageUrl || defaultAvatar}
                                    alt={reply.author?.username || 'User'}
                                    sx={{ width: 24, height: 24 }}
                                  />
                                  <Typography
                                    variant="body2"
                                    color="primary.main"
                                    sx={{ fontWeight: 'medium' }}
                                    component={Link}
                                    to={`/users/${reply.author?.clerkId}`}
                                  >
                                    {reply.author?.username || 'Unknown User'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {replyFormatted}
                                  </Typography>
                                </Box>
                                
                                {isReplyAuthor && (
                                  <Box>
                                    <Tooltip title="Edit reply">
                                      <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => handleEditReply(reply)}
                                      >
                                        <Edit2 size={14} />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete reply">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteReply(reply._id)}
                                      >
                                        <Trash2 size={14} />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                )}
                              </Box>
                              
                              {/* Reply Content */}
                              <Box sx={{ mb: 1 }}>
                                <MarkdownRenderer>
                                  {reply.content}
                                </MarkdownRenderer>
                              </Box>
                              
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 1 }}>
                                <Tooltip title={isSignedIn ? "Like this reply" : "Sign in to like"}>
                                  <Box 
                                    sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: 0.5,
                                      cursor: isSignedIn ? 'pointer' : 'default',
                                      '&:hover': {
                                        color: isSignedIn ? theme.palette.primary.main : 'inherit'
                                      }
                                    }}
                                    onClick={() => isSignedIn && handleLikeReply(reply._id)}
                                  >
                                    <ThumbsUp 
                                      size={14} 
                                      fill={reply.liked ? theme.palette.primary.main : 'none'} 
                                      color={reply.liked ? theme.palette.primary.main : 'inherit'}
                                    />
                                    <Typography variant="caption">
                                      {reply.likesCount || 0} likes
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              </Box>
                            </Paper>
                          );
                        })}
                      </Box>

                      {/* Pagination - Load More Button */}
                      {replyPage < totalReplyPages && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                          <Button 
                            variant="outlined" 
                            onClick={handleLoadMoreReplies}
                            disabled={isLoadingMoreReplies}
                            startIcon={isLoadingMoreReplies ? <CircularProgress size={16} /> : <MessageSquare size={16} />}
                          >
                            {isLoadingMoreReplies ? 'Loading...' : 'Load More Replies'}
                          </Button>
                        </Box>
                      )}
                      </>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">
                          No replies yet. Be the first to reply!
                        </Typography>
                      </Box>
                    )}
                  </>
                ) : (
                  <Alert severity="error">Failed to load discussion details</Alert>
                )}
              </Box>
            )}
          </Paper>
        );
      })}
    </Box>
  );
}

export default DiscussionsPage;