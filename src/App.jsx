import { useState } from 'react';
import './App.css';
import PingTest from './PingTest';
import DownloadTest from './DownloadTest';
import VideoStreamTest from './VideoStreamTest';

function App() {
  const [selectedOption, setSelectedOption] = useState(null);
  return (
    <div className="container">
      {!selectedOption ? (
        <>
          <h1>Welcome to the Network Test Suite</h1>
          <p>Please choose one of the following options:</p>
          <button className="option-button" onClick={() => setSelectedOption('ping')}>Ping Test</button>
          <button className="option-button" onClick={() => setSelectedOption('download')}>Download Test</button>
          <button className="option-button" onClick={() => setSelectedOption('video')}>Video Stream Test</button>
        </>
      ) : (
        <>
          <button className="back-button" onClick={() => setSelectedOption(null)}>Back</button>
          {selectedOption === 'ping' && <PingTest />}
          {selectedOption === 'download' && <DownloadTest />}
          {selectedOption === 'video' && <VideoStreamTest />}
        </>
      )}
    </div>
  );
}

export default App;
