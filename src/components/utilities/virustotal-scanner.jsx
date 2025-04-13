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
    setProgress(5);

    try {
      if (file.size > 32 * 1024 * 1024) {
        throw new Error("File size exceeds 32MB limit");
      }

      // Use XMLHttpRequest for better control over progress
      const formData = new FormData();
      formData.append("file", file);

      // Setup for actual progress tracking
      const xhr = new XMLHttpRequest();

      // Create a promise wrapper for XMLHttpRequest
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.open("POST", "/api/virus-total/scan");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progressPercent =
              Math.round((event.loaded / event.total) * 80) + 5;
            setProgress(progressPercent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error("Invalid response format"));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(
                new Error(
                  errorData.error || errorData.details || "Scan failed",
                ),
              );
            } catch (e) {
              reject(new Error(`Server error: ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network or server error"));
        };

        xhr.ontimeout = () => {
          reject(new Error("Request timed out"));
        };

        xhr.timeout = 60000; // 60 seconds timeout

        // Send the form data
        xhr.send(formData);
      });

      // Wait for the upload and initial processing
      setProgress(15); // Ensure there's visible progress
      const response = await uploadPromise;

      // If we already have completed status, we're done
      if (response.status === "completed") {
        setScanResults(response);
        setScanStatus("complete");
        setProgress(100);
        return;
      }

      // If we get here, we need to poll for results
      if (response.analysisId) {
        setProgress(85);
        setScanStatus("analyzing");

        let attempts = 0;
        const maxAttempts = 15;
        let delay = 500;

        // Polling loop
        while (attempts < maxAttempts) {
          attempts++;
          try {
            const pollResponse = await fetch(
              `/api/virus-total/scan/${response.analysisId}`,
            );
            if (!pollResponse.ok) {
              const errorData = await pollResponse.json();
              throw new Error(errorData.error || "Poll failed");
            }

            const data = await pollResponse.json();

            if (data.status === "completed") {
              // Success - get the full data
              const finalResponse = await fetch(
                `/api/virus-total/scan/${response.analysisId}`,
              );
              const finalData = await finalResponse.json();

              setScanResults(finalData.data || response);
              setScanStatus("complete");
              setProgress(100);
              return;
            }

            // Update progress to show activity
            setProgress(Math.min(85 + attempts, 95));

            // Wait before next poll
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay = Math.min(delay * 1.2, 2000);
          } catch (err) {
            console.error("Polling error:", err);
            if (attempts >= maxAttempts - 1) {
              throw new Error("Scan timed out");
            }
          }
        }

        // If we exit the loop without returning, assume we have results
        setScanResults(response);
        setScanStatus("complete");
        setProgress(100);
      } else {
        // No analysis ID, but we have results
        setScanResults(response);
        setScanStatus("complete");
        setProgress(100);
      }
    } catch (err) {
      console.error("Scan error:", err);
      setError(err.message || "An unknown error occurred");
      setScanStatus("error");
      setProgress(0);
    }
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
    const isClean = stats?.malicious === 0;
    const totalEngines = stats
      ? stats.malicious + stats.suspicious + stats.undetected + stats.harmless
      : 0;

    // Handle missing or incomplete data
    if (!stats) {
      return (
        <Box sx={{ mt: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Incomplete scan results received. The scan may still be processing.
          </Alert>
          <Button variant="outlined" onClick={onReset}>
            Try Again
          </Button>
        </Box>
      );
    }

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
            sx={{ p: 2, flex: 1, textAlign: "center", bgcolor: "error.light" }}
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

        {!isClean && engineResults && (
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
