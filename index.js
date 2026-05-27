require("dotenv").config();
var port = process.env.PORT || 3001;
var express = require("express");
const mongoose = require("mongoose");
var cors = require("cors");
require("./db");
const { User, Contact } = require("./model");

var app = express();

app.use(express.json());
app.use(cors());

/* ---------------- SCHEMA ---------------- */

const appointmentSchema = new mongoose.Schema({
  doctorId: { type: String, required: true },
  doctorName: String,
  doctorSpeciality: String,
  patientName: String,
  patientEmail: String,
  date: String,
  timeSlot: String,
  tokenNumber: Number,
  status: { type: String, default: "upcoming" },
  notes: { type: String, default: "" },
  bookedAt: { type: Date, default: Date.now }
});

// 🔥 performance index (recommended)
appointmentSchema.index({ doctorId: 1, date: 1, timeSlot: 1 });

const Appointment = mongoose.model("Appointment", appointmentSchema);

/* ---------------- GET ALL USERS (ADMIN / TESTING) ---------------- */

app.get("/users", async (req, res) => {
  const users = await User.find({}, "-password"); // hides password
  res.json(users);
});

/* ---------------- REGISTER ---------------- */

app.post("/register", async (req, res) => {
  try {
    const userData = { ...req.body };

    if (
      userData.role &&
      userData.role.toLowerCase() === "doctor" &&
      !userData.availability
    ) {
      userData.availability = {
        Monday: { on: true, slots: ["09:00 AM", "11:30 AM", "03:30 PM"] },
        Tuesday: { on: true, slots: ["09:00 AM", "11:30 AM", "03:30 PM"] },
        Wednesday: { on: true, slots: ["09:00 AM", "11:30 AM", "03:30 PM"] },
        Thursday: { on: false, slots: [] },
        Friday: { on: true, slots: ["09:00 AM", "11:30 AM", "03:30 PM"] },
        Saturday: { on: true, slots: ["10:00 AM", "11:30 AM"] }
      };
    }

    const newUser = new User(userData);
    const savedUser = await newUser.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: savedUser
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/* ---------------- LOGIN ---------------- */

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, password });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    res.json({
      success: true,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- GET DOCTORS ---------------- */

app.get("/doctors", async (req, res) => {
  try {
    const doctors = await User.find({
      role: { $regex: /^doctor$/i }
    });

    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- BOOK APPOINTMENT ---------------- */

app.post("/book-appointment", async (req, res) => {
  try {
    const {
      doctorId,
      doctorName,
      doctorSpeciality,
      patientName,
      patientEmail,
      date,
      timeSlot
    } = req.body;

    if (!doctorId || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // prevent double booking
    const existingBooking = await Appointment.findOne({
      doctorId,
      date,
      timeSlot,
      status: "upcoming"
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: "Slot already booked"
      });
    }

    const count = await Appointment.countDocuments({
      doctorId,
      date
    });

    const newAppointment = new Appointment({
      doctorId,
      doctorName,
      doctorSpeciality,
      patientName,
      patientEmail,
      date,
      timeSlot,
      tokenNumber: count + 1
    });

    const saved = await newAppointment.save();

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: saved
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- DOCTOR APPOINTMENTS ---------------- */

app.get("/appointments/doctor/:doctorId", async (req, res) => {
  try {
    const data = await Appointment.find({
      doctorId: req.params.doctorId
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- UPDATE STATUS ---------------- */

app.put("/appointments/:id/status", async (req, res) => {
  try {
    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- UPDATE NOTES ---------------- */

app.put("/appointments/:id/notes", async (req, res) => {
  try {
    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { notes: req.body.notes },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- UPDATE AVAILABILITY ---------------- */

app.put("/doctors/:id/availability", async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { availability: req.body.availability } },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- GET ALL APPOINTMENTS (ADMIN) ---------------- */

app.get("/appointments/all", async (req, res) => {
  try {
    const all = await Appointment.find();
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- DELETE USER / DOCTOR (ADMIN) ---------------- */

app.delete("/users/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- DELETE APPOINTMENT (ADMIN) ---------------- */

app.delete("/appointments/:id", async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: "Appointment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- USER PROFILE ENDPOINTS ---------------- */

// 1. Get profile by email
app.get("/get-profile/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Update profile by email
app.put("/update-profile/:email", async (req, res) => {
  try {
    const updatedUser = await User.findOneAndUpdate(
      { email: req.params.email },
      { $set: req.body },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. User Appointments (Fixes profile page loading all appointments instead of just their own)
app.get("/appointments/patient/:email", async (req, res) => {
  try {
    const data = await Appointment.find({ patientEmail: req.params.email });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- RESCHEDULE APPOINTMENT ---------------- */

app.put("/appointments/:id/reschedule", async (req, res) => {
  try {
    const { date, timeSlot } = req.body;

    if (!date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: "Date and time required"
      });
    }

    // ✅ Get current appointment
    const currentAppointment = await Appointment.findById(req.params.id);

    if (!currentAppointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    // ✅ Check if slot already booked
    const existing = await Appointment.findOne({
      doctorId: currentAppointment.doctorId,
      date,
      timeSlot,
      status: "upcoming"
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Slot already booked"
      });
    }

    // ✅ Update appointment
    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        date,
        timeSlot,
        status: "upcoming"
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Appointment rescheduled successfully",
      data: updated
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- CONTACT FORM ENDPOINTS ---------------- */

// 1. Save contact message (Called by your React frontend)
app.post("/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation check
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const newContactMessage = new Contact({
      name,
      email,
      subject,
      message
    });

    await newContactMessage.save();

    res.status(201).json({
      success: true,
      message: "Message sent successfully! We will get back to you soon."
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get all contact messages (For the Admin View)
app.get("/contact/messages", async (req, res) => {
  try {
    // Fetches all messages, newest first
    const messages = await Contact.find().sort({ submittedAt: -1 }); 
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});     

/* ---------------- SERVER ---------------- */

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
