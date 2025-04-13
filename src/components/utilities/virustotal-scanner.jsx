import { useState, useEffect } from "react";
import {
  Box,
  Alert,
  CircularProgress,
  Typography,
  Paper,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import WarningIcon from "@mui/icons-material/Warning";

export const VirusTotalScanner = ({ files, onReset }) => {
  const [scanResults, setScanResults] = useState(null);
  const [scanStatus, setScanStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const scanFile = async (file) => {
    setScanStatus("uploading");
    setError(null);
    setProgress(0);

    try {
      if (file.size > 32 * 1024 * 1024) {
        throw new Error("File size exceeds 32MB limit");
      }

      setProgress(10);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/virus-total/scan", {
        method: "POST",
        headers: {
          "X-Filename": file.name,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Scan failed");
      }

      const data = await response.json();

      // Simulate progress updates
      const updateProgress = () => {
        setProgress((prev) => {
          const newProgress = prev + 10;
          if (newProgress >= 90) return 90;
          return newProgress;
        });
      };

      const progressInterval = setInterval(updateProgress, 500);

      if (data.status !== "completed") {
        await pollScanResults(data.analysisId || data.data?.id);
      }

      clearInterval(progressInterval);
      setScanResults(data);
      setScanStatus("complete");
      setProgress(100);
    } catch (err) {
      console.error("Scan error:", err);
      setError(err.message || "An unknown error occurred");
      setScanStatus("error");
      setProgress(0);
    }
  };

  const pollScanResults = async (analysisId) => {
    let attempts = 0;
    const maxAttempts = 30;
    let delay = 1000;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const response = await fetch(`/api/virus-total/scan/${analysisId}`);
        const data = await response.json();

        if (data.status === "completed") {
          return data;
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 1.5, 5000);
      } catch (err) {
        if (attempts >= maxAttempts) {
          throw new Error("Scan timed out");
        }
      }
    }
    throw new Error("Scan timed out");
  };

  useEffect(() => {
    if (files?.length > 0) {
      scanFile(files[0]);
    }
  }, [files]);

  if (scanStatus === "idle") return null;

  if (scanStatus === "uploading" || scanStatus === "analyzing") {
    return (
      <Box sx={{ mt: 3 }}>
        <Alert severity="info" icon={<CircularProgress size={20} />}>
          {scanStatus === "uploading"
            ? "Uploading file..."
            : "Analyzing file..."}
          <Box sx={{ width: "100%", mt: 2 }}>
            <CircularProgress variant="determinate" value={progress} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {Math.round(progress)}% complete
            </Typography>
          </Box>
        </Alert>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Scan failed: {error}
        </Alert>
        <Button variant="outlined" onClick={onReset}>
          Try Again
        </Button>
      </Box>
    );
  }

  if (scanResults) {
    const { name, size, stats, engineResults, permalink, hash } = scanResults;
    const isClean = stats.malicious === 0;
    const totalEngines =
      stats.malicious + stats.suspicious + stats.undetected + stats.harmless;

    return (
      <Box sx={{ mt: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Scan Results
          </Typography>
          <Button variant="outlined" onClick={onReset}>
            Scan Another File
          </Button>
        </Box>

        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Paper elevation={1} sx={{ p: 2, flex: 1, textAlign: "center" }}>
            <Typography variant="h4">{totalEngines}</Typography>
            <Typography color="text.secondary">Engines Scanned</Typography>
          </Paper>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              flex: 1,
              textAlign: "center",
              bgcolor: isClean ? "success.light" : "warning.light",
            }}
          >
            <Typography
              variant="h4"
              color={isClean ? "success.dark" : "warning.dark"}
            >
              {isClean ? "Clean" : "Suspicious"}
            </Typography>
            <Typography color={isClean ? "success.dark" : "warning.dark"}>
              Verdict
            </Typography>
          </Paper>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              flex: 1,
              textAlign: "center",
              bgcolor: "error.light",
            }}
          >
            <Typography variant="h4" color="error.dark">
              {stats.malicious}
            </Typography>
            <Typography color="error.dark">Malicious</Typography>
          </Paper>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              flex: 1,
              textAlign: "center",
              bgcolor: "warning.light",
            }}
          >
            <Typography variant="h4" color="warning.dark">
              {stats.suspicious}
            </Typography>
            <Typography color="warning.dark">Suspicious</Typography>
          </Paper>
        </Stack>

        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <InsertDriveFileIcon sx={{ mr: 2, color: "text.secondary" }} />
              <Box>
                <Typography variant="body1">{name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {(size / 1024 / 1024).toFixed(2)} MB
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hash: {hash}
                </Typography>
              </Box>
            </Box>
            <Box>
              {isClean ? (
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Clean"
                  color="success"
                />
              ) : (
                <Chip
                  icon={<WarningIcon />}
                  label="Threat Detected"
                  color="error"
                />
              )}
              <Button
                variant="outlined"
                sx={{ ml: 2 }}
                href={permalink}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on VirusTotal
              </Button>
            </Box>
          </Box>
        </Paper>

        {!isClean && (
          <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Detection Summary
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {stats.malicious} security vendors flagged this file as malicious
            </Typography>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Engine</TableCell>
                    <TableCell>Detection</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {engineResults.slice(0, 5).map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>{result.engine}</TableCell>
                      <TableCell>
                        <Chip
                          label={result.result}
                          color="error"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{result.method || "Unknown"}</TableCell>
                      <TableCell>{result.update || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {engineResults.length > 5 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                + {engineResults.length - 5} more detections...
              </Typography>
            )}
          </Paper>
        )}

        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Scan Statistics
          </Typography>
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2">Harmless</Typography>
              <Typography variant="h6">{stats.harmless || 0}</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2">Undetected</Typography>
              <Typography variant="h6">{stats.undetected || 0}</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2">Suspicious</Typography>
              <Typography variant="h6">{stats.suspicious || 0}</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2">Malicious</Typography>
              <Typography variant="h6">{stats.malicious || 0}</Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return null;
};
