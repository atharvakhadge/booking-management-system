const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Admin = require('../models/Admin');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login — { username, password } -> { token }
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const matches = await bcrypt.compare(password, admin.passwordHash);
    if (!matches) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ sub: admin._id.toString(), username: admin.username }, JWT_SECRET, {
      expiresIn: '4h',
    });

    res.json({ token, username: admin.username });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
