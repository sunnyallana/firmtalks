// src/components/dashboard/dashboard-stats.jsx
import React from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box,
  useMediaQuery,
  useTheme
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import MessageIcon from '@mui/icons-material/Message';
import ShieldIcon from '@mui/icons-material/Shield';
import TimelineIcon from '@mui/icons-material/Timeline';

export function DashboardStats() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const stats = [
    {
      title: 'Total Users',
      value: '1,294',
      icon: <PeopleIcon sx={{ height: 24, width: 24, color: 'primary.main' }} />,
      change: '+12%',
      changeType: 'positive',
    },
    {
      title: 'Active Discussions',
      value: '452',
      icon: <MessageIcon sx={{ height: 24, width: 24, color: 'success.main' }} />,
      change: '+8%',
      changeType: 'positive',
    },
    {
      title: 'Scans Performed',
      value: '3,782',
      icon: <ShieldIcon sx={{ height: 24, width: 24, color: 'info.main' }} />,
      change: '+24%',
      changeType: 'positive',
    },
    {
      title: 'Threats Detected',
      value: '183',
      icon: <TimelineIcon sx={{ height: 24, width: 24, color: 'error.main' }} />,
      change: '-3%',
      changeType: 'negative',
    },
  ];

  return (
    <Grid container spacing={2}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              borderRadius: 2,
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 1,
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <Typography variant="subtitle2" color="text.secondary">
                {stat.title}
              </Typography>
              {stat.icon}
            </Box>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mt: isMobile ? 1 : 0 }}>
              {stat.value}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: stat.changeType === 'positive' ? 'success.main' : 'error.main',
                mt: 0.5,
              }}
            >
              {stat.change} from last month
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}