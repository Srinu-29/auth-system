require('dotenv').config(); // Load environment variables
const express = require('express');
const mongoose = require('mongoose');
const USER = require("./models/user");
const app = express();
const bcrypt = require('bcrypt');
const path = require("path");
const session = require("express-session");
const crypto = require('crypto');
const serverless = require('serverless-http');


// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Secure session secret
const secretKey = crypto.randomBytes(64).toString('hex');

// MongoDB Connection
const dbURI = process.env.MONGODB_URI; // Use environment variable
mongoose.connect(dbURI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  });

// Session middleware
app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// ==== ROUTES ====

app.get('/', (req, res) => {
  if (req.session.user) {
    console.log("Root route: User logged in, redirecting to dashboard");
    return res.redirect('/dashboard');
  }
  console.log("Root route: No user, redirecting to signin");
  res.redirect('/signin');
});

app.get('/signin', (req, res) => {
  console.log("Rendering signin page");
  res.render("signin", { error: null });
});

app.get('/signup', (req, res) => {
  console.log("Rendering signup page");
  res.render("signup", { error: null, passwordErrors: [] });
});

app.get('/dashboard', (req, res) => {
  console.log("Dashboard accessed, session:", req.session.user);
  
  if (!req.session.user) {
    console.log("No session user, redirecting to signin");
    return res.redirect('/signin');
  }
  
  try {
    res.render("dashboard", { 
      user: req.session.user,
      error: null 
    });
    console.log("Dashboard rendered successfully");
  } catch (error) {
    console.error("Dashboard render error:", error.stack);
    res.status(500).send("Error rendering dashboard: " + error.message);
  }
});

app.get('/user', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json(req.session.user);
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Logout error:", err.stack);
      return res.status(500).send("Error during logout");
    }
    console.log("Session destroyed, redirecting to signin");
    res.redirect('/signin');
  });
});

// ==== SIGNUP ====

app.post("/signup", async (req, res) => {
  const { name, email, password, confirm_password, gender, mobile_number } = req.body;

  // Debug log
  console.log("Signup form data:", { name, email, password: "[hidden]", confirm_password: "[hidden]", gender, mobile_number });

  // Trim inputs
  const trimmed = {
    name: name?.trim(),
    email: email?.trim(),
    password: password?.trim(),
    confirm_password: confirm_password?.trim(),
    gender: gender?.trim(),
    mobile_number: mobile_number?.trim()
  };

  // Password regex: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_-])[A-Za-z\d!@#$%^&*_-]{8,}$/;
  const passwordErrors = [];
  if (!passwordRegex.test(trimmed.password)) {
    if (trimmed.password.length < 8) passwordErrors.push("Password must be at least 8 characters");
    if (!/[a-z]/.test(trimmed.password)) passwordErrors.push("Password must contain at least 1 lowercase letter");
    if (!/[A-Z]/.test(trimmed.password)) passwordErrors.push("Password must contain at least 1 uppercase letter");
    if (!/\d/.test(trimmed.password)) passwordErrors.push("Password must contain at least 1 number");
    if (!/[!@#$%^&*_-]/.test(trimmed.password)) passwordErrors.push("Password must contain at least 1 special character (!@#$%^&*_-)");
  }

  // Check if passwords match
  if (trimmed.password !== trimmed.confirm_password) {
    passwordErrors.push("Passwords do not match");
  }

  if (passwordErrors.length > 0) {
    console.log("Server-side validation failed:", passwordErrors);
    return res.render("signup", { error: null, passwordErrors });
  }

  try {
    console.log("USER model:", USER); // Debug
    const existingUser = await USER.findOne({ email: trimmed.email });
    if (existingUser) {
      console.log("User already exists:", trimmed.email);
      return res.render("signup", { error: "Email already exists", passwordErrors: [] });
    }

    const hashedPassword = await bcrypt.hash(trimmed.password, 10);
    console.log("Hashed password:", hashedPassword); // Debug

    const person = new USER({
      name: trimmed.name,
      email: trimmed.email,
      password: hashedPassword,
      gender: trimmed.gender,
      mobile_number: trimmed.mobile_number
    });
    
    // Debug the user object
    console.log("User to be saved:", person);

    await person.save();
    console.log("User saved successfully");

    // Auto-login by setting session
    req.session.user = {
      id: person._id,
      name: person.name,
      email: person.email,
      mobile_number: person.mobile_number
    };
    console.log("Session user set after signup:", req.session.user);
    console.log("Redirecting to dashboard");
    return res.redirect("/dashboard");
  } catch (err) {
    console.error("Signup error details:", err.stack);
    if (err.name === 'ValidationError') {
      const errorMessages = Object.values(err.errors).map(e => e.message).join(', ');
      console.log("Validation error:", errorMessages);
      return res.render("signup", { error: `Validation error: ${errorMessages}`, passwordErrors: [] });
    }
    if (err.code === 11000) {
      console.log("Duplicate key error:", trimmed.email);
      return res.render("signup", { error: "Email already exists", passwordErrors: [] });
    }
    return res.render("signup", { error: "Server error: " + err.message, passwordErrors: [] });
  }
});

// ==== SIGNIN ====

app.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Debug log
    console.log("Signin attempt:", { email, password: "[hidden]" });
    console.log("USER model:", USER); // Debug
    const user = await USER.findOne({ email: email?.trim() });
    console.log("User found:", user ? { ...user._doc, password: "[hidden]" } : "No");

    if (!user) {
      console.log("Email not found");
      return res.render("signin", { error: "Email not found" });
    }

    console.log("Stored password hash:", user.password); // Debug
    const isMatch = await bcrypt.compare(password?.trim(), user.password);
    console.log("Password match:", isMatch ? "Yes" : "No");
    
    if (!isMatch) {
      console.log("Invalid password");
      return res.render("signin", { error: "Invalid password" });
    }

    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      mobile_number: user.mobile_number
    };

    console.log("Session user set:", req.session.user);
    console.log("Redirecting to dashboard");
    return res.redirect("/dashboard");
  } catch (error) {
    console.error("Signin error details:", error.stack);
    res.render("signin", { error: "Server error: " + error.message });
  }
});
module.exports.handler = serverless(app);
// ==== START SERVER ====

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));