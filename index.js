const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Allow CORS only from your GitHub Pages domain
const corsOptions = {
  origin: "https://creedpest.github.io",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
};
app.use(cors(corsOptions));
app.use(express.json());

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwXtE5qHfesanxb4_CI7tKGLlLAnkI-c6yE9C1RPKNwwNjfhMTj8fdcJFSHbZOgrXT0/exec";

// ✅ Preflight (OPTIONS) response handler
app.options("/", (req, res) => {
  res.set("Access-Control-Allow-Origin", "https://creedpest.github.io");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(204);
});

// GET request: forward to Google Apps Script
app.get("/", async (req, res) => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL);
    const data = await response.json();
    res.set("Access-Control-Allow-Origin", "https://creedpest.github.io");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST request: forward to Google Apps Script
app.post("/", async (req, res) => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.set("Access-Control-Allow-Origin", "https://creedpest.github.io");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy is running on port ${PORT}`);
});
