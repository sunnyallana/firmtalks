import express from "express";
import axios from "axios";
import FormData from "form-data";
import { Readable } from "stream";
import { clerkMiddleware } from "@clerk/express";

const router = express.Router();

// Middleware to handle multipart/form-data file uploads
const fileUploadMiddleware = (req, res, next) => {
  let data = [];
  req.on("data", (chunk) => {
    data.push(chunk);
  });
  req.on("end", () => {
    req.fileBuffer = Buffer.concat(data);
    next();
  });
};

/**
 * Poll VirusTotal for analysis results
 */
const pollAnalysisResults = async (
  analysisId,
  maxAttempts = 20,
  interval = 1000,
) => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const analysisResponse = await axios.get(
        `${process.env.VITE_VIRUSTOTAL_API_URL}/analyses/${analysisId}`,
        { headers: getVirusTotalHeaders() },
      );

      if (analysisResponse.data.data?.attributes?.status === "completed") {
        return analysisResponse.data;
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
      interval = Math.min(interval * 1.5, 5000);
    } catch (err) {
      if (attempts >= maxAttempts) throw err;
    }
  }

  throw new Error(`Analysis timed out after ${maxAttempts} attempts`);
};

const getVirusTotalHeaders = () => ({
  "x-apikey": process.env.VITE_VIRUSTOTAL_API_KEY,
  "x-tool": "vt4browsers",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0 VT4Browsers/4.0.9",
  Accept: "application/json",
});

router.post(
  "/scan",
  clerkMiddleware(),
  fileUploadMiddleware,
  async (req, res) => {
    try {
      if (!req.fileBuffer || req.fileBuffer.length === 0) {
        return res.status(400).json({ error: "No file provided" });
      }

      const filename = req.headers["x-filename"] || `file-${Date.now()}`;
      const fileSize = req.fileBuffer.length;

      if (fileSize > 32 * 1024 * 1024) {
        return res.status(400).json({ error: "File size exceeds 32MB limit" });
      }

      // Get upload URL
      const uploadUrlResponse = await axios.get(
        `${process.env.VITE_VIRUSTOTAL_API_URL}/files/upload_url`,
        { headers: getVirusTotalHeaders() },
      );

      const uploadUrl = uploadUrlResponse.data.data;
      if (!uploadUrl) throw new Error("Invalid upload URL received");

      // Upload file
      const formData = new FormData();
      formData.append("file", Readable.from(req.fileBuffer), {
        filename,
        knownLength: fileSize,
      });

      const uploadResponse = await axios.post(uploadUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          ...getVirusTotalHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      const analysisId = uploadResponse.data.data?.id;
      if (!analysisId) throw new Error("No analysis ID received");

      // Poll for results
      const analysisResult = await pollAnalysisResults(analysisId);
      const decoded = Buffer.from(analysisId, "base64").toString("utf-8");
      const fileHash = decoded.split(":")[0];
      if (!fileHash) throw new Error("Could not extract file hash");

      // Get full report
      const fileReportResponse = await axios.get(
        `${process.env.VITE_VIRUSTOTAL_API_URL}/files/${fileHash}`,
        { headers: getVirusTotalHeaders() },
      );

      const stats =
        fileReportResponse.data.data?.attributes?.last_analysis_stats;
      if (!stats) throw new Error("Invalid analysis results");

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
        status: "error",
      });
    }
  },
);

router.get("/scan/:analysisId", clerkMiddleware(), async (req, res) => {
  try {
    const response = await axios.get(
      `${process.env.VITE_VIRUSTOTAL_API_URL}/analyses/${req.params.analysisId}`,
      { headers: getVirusTotalHeaders() },
    );
    res.json({
      status: response.data.data?.attributes?.status || "unknown",
      data: response.data.data,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message || "Error checking scan status",
    });
  }
});

export default router;
