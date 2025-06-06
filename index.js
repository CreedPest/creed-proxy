const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Allow only GitHub Pages frontend
app.use(cors({
  origin: 'https://creedpest.github.io'
}));

app.use(bodyParser.json());

// 🔹 Example data for availability (you should replace this with actual logic if pulling from Google Calendar or similar)
app.get('/', (req, res) => {
  const now = new Date();
  const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const result = [];

  for (let i = 0; i < 14; i++) {
    const day = new Date(baseDate);
    day.setDate(baseDate.getDate() + i);

    // Skip Saturdays and Sundays
    if (day.getDay() === 0 || day.getDay() === 6) continue;

    const dateStr = day.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      windows: [
        { label: "8–10 AM", start: [8] },
        { label: "10 AM–12 PM", start: [10] },
        { label: "12–2 PM", start: [12] },
        { label: "2–4 PM", start: [14] }
      ]
    });
  }

  res.json(result);
});

// 🔹 Handle booking form submission
app.post('/', (req, res) => {
  const formData = req.body;

  // You can plug this into an email service, Google Sheet, DB, etc.
  console.log("New booking:", formData);

  // Simulate success
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
