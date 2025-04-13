import express from "express";
import axios from "axios";
import FormData from "form-data";
import { Readable } from "stream";
import { clerkMiddleware } from "@clerk/express";
import multer from "multer";

const router = express.Router();

// Setup multer for memory storage (handles multipart form data properly)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 32 * 1024 * 1024 }, // 32MB limit
});

// Helper function for VT headers
const getVirusTotalHeaders = () => ({
  "x-apikey": process.env.VITE_VIRUSTOTAL_API_KEY,
  "x-tool": "vt4browsers",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) VT4Browsers/4.0.9",
  Accept: "application/json",
});

// Optimized polling function
const pollAnalysisResults = async (
  analysisId,
  maxAttempts = 10,
  interval = 500,
) => {
  for (let attempts = 0; attempts < maxAttempts; attempts++) {
    try {
      const analysisResponse = await axios.get(
        `${process.env.VITE_VIRUSTOTAL_API_URL}/analyses/${analysisId}`,
        {
          headers: getVirusTotalHeaders(),
          timeout: 5000,
        },
      );

      if (analysisResponse.data.data?.attributes?.status === "completed") {
        return analysisResponse.data;
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
      interval = Math.min(interval * 1.2, 2000);
    } catch (err) {
      console.error(`Poll attempt ${attempts + 1} failed:`, err.message);
      if (attempts >= maxAttempts - 1) throw err;
    }
  }
  throw new Error("Analysis timed out");
};

router.post(
  "/scan",
  clerkMiddleware(),
  upload.single("file"), // Use multer middleware
  async (req, res) => {
    try {
      console.log("Starting scan process");

      // Check if file exists
      if (!req.file) {
        console.error("No file in request");
        return res.status(400).json({ error: "No file provided" });
      }

      const filename = req.file.originalname || `file-${Date.now()}`;
      const fileBuffer = req.file.buffer;
      const fileSize = fileBuffer.length;

      console.log(`Processing file: ${filename}, size: ${fileSize} bytes`);

      if (fileSize > 32 * 1024 * 1024) {
        return res.status(400).json({ error: "File size exceeds 32MB limit" });
      }

      // Get upload URL
      console.log("Getting VirusTotal upload URL");
      const uploadUrlResponse = await axios.get(
        `${process.env.VITE_VIRUSTOTAL_API_URL}/files/upload_url`,
        {
          headers: getVirusTotalHeaders(),
          timeout: 5000,
        },
      );

      const uploadUrl = uploadUrlResponse.data.data;
      if (!uploadUrl) {
        console.error("Invalid upload URL received");
        throw new Error("Invalid upload URL received");
      }

      console.log("Uploading file to VirusTotal");
      // Create form data with the file
      const formData = new FormData();
      formData.append("file", Readable.from(fileBuffer), {
        filename,
        knownLength: fileSize,
      });

      // Upload file
      const uploadResponse = await axios.post(uploadUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          ...getVirusTotalHeaders(),
        },
        maxBodyLength: Infinity,
        timeout: 30000, // 30 second timeout
      });

      console.log("Upload response received");
      const analysisId = uploadResponse.data.data?.id;
      if (!analysisId) {
        console.error("No analysis ID in response");
        throw new Error("No analysis ID received");
      }

      console.log(`Analysis ID: ${analysisId}`);
      // Decode to get file hash
      const decoded = Buffer.from(analysisId, "base64").toString("utf-8");
      const fileHash = decoded.split(":")[0];
      if (!fileHash) {
        console.error("Failed to extract file hash");
        throw new Error("Could not extract file hash");
      }

      console.log(`File hash: ${fileHash}`);
      console.log("Polling for analysis results");

      // First check if the analysis is already complete
      try {
        // Get file report directly
        const fileReportResponse = await axios.get(
          `${process.env.VITE_VIRUSTOTAL_API_URL}/files/${fileHash}`,
          {
            headers: getVirusTotalHeaders(),
            timeout: 10000,
          },
        );

        console.log("File report received");
        const stats =
          fileReportResponse.data.data?.attributes?.last_analysis_stats;

        if (stats) {
          console.log("Analysis already complete, returning results");
          const results =
            fileReportResponse.data.data?.attributes?.last_analysis_results ||
            {};
          const engineResults = Object.entries(results)
            .filter(([_, value]) => value.category === "malicious")
            .map(([engine, result]) => ({
              engine,
              result: result.result,
              method: result.method,
              update: result.update,
            }));

          return res.json({
            name: filename,
            size: fileSize,
            stats,
            engineResults,
            permalink: `https://www.virustotal.com/gui/file/${fileHash}/detection`,
            hash: fileHash,
            status: "completed",
          });
        }
      } catch (err) {
        console.log(
          "File report not immediately available, will poll for results",
        );
      }

      // Poll for results
      console.log("Starting polling process");
      const analysisResult = await pollAnalysisResults(analysisId);
      console.log("Analysis complete, getting full report");

      // Get full report after polling
      const fileReportResponse = await axios.get(
        `${process.env.VITE_VIRUSTOTAL_API_URL}/files/${fileHash}`,
        {
          headers: getVirusTotalHeaders(),
          timeout: 10000,
        },
      );

      const stats =
        fileReportResponse.data.data?.attributes?.last_analysis_stats;
      if (!stats) {
        console.error("Invalid analysis results");
        throw new Error("Invalid analysis results");
      }

      console.log("Processing results");
      const results =
        fileReportResponse.data.data?.attributes?.last_analysis_results || {};
      const engineResults = Object.entries(results)
        .filter(([_, value]) => value.category === "malicious")
        .map(([engine, result]) => ({
          engine,
          result: result.result,
          method: result.method,
          update: result.update,
        }));

      console.log("Sending response to client");
      res.json({
        name: filename,
        size: fileSize,
        stats,
        engineResults,
        permalink: `https://www.virustotal.com/gui/file/${fileHash}/detection`,
        hash: fileHash,
        status: "completed",
      });
    } catch (error) {
      console.error("VirusTotal scan error:", error);
      res.status(500).json({
        error: error.message || "An error occurred during scanning",
        details: error.response?.data || "No additional details",
        status: "error",
      });
    }
  },
);

router.get("/scan/:analysisId", clerkMiddleware(), async (req, res) => {
  try {
    console.log(`Checking analysis status for: ${req.params.analysisId}`);
    const response = await axios.get(
      `${process.env.VITE_VIRUSTOTAL_API_URL}/analyses/${req.params.analysisId}`,
      {
        headers: getVirusTotalHeaders(),
        timeout: 5000,
      },
    );
    console.log("Analysis status:", response.data.data?.attributes?.status);
    res.json({
      status: response.data.data?.attributes?.status || "unknown",
      data: response.data.data,
    });
  } catch (error) {
    console.error("Error checking scan status:", error);
    res.status(500).json({
      error: error.message || "Error checking scan status",
      details: error.response?.data || "No additional details",
    });
  }
});

export default router;
