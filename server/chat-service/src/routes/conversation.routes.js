const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { createGroup, getConversations } = require('../controllers/conversation.controller');

router.get('/', auth, getConversations);
router.post('/group', auth, createGroup);

module.exports = router;