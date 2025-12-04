const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');
const config = require('../config');

const validateAdminCredentials = (email, password) => {
  if (email !== config.admin.email) return false;
  const hashedPassword = CryptoJS.SHA256(password + config.passwordSalt).toString();
  return hashedPassword === config.admin.passwordHash;
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    if (!validateAdminCredentials(email, password)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = jwt.sign({ email, role: 'admin' }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    res.json({ success: true, token, user: { email, role: 'admin' } });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

exports.me = async (req, res) => {
  res.json({ success: true, user: req.user });
};
