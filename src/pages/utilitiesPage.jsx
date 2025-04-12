import { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  Grid,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import FolderZipIcon from "@mui/icons-material/FolderZip";

export function UtilitiesPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [scanResults, setScanResults] = useState(null);
  const [unpackStatus, setUnpackStatus] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    await handleFiles(files);
  };

  const handleFiles = async (files) => {
    if (activeTab === 0) {
      // Malware Scanner
      setUploadStatus("uploading");
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setScanResults({
          scanned: files.length,
          clean: files.length - 1,
          suspicious: 1,
          files: files.map((file) => ({
            name: file.name,
            size: file.size,
            status: file.name.includes("test") ? "suspicious" : "clean",
          })),
        });
        setUploadStatus("complete");
      } catch (error) {
        setUploadStatus("error");
        console.error("Upload failed:", error);
      }
    } else {
      // Firmware Unpacker
      setUnpackStatus("processing");
      try {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        setUnpackStatus("complete");
      } catch (error) {
        setUnpackStatus("error");
        console.error("Unpacking failed:", error);
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ mb: 4, fontWeight: "bold" }}
      >
        Utilities
      </Typography>

      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Malware Scanner" />
          <Tab label="Firmware Unpacker" />
        </Tabs>

        {activeTab === 0 ? (
          <>
            <Typography variant="h6" gutterBottom>
              File Malware Scanner
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Scan files for potential security threats and malware signatures.
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              Firmware Unpacker
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Upload firmware images to extract and analyze their contents.
            </Typography>
          </>
        )}

        <Box
          sx={{
            border: "2px dashed",
            borderColor: isDragging ? "primary.main" : "grey.300",
            borderRadius: 2,
            p: 4,
            height: 510,
            textAlign: "center",
            bgcolor: isDragging ? "primary.50" : "background.paper",
            transition: "all 0.2s ease-in-out",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            style={{ display: "none" }}
            multiple
            onChange={handleFileSelect}
          />
          <label htmlFor="file-upload" style={{ cursor: "pointer" }}>
            {activeTab === 0 ? (
              <>
                <CloudUploadIcon
                  sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                />
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  Click to upload or drag and drop files to scan
                </Typography>
              </>
            ) : (
              <>
                <FolderZipIcon
                  sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                />
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  Click to upload or drag and drop firmware to unpack
                </Typography>
              </>
            )}
            <Typography variant="body2" color="text.secondary">
              Support for multiple files
            </Typography>
          </label>
        </Box>

        {activeTab === 0 ? (
          <>
            {uploadStatus === "uploading" && (
              <Box sx={{ mt: 3 }}>
                <Alert severity="info" icon={<CircularProgress size={20} />}>
                  Scanning files for malware...
                </Alert>
              </Box>
            )}

            {scanResults && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Scan Results
                </Typography>

                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={4}>
                    <Paper elevation={1} sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="h4">
                        {scanResults.scanned}
                      </Typography>
                      <Typography color="text.secondary">
                        Files Scanned
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        textAlign: "center",
                        bgcolor: "success.light",
                      }}
                    >
                      <Typography variant="h4" color="success.dark">
                        {scanResults.clean}
                      </Typography>
                      <Typography color="success.dark">Clean Files</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper
                      elevation={1}
                      sx={{ p: 2, textAlign: "center", bgcolor: "error.light" }}
                    >
                      <Typography variant="h4" color="error.dark">
                        {scanResults.suspicious}
                      </Typography>
                      <Typography color="error.dark">
                        Suspicious Files
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Paper elevation={1}>
                  {scanResults.files.map((file, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderBottom:
                          index < scanResults.files.length - 1 ? 1 : 0,
                        borderColor: "divider",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <InsertDriveFileIcon
                          sx={{ mr: 2, color: "text.secondary" }}
                        />
                        <Box>
                          <Typography variant="body1">{file.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                        </Box>
                      </Box>
                      {file.status === "clean" ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <ErrorIcon color="error" />
                      )}
                    </Box>
                  ))}
                </Paper>
              </Box>
            )}
          </>
        ) : (
          <>
            {unpackStatus === "processing" && (
              <Box sx={{ mt: 3 }}>
                <Alert severity="info" icon={<CircularProgress size={20} />}>
                  Unpacking firmware image...
                </Alert>
              </Box>
            )}

            {unpackStatus === "complete" && (
              <Box sx={{ mt: 3 }}>
                <Alert severity="success">
                  Firmware successfully unpacked! Analysis complete.
                </Alert>
                <Paper elevation={1} sx={{ p: 3, mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Extracted Files
                  </Typography>
                  <Typography color="text.secondary">
                    (Firmware unpacking results would be displayed here)
                  </Typography>
                </Paper>
              </Box>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
}

export default UtilitiesPage;
