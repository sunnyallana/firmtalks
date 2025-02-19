import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
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
  useTheme
} from '@mui/material';
import {
  MessageSquare,
  ThumbsUp,
  Clock,
  Edit2,
  Trash2,
  ArrowRight,
  Send
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import MessageIcon from '@mui/icons-material/Message';
import { DiscussionForm } from '../components/discussions/discussion-form';

const defaultAvatar = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

export function DiscussionsPage() {
  const { getToken, userId, isSignedIn } = useAuth();
  const [discussions, setDiscussions] = useState([]);
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingDiscussion, setEditingDiscussion] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    fetchDiscussions();
  }, []);

  const fetchDiscussions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3000/api/discussions');
      if (!response.ok) throw new Error(`Error fetching discussions: ${response.status}`);
      const data = await response.json();
      setDiscussions(data.discussions || []);
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
      
      // If editing an existing discussion
      if (editingDiscussion) {
        url = `http://localhost:3000/api/discussions/${editingDiscussion._id}`;
        method = 'PUT';
      }
      
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
      
      if (editingDiscussion) {
        setDiscussions(prevDiscussions => 
          prevDiscussions.map(d => d._id === result._id ? result : d)
        );
        setEditingDiscussion(null);
      } else {
        setDiscussions(prevDiscussions => [result, ...prevDiscussions]);
      }
      
      setShowNewDiscussion(false);
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

        if (response.ok) {
          setDiscussions(prevDiscussions => prevDiscussions.filter(discussion => discussion._id !== id));
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete discussion');
        }
      } catch (error) {
        console.error('Error deleting discussion:', error);
        setError(error.message || 'Failed to delete discussion. Please try again.');
      }
    }
  };

  const handleLikeDiscussion = async (id) => {
    if (!isSignedIn) {
      setError('Please sign in to like discussions');
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/discussions/discussions/${id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to like discussion');
      }

      const result = await response.json();
      
      setDiscussions(prevDiscussions => 
        prevDiscussions.map(discussion => 
          discussion._id === id 
            ? { ...discussion, likesCount: result.likesCount, liked: result.liked }
            : discussion
        )
      );
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
            >
              {showNewDiscussion ? 'Cancel' : 'New Discussion'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => navigate('/sign-in')}
            >
              Sign in to Start Discussion
            </Button>
          )}
        </Box>

        {showNewDiscussion && (
          <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              {editingDiscussion ? 'Edit Discussion' : 'Create New Discussion'}
            </Typography>
            <DiscussionForm 
              onSubmit={handleSubmitDiscussion} 
              initialData={editingDiscussion}
              onCancel={cancelEdit}
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
            discussions={discussions} 
            onDeleteDiscussion={handleDeleteDiscussion}
            onEditDiscussion={handleEditDiscussion}
            onLikeDiscussion={handleLikeDiscussion}
            currentUserId={userId}
          />
        )}
      </Box>
    </Container>
  );
}

export function DiscussionList({ discussions, onDeleteDiscussion, onEditDiscussion, onLikeDiscussion, currentUserId }) {
  const { getToken, isSignedIn } = useAuth();
  const [expandedDiscussionId, setExpandedDiscussionId] = useState(null);
  const [discussion, setDiscussion] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [replyErrors, setReplyErrors] = useState({});
  const [editingReply, setEditingReply] = useState(null);
  const theme = useTheme();

  // Fetch full discussion details
  const fetchDiscussionDetail = async (id) => {
    setIsLoadingDetail(true);
    try {
      const response = await fetch(`http://localhost:3000/api/discussions/${id}`);
      if (!response.ok) throw new Error(`Error fetching discussion: ${response.status}`);
      const data = await response.json();
      setDiscussion(data);
    } catch (error) {
      console.error('Error fetching discussion details:', error);
      setReplyErrors(prev => ({...prev, [id]: 'Failed to load discussion details'}));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleViewClick = (id) => {
    if (expandedDiscussionId === id) {
      setExpandedDiscussionId(null);
      setDiscussion(null);
    } else {
      setExpandedDiscussionId(id);
      fetchDiscussionDetail(id);
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
      
      // Update the reply's like count in the local state
      setDiscussion(prev => {
        if (!prev) return null;
        return {
          ...prev,
          replies: prev.replies.map(reply => 
            reply._id === replyId 
              ? { ...reply, likesCount: result.likesCount, liked: result.liked }
              : reply
          )
        };
      });
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
      
      // Update the discussion with the new reply
      if (editingReply) {
        setDiscussion(prev => ({
          ...prev,
          replies: prev.replies.map(reply => 
            reply._id === editingReply._id ? newReply : reply
          )
        }));
        setEditingReply(null);
      } else {
        setDiscussion(prev => ({
          ...prev,
          replies: [...prev.replies, newReply],
          repliesCount: prev.repliesCount + 1
        }));
      }
      
      setReplyContent('');
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

        // Update the discussion without the deleted reply
        setDiscussion(prev => ({
          ...prev,
          replies: prev.replies.filter(reply => reply._id !== replyId),
          repliesCount: prev.repliesCount - 1
        }));
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
              {isAuthor && (
                <Box>
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
                </Box>
              )}
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
                {discussionItem.content}
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
                  to={`/users/${discussionItem.author?.id}`}
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
                    <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
                      {discussion.content}
                    </Typography>
                    
                    <Divider sx={{ mb: 3 }} />
                    
                    {/* Replies Section */}
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Replies ({discussion.repliesCount || 0})
                    </Typography>
                    
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
                            placeholder="Add your reply..."
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
                              
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
                                {reply.content}
                              </Typography>
                              
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