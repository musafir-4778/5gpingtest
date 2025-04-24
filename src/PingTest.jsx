import { useState } from 'react';
import './PingTest.css';

function App() {
  const [pingResult, setPingResult] = useState(null);
  const [isPinging, setIsPinging] = useState(false);
  const [progress, setProgress] = useState(0);

  const performPingTest = async () => {
    setIsPinging(true);
    setPingResult(null);
    setProgress(0);
    const serverURL = window.location.origin.includes('localhost') 
    ? 'http://localhost:3000' 
    : window.location.origin;

    const pings = [];
    const numberOfPings = 20;

    for (let i = 0; i < numberOfPings; i++) {
      const start = Date.now();
      try {
        const response = await fetch(`${serverURL}/ping`);
        await response.json();
        const latency = Date.now() - start;
        pings.push(latency);
      } catch (error) {
        console.error('Ping failed:', error);
      }

      setProgress(((i + 1) / numberOfPings) * 100);

      // Wait 200ms between pings
      if (i < numberOfPings - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    const minLatency = Math.min(...pings);
    const maxLatency = Math.max(...pings);
    const avgLatency = Math.round(pings.reduce((a, b) => a + b, 0) / pings.length);

    const result = { min: minLatency, max: maxLatency, avg: avgLatency };
    setPingResult(result);
    setIsPinging(false);

    // Send results back to the server
    fetch(`${serverURL}/logPing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...result, timestamp: new Date().toISOString() })
    });
  };

  return (
    <div className="test-container">
      <h1>Ping Test</h1>
      <button onClick={performPingTest} disabled={isPinging} className="ping-button">
        {isPinging ? 'Pinging...' : 'Start Ping Test'}
      </button>

      {/* Progress Bar */}
      {isPinging && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
      )}

      {pingResult && (
        <div className="result">
          <h2>Latency Results</h2>
          <p>Min: {pingResult.min}ms</p>
          <p>Max: {pingResult.max}ms</p>
          <p>Average: {pingResult.avg}ms</p>
        </div>
      )}
    </div>
  );
}

export default App;
