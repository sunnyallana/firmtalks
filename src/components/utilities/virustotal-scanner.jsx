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
import ErrorIcon from "@mui/icons-material/Error";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import WarningIcon from "@mui/icons-material/Warning";

const API_KEY = import.meta.env.VITE_VIRUSTOTAL_API_KEY;
const BASE_URL = import.meta.env.VITE_VIRUSTOTAL_API_URL;

export const VirusTotalScanner = ({ files, onReset }) => {
  const [scanResults, setScanResults] = useState(null);
  const [scanStatus, setScanStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const commonHeaders = {
    "x-apikey": API_KEY,
    "x-tool": "vt4browsers",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0 VT4Browsers/4.0.9",
    Accept: "application/json",
  };

  const pollAnalysisResults = async (
    analysisId,
    initialInterval = 1000,
    maxAttempts = 20,
  ) => {
    let interval = initialInterval;
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const response = await fetch(`${BASE_URL}/analyses/${analysisId}`, {
          headers: commonHeaders,
        });

        const data = await response.json();
        const progress = Math.min(100, (attempts / maxAttempts) * 100);
        setProgress(progress);

        if (data.data?.attributes?.status === "completed") {
          return data;
        }

        // If we know the status is queued, we can adjust our polling
        if (data.data?.attributes?.status === "queued") {
          interval = Math.min(interval * 1.5, 5000); // Reduced max interval from 10000 to 5000
        } else {
          interval = initialInterval; // Reset to fast polling when status changes
        }

        if (data.error) {
          throw new Error(data.error.message || "Analysis error occurred");
        }

        await new Promise((resolve) => setTimeout(resolve, interval));
      } catch (err) {
        console.error("Polling error:", err);
        // If it's a network error, we might want to retry immediately
        if (err.message.includes("NetworkError")) {
          interval = 1000;
          continue;
        }
        throw err;
      }
    }
    throw new Error(`Analysis timed out after ${maxAttempts} attempts`);
  };

  const scanFile = async (file) => {
    setScanStatus("uploading");
    setError(null);
    setProgress(0);

    try {
      // Validate API configuration
      if (!API_KEY) throw new Error("VirusTotal API key is not configured");
      if (file.size > 32 * 1024 * 1024)
        throw new Error("File size exceeds 32MB limit");

      // Step 1: Get upload URL
      setProgress(10);
      const uploadUrlResponse = await fetch(`${BASE_URL}/files/upload_url`, {
        headers: commonHeaders,
      });

      if (!uploadUrlResponse.ok) {
        const text = await uploadUrlResponse.text();
        throw new Error(`Failed to get upload URL: ${text.substring(0, 100)}`);
      }

      const uploadUrlData = await uploadUrlResponse.json();
      const uploadUrl = uploadUrlData.data;
      if (!uploadUrl) throw new Error("Invalid upload URL received");

      // Step 2: Upload file - optimized for speed
      setScanStatus("uploading");
      setProgress(30);

      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          ...commonHeaders,
          // Removing Content-Type header to let the browser set it with the boundary
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const text = await uploadResponse.text();
        throw new Error(`File upload failed: ${text.substring(0, 100)}`);
      }

      const uploadData = await uploadResponse.json();
      const analysisId = uploadData.data?.id;
      if (!analysisId) throw new Error("No analysis ID received");

      // Get file hash from analysis ID
      setScanStatus("analyzing");
      setProgress(70);

      // Convert analysis ID to hash
      const decoded = atob(analysisId);
      const fileHash = decoded.split(":")[0];
      if (!fileHash)
        throw new Error("Could not extract file hash from analysis ID");

      // Get file report
      const fileReportResponse = await fetch(`${BASE_URL}/files/${fileHash}`, {
        headers: commonHeaders,
      });

      if (!fileReportResponse.ok) {
        // Fall back to polling if direct lookup fails
        const analysisResult = await pollAnalysisResults(analysisId);

        // After polling, try to get the full report again
        const secondAttemptResponse = await fetch(
          `${BASE_URL}/files/${fileHash}`,
          {
            headers: commonHeaders,
          },
        );

        if (!secondAttemptResponse.ok) {
          throw new Error("Failed to get file report after polling");
        }

        var fileReport = await secondAttemptResponse.json();
      } else {
        var fileReport = await fileReportResponse.json();
      }

      // Process results
      const stats = fileReport.data?.attributes?.last_analysis_stats;
      if (!stats) throw new Error("Invalid analysis results");

      const results = fileReport.data?.attributes?.last_analysis_results || {};
      const engineResults = Object.entries(results)
        .filter(([_, value]) => value.category === "malicious")
        .map(([engine, result]) => ({
          engine,
          result: result.result,
          method: result.method,
          update: result.update,
        }));

      // Fix permalink to use public VirusTotal page instead of API
      const publicPermalink = `https://www.virustotal.com/gui/file/${fileHash}/detection`;

      setScanResults({
        name: file.name,
        size: file.size,
        stats,
        engineResults,
        fullResults: fileReport,
        permalink: publicPermalink,
        hash: fileHash,
      });
      setScanStatus("complete");
      setProgress(100);
    } catch (err) {
      console.error("Scan error:", err);
      setError(err.message || "An unknown error occurred");
      setScanStatus("error");
      setProgress(0);
    }
  };

  // Start scanning when files are received
  useEffect(() => {
    if (files && files.length > 0) {
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
