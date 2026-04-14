const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.use('/api/bookmarks', require('./routes/bookmarks'));

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
