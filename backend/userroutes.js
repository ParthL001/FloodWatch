import express from "express";
//import db from "../db.js";

const router = express.Router();

router.post("/register", (req, res) => {
  const { name, email, phone, pincode } = req.body;
  db.query("INSERT INTO users (name, email, phone, pincode) VALUES (?, ?, ?, ?)",
    [name, email, phone, pincode],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "User registered successfully" });
    }
  );
});

export default router;
