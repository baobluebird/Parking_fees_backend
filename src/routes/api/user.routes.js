const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user.controllers');
const {  authUserMiddleware  } = require('../../middleware/authMiddleware');

router.post('/sign-up', userController.createUser);
router.post('/sign-in', userController.loginUser);
router.post('/log-out', userController.logoutUser);
router.post('/get-id', userController.getId);
router.post('/update-user/:id', userController.updateUser);

// router.get('/get-detail/:id',authUserMiddleware ,userController.getDetailsUser);
// router.post('/change-password/:id', userController.changePassword);
//router.post('/refresh-token', userController.refreshToken);


module.exports = router;  