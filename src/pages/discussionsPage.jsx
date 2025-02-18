import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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
  const navigate = useNavigate();
  const theme = useTheme();

  const fetchDiscussions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3000/api/discussions');
      if (!response.ok) throw new Error(`Error fetching discussions: ${response.status}`);
      const data = await response.json();
      setDiscussions(data.discussions);
      setError(null);
    } catch (error) {
      console.error('Error fetching discussions:', error);
      setError('Failed to load discussions. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussions();
  }, []);

  const handleSubmitDiscussion = async (data) => {
    if (!isSignedIn) {
      setError('Please sign in to create a discussion');
      return;
    }

    try {
      setIsLoading(true);
      const token = await getToken();
      const response = await fetch('http://localhost:3000/api/discussions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error creating discussion: ${response.status}`);
      }

      const result = await response.json();
      setDiscussions(prevDiscussions => [...prevDiscussions, result]);
      setShowNewDiscussion(false);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to create discussion. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
          console.error('Failed to delete discussion');
        }
      } catch (error) {
        console.error('Error deleting discussion:', error);
      }
    }
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
              onClick={() => setShowNewDiscussion(!showNewDiscussion)}
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
              Create New Discussion
            </Typography>
            <DiscussionForm onSubmit={handleSubmitDiscussion} />
          </Paper>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}

        {isLoading ? (
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
          <DiscussionList discussions={discussions} onDeleteDiscussion={handleDeleteDiscussion} />
        )}
      </Box>
    </Container>
  );
}

export function DiscussionList({ discussions, onDeleteDiscussion }) {
  const theme = useTheme();
  const { userId } = useAuth();
  const navigate = useNavigate();

  if (!discussions?.length) {
    return (
      <Paper
        elevation={1}
        sx={{
          textAlign: 'center',
          py: 4,
          px: 2,
          borderRadius: 2,
          bgcolor: theme.palette.background.default
        }}
      >
        <Typography variant="body1" color="text.secondary">
          No discussions found
        </Typography>
      </Paper>
    );
  }

  const handleEditClick = (id) => {
    navigate(`/discussions/edit/${id}`);
  };

  const handleViewClick = (id) => {
    navigate(`/discussions/view/${id}`);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {discussions.map((discussion) => {
        const createdAtDate = discussion.createdAt ? new Date(discussion.createdAt) : null;
        const formattedDate = createdAtDate && !isNaN(createdAtDate)
          ? formatDistanceToNow(createdAtDate, { addSuffix: true })
          : 'Invalid date';

        return (
          <Paper
            key={discussion._id}
            elevation={1}
            sx={{
              p: 3,
              borderRadius: 2,
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: 3,
                transform: 'translateY(-2px)',
              },
              bgcolor: theme.palette.background.paper,
              cursor: 'pointer'
            }}
            onClick={() => handleViewClick(discussion._id)}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="h6" component="h3" color="primary.main" gutterBottom>
                {discussion.title}
              </Typography>
              {userId === discussion.author?.id && (
                <Box>
                  <Tooltip title="Edit discussion">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(discussion._id);
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
                        onDeleteDiscussion(discussion._id);
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
                  {discussion.replies?.length || 0} replies
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ThumbsUp size={16} />
                <Typography variant="body2">
                  {discussion.likes?.length || 0} likes
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Clock size={16} />
                <Typography variant="body2">
                  {formattedDate}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  src={discussion.author?.profileImageUrl || defaultAvatar}
                  alt={discussion.author?.username || 'User'}
                  sx={{ width: 28, height: 28 }}
                />
                <Typography variant="body2" color="text.secondary">by</Typography>
                <Typography
                  variant="body2"
                  color="primary.main"
                  sx={{ fontWeight: 'medium' }}
                  component={Link}
                  to={`/users/${discussion.author?.id}`}
                >
                  {discussion.author?.username || 'Unknown User'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                  {discussion.tags?.length > 0 && discussion.tags.map((tag, index) => (
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewClick(discussion._id);
                }}
                sx={{ textTransform: 'none' }}
              >
                Read discussion
              </Button>
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
}

export default DiscussionsPage;