const express = require('express');
const user = require(`../controllers/usersController`);
const auth = require(`../controllers/authController`);
const router = express.Router();

router.post('/signup', auth.signup);
router.post('/login', auth.login);
router.post('/logout', auth.cookieLogout)
router.post('/forgot-password', auth.forgotPassword);
router.patch('/reset-password/:token', auth.resetPassword);

//Protect all Routes after this Middleware
router.use(auth.protectRoute);
router.use(user.setAdmin);

router.patch('/update-password', auth.updatePassword);     
router.get('/me',
     user.getMe,
     user.getOneUser);
router.patch('/update-me',
     user.getMe,
     user.updateMe,
     user.updateUser);
router.delete('/delete-me', user.deleteMe);

// Restrict all Routes to 'admin'
router.use(auth.restrictTo('admin'))

router.route('/')
     .get(user.getAllUsers);
router.route('/:id')
     .get(user.getOneUser)
     .patch(user.updateUser)
     .delete(user.deleteUser);

module.exports = router;