import React, { useState } from 'react';

const backendUrl = window.location.origin.includes('localhost') 
? 'http://localhost:3000' 
: window.location.origin;

const NetworkTest = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState(0);
  
  const startTest = async () => {
    setIsTesting(true);
    setResults(null);
    setProgress(0);
    
    const latencyStart = performance.now();
    await fetch(`${backendUrl}/download-ping`);
    const latency = performance.now() - latencyStart;
    
    const ttfbStart = performance.now();
    const ttfbResponse = await fetch(`${backendUrl}/download-ttfb`);
    const ttfb = parseFloat(await ttfbResponse.text());
    
    let packetsSent = 0;
    let packetsReceived = 0;
    let jitterValues = [];
    let lastPing = null;
    let pingInterval;
    let stopPinging = false;
    
    
    // Start pinging in the background
    
    const startPinging = () => {
      pingInterval = setInterval(async () => {
        if (stopPinging) return;
        const pingStart = performance.now();
        packetsSent++;
        try {
          await fetch(`${backendUrl}/ping`);
          const pingEnd = performance.now();
          const pingDuration = pingEnd - pingStart;
          packetsReceived++;
          
          if (lastPing !== null) {
            jitterValues.push(Math.abs(pingDuration - lastPing));
          }
          lastPing = pingDuration;
        } catch (err) {
          console.warn("Packet lost");
        }
      }, 200); // ping every 200ms
    };

    const downloadFileWithProgress = async (fileSize) => {
      const response = await fetch(`${backendUrl}/download`);
      
      if (!response.body) {
        throw new Error("Readable stream not supported in this browser.");
      }
      
      const reader = response.body.getReader();
      let receivedLength = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        receivedLength += value.length;
        const progressPercent = (receivedLength / fileSize) * 100;
        setProgress(progressPercent);
      }
      
      // Optional: finalize or reset progress
      setProgress(100);
    };
    
    const fileSizeRes = await fetch(`${backendUrl}/download-file-size`);
    const { fileSize } = await fileSizeRes.json();
    
    startPinging();
    
    // Download the file
    const downloadStart = performance.now();
    await downloadFileWithProgress(fileSize);
    const downloadEnd = performance.now();
    stopPinging = true;
    clearInterval(pingInterval);
    
    const fileSizeMB = fileSize / (1024 * 1024);
    const downloadTime = (downloadEnd - downloadStart) / 1000;
    const speedMbps = (fileSizeMB / downloadTime) * 8;
  
    const packetLoss = ((packetsSent - packetsReceived) / packetsSent) * 100;
    const jitter = jitterValues.length > 0
      ? jitterValues.reduce((a, b) => a + b, 0) / jitterValues.length
      : 0;
    const networkStability = 100 - packetLoss - (jitter / 10);
    setIsTesting(false);
  
    setResults({
      latency,
      ttfb,
      downloadTime,
      fileSizeMB,
      speedMbps,
      packetLoss,
      jitter,
      networkStability,
    });
  
  };
  

  return (
    <div className="container">
      <h1>Download File Test</h1>
      <button onClick={startTest} disabled={isTesting} className="ping-button">
        {isTesting ? "Testing..." : "Start Test"}
      </button>

      {/* Progress Bar */}
      {isTesting && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
      )}


      {results && (
        <div className="result">
          <p>Latency: {results.latency.toFixed(2)} ms</p>
          <p>TTFB: {results.ttfb} ms</p>
          <p>Download Time: {results.downloadTime.toFixed(2)} s</p>
          <p>Downloaded File Size: {results.fileSizeMB.toFixed(2)} MB</p>
          <p>Download Speed: {results.speedMbps.toFixed(2)} Mbps</p>
          <p>Packet Loss: {results.packetLoss.toFixed(2)} %</p>
          <p>Jitter: {results.jitter.toFixed(2)} ms</p>
          <p>Network Stability: {results.networkStability.toFixed(2)} %</p>
        </div>
      )}
    </div>
  );
};

export default NetworkTest;
