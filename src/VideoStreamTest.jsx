import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import './VideoStreamTest.css';

function VideoStreamTest() {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  // const serverURL = window.origin.includes("localhost") ? 'http://localhost:3001' : window.origin;
  // console.log('Server URL:', serverURL);
  // const serverURL = 'http://localhost:3000';
  const serverURL = window.origin;

  const [resOptions, setResOptions] = useState([]);
  const [selectedRes, setSelectedRes] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const [stats, setStats] = useState({
    latency: 0,
    throughput: 0,
    bufferingTime: 0,
    jitter: 0,
  });

  const latencySamples = useRef([]);
  const bufferingStart = useRef(null);
  const totalBufferingTime = useRef(0);
  const chunkRequestTimes = useRef(new Map());

  useEffect(() => {
    fetch(`${serverURL}/video/resolutions`)
      .then((res) => res.json())
      .then((data) => setResOptions(data.resolutions || []));
  }, [serverURL]);

  useEffect(() => {
    if (!selectedRes) return;

    // Reset stats
    latencySamples.current = [];
    bufferingStart.current = null;
    totalBufferingTime.current = 0;
    chunkRequestTimes.current = new Map();
    setStats({ latency: 0, throughput: 0, bufferingTime: 0, jitter: 0 });

    const video = videoRef.current;
    const src = `${serverURL}/hls/${selectedRes}/index.m3u8`;

    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    const hls = new Hls();
    hlsRef.current = hls;

    let isUnmounted = false;

    video.muted = true;
    hls.attachMedia(video);
    hls.loadSource(src);

    hls.on(Hls.Events.FRAG_LOADING, (event, data) => {
      chunkRequestTimes.current.set(data.frag.sn, performance.now());
    });

    hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
      const now = performance.now();
      const requestTime = chunkRequestTimes.current.get(data.frag.sn);

      if (requestTime !== undefined) {
        const latency = now - requestTime;
        latencySamples.current.push(latency);

        const avgLatency = latencySamples.current.reduce((a, b) => a + b, 0) / latencySamples.current.length;
        const jitter = latencySamples.current.length > 1
          ? Math.sqrt(latencySamples.current.reduce((acc, val) => acc + Math.pow(val - avgLatency, 2), 0) / latencySamples.current.length)
          : 0;

        let throughput = 0;
        const size = data.stats.total; // bytes
        const loadStart = data.stats.loading?.start ?? 0;
        const loadEnd = data.stats.loading?.end ?? 0;
        const loadDuration = loadEnd - loadStart; // in ms

        if (loadDuration > 0 && size > 0) {
          throughput = (size * 8) / (loadDuration / 1000) / 1000 / 1000; // Mbps
        }

        setStats(prev => ({
          ...prev,
          latency: avgLatency.toFixed(2),
          jitter: jitter.toFixed(2),
          throughput: throughput.toFixed(2),
        }));
      }
    });

    video.addEventListener('waiting', () => {
      bufferingStart.current = performance.now();
    });

    video.addEventListener('playing', () => {
      if (bufferingStart.current) {
        const bufferingDuration = performance.now() - bufferingStart.current;
        totalBufferingTime.current += bufferingDuration;
        setStats(prev => ({
          ...prev,
          bufferingTime: totalBufferingTime.current.toFixed(2),
        }));
        bufferingStart.current = null;
      }
    });

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      if (!isUnmounted) {
        video.play();
        setIsTesting(true);
      }
    });

    video.onended = () => {
      setIsTesting(false);
    };

    return () => {
      isUnmounted = true;
      hls.destroy();
    };
  }, [selectedRes, serverURL]);

  return (
    <div className="container" style={{ backgroundColor: '#1e1e1e', color: '#ffffff', minHeight: '100vh', padding: '20px' }}>
      <h2 className="header">🎯 Video Test Player</h2>

      <div className="button-group">
        {resOptions.map((res) => (
          <button
            key={res}
            onClick={() => setSelectedRes(res)}
            className={`res-button ${res === selectedRes ? 'active' : ''}`}
          >
            {res}
          </button>
        ))}
      </div>

      {selectedRes ? (
        <video
          ref={videoRef}
          controls
          className="video-player"
        />
      ) : (
        <p className="select-text"> Choose a resolution to begin the test.</p>
      )}

      <div className="stats">
        <h3>Live Stats</h3>
        <ul>
          {/* <li>Latency: {stats.latency} ms</li> */}
          {/* <li>Throughput: {stats.throughput} Mbps</li> */}
          <li>Buffering Time: {stats.bufferingTime} ms</li>
          {/* <li>Jitter: {stats.jitter} ms</li>  */}
        </ul>
      </div>
    </div>
  );
}

export default VideoStreamTest;
