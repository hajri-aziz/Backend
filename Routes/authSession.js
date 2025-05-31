// backend/Routes/authSession.js
const router           = require('express').Router();
const { authMiddleware } = require('../Middll/authMiddleware');
const { sessionLogin } = require('../Controller/AuthSessionController');

router.post(
  '/session-login',
  authMiddleware,       // vérifie le JWT utilisateur
  sessionLogin
);

module.exports = router;
