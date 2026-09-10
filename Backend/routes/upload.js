const express = require("express");
const upload = require("../config/multer");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");

const router = express.Router();

router.post("/profile-image", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const imageUrl = req.file.path;

    const user = await User.findByPk(req.user.id);
    if (user) {
      user.profile_picture = imageUrl;
      await user.save();
    }

    res.json({
      imageUrl,
      message: "Uploaded successfully!"
    });
  } catch (err) {
    console.error("Profile image upload error:", err);
    res.status(500).json({ error: "File upload failed" });
  }
});

router.post("/resume", (req, res) => {
  upload.single("resume")(req, res, (err) => {
    if (err) {
      console.error("Upload error:", err);
      return res.status(400).json({ error: err.message || "File upload failed" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    res.json({
      resumeUrl: req.file.path,
      message: "Resume uploaded successfully!"
    });
  });
});

module.exports = router;
