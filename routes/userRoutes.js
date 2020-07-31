const express = require('express');
const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');

const router = express.Router();

router.post('/signup',authController.signup);
router.post('/login',authController.login);
router.get('/logout',authController.logout);
router.post('/googleAPI', authController.googleLogin);

router.use(authController.protect);

router.get('/me',userController.getInfo);
router.get('/check', authController.isLoggedInByHeader);
router.get('/getMessages', userController.processingMessages);

module.exports = router;


