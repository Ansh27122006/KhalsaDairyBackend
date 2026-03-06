const express = require("express");
const { register, login, validate } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// GET /api/auth/validate
router.get("/validate", protect, validate);

module.exports = router;
