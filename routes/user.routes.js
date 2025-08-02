const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const {authenticate} = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/view',authenticate,userController.getAllUsers);
router.delete('/:id', userController.deleteUser);
router.put('/:id', upload.single('profileImage'), userController.editUser);





module.exports = router;