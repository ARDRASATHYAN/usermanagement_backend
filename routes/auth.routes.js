const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const auth = require('../controllers/auth.controller');

router.post('/register', upload.single('profile'), auth.register);
router.get('/verify/:token', auth.verifyEmail);
router.post('/login', auth.login);
router.post('/refresh', auth.refreshToken);

router.post('/forgot-password', auth.forgotPassword);
router.post('/reset-password/:token', auth.resetPassword);

module.exports = router;
