import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import {
  MessageSquare,
  ThumbsUp,
  Clock,
  Edit2,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  Paper,
  Typography,
  Box,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Divider,
  TextField,
  CircularProgress,
  useTheme
} from '@mui/material';

const defaultAvatar = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

// Helper function to safely format dates
const formatDate = (dateString) => {
  try {
    if (!dateString) return 'Unknown date';
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export function DiscussionList({ discussions, onDeleteDiscussion }) {
  const theme = useTheme();
  const { userId, getToken } = useAuth();
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

  const handleDeleteClick = async (id, event) => {
    event.preventDefault();
    event.stopPropagation();

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
          if (onDeleteDiscussion) {
            onDeleteDiscussion(id);
          } else {
            // If no callback provided, refresh the page
            window.location.reload();
          }
        } else {
          console.error('Failed to delete discussion');
        }
      } catch (error) {
        console.error('Error deleting discussion:', error);
      }
    }
  };

  const handleEditClick = (id, event) => {
    event.preventDefault();
    event.stopPropagation();
    navigate(`/discussions/edit/${id}`);  // Updated route path
  };

  const handleViewClick = (id) => {
    navigate(`/discussions/view/${id}`);  // Updated route path
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {discussions.map((discussion) => (
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
                    onClick={(e) => handleEditClick(discussion._id, e)}
                  >
                    <Edit2 size={18} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete discussion">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => handleDeleteClick(discussion._id, e)}
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
                {formatDate(discussion.createdAt)}
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
              onClick={() => handleViewClick(discussion._id)}
              sx={{ textTransform: 'none' }}
            >
              Read discussion
            </Button>
          </Box>
        </Paper>
      ))}
    </Box>
  );
}

export function DiscussionDetail({ discussion, onReply, onLike, onDelete, onEdit, onEditReply, onDeleteReply }) {
  const theme = useTheme();
  const { userId, getToken } = useAuth();
  const [newReply, setNewReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!discussion) {
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
          Loading discussion...
        </Typography>
      </Paper>
    );
  }

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!newReply.trim()) return;

    try {
      setIsSubmitting(true);
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/discussions/${discussion._id}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newReply })
      });

      if (response.ok) {
        const data = await response.json();
        if (onReply) {
          onReply(data);
        } else {
          // Refresh the page if no callback provided
          window.location.reload();
        }
        setNewReply('');
      } else {
        console.error('Failed to post reply');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeClick = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/discussions/${discussion._id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (onLike) {
          onLike(data);
        } else {
          // Refresh the page if no callback provided
          window.location.reload();
        }
      } else {
        console.error('Failed to like discussion');
      }
    } catch (error) {
      console.error('Error liking discussion:', error);
    }
  };

  const handleReplyLike = async (replyId) => {
    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/discussions/${discussion._id}/replies/${replyId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (onReply) {
          onReply(data, replyId);
        } else {
          // Refresh the page if no callback provided
          window.location.reload();
        }
      } else {
        console.error('Failed to like reply');
      }
    } catch (error) {
      console.error('Error liking reply:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper
        elevation={2}
        sx={{
          p: 3,
          borderRadius: 2,
          bgcolor: theme.palette.background.paper
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h5" component="h2" color="primary.main" gutterBottom>
            {discussion.title}
          </Typography>

          {userId === discussion.author?.id && (
            <Box>
              <Tooltip title="Edit discussion">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => onEdit ? onEdit(discussion._id) : null}
                >
                  <Edit2 size={18} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete discussion">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onDelete ? onDelete(discussion._id) : null}
                >
                  <Trash2 size={18} />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar
            src={discussion.author?.profileImageUrl || defaultAvatar}
            alt={discussion.author?.username || 'User'}
          />
          <Box>
            <Typography
              variant="subtitle1"
              component={Link}
              to={`/users/${discussion.author?.id}`}
              color="primary.main"
              sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              {discussion.author?.username || 'Unknown User'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Posted {formatDate(discussion.createdAt)}
            </Typography>
          </Box>
        </Box>

        <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
          {discussion.content}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3 }}>
          <Button
            startIcon={<ThumbsUp size={18} color={discussion.likes?.includes(userId) ? theme.palette.primary.main : undefined} />}
            variant="text"
            onClick={handleLikeClick}
            color={discussion.likes?.includes(userId) ? "primary" : "inherit"}
          >
            Like ({discussion.likes?.length || 0})
          </Button>

          {discussion.tags?.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
              {discussion.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  sx={{
                    bgcolor: theme.palette.action.hover,
                    color: theme.palette.text.secondary
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      </Paper>

      <Paper
        elevation={1}
        sx={{
          p: 3,
          borderRadius: 2,
          bgcolor: theme.palette.background.paper
        }}
      >
        <Typography variant="h6" gutterBottom>
          Replies ({discussion.replies?.length || 0})
        </Typography>

        {discussion.replies?.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
            {discussion.replies.map((reply) => (
              <Box
                key={reply._id}
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: theme.palette.action.hover,
                  position: 'relative'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                  <Avatar
                    src={reply.author?.profileImageUrl || defaultAvatar}
                    alt={reply.author?.username || 'User'}
                    sx={{ width: 32, height: 32 }}
                  />
                  <Box>
                    <Typography
                      variant="subtitle2"
                      component={Link}
                      to={`/users/${reply.author?.id}`}
                      color="primary.main"
                      sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      {reply.author?.username || 'Unknown User'}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {formatDate(reply.createdAt)}
                    </Typography>
                  </Box>

                  {userId === reply.author?.id && (
                    <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex' }}>
                      <Tooltip title="Edit reply">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => onEditReply ? onEditReply(reply._id) : null}
                        >
                          <Edit2 size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete reply">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onDeleteReply ? onDeleteReply(reply._id) : null}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>

                <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                  {reply.content}
                </Typography>

                <Button
                  size="small"
                  startIcon={<ThumbsUp size={16} color={reply.likes?.includes(userId) ? theme.palette.primary.main : undefined} />}
                  variant="text"
                  onClick={() => handleReplyLike(reply._id)}
                  color={reply.likes?.includes(userId) ? "primary" : "inherit"}
                  sx={{ mt: 1 }}
                >
                  ({reply.likes?.length || 0})
                </Button>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ my: 3, textAlign: 'center' }}>
            No replies yet. Be the first to reply!
          </Typography>
        )}

        <Box component="form" onSubmit={handleReplySubmit} sx={{ mt: 4 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Write a reply"
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            variant="outlined"
            placeholder="Share your thoughts..."
            required
            disabled={!userId || isSubmitting}
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!userId || isSubmitting || !newReply.trim()}
            sx={{ float: 'right' }}
          >
            {isSubmitting ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                Posting...
              </>
            ) : (
              'Post Reply'
            )}
          </Button>
          {!userId && (
            <Typography variant="body2" color="text.secondary">
              Please <Link to="/sign-in" style={{ color: theme.palette.primary.main }}>sign in</Link> to post a reply.
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
}