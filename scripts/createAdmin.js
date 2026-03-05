/**
 * scripts/createAdmin.js
 *
 * Creates the first admin account (or promotes an existing user to admin).
 * Run once from the backend folder:
 *
 *   node scripts/createAdmin.js
 *
 * It reads MONGODB_URI from your .env file automatically.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline");

// ─── Inline User schema (avoids circular import issues in script context) ─────
const UserSchema = new mongoose.Schema(
  {
    name: String,
    phone: { type: String, unique: true },
    password: String,
    address: String,
    isActive: { type: Boolean, default: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

// ─── Prompt helper ────────────────────────────────────────────────────────────
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error("\n❌  MONGODB_URI not found in .env file");
      process.exit(1);
    }

    console.log("\n🥛  Khalsa Dairy — Admin Account Setup\n");

    await mongoose.connect(uri);
    console.log("✅  Connected to MongoDB\n");

    const phone = await ask("   Admin phone number (10 digits): ");
    const password = await ask("   Admin password (min 6 chars):   ");
    const name = await ask("   Admin name:                      ");
    const address = await ask("   Address (optional, press Enter): ");
    rl.close();

    // Validate
    if (!/^\d{10}$/.test(phone.trim())) {
      console.error("\n❌  Phone must be exactly 10 digits");
      process.exit(1);
    }
    if (password.length < 6) {
      console.error("\n❌  Password must be at least 6 characters");
      process.exit(1);
    }

    const hashed = await bcrypt.hash(password, 12);

    const existing = await User.findOne({ phone: phone.trim() });

    if (existing) {
      // User already exists — just promote to admin
      existing.role = "admin";
      existing.isActive = true;
      await existing.save();
      console.log(`\n✅  Promoted existing user "${existing.name}" to admin!`);
    } else {
      // Create fresh admin account
      await User.create({
        name: name.trim() || "Admin",
        phone: phone.trim(),
        password: hashed,
        address: address.trim() || "Admin Office",
        isActive: true,
        role: "admin",
      });
      console.log(`\n✅  Admin account created successfully!`);
    }

    console.log("\n   📱  Phone:    ", phone.trim());
    console.log("   🔑  Password: ", "*".repeat(password.length));
    console.log("   🛡️   Role:     admin\n");
    console.log(
      "   You can now log into the admin dashboard with these credentials.\n"
    );
  } catch (err) {
    console.error("\n❌  Error:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
