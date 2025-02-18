import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Divider,
  useTheme
} from '@mui/material';
import { ArrowLeft, ThumbsUp, Edit2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const defaultAvatar = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

export function DiscussionViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken, userId } = useAuth();
  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newReply, setNewReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const theme = useTheme();

  const fetchDiscussion = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/discussions/${id}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching discussion: ${response.status}`);
      }

      const data = await response.json();
      setDiscussion(data);
    } catch (error) {
      console.error('Error fetching discussion:', error);
      setError('Failed to load discussion. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussion();
  }, [id]);

  const handleEdit = (discussionId) => {
    navigate(`/discussions/edit/${discussionId}`);
  };

  const handleDelete = async (discussionId) => {
    if (window.confirm('Are you sure you want to delete this discussion?')) {
      try {
        const token = await getToken();
        const response = await fetch(`http://localhost:3000/api/discussions/${discussionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          navigate('/discussions');
        } else {
          throw new Error('Failed to delete discussion');
        }
      } catch (error) {
        console.error('Error deleting discussion:', error);
        setError('Failed to delete discussion. Please try again.');
      }
    }
  };


  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!newReply.trim()) return;
    try {
      setIsSubmitting(true);
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/discussions/${id}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newReply })
      });
  
      if (response.ok) {
        const newReplyData = await response.json();
        console.log('New Reply Data:', newReplyData);
  
        if (!newReplyData._id) {
          throw new Error('Reply ID not found in response');
        }
  
        setDiscussion((prevDiscussion) => ({
          ...prevDiscussion,
          replies: [newReplyData, ...prevDiscussion.replies]
        }));
      } else {
        throw new Error('Failed to post reply');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      setError('Failed to post reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleLike = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/discussions/${id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchDiscussion();
      } else {
        throw new Error('Failed to like discussion');
      }
    } catch (error) {
      console.error('Error liking discussion:', error);
      setError('Failed to like discussion. Please try again.');
    }
  };

  const handleEditReply = async (replyId) => {
    try {
      if (!editedContent.trim()) return;
      
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/discussions/${id}/replies/${replyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': `application/json`,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: editedContent })
      });

      if (response.ok) {
        setDiscussion((prevDiscussion) => ({
          ...prevDiscussion,
          replies: prevDiscussion.replies.map((reply) =>
            reply._id === replyId ? { ...reply, content: editedContent, updatedAt: new Date() } : reply
          )
        }));
        setEditingReplyId(null);
        setEditedContent('');
      } else {
        throw new Error('Failed to update reply');
      }
    } catch (error) {
      console.error('Error updating reply:', error);
      setError('Failed to update reply. Please try again.');
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (window.confirm('Are you sure you want to delete this reply?')) {
      try {
        const token = await getToken();
        const response = await fetch(`http://localhost:3000/api/discussions/${id}/replies/${replyId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete reply');
        }

        setDiscussion((prevDiscussion) => ({
          ...prevDiscussion,
          replies: prevDiscussion.replies.filter((reply) => reply._id !== replyId)
        }));
      } catch (error) {
        console.error('Error deleting reply:', error);
        setError('Failed to delete reply. Please try again.');
      }
    }
  };

  const handleReplyLike = async (replyId) => {
    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/discussions/${id}/replies/${replyId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setDiscussion((prevDiscussion) => ({
          ...prevDiscussion,
          replies: prevDiscussion.replies.map((reply) =>
            reply._id === replyId
              ? {
                  ...reply,
                  likes: reply.likes.includes(userId)
                    ? reply.likes.filter((id) => id !== userId)
                    : [...reply.likes, userId]
                }
              : reply
          )
        }));
      } else {
        throw new Error('Failed to like reply');
      }
    } catch (error) {
      console.error('Error liking reply:', error);
      setError('Failed to like reply. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowLeft size={18} />}
          onClick={() => navigate('/discussions')}
          variant="text"
          color="inherit"
        >
          Back to discussions
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : discussion ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Discussion content */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
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
                      onClick={() => handleEdit(discussion._id)}
                    >
                      <Edit2 size={18} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete discussion">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(discussion._id)}
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
                  Posted {formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })}
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
                onClick={handleLike}
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

          {/* Replies section */}
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
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
                              onClick={() => {
                                setEditingReplyId(reply._id);
                                setEditedContent(reply.content);
                              }}
                            >
                              <Edit2 size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete reply">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteReply(reply._id)}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </Box>

                    {editingReplyId === reply._id ? (
                      <Box sx={{ mt: 2 }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          variant="outlined"
                          size="small"
                        />
                        <Box sx={{ mt: 1, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button
                            size="small"
                            onClick={() => {
                              setEditingReplyId(null);
                              setEditedContent('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleEditReply(reply._id)}
                          >
                            Save
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                        {reply.content}
                      </Typography>
                    )}

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
      ) : (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 8 }}>
          Discussion not found.
        </Typography>
      )}
    </Container>
  );
}

export default DiscussionViewPage;