import express from "express";
//import db from "../db.js";
import twilio from "twilio";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Get all flood data (for map)
router.get("/", (req, res) => {
  db.query("SELECT * FROM flood_data", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Add or update flood record
router.post("/", (req, res) => {
  const { district, latitude, longitude, water_level, status } = req.body;
  const sql = "INSERT INTO flood_data (district, latitude, longitude, water_level, status) VALUES (?, ?, ?, ?, ?)";
  
  db.query(sql, [district, latitude, longitude, water_level, status], (err) => {
    if (err) return res.status(500).json({ error: err.message });

    // Trigger alert if severe
    if (status === "Severe") triggerAlert(district, water_level);
    res.json({ message: "Flood data added successfully" });
  });
});

// Alert function (Twilio + Email)
function triggerAlert(district, water_level) {
  const message = `⚠️ Flood Alert in ${district}: Water level is ${water_level}m (Severe risk).`;

  // SMS
  client.messages
    .create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: "+91XXXXXXXXXX" // replace with test number or fetch from DB
    })
    .then(() => console.log("✅ SMS sent"))
    .catch((err) => console.error("❌ SMS error:", err));

  // Email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: "testreceiver@gmail.com",
    subject: "Flood Alert Notification",
    text: message
  });
}

export default router;
