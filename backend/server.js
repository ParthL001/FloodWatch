import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Twilio setup
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ✅ Flood data (SIMULATION)
const floodData = {
  // 🌆 Mumbai (20)
  "400001": { district: "Mumbai", status: "Severe", waterLevel: 7.5 },
  "400002": { district: "Mumbai", status: "Warning", waterLevel: 4.8 },
  "400003": { district: "Mumbai", status: "Normal", waterLevel: 2.0 },
  "400004": { district: "Mumbai", status: "Warning", waterLevel: 3.5 },
  "400005": { district: "Mumbai", status: "Severe", waterLevel: 6.9 },
  "400006": { district: "Mumbai", status: "Warning", waterLevel: 5.4 },
  "400007": { district: "Mumbai", status: "Normal", waterLevel: 1.6 },
  "400008": { district: "Mumbai", status: "Warning", waterLevel: 4.2 },
  "400009": { district: "Mumbai", status: "Warning", waterLevel: 4.9 },
  "400010": { district: "Mumbai", status: "Normal", waterLevel: 3.2 },
  "400011": { district: "Mumbai", status: "Severe", waterLevel: 6.2 },
  "400012": { district: "Mumbai", status: "Normal", waterLevel: 1.8 },
  "400013": { district: "Mumbai", status: "Severe", waterLevel: 7.2 },
  "400014": { district: "Mumbai", status: "Warning", waterLevel: 4.3 },
  "400015": { district: "Mumbai", status: "Normal", waterLevel: 2.1 },
  "400016": { district: "Mumbai", status: "Warning", waterLevel: 5.0 },
  "400017": { district: "Mumbai", status: "Warning", waterLevel: 3.7 },
  "400018": { district: "Mumbai", status: "Warning", waterLevel: 5.8 },
  "400019": { district: "Mumbai", status: "Warning", waterLevel: 4.6 },
  "400020": { district: "Mumbai", status: "Normal", waterLevel: 1.9 },

  // 🌧 Pune (20)
  "411001": { district: "Pune", status: "Severe", waterLevel: 6.9 },
  "411002": { district: "Pune", status: "Warning", waterLevel: 4.5 },
  "411003": { district: "Pune", status: "Normal", waterLevel: 1.8 },
  "411004": { district: "Pune", status: "Warning", waterLevel: 5.7 },
  "411005": { district: "Pune", status: "Warning", waterLevel: 3.4 },
  "411006": { district: "Pune", status: "Warning", waterLevel: 4.8 },
  "411007": { district: "Pune", status: "Severe", waterLevel: 7.0 },
  "411008": { district: "Pune", status: "Warning", waterLevel: 4.2 },
  "411009": { district: "Pune", status: "Normal", waterLevel: 1.7 },
  "411010": { district: "Pune", status: "Severe", waterLevel: 6.3 },
  "411011": { district: "Pune", status: "Warning", waterLevel: 5.2 },
  "411012": { district: "Pune", status: "Warning", waterLevel: 3.1 },
  "411013": { district: "Pune", status: "Normal", waterLevel: 1.6 },
  "411014": { district: "Pune", status: "Warning", waterLevel: 5.6 },
  "411015": { district: "Pune", status: "Severe", waterLevel: 6.8 },
  "411016": { district: "Pune", status: "Warning", waterLevel: 4.0 },
  "411017": { district: "Pune", status: "Normal", waterLevel: 1.9 },
  "411018": { district: "Pune", status: "Warning", waterLevel: 5.9 },
  "411019": { district: "Pune", status: "Warning", waterLevel: 4.4 },
  "411020": { district: "Pune", status: "Normal", waterLevel: 1.5 }
};

// ✅ Root route
app.get("/", (req, res) => {
  res.send("🌊 Flood Alert Backend Running");
});


// ===================== 🆕 ADDED ROUTE =====================
// ✅ Get flood status by pincode (USED BY FRONTEND CHECK BUTTON)
app.get("/api/flood-status/:pincode", (req, res) => {
  const { pincode } = req.params;

  const data = floodData[pincode];

  if (!data) {
    return res.json({
      message: "No data found for this pincode",
    });
  }

  res.json({
    pincode,
    status: data.status,
    water_level: data.waterLevel,
    station_name: data.district,
    updated_at: new Date().toISOString(),
  });
});
// ==========================================================


// ===================== 🆕 ADDED ROUTE =====================
// ✅ Get ALL flood data (USED BY MAP + ALERTS)
app.get("/api/flood-status/all", (req, res) => {
  const result = Object.entries(floodData).map(([pincode, data]) => ({
    pincode,
    status: data.status,
    water_level: data.waterLevel,
    latitude: 19 + Math.random(),   // temporary coords
    longitude: 73 + Math.random(),
    updated_at: new Date().toISOString(),
  }));

  res.json(result);
});
// ==========================================================


// ✅ Subscribe route (SMS alert)
app.post("/api/subscribe", async (req, res) => {
  const { name, phone, email, pincode } = req.body;

  if (!name || !phone || !pincode) {
    return res.status(400).json({ message: "⚠️ Missing required fields" });
  }

  const data = floodData[pincode];

  let alertMsg;
  if (data) {
    alertMsg = `🚨 Flood Alert for ${data.district} (${pincode}): ${data.status}. Water level: ${data.waterLevel}m. Stay safe, ${name}!`;
  } else {
    alertMsg = `✅ No flood alerts for your area (${pincode}), ${name}.`;
  }

  try {
    await client.messages.create({
      body: alertMsg,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    res.json({ message: "Subscription successful! SMS sent." });
  } catch (error) {
    console.error("❌ SMS failed:", error.message);
    res.status(500).json({ message: "SMS failed" });
  }
});


// ✅ Start server
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});