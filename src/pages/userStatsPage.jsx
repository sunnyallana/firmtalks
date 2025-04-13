import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Typography,
  Container,
  Skeleton,
  useTheme,
  alpha,
} from "@mui/material";
import {
  ThumbsUp,
  MessageCircle,
  Star,
  Shield,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@clerk/clerk-react";
import PropTypes from "prop-types";

const StatItem = ({ icon: Icon, label, value, color, iconColor, bgColor }) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        flex: 1,
        minWidth: 200,
        maxWidth: 300,
        borderRadius: 4,
        transition: "all 0.3s ease",
        bgcolor: "background.paper",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
        },
      }}
    >
      <CardContent sx={{ textAlign: "center", px: 2 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            bgcolor:
              bgColor || alpha(iconColor || theme.palette[color].main, 0.2),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
          }}
        >
          <Icon size={28} color={iconColor || theme.palette[color].main} />
        </Box>
        <Typography
          variant="h5"
          component="div"
          fontWeight="bold"
          color="text.primary"
        >
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
};

// Prop validation
StatItem.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string,
  iconColor: PropTypes.string,
  bgColor: PropTypes.string,
};

// Default props
StatItem.defaultProps = {
  color: "primary",
  iconColor: undefined,
  bgColor: undefined,
};

export function UserStatsPage() {
  const { clerkId } = useParams();
  const { userId: currentUserId } = useAuth();
  const { getToken } = useAuth();
  const [stats, setStats] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const isViewingOwnProfile = clerkId === currentUserId;

  const iconColors = {
    discussions: {
      main: "#738aff",
      bg: "rgba(115, 138, 255, 0.15)",
    },
    likes: {
      main: "#4ecca3",
      bg: "rgba(78, 204, 163, 0.15)",
    },
    replies: {
      main: "#ff6b9a",
      bg: "rgba(255, 107, 154, 0.15)",
    },
    reputation: {
      main: "#ffb347",
      bg: "rgba(255, 179, 71, 0.15)",
    },
    malwareScans: {
      main: "#bd6fde",
      bg: "rgba(189, 111, 222, 0.15)",
    },
    lastActive: {
      main: "#64dfdf",
      bg: "rgba(100, 223, 223, 0.15)",
    },
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/users/${clerkId}`);
        if (!response.ok) throw new Error("User not found");
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchBookmarks = async () => {
      try {
        if (isViewingOwnProfile) {
          const token = await getToken();
          const response = await fetch(`/api/users/me/bookmarks`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!response.ok) throw new Error("Failed to fetch bookmarks");
          const data = await response.json();
          setBookmarks(data);
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchStats();
    fetchBookmarks();
  }, [clerkId, getToken, isViewingOwnProfile]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Skeleton
            variant="circular"
            width={128}
            height={128}
            sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}
          />
          <Skeleton
            variant="text"
            width={200}
            height={48}
            sx={{ mt: 2, bgcolor: "rgba(255, 255, 255, 0.1)" }}
          />
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 3,
            justifyContent: "center",
          }}
        >
          {[...Array(6)].map((_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={180}
              sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}
            />
          ))}
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container
        maxWidth="md"
        sx={{
          py: 4,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "80vh",
          justifyContent: "center",
        }}
      >
        <Typography variant="h4" color="error" sx={{ mb: 2 }}>
          ⚠️ {error}
        </Typography>
        <Typography variant="body1" color="text.primary">
          Please check the user ID and try again
        </Typography>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: 6,
        bgcolor: "background.default",
        minHeight: "100vh",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mb: 6,
          textAlign: "center",
        }}
      >
        <Avatar
          src={stats.profileImageUrl}
          sx={{
            width: 144,
            height: 144,
            mb: 3,
            border: `4px solid ${iconColors.discussions.main}`,
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
          }}
        />
        <Typography
          variant="h3"
          fontWeight="bold"
          gutterBottom
          color="text.primary"
        >
          {stats.username}
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
          <Typography variant="body1" color="text.secondary">
            Joined {formatDistanceToNow(new Date(stats.joined))} ago
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 3,
          justifyContent: "center",
          justifyItems: "center",
        }}
      >
        <StatItem
          icon={MessageSquare}
          label="Total Discussions"
          value={stats.totalDiscussions.toLocaleString()}
          color="primary"
          iconColor={iconColors.discussions.main}
          bgColor={iconColors.discussions.bg}
        />
        <StatItem
          icon={ThumbsUp}
          label="Total Likes"
          value={stats.totalLikes.toLocaleString()}
          color="success"
          iconColor={iconColors.likes.main}
          bgColor={iconColors.likes.bg}
        />
        <StatItem
          icon={MessageCircle}
          label="Total Replies"
          value={stats.totalReplies.toLocaleString()}
          color="info"
          iconColor={iconColors.replies.main}
          bgColor={iconColors.replies.bg}
        />
        <StatItem
          icon={Star}
          label="Reputation"
          value={stats.reputation.toLocaleString()}
          color="warning"
          iconColor={iconColors.reputation.main}
          bgColor={iconColors.reputation.bg}
        />
        <StatItem
          icon={Shield}
          label="Malware Scans"
          value={stats.totalMalwareScans.toLocaleString()}
          color="error"
          iconColor={iconColors.malwareScans.main}
          bgColor={iconColors.malwareScans.bg}
        />
        <StatItem
          icon={Calendar}
          label="Last Active"
          value={formatDistanceToNow(new Date(stats.lastActive))}
          color="secondary"
          iconColor={iconColors.lastActive.main}
          bgColor={iconColors.lastActive.bg}
        />
      </Box>

      {/* Bookmarked Discussions Section */}
      {isViewingOwnProfile && (
        <Box sx={{ mt: 6 }}>
          {bookmarks.length > 0 && (
            <>
              <Typography
                variant="h4"
                fontWeight="bold"
                gutterBottom
                color="text.primary"
              >
                Bookmarked Discussions
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: 3,
                }}
              >
                {bookmarks.map((bookmark) =>
                  bookmark.discussion ? (
                    <Card key={bookmark._id} sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Typography
                          variant="h6"
                          component="a"
                          onClick={() =>
                            navigate(
                              `/discussions/${bookmark.discussion._id}?viewFirst=true`,
                            )
                          }
                          sx={{
                            cursor: "pointer",
                            textDecoration: "none",
                            color: "inherit",
                          }}
                        >
                          {bookmark.discussion.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          by {bookmark.discussion.author.username}
                        </Typography>
                      </CardContent>
                    </Card>
                  ) : null,
                )}
              </Box>
            </>
          )}
        </Box>
      )}
    </Container>
  );
}

export default UserStatsPage;
