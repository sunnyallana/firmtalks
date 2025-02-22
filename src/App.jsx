import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Navbar } from './components/layout/navbar';
import { useTheme } from './lib/theme';
import { MalwareScannerPage } from './pages/malwareScannerPage';
import { DiscussionsPage } from './pages/discussionsPage';
import { PlatformStatisticsPage } from './pages/platformStatisticsPage';
import { ThemeProvider, createTheme, CssBaseline, Button, Typography, Box, Container } from '@mui/material';
import { ClerkProvider } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { motion } from 'framer-motion';
import { Shield, MessageCircle, BarChart3, ChevronRight } from 'lucide-react';

function App() {
  const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!PUBLISHABLE_KEY) {
    throw new Error('Add your Clerk Publishable Key to the .env.local file');
  }

  const { isDark } = useTheme();

  const muiTheme = createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: '#8ecdf8',
      },
      secondary: {
        main: '#60a5fa',
      },
      background: {
        default: isDark ? '#0f172a' : '#ffffff',
        paper: isDark ? '#1e293b' : '#f8fafc',
      },
    },
    shape: {
      borderRadius: 16,
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 800,
        letterSpacing: '-0.025em',
        textShadow: isDark ? '0 0 20px rgba(142, 205, 248, 0.3)' : 'none',
      },
      h2: {
        fontWeight: 800,
        letterSpacing: '-0.025em',
      },
      h3: {
        fontWeight: 700,
        letterSpacing: '-0.025em',
      },
      h4: {
        fontWeight: 700,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 12,
            padding: '12px 28px',
          },
          contained: {
            boxShadow: isDark ? '0 0 20px rgba(142, 205, 248, 0.2)' : 'none',
            '&:hover': {
              boxShadow: isDark ? '0 0 30px rgba(142, 205, 248, 0.3)' : 'none',
              transform: 'translateY(-2px)',
              transition: 'all 0.3s ease',
            },
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

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  const featureCards = [
    {
      icon: <Shield className="w-10 h-10" />,
      title: "Malware Detection",
      description: "Advanced firmware scanning to identify potential security threats and vulnerabilities",
      link: "/scanner",
    },
    {
      icon: <MessageCircle className="w-10 h-10" />,
      title: "Expert Discussions",
      description: "Connect with firmware professionals and share knowledge in our community forums",
      link: "/discussions",
    },
    {
      icon: <BarChart3 className="w-10 h-10" />,
      title: "Platform Insights",
      description: "Access detailed statistics and trends about firmware security landscape",
      link: "/statistics",
    },
  ];

  return (
    <ClerkProvider appearance={{ baseTheme: dark }} publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Router>
          <div className="min-h-screen bg-gradient-to-b from-background-default to-background-paper">
            <Navbar />
            <Routes>
              <Route
                path="/"
                element={
                  <Container maxWidth="lg" sx={{ py: { xs: 8, md: 16 } }}>
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-20"
                    >
                      {/* Hero Section */}
                      <motion.div variants={itemVariants} className="text-center space-y-8">
                        <Typography
                          variant="h1"
                          sx={{
                            fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
                            color: '#8ecdf8',
                            mb: 3,
                            position: 'relative',
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              width: '100px',
                              height: '4px',
                              background: 'linear-gradient(90deg, #8ecdf8, transparent)',
                              bottom: '-16px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                            },
                          }}
                        >
                          FirmTalks
                        </Typography>
                        <Typography
                          variant="h5"
                          color="text.secondary"
                          sx={{
                            maxWidth: '800px',
                            mx: 'auto',
                            fontSize: { xs: '1.2rem', sm: '1.4rem' },
                            lineHeight: 1.8,
                            opacity: 0.9,
                          }}
                        >
                          Secure your firmware with advanced malware detection and expert community insights.
                          Your all-in-one platform for firmware security analysis.
                        </Typography>
                      </motion.div>

                      {/* Feature Cards */}
                      <motion.div
                        variants={containerVariants}
                        className="grid grid-cols-1 md:grid-cols-3 gap-10"
                      >
                        {featureCards.map((card, index) => (
                          <motion.div
                            key={index}
                            variants={itemVariants}
                            whileHover={{ scale: 1.03, translateY: -8 }}
                            className="relative"
                          >
                            <Box
                              component={Link}
                              to={card.link}
                              sx={{
                                display: 'block',
                                p: 5,
                                borderRadius: 4,
                                bgcolor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                                textDecoration: 'none',
                                color: 'text.primary',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                overflow: 'hidden',
                                '&:hover': {
                                  borderColor: '#8ecdf8',
                                  boxShadow: isDark ? '0 8px 32px rgba(142, 205, 248, 0.15)' : '0 8px 32px rgba(0,0,0,0.1)',
                                  '& .icon-wrapper': {
                                    transform: 'translateY(-2px)',
                                    color: '#8ecdf8',
                                  },
                                },
                              }}
                            >
                              <Box className="icon-wrapper" sx={{ color: 'primary.main', mb: 3, transition: 'all 0.3s ease' }}>
                                {card.icon}
                              </Box>
                              <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                                {card.title}
                              </Typography>
                              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                {card.description}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', color: 'primary.main', mt: 'auto' }}>
                                <Typography variant="button">Learn More</Typography>
                                <ChevronRight size={20} />
                              </Box>
                            </Box>
                          </motion.div>
                        ))}
                      </motion.div>

                      {/* CTA Section */}
                      <motion.div
                        variants={itemVariants}
                        className="text-center py-10"
                      >
                        <Button
                          variant="contained"
                          component={Link}
                          to="/scanner"
                          size="large"
                          sx={{
                            px: 8,
                            py: 3,
                            fontSize: '1.25rem',
                            background: isDark ? 'linear-gradient(135deg, #8ecdf8 0%, #60a5fa 100%)' : '#8ecdf8',
                            '&:hover': {
                              background: isDark ? 'linear-gradient(135deg, #60a5fa 0%, #8ecdf8 100%)' : '#60a5fa',
                            },
                          }}
                        >
                          Start Scanning Now
                        </Button>
                      </motion.div>
                    </motion.div>
                  </Container>
                }
              />

              <Route path="/statistics" element={<PlatformStatisticsPage />} />
              <Route path="/scanner" element={<MalwareScannerPage />} />
              <Route path="/discussions" element={<DiscussionsPage />} />
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
    </ClerkProvider>
  );
}

export default App;