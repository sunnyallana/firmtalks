import { 
  Container, 
  Typography, 
  Box, 
  Paper,
} from '@mui/material';
import { DashboardStats } from '../components/dashboard/dashboard-stats';
import { DashboardCharts } from '../components/dashboard/dashboard-charts';

export function PlatformStatisticsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Platform Statistics
      </Typography>
      
      <Box sx={{ width: '100%', mb: 4 }}>
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <DashboardStats />
        </Paper>
      </Box>

      <Box sx={{ width: '100%' }}>
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <DashboardCharts />
        </Paper>
      </Box>
    </Container>
  );
}

export default PlatformStatisticsPage;