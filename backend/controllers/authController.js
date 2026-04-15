const User = require('../models/User');
const jwt = require('jsonwebtoken');

function signToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    // Normalize email to lowercase for consistency
    const normalizedEmail = email.toLowerCase().trim();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if email already exists (case-insensitive)
    let existed = await User.findOne({ 
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } 
    });
    if (existed) {
      return res.status(400).json({ 
        message: 'This email is already registered. Please use a different email or sign in instead.' 
      });
    }

    const user = new User({ name, email: normalizedEmail, password });
    
    try {
      await user.save();
    } catch (saveError) {
      // Handle MongoDB duplicate key error (in case of race condition)
      if (saveError.code === 11000 || saveError.name === 'MongoServerError') {
        return res.status(400).json({ 
          message: 'This email is already registered. Please use a different email or sign in instead.' 
        });
      }
      throw saveError; // Re-throw if it's a different error
    }

    const token = signToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('register error', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    // Normalize email for login (case-insensitive)
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } 
    });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const matched = await user.comparePassword(password);
    if (!matched) return res.status(400).json({ message: 'Invalid credentials' });

    const token = signToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/auth/me (protected)
exports.me = async (req, res) => {
  try {
    const user = req.user;
    res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
