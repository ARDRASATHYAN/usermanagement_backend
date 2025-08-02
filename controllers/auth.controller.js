const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const transporter = require('../config/mailer');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');
const crypto = require('crypto');

exports.register = async (req, res) => {
  const { name, email, password,role } = req.body;
  const profileImage = req.file?.filename || null;

  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, profileImage,role });
 // In the frontend

    // ✅ Generate JWT token for verification
    const verificationToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const link = `${process.env.CLIENT_URL}/verify/${verificationToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Welcome, ${user.name}!</h2>
          <p>Please verify your email by clicking the button below:</p>
          <a href="${link}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
            Verify Email
          </a>
          <p>If the button doesn't work, paste this link into your browser:</p>
          <p>${link}</p>
        </div>
      `,
    });

    console.log('✅ Verification email sent to:', user.email);
    res.status(201).json({ message: 'Registration successful. Please verify your email.' });
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.json({ message: 'Email already verified' });
    }

    user.isVerified = true;
    await user.save();

    console.log(`✅ Email verified for: ${user.email}`);
    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  if (!user.isVerified) {
    return res.status(401).json({ message: 'Email not verified' });
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
   user.refreshToken = refreshToken;
  await user.save();

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      role:user.role
    }
  });
};

exports.refreshToken = async (req, res) => {
  const { token } = req.body;

  try {
    const user = await User.findOne({ where: { refreshToken: token } });
    if (!user) return res.status(403).json({ message: 'Refresh token not found' });

    jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const newAccessToken = generateAccessToken(user.id);
    return res.json({ accessToken: newAccessToken }); // only access token
  } catch (err) {
    console.error('Refresh failed:', err.message);
    return res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
};




// Add at the top


// ✅ FORGOT PASSWORD - send reset email
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1m' }
    );

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h3>Password Reset</h3>
        <p>Click the button below to reset your password:</p>
        <a href="${resetLink}" style="padding:10px 20px; background:#007BFF; color:#fff; text-decoration:none; border-radius:5px;">
          Reset Password
        </a>
        <p>If the link doesn't work, copy and paste this URL into your browser:</p>
        <p>${resetLink}</p>
      `
    });

    console.log('✅ Password reset email sent to:', user.email);
    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ✅ RESET PASSWORD - update in DB
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('❌ Reset password error:', err.message);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
};

exports.logout = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Logout failed' });
  }
};


