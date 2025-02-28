import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Avatar, Grid, Card, CardContent, Typography, Container, Skeleton } from '@mui/material';
import { ThumbsUp, MessageCircle, Star, Shield, Calendar, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const StatItem = ({ icon: Icon, label, value }) => (
  <Grid item xs={6} sm={4} md={3}>
    <Card sx={{ height: '100%', textAlign: 'center' }}>
      <CardContent>
        <Icon size={32} style={{ marginBottom: 8 }} />
        <Typography variant="h6" component="div">
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </CardContent>
    </Card>
  </Grid>
);

export function UserStatsPage() {
  const { clerkId } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Skeleton variant="circular" width={128} height={128} sx={{ mx: 'auto' }} />
        <Skeleton variant="text" sx={{ fontSize: '2rem', maxWidth: 300, mx: 'auto', mt: 2 }} />
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={6} sm={4} md={3} key={i}>
              <Skeleton variant="rounded" height={120} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Avatar
        src={stats.profileImageUrl}
        sx={{
          width: 128,
          height: 128,
          mx: 'auto',
          mb: 2,
          border: '3px solid',
          borderColor: 'primary.main'
        }}
      />
      <Typography variant="h4" align="center" gutterBottom>
        {stats.username}
      </Typography>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <StatItem
          icon={ThumbsUp}
          label="Likes"
          value={stats.totalLikes.toLocaleString()}
        />
        <StatItem
          icon={MessageCircle}
          label="Total Replies"
          value={stats.totalReplies.toLocaleString()}
        />
        <StatItem
          icon={Star}
          label="Reputation"
          value={stats.reputation.toLocaleString()}
        />
        <StatItem
          icon={Shield}
          label="Malware Scans"
          value={stats.totalMalwareScans.toLocaleString()}
        />
        <StatItem
          icon={Calendar}
          label="Joined"
          value={formatDistanceToNow(new Date(stats.joined), { addSuffix: true })}
        />
        <StatItem
          icon={Clock}
          label="Last Active"
          value={formatDistanceToNow(new Date(stats.lastActive), { addSuffix: true })}
        />
      </Grid>
    </Container>
  );
};

export default UserStatsPage;