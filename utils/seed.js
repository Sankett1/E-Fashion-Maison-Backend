import "dotenv/config";
import connectDB from "../config/db.js";
import Product   from "../models/Product.js";
import User      from "../models/User.js";

// ── Seed function ──────────────────────────────────────────────────────────────
// Creates admin + demo user accounts only.
// Products are managed via the Admin Panel (Admin → Products) — no hardcoded data.
// Run with:  node utils/seed.js
const seedDB = async () => {
  await connectDB();

  // Wipe existing users (products added via Admin Panel are preserved)
  await User.deleteMany();
  console.log("🗑️  Cleared existing users");

  // ── Admin user ──────────────────────────────────────────────────────────────
  await User.create({
    name:          process.env.ADMIN_NAME,
    email:         process.env.ADMIN_EMAIL,
    password:      process.env.ADMIN_PASSWORD,
    role:          "admin",
    emailVerified: true,
  });
  console.log(`✅  Admin created: ${process.env.ADMIN_EMAIL}`);

  // ── Demo / test user ────────────────────────────────────────────────────────
  await User.create({
    name:          process.env.DEMO_USER_NAME,
    email:         process.env.DEMO_USER_EMAIL,
    password:      process.env.DEMO_USER_PASSWORD,
    role:          "user",
    emailVerified: true,
  });
  console.log(`✅  Demo user created: ${process.env.DEMO_USER_EMAIL}`);

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  MAISON — Database Seeded Successfully!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  🔑 Admin : ${process.env.ADMIN_EMAIL} / ${process.env.ADMIN_PASSWORD}`);
  console.log(`  👤 User  : ${process.env.DEMO_USER_EMAIL} / ${process.env.DEMO_USER_PASSWORD}`);
  console.log("  📦 Products : Add yours via Admin → Products");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  process.exit(0);
};

seedDB().catch(err => {
  console.error("❌  Seed failed:", err.message);
  process.exit(1);
});