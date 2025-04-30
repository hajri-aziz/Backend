// routes/groupRoutes.js
const express = require('express');
const router = express.Router();
const groupController = require('../Controller/ForumController.js');
router.post('/create', groupController.createGroup);
router.get('/all',  groupController.getUserGroups);
router.get('/:groupId/join', groupController.joinGroup);
router.post('/:groupId/search',  groupController.searchGroups);
router.get('/:groupId/messages',  groupController.getGroupMessages);

module.exports = router;