const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const urlMap = {}; // in-memory store for short_code -> long_url

const generateShortCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const getUniqueShortCode = () => {
  let code = generateShortCode();
  while (urlMap[code]) {
    code = generateShortCode();
  }
  return code;
};

app.post('/api/shorten', (req, res) => {
  const { long_url } = req.body;

  if (!long_url) return res.status(400).json({ message: 'Missing long_url' });
  if (long_url.length > 250) return res.status(400).json({ message: 'URL too long' });

  const short_code = getUniqueShortCode();
  urlMap[short_code] = long_url;

  res.json({ short_url: `http://localhost:5000/${short_code}` });
});

app.get('/:short_code', (req, res) => {
  const { short_code } = req.params;
  const longUrl = urlMap[short_code];

  if (longUrl) {
    return res.redirect(longUrl);
  } else {
    return res.status(404).send('Not found');
  }
});

app.get('/', (req, res) => {
  res.send('🎉 URL Shortener API is running without DB!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

