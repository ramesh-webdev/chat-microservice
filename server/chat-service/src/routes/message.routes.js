const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const controller = require('../controllers/message.controller');

router.get('/:conversationId', auth, controller.getMessages);


module.exports = router;