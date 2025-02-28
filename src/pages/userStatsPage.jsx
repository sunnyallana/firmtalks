import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Avatar, Box, Card, CardContent, Typography, Container, Skeleton, useTheme } from '@mui/material';
import { ThumbsUp, MessageCircle, Star, Shield, Calendar, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const StatItem = ({ icon: Icon, label, value, color }) => {
  const theme = useTheme();
  
  return (
    <Card sx={{ 
      flex: 1,
      minWidth: 200,
      maxWidth: 300,
      borderRadius: 4,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[6]
      }
    }}>
      <CardContent sx={{ textAlign: 'center', px: 2 }}>
        <Box sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          bgcolor: `${color}.light`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2
        }}>
          <Icon size={28} color={theme.palette[color].main} />
        </Box>
        <Typography variant="h5" component="div" fontWeight="bold">
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
};

export function UserStatsPage() {
  const { clerkId } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const theme = useTheme();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/users/${clerkId}`);
        if (!response.ok) throw new Error('User not found');
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [clerkId]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <Skeleton variant="circular" width={128} height={128} />
          <Skeleton variant="text" width={200} height={48} sx={{ mt: 2 }} />
        </Box>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 3,
          justifyContent: 'center'
        }}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={180} />
          ))}
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ 
        py: 4, 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '80vh',
        justifyContent: 'center'
      }}>
        <Typography variant="h4" color="error" sx={{ mb: 2 }}>
          ⚠️ {error}
        </Typography>
        <Typography variant="body1">
          Please check the user ID and try again
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        mb: 6,
        textAlign: 'center'
      }}>
        <Avatar
          src={stats.profileImageUrl}
          sx={{
            width: 144,
            height: 144,
            mb: 3,
            border: `4px solid ${theme.palette.primary.main}`,
            boxShadow: theme.shadows[6]
          }}
        />
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          {stats.username}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          <Typography variant="body1" color="text.secondary">
            Joined {formatDistanceToNow(new Date(stats.joined))} ago
          </Typography>
        </Box>
      </Box>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 3,
        justifyContent: 'center',
        justifyItems: 'center'
      }}>
        <StatItem
          icon={ThumbsUp}
          label="Total Likes"
          value={stats.totalLikes.toLocaleString()}
          color="success"
        />
        <StatItem
          icon={MessageCircle}
          label="Total Replies"
          value={stats.totalReplies.toLocaleString()}
          color="info"
        />
        <StatItem
          icon={Star}
          label="Reputation"
          value={stats.reputation.toLocaleString()}
          color="warning"
        />
        <StatItem
          icon={Shield}
          label="Malware Scans"
          value={stats.totalMalwareScans.toLocaleString()}
          color="error"
        />
        <StatItem
          icon={Calendar}
          label="Last Active"
          value={formatDistanceToNow(new Date(stats.lastActive))}
          color="secondary"
        />
      </Box>
    </Container>
  );
};

export default UserStatsPage;