import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Navbar } from './components/layout/navbar';
import { useTheme } from './lib/theme';
import { MalwareScannerPage } from './pages/malwareScannerPage';
import { DiscussionsPage } from './pages/discussionsPage';
import { PlatformStatisticsPage } from './pages/platformStatisticsPage';
import { ThemeProvider, createTheme, CssBaseline, Button, Typography, Box, Container } from '@mui/material';
import {ClerkProvider} from '@clerk/clerk-react'
import { dark } from '@clerk/themes'


function App() {
  const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

  if (!PUBLISHABLE_KEY) {
    throw new Error('Add your Clerk Publishable Key to the .env.local file')
  }

  const { isDark } = useTheme();

  const muiTheme = createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: '#3f51b5',
      },
      secondary: {
        main: '#f50057',
      },
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
      },
      h2: {
        fontWeight: 700,
      },
      h3: {
        fontWeight: 600,
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 500,
      },
      h6: {
        fontWeight: 500,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
    },
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
  <ClerkProvider appearance={{baseTheme: dark,}}  publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Router>
        <div className="min-h-screen">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                <Container maxWidth="lg" sx={{ py: 8 }}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      textAlign: 'center',
                      gap: 4
                    }}
                  >
                    <Typography variant="h2" component="h1" gutterBottom sx={{ 
                      fontSize: { xs: '2rem', sm: '3rem', md: '3.75rem' },
                      fontWeight: 'bold',
                      lineHeight: 1.2
                    }}>
                      Welcome to FirmTalks
                    </Typography>
                    <Typography variant="h5" component="p" color="text.secondary" sx={{ 
                      maxWidth: 'md',
                      mb: 2,
                      fontSize: { xs: '1rem', sm: '1.25rem' },
                    }}>
                      The premier platform for firmware professionals and enthusiasts to detect malware
                      and collaborate on firmware-related discussions.
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 2
                    }}>
                      <Button 
                        variant="contained" 
                        component={Link} 
                        to="/scanner" 
                        size="large"
                        sx={{ px: 4, py: 1.5 }}
                      >
                        Try Scanner
                      </Button>
                      <Button 
                        variant="outlined" 
                        component={Link} 
                        to="/discussions" 
                        size="large"
                        sx={{ px: 4, py: 1.5 }}
                      >
                        Join Discussions
                      </Button>
                    </Box>
                  </Box>
                </Container>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/statistics"
              element={
                    <PlatformStatisticsPage />
              }
            />

            <Route
              path="/scanner"
              element={
                    <MalwareScannerPage />
              }
            />

            <Route
              path="/discussions"
              element={
                    <DiscussionsPage />
              }
            />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  </ClerkProvider>
  );
}

export default App;
