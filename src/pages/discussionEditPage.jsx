import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import {
  Container,
  Box,
  CircularProgress,
  Alert,
  Button,
  Paper
} from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { DiscussionForm } from '../components/discussions/discussion-form';

export function DiscussionEditPage() {
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
        setError(error.message || 'Failed to load discussion. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDiscussion();
  }, [id, userId]);

  const handleSubmit = async (formData) => {
    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/discussions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error updating discussion: ${response.status}`);
      }

      // Navigate back to the discussion view page after successful update
      navigate(`/discussions/view/${id}`);
    } catch (err) {
      setError(err.message || 'Failed to update discussion. Please try again.');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowLeft size={18} />}
          onClick={() => navigate(-1)}
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
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <DiscussionForm
            onSubmit={handleSubmit}
            initialValues={discussion}
            isEditing={true}
          />
        </Paper>
      )}
    </Container>
  );
}

export default DiscussionEditPage;