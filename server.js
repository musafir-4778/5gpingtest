import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

// Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Serve HLS video files
const hlsBasePath = path.join(__dirname, 'videos/hls');
app.use('/hls', express.static(hlsBasePath));

// Serve frontend build
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Ping test
app.get('/ping', (req, res) => {
  res.json({ timestamp: Date.now() });
});

// Receive ping logs
app.post("/logPing", (req, res) => {
  console.log(req.body);
  res.status(200).json({ message: "Data received" });
});

// Get file size
app.get('/download-file-size', (req, res) => {
  try {
    const stat = fs.statSync("1080.mp4");
    res.json({ fileSize: stat.size });
  } catch (error) {
    console.error("Error getting file size:", error);
    res.status(500).json({ error: "Unable to retrieve file size" });
  }
});

// Stream file download
app.get('/download', (req, res) => {
  const filePath = "1080.mp4";
  try {
    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Length': stat.size
    });
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error("Error streaming file:", error);
    res.status(500).json({ error: "Unable to stream file" });
  }
});

// Latency test
app.get('/download-ping', (req, res) => {
  res.send('pong');
});

// TTFB test
app.get('/download-ttfb', (req, res) => {
  const start = Date.now();
  res.setHeader('Content-Type', 'text/plain');
  res.send(`${Date.now() - start}`);
});

// List available video resolutions
app.get('/video/resolutions', (req, res) => {
  fs.readdir(hlsBasePath, { withFileTypes: true }, (err, files) => {
    if (err) return res.status(500).json({ error: 'Could not read folder' });

    const folders = files
      .filter((f) => f.isDirectory())
      .map((dir) => dir.name)
      .sort((a, b) => parseInt(b) - parseInt(a)); // sort high to low

    res.json({ resolutions: folders });
  });
});

// Serve frontend app (React SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// 404 and error handlers
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server (external access enabled)
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});
