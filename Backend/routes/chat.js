// Backend/routes/chat.js
const express = require("express");
const { chat } = require("../controllers/chatController");

const router = express.Router();

// POST /api/chat - Chat with the assistant (auth optional; role detected from token)
router.post("/", chat);

module.exports = router;