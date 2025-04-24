import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const app = express();
const port = 3000;

app.use(cors());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const hlsBasePath = path.join(__dirname, 'videos/hls');
app.use('/hls',cors(), express.static(hlsBasePath));
app.use(express.json());

app.use(express.static("public"));
// Root route
// app.get('/', (req, res) => {
//   res.json({ message: 'Ping test server is running' });
// });

// Ping endpoint
app.get('/ping', (req, res) => {
  res.json({ timestamp: Date.now() });
});

app.post("/logPing", (req, res) => {
  console.log(req.body);
  res.status(200).json({ message: "Data received" });
});


// // Endpoint to get the file size
app.get('/download-file-size', (req, res) => {
  try {
    const stat = fs.statSync("1080.mp4");
    res.json({ fileSize: stat.size });
  } catch (error) {
    console.error("Error getting file size:", error);
    res.status(500).json({ error: "Unable to retrieve file size" });
  }
});

// Endpoint to stream the file
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

// Latency test endpoint
app.get('/download-ping', (req, res) => {
  res.send('pong');
});

// Time to First Byte (TTFB) test endpoint
app.get('/download-ttfb', (req, res) => {
  const start = Date.now();
  res.setHeader('Content-Type', 'text/plain');
  res.send(`${Date.now() - start}`);
});

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


// Error handling middleware
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});