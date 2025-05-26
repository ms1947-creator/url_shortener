const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const DB_NAME = 'url_shortener';

// Step 1: Initial connection (without selecting database)
const rootDb = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Msiddu@1947',
});

rootDb.connect((err) => {
  if (err) {
    console.error('Initial MySQL connection error:', err.message);
    process.exit(1);
  }
  console.log('Connected to MySQL (root)');

  // Step 2: Create database if not exists
  rootDb.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`, (err) => {
    if (err) {
      console.error('Failed to create database:', err.message);
      process.exit(1);
    }
    console.log(`Database '${DB_NAME}' is ready.`);

    // Step 3: Connect using the newly created database
    const db = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Msiddu@1947',
      database: DB_NAME,
    });

    db.connect((err) => {
      if (err) {
        console.error('MySQL DB connection error:', err.message);
        process.exit(1);
      }
      console.log('Connected to MySQL with database');

      // Step 4: Create table if not exists
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS urls_generator (
          id INT AUTO_INCREMENT PRIMARY KEY,
          long_url VARCHAR(250) NOT NULL,
          short_code VARCHAR(10) NOT NULL UNIQUE,
          click_count INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      db.query(createTableQuery, (err) => {
        if (err) {
          console.error('Failed to create table:', err.message);
          process.exit(1);
        }
        console.log('Table "urls_generator" is ready.');

        // All app routes and logic go below now that DB is ready

        const generateShortCode = () => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          let code = '';
          for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return code;
        };

        const getUniqueShortCode = (callback) => {
          const short_code = generateShortCode();
          const sql = 'SELECT COUNT(*) AS count FROM urls_generator WHERE short_code = ?';

          db.query(sql, [short_code], (err, results) => {
            if (err) return callback(err);
            if (results[0].count > 0) {
              return getUniqueShortCode(callback);
            }
            callback(null, short_code);
          });
        };

        app.post('/api/shorten', (req, res) => {
          const { long_url } = req.body;

          if (!long_url) return res.status(400).json({ message: 'Missing long_url' });
          if (long_url.length > 250) return res.status(400).json({ message: 'URL too long' });

          getUniqueShortCode((err, short_code) => {
            if (err) return res.status(500).json({ message: 'Short code error' });

            const insertSql = 'INSERT INTO urls_generator (long_url, short_code) VALUES (?, ?)';
            db.query(insertSql, [long_url, short_code], (err) => {
              if (err) return res.status(500).json({ message: 'Insert error' });
              res.json({ short_url: `http://localhost:5000/${short_code}` });
            });
          });
        });

        app.get('/:short_code', (req, res) => {
          const { short_code } = req.params;
          const selectSql = 'SELECT long_url FROM urls_generator WHERE short_code = ?';

          db.query(selectSql, [short_code], (err, results) => {
            if (err) return res.status(500).send('DB error');
            if (results.length === 0) return res.status(404).send('Not found');

            const longUrl = results[0].long_url;

            db.query('UPDATE urls_generator SET click_count = click_count + 1 WHERE short_code = ?', [short_code]);
            res.redirect(longUrl);
          });
        });

        const PORT = 5000;
        app.listen(PORT, () => {
          console.log(`Server running on http://localhost:${PORT}`);
        });
      });
    });
  });
});
