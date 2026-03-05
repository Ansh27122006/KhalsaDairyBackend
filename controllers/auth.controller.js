const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

// ─── Helper ───────────────────────────────────────────────────────────────────
const generateToken = (userId, role) =>
  jwt.sign(
    { userId, role }, // ✅ role baked into JWT
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

const buildAuthResponse = (user, token, message) => ({
  userId: user._id,
  name: user.name,
  phone: user.phone,
  address: user.address,
  role: user.role, // ✅ returned to client so frontend can gate access
  token,
  message,
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, phone, password, address } = req.body;

  // Validation — mirrors AuthServiceImpl
  if (!phone || !/^\d{10}$/.test(phone)) {
    return res.status(400).json({
      error: "REGISTRATION_FAILED",
      message: "Phone number must be 10 digits",
    });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({
      error: "REGISTRATION_FAILED",
      message: "Password must be at least 6 characters",
    });
  }
  if (!name || name.trim().length === 0) {
    return res.status(400).json({
      error: "REGISTRATION_FAILED",
      message: "Name is required",
    });
  }

  // Duplicate phone check
  const exists = await User.findOne({ phone });
  if (exists) {
    return res.status(400).json({
      error: "REGISTRATION_FAILED",
      message: "Phone number already registered",
    });
  }

  // Hash password — replaces the insecure Base64 encoding in Java code
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name: name.trim(),
    phone,
    password: hashedPassword,
    address: address?.trim(),
    isActive: true,
  });

  const token = generateToken(user._id, user.role);
  res
    .status(201)
    .json(buildAuthResponse(user, token, "Registration successful"));
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(401).json({
      error: "LOGIN_FAILED",
      message: "Phone and password are required",
    });
  }

  // Explicitly select password (excluded from queries by default via select:false)
  const user = await User.findOne({ phone }).select("+password +role");
  if (!user) {
    return res.status(401).json({
      error: "LOGIN_FAILED",
      message: "Invalid phone number or password",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({
      error: "LOGIN_FAILED",
      message: "Invalid phone number or password",
    });
  }

  if (!user.isActive) {
    return res.status(401).json({
      error: "LOGIN_FAILED",
      message: "Account is inactive",
    });
  }

  const token = generateToken(user._id, user.role);
  res.status(200).json(buildAuthResponse(user, token, "Login successful"));
});

module.exports = { register, login };
