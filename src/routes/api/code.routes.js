const express = require('express');
const router = express.Router();
const codeController = require('../../controllers/code.controllers');
const {  authUserMiddleware  } = require('../../middleware/authMiddleware');

router.post('/create-code', codeController.createCode);
router.post('/check-code/:id', codeController.checkCode);
router.post('/create-token-email', codeController.createTokenEmail);
module.exports = router;  