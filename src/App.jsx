import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Navbar } from "./components/layout/navbar";
import { useTheme } from "./lib/theme";
import { MalwareScannerPage } from "./pages/malwareScannerPage";
import { DiscussionsPage } from "./pages/discussionsPage";
import { UserStatsPage } from "./pages/userStatsPage";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Button,
  Typography,
  Box,
  Container,
} from "@mui/material";
import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { motion } from "framer-motion";
import {
  Shield,
  MessageCircle,
  BarChart3,
  ChevronRight,
  Rocket,
  Code,
  Cpu,
} from "lucide-react";
import { DashboardStats } from "./components/dashboard/dashboard-stats";
import { DashboardCharts } from "./components/dashboard/dashboard-charts";
import { Footer } from "./components/layout/footer";

function App() {
  const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!PUBLISHABLE_KEY) {
    throw new Error("Add your Clerk Publishable Key to the .env.local file");
  }

  const { isDark } = useTheme();

  const primaryColor = "hsl(217.6, 62.6%, 46.1%)";

  const muiTheme = createTheme({
    palette: {
      mode: isDark ? "dark" : "light",
      primary: {
        main: primaryColor,
      },
      secondary: {
        main: primaryColor,
      },
      background: {
        default: isDark ? "#0f172a" : "#f2f2f2",
        paper: isDark ? "#1e293b" : "#f8fafc",
      },
    },
    shape: {
      borderRadius: 16,
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 800,
        letterSpacing: "-0.025em",
        textShadow: isDark ? `0 0 20px ${primaryColor}4D` : "none",
      },
      h2: {
        fontWeight: 800,
        letterSpacing: "-0.025em",
      },
      h3: {
        fontWeight: 700,
        letterSpacing: "-0.025em",
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
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 12,
            padding: "12px 28px",
          },
          contained: {
            background: primaryColor,
            boxShadow: isDark ? `0 0 20px ${primaryColor}33` : "none",
            "&:hover": {
              background: "hsl(217.6, 62.6%, 41%)",
              boxShadow: isDark ? `0 0 30px ${primaryColor}4D` : "none",
              transform: "translateY(-2px)",
              transition: "all 0.3s ease",
            },
          },
        },
      },
    },
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
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
      description:
        "Advanced firmware scanning to identify potential security vulnerabilities",
      link: "/scanner",
    },
    {
      icon: <MessageCircle className="w-10 h-10" />,
      title: "Expert Discussions",
      description:
        "Connect with firmware professionals and share knowledge in our forums",
      link: "/discussions",
    },
    {
      icon: <Code className="w-10 h-10" />,
      title: "Firmware Analysis",
      description:
        "Deep dive into firmware binaries with our advanced analysis tools",
      link: "/scanner",
    },
  ];

  const valueProps = [
    {
      icon: <Rocket className="w-8 h-8" />,
      title: "Cutting-Edge Technology",
      description:
        "Leveraging the latest in firmware analysis and AI detection",
    },
    {
      icon: <Cpu className="w-8 h-8" />,
      title: "Hardware Focused",
      description:
        "Specialized tools designed specifically for embedded systems",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Actionable Insights",
      description: "Clear, understandable results with remediation guidance",
    },
  ];

  return (
    <ClerkProvider
      appearance={{ baseTheme: dark }}
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
    >
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Router>
          <div className="min-h-screen bg-gradient-to-b from-background-default to-background-paper">
            <Navbar />
            <Routes>
              <Route
                path="/"
                element={
                  <Container maxWidth="xl" sx={{ py: { xs: 4, md: 8 } }}>
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-16"
                    >
                      {/* Hero Section */}
                      <motion.div
                        variants={itemVariants}
                        className="text-center space-y-6"
                      >
                        <Typography
                          variant="h1"
                          sx={{
                            fontSize: {
                              xs: "2.5rem",
                              sm: "3rem",
                              md: "3.5rem",
                            },
                            color: primaryColor,
                            mb: 2,
                            position: "relative",
                            "&::after": {
                              content: '""',
                              position: "absolute",
                              width: "100px",
                              height: "4px",
                              background: `linear-gradient(90deg, ${primaryColor}, transparent)`,
                              bottom: "-16px",
                              left: "50%",
                              transform: "translateX(-50%)",
                            },
                            textShadow: (theme) =>
                              theme.palette.mode === "dark"
                                ? `0 0 20px ${primaryColor}4D`
                                : "none",
                          }}
                        >
                          FirmTalks
                        </Typography>
                        <Typography
                          variant="h6"
                          color="text.secondary"
                          sx={{
                            maxWidth: "800px",
                            mx: "auto",
                            fontSize: { xs: "1rem", sm: "1.1rem" },
                            lineHeight: 1.6,
                          }}
                        >
                          Secure your firmware with advanced malware detection
                          and expert community insights.
                        </Typography>
                        <Box sx={{ pt: 2 }}>
                          <Button
                            variant="contained"
                            component={Link}
                            to="/scanner"
                            size="medium"
                            sx={{
                              px: 6,
                              py: 2,
                              fontSize: "1rem",
                            }}
                          >
                            Start Scanning Now
                          </Button>
                        </Box>
                      </motion.div>

                      {/* Feature Cards */}
                      <motion.div
                        variants={containerVariants}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
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
                                display: "block",
                                p: 3,
                                borderRadius: 4,
                                bgcolor: "background.paper",
                                border: "1px solid",
                                borderColor: "divider",
                                textDecoration: "none",
                                color: "text.primary",
                                transition: "all 0.3s ease",
                                position: "relative",
                                overflow: "hidden",
                                minHeight: "280px",
                                "&:hover": {
                                  borderColor: primaryColor,
                                  boxShadow: isDark
                                    ? `0 8px 32px ${primaryColor}26`
                                    : "0 8px 32px rgba(0,0,0,0.1)",
                                  "& .icon-wrapper": {
                                    transform: "translateY(-2px)",
                                    color: primaryColor,
                                  },
                                },
                              }}
                            >
                              <Box
                                className="icon-wrapper"
                                sx={{
                                  color: primaryColor,
                                  mb: 3,
                                  transition: "all 0.3s ease",
                                }}
                              >
                                {card.icon}
                              </Box>
                              <Typography
                                variant="h5"
                                gutterBottom
                                sx={{ mb: 2 }}
                              >
                                {card.title}
                              </Typography>
                              <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mb: 3 }}
                              >
                                {card.description}
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  color: primaryColor,
                                  mt: "auto",
                                }}
                              >
                                <Typography variant="button">
                                  Learn More
                                </Typography>
                                <ChevronRight size={20} />
                              </Box>
                            </Box>
                          </motion.div>
                        ))}
                      </motion.div>

                      {/* Stats Section */}
                      <motion.div variants={itemVariants}>
                        <Typography
                          variant="h4"
                          component="h2"
                          sx={{ mb: 4, textAlign: "center" }}
                        >
                          Platform Insights
                        </Typography>
                        <DashboardStats />
                      </motion.div>

                      {/* Charts Section */}
                      <motion.div variants={itemVariants}>
                        <DashboardCharts />
                      </motion.div>

                      {/* Value Proposition */}
                      <motion.div variants={itemVariants}>
                        <Box
                          sx={{
                            backgroundColor: "background.paper",
                            borderRadius: 4,
                            p: 4,
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <Typography
                            variant="h4"
                            component="h2"
                            sx={{ mb: 4, textAlign: "center" }}
                          >
                            Why Choose FirmTalks?
                          </Typography>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "1fr",
                                md: "repeat(3, 1fr)",
                              },
                              gap: 4,
                            }}
                          >
                            {valueProps.map((prop, index) => (
                              <Box
                                key={index}
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  textAlign: "center",
                                  p: 2,
                                }}
                              >
                                <Box
                                  sx={{
                                    backgroundColor: isDark
                                      ? "rgba(255, 255, 255, 0.1)"
                                      : "rgba(0, 0, 0, 0.05)",
                                    width: 64,
                                    height: 64,
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    mb: 2,
                                  }}
                                >
                                  {prop.icon}
                                </Box>
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                  {prop.title}
                                </Typography>
                                <Typography
                                  variant="body1"
                                  color="text.secondary"
                                >
                                  {prop.description}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </motion.div>

                      {/* Final CTA */}
                      <motion.div
                        variants={itemVariants}
                        className="text-center py-6"
                      >
                        <Box
                          sx={{
                            backgroundColor: "background.paper",
                            borderRadius: 4,
                            p: 4,
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <Typography
                            variant="h4"
                            component="h2"
                            sx={{ mb: 2 }}
                          >
                            Ready to Secure Your Firmware?
                          </Typography>
                          <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ mb: 4, maxWidth: 600, mx: "auto" }}
                          >
                            Join our community of firmware security experts and
                            get started with our advanced analysis tools today.
                          </Typography>
                          <Button
                            variant="contained"
                            component={Link}
                            to="/scanner"
                            size="large"
                            sx={{
                              px: 6,
                              py: 2,
                              fontSize: "1rem",
                            }}
                          >
                            Get Started
                          </Button>
                        </Box>
                      </motion.div>
                    </motion.div>
                  </Container>
                }
              />
              <Route path="/scanner" element={<MalwareScannerPage />} />
              <Route
                path="/discussions/:discussionId?"
                element={<DiscussionsPage />}
              />
              <Route path="/users/:clerkId" element={<UserStatsPage />} />
            </Routes>
            <Footer />
          </div>
        </Router>
      </ThemeProvider>
    </ClerkProvider>
  );
}

export default App;
