import express from "express";
import multer from "multer";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use absolute paths to ensure directories are created in the right place
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 32 * 1024 * 1024 }, // 32MB limit
});

// Helper function to read directory structure recursively
function readDirectoryRecursive(dir) {
  const results = [];
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      results.push({
        name: file,
        type: "directory",
        path: fullPath.replace(path.join(__dirname, "../"), ""),
        children: readDirectoryRecursive(fullPath),
      });
    } else {
      results.push({
        name: file,
        type: "file",
        path: fullPath.replace(path.join(__dirname, "../"), ""),
        size: stats.size,
      });
    }
  });

  return results;
}

// Firmware unpack endpoint
router.post("/unpack", upload.single("firmware"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    // Sanitize the output directory name by removing special characters
    const safeFilename = path.basename(filePath).replace(/[()]/g, "");
    const outputDir = path.join(__dirname, "../extracted", safeFilename);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Escape the file paths for shell usage
    const escapedFilePath = filePath.replace(/([ ()])/g, "\\$1");
    const escapedOutputDir = outputDir.replace(/([ ()])/g, "\\$1");

    // Run binwalk to extract the firmware
    const command = `binwalk -e --directory=${escapedOutputDir} ${escapedFilePath}`;

    exec(command, { timeout: 300000 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error during binwalk execution: ${error}`);
        fs.unlinkSync(filePath);
        return res.status(500).json({
          error: "Failed to unpack firmware",
          details: stderr || error.message,
        });
      }

      const extractedFiles = readDirectoryRecursive(outputDir);
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        originalFile: req.file.originalname,
        extractedFiles,
        log: stdout,
      });
    });
  } catch (err) {
    console.error("Firmware unpacking error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// File download endpoint
router.get("/download", (req, res) => {
  try {
    const filePath = path.join(__dirname, "../", req.query.path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File not found");
    }

    // Security check - prevent directory traversal
    if (!filePath.startsWith(path.join(__dirname, "../extracted"))) {
      return res.status(403).send("Access denied");
    }

    res.download(filePath);
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).send("Error downloading file");
  }
});

export default router;
