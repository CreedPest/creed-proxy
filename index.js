const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { google } = require("googleapis");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 8080;

const SERVICE_ACCOUNT_EMAIL = "calendar-bot@creed-booking-462016.iam.gserviceaccount.com";
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
const CALENDAR_ID = "erik@creedpest.com";

const auth = new google.auth.JWT(
  SERVICE_ACCOUNT_EMAIL,
  null,
  PRIVATE_KEY,
  ["https://www.googleapis.com/auth/calendar"]
);
const calendar = google.calendar({ version: "v3", auth });

// GET availability
app.get("/", async (req, res) => {
  try {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 30);

    const result = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      singleEvents: true,
      orderBy: "startTime"
    });

    const events = result.data.items;

    // Create availability slots
    const availability = [];
    for (let i = 0; i < 30; i++) {
      const day = new Date();
      day.setDate(day.getDate() + i);

      if (day.getDay() === 0 || day.getDay() === 6) continue; // skip weekends

      const dateStr = day.toISOString().split("T")[0];
      const windows = [
        { label: "8–10 AM", start: 8 },
        { label: "10–12 PM", start: 10 },
        { label: "12–2 PM", start: 12 },
        { label: "2–4 PM", start: 14 },
      ];

      const free = windows.filter(w => {
        const slotStart = new Date(`${dateStr}T${String(w.start).padStart(2, "0")}:00:00-05:00`);
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(slotStart.getHours() + 2);

        // Don't show past slots
        const nowCentral = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }));
        if (slotEnd <= nowCentral) return false;

        return !events.some(ev => {
          const evStart = new Date(ev.start.dateTime || ev.start.date);
          const evEnd = new Date(ev.end.dateTime || ev.end.date);
          return slotStart < evEnd && evStart < slotEnd;
        });
      });

      if (free.length) availability.push({ date: dateStr, windows: free });
    }

    res.set("Access-Control-Allow-Origin", "*");
    res.json(availability);
  } catch (error) {
    console.error("GET error:", error);
    res.status(500).json({ error: "Failed to fetch availability" });
  }
});

// POST booking
app.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, city, zip, concern, date, timeWindow } = req.body;

    const [startHour] = timeWindow.split("–").map(t => parseInt(t));
    const start = new Date(`${date}T${String(startHour).padStart(2, "0")}:00:00-05:00`);
    const end = new Date(start);
    end.setHours(start.getHours() + 2);

    const description = `
Customer: ${firstName} ${lastName}
Phone: ${phone}
Email: ${email}
Address: ${address}, ${city}, ${zip}
Concern: ${concern}
Window: ${timeWindow}
`;

    await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: {
        summary: `Pest Control Estimate - ${firstName} ${lastName}`,
        description,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() }
      }
    });

    res.set("Access-Control-Allow-Origin", "*");
    res.json({ success: true });
  } catch (error) {
    console.error("POST error:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
