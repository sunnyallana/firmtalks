import { Box, Paper, Typography, useMediaQuery, useTheme, Stack } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from 'recharts';

export function DashboardCharts() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const discussionsByCategory = [
    { name: 'Firmware', value: 35 },
    { name: 'Security', value: 25 },
    { name: 'Embedded', value: 18 },
    { name: 'IoT', value: 15 },
    { name: 'Reverse Engineering', value: 7 },
  ];

  const monthlyActivity = [
    { month: 'Jan', discussions: 12, scans: 24 },
    { month: 'Feb', discussions: 19, scans: 30 },
    { month: 'Mar', discussions: 15, scans: 22 },
    { month: 'Apr', discussions: 25, scans: 35 },
    { month: 'May', discussions: 30, scans: 40 },
    { month: 'Jun', discussions: 28, scans: 37 },
  ];

  const scanResults = [
    { name: 'Clean', value: 68 },
    { name: 'Suspicious', value: 22 },
    { name: 'Malicious', value: 10 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const SCAN_COLORS = ['#4CAF50', '#FFC107', '#F44336'];

  return (
    <Stack spacing={3} sx={{ width: '100%' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <Box sx={{ width: '100%', height: 400 }}>
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
            <Typography variant="h6" component="h3" gutterBottom>
              Monthly Activity
            </Typography>
            <Box sx={{ flexGrow: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="discussions"
                    stroke={theme.palette.primary.main}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="scans"
                    stroke={theme.palette.success.main}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Box>

        <Box sx={{ width: '100%', height: 400 }}>
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
            <Typography variant="h6" component="h3" gutterBottom>
              Discussions by Category
            </Typography>
            <Box sx={{ flexGrow: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={discussionsByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 40 : 70}
                    outerRadius={isMobile ? 60 : 90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {discussionsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Box>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <Box sx={{ width: '100%', height: 400 }}>
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
            <Typography variant="h6" component="h3" gutterBottom>
              Top Contributors
            </Typography>
            <Box sx={{ flexGrow: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Alex', posts: 23 },
                    { name: 'Maria', posts: 21 },
                    { name: 'John', posts: 18 },
                    { name: 'Sarah', posts: 15 },
                    { name: 'David', posts: 12 },
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="posts" fill={theme.palette.primary.main} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Box>

        <Box sx={{ width: '100%', height: 400 }}>
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
            <Typography variant="h6" component="h3" gutterBottom>
              Scan Results
            </Typography>
            <Box sx={{ flexGrow: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={scanResults}
                    cx="50%"
                    cy="50%"
                    outerRadius={isMobile ? 60 : 90}
                    dataKey="value"
                    label={({ name, value, percent }) =>
                      `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {scanResults.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={SCAN_COLORS[index % SCAN_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Box>
      </Stack>
    </Stack>
  );
}