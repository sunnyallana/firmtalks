// src/pages/utilities-page.js
import { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import FolderZipIcon from "@mui/icons-material/FolderZip";
import { VirusTotalScanner } from "../components/utilities/virustotal-scanner";

export function UtilitiesPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [filesToScan, setFilesToScan] = useState(null);
  const [unpackStatus, setUnpackStatus] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setFilesToScan(null);
    setUnpackStatus(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    if (activeTab === 0) {
      // Malware Scanner
      setFilesToScan(files);
    } else {
      // Firmware Unpacker
      setUnpackStatus("processing");
      setTimeout(() => {
        setUnpackStatus("complete");
      }, 3000);
    }
  };

  const resetScanner = () => {
    setFilesToScan(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ mb: 4, fontWeight: "bold" }}
      >
        Security Utilities
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
              Scan files with VirusTotal to detect potential security threats.
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
            height: 300,
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
              Maximum file size: 32MB
            </Typography>
          </label>
        </Box>

        {activeTab === 0 && filesToScan && (
          <VirusTotalScanner files={filesToScan} onReset={resetScanner} />
        )}

        {activeTab === 1 && (
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
