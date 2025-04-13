import { useState, useEffect } from "react";
import {
  Alert,
  CircularProgress,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  IconButton,
  Collapse,
  Box,
} from "@mui/material";
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";

export function FirmwareUnpacker({ file, onReset }) {
  const [status, setStatus] = useState("idle"); // idle, uploading, unpacking, success, error
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [expandedDirs, setExpandedDirs] = useState(new Set());

  useEffect(() => {
    if (file) {
      handleFileUpload(file);
    }
  }, [file]);

  const handleFileUpload = async (file) => {
    if (!file) return;

    setStatus("uploading");
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append("firmware", file);

    try {
      // Create a progress tracker for the upload
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      });

      const response = await fetch("/api/firmware/unpack", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      setStatus("unpacking");
      const data = await response.json();
      setResult(data);
      setStatus("success");
    } catch (err) {
      console.error("Firmware unpack error:", err);
      setError(err.message || "Failed to unpack firmware");
      setStatus("error");
    }
  };

  const toggleDirectory = (path) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const handleDownload = (filePath) => {
    window.open(
      `/api/firmware/download?path=${encodeURIComponent(filePath)}`,
      "_blank",
    );
  };

  const renderFileTree = (items) => {
    return (
      <List dense sx={{ pl: 2 }}>
        {items.map((item) =>
          item.type === "directory" ? (
            <div key={item.path}>
              <ListItem button onClick={() => toggleDirectory(item.path)}>
                <ListItemIcon>
                  <FolderIcon />
                </ListItemIcon>
                <ListItemText primary={item.name} />
                {expandedDirs.has(item.path) ? (
                  <ExpandLessIcon />
                ) : (
                  <ExpandMoreIcon />
                )}
              </ListItem>
              <Collapse
                in={expandedDirs.has(item.path)}
                timeout="auto"
                unmountOnExit
              >
                {renderFileTree(item.children)}
              </Collapse>
            </div>
          ) : (
            <ListItem
              key={item.path}
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="download"
                  onClick={() => handleDownload(item.path)}
                >
                  <DownloadIcon />
                </IconButton>
              }
            >
              <ListItemIcon>
                <FileIcon />
              </ListItemIcon>
              <ListItemText
                primary={item.name}
                secondary={`${(item.size / 1024).toFixed(2)} KB`}
              />
            </ListItem>
          ),
        )}
      </List>
    );
  };

  return (
    <Box sx={{ mt: 3 }}>
      {status === "idle" && (
        <Alert severity="info">
          Upload a firmware file to begin unpacking and analysis.
        </Alert>
      )}

      {(status === "uploading" || status === "unpacking") && (
        <Alert
          severity="info"
          icon={
            <CircularProgress
              size={20}
              value={status === "uploading" ? progress : undefined}
            />
          }
        >
          {status === "uploading"
            ? "Uploading firmware..."
            : "Unpacking firmware..."}
        </Alert>
      )}

      {status === "error" && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={onReset}>
              Try Again
            </Button>
          }
        >
          {error || "Failed to unpack firmware"}
        </Alert>
      )}

      {status === "success" && result && (
        <>
          <Alert
            severity="success"
            action={
              <Button color="inherit" size="small" onClick={onReset}>
                Upload Another
              </Button>
            }
          >
            Successfully unpacked: {result.originalFile}
          </Alert>

          <Paper elevation={1} sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Extracted Files
            </Typography>
            {result.extractedFiles.length > 0 ? (
              renderFileTree(result.extractedFiles)
            ) : (
              <Typography color="text.secondary">
                No files were extracted from the firmware.
              </Typography>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
}
