import React, { useState } from 'react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;


export default function PremiumURLShortener() {
  const [longUrl, setLongUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const shortenUrl = async () => {
    setError('');
    setShortUrl('');
    if (!longUrl) {
      setError('Please enter a URL');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ long_url: longUrl }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Failed to generate short URL');
      } else {
        setShortUrl(data.short_url);
      }
    } catch {
      setError('Server unreachable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>URL Shortener</h1>
      <input
        type="text"
        placeholder="Enter your long URL here"
        value={longUrl}
        onChange={(e) => setLongUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') shortenUrl();
        }}
        spellCheck="false"
      />
      <button onClick={shortenUrl} disabled={loading}>
        {loading ? 'Shortening...' : 'Shorten URL'}
      </button>
      {shortUrl && (
        <div className="result">
          Short URL:{' '}
          <a href={shortUrl} target="_blank" rel="noopener noreferrer">
            {shortUrl}
          </a>
        </div>
      )}
      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Generating short URL...</div>}
    </div>
  );
}
