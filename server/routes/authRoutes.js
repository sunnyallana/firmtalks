import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email or username already exists'
      });
    }

    const user = new User({
      email,
      username,
      password
    });

    // Logging here to check before saving
    console.log('User created:', user);

    await user.save();

    // Logging after save
    console.log('User saved successfully');

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Logging token generation
    console.log('JWT token generated:', token);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        reputation: user.reputation
      }
    });
  } catch (error) {
    console.error('Registration error:', error);  // Log the error for debugging
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    
    const user = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        reputation: user.reputation
      }
    });
  } catch (error) {
    console.error('Error in login route:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;