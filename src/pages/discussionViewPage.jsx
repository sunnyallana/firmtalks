import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { 
  Container, 
  Box, 
  Typography, 
  CircularProgress, 
  Alert,
  Button
} from '@mui/material';
import { DiscussionDetail } from '../components/discussions/discussion-list';
import { ArrowLeft } from 'lucide-react';

export function DiscussionViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken, userId } = useAuth();
  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
          setError('Failed to delete discussion');
        }
      } catch (error) {
        console.error('Error deleting discussion:', error);
        setError('An error occurred. Please try again.');
      }
    }
  };

  const handleReply = (newReply) => {
    setDiscussion(prevDiscussion => ({
      ...prevDiscussion,
      replies: [...prevDiscussion.replies, newReply]
    }));
  };

  const handleLike = (updatedDiscussion) => {
    setDiscussion(updatedDiscussion);
  };

  const handleEditReply = async (replyId) => {
    // Implement edit reply functionality
    // This would typically open a modal or form for editing
    console.log(`Edit reply: ${replyId}`);
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
        
        if (response.ok) {
          setDiscussion(prevDiscussion => ({
            ...prevDiscussion,
            replies: prevDiscussion.replies.filter(reply => reply._id !== replyId)
          }));
        } else {
          setError('Failed to delete reply');
        }
      } catch (error) {
        console.error('Error deleting reply:', error);
        setError('An error occurred. Please try again.');
      }
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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      ) : (
        <DiscussionDetail
          discussion={discussion}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReply={handleReply}
          onLike={handleLike}
          onEditReply={handleEditReply}
          onDeleteReply={handleDeleteReply}
        />
      )}
    </Container>
  );
}

export default DiscussionViewPage;