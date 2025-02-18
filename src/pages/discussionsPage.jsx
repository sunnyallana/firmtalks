import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper,
  Button, 
  CircularProgress,
  Alert,
  AlertTitle
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import MessageIcon from '@mui/icons-material/Message';
import { DiscussionList } from '../components/discussions/discussion-list';
import { DiscussionForm } from '../components/discussions/discussion-form';

export function DiscussionsPage() {
  const { getToken, isSignedIn } = useAuth();
  const [discussions, setDiscussions] = useState([]);
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDiscussions = async () => {
    try {
      setIsLoading(true);
      // Public endpoint - no auth required
      const response = await fetch('http://localhost:3000/api/discussions');
      
      if (!response.ok) {
        throw new Error(`Error fetching discussions: ${response.status}`);
      }
      
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
      setDiscussions(prevDiscussions => Array.isArray(prevDiscussions) ? [...prevDiscussions, result] : [result]);
      setShowNewDiscussion(false);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to create discussion. Please try again.');
    } finally {
      setIsLoading(false);
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
              onClick={() => window.location.href = '/sign-in'}
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
          <DiscussionList discussions={discussions} />
        )}
      </Box>
    </Container>
  );
}

export default DiscussionsPage;