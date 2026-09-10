
// Backend/index.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth.js");
const sequelize = require("./config/db.js");
const uploadRoutes = require("./routes/upload.js");
const Job = require("./models/Job.js");
const jobRoutes = require("./routes/jobs.js");
const recruiterRoutes = require("./routes/recruiter.js");
const applicationsRoutes = require("./routes/applications.js");
const adminRoutes = require("./routes/adminRoutes.js");
const studentRoutes = require("./routes/student.js");
const studentApplicationsRoutes = require("./routes/studentApplications.js");
const chatRoutes = require("./routes/chat.js");
const Notification = require("./models/Notification.js");
const path = require("path");




dotenv.config({ path: path.join(__dirname, '.env') });
process.env.JWT_SECRET = process.env.JWT_SECRET || "hireway-dev-secret-change-me";
const app = express();


app.use(express.json());
app.use(cors({
  origin: true,
  credentials: true
}));

// Serve static files
const frontendPath = path.resolve(__dirname, '../Frontend');

console.log(`Serving Frontend from: ${frontendPath}`);

app.use(express.static(frontendPath)); // Serve Frontend at root
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads'))); // Serve uploaded resumes

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/recruiter", recruiterRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/student", studentApplicationsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/apply-job", applicationsRoutes);

// Start server after syncing DB
const PORT = process.env.PORT || 5001;
const fs = require("fs");
(async () => {
  try {
    fs.mkdirSync(path.join(__dirname, 'uploads', 'resumes'), { recursive: true });
    await sequelize.sync(); // �o. Sync database without forcing alterations
    console.log("�o. Database synced successfully.");
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  } catch (err) {
    console.error("�?O Unable to start server:", err);
  }
})();
