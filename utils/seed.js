import "dotenv/config";
import connectDB from "../config/db.js";
import Product   from "../models/Product.js";
import User      from "../models/User.js";

// ── Real fashion images from Unsplash (free, no auth needed) ─────────────────
// Format: https://images.unsplash.com/photo-{id}?w=800&q=80&fit=crop
const IMG = (id, w = 800, h = 1067) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80`;

const PRODUCTS = [
  // ── WOMEN ─────────────────────────────────────────────────────────────────
  {
    name:        "Belted Trench Coat",
    description: "A timeless wardrobe staple rendered in premium cotton-gabardine. Double-breasted front, storm flap, and detachable belt create effortless polish for any occasion. Fully lined in ivory silk.",
    price:       24900,
    category:    "Women",
    subCategory: "Outerwear",
    sizes:       ["XS", "S", "M", "L", "XL"],
    colors:      ["#c8b080", "#1a1a1a", "#e8e8e8"],
    stock:       18,
    tag:         "NEW",
    isFeatured:  true,
    fabric:      "65% Cotton, 35% Polyester Gabardine. Lining: 100% Silk.",
    careInstructions: "Dry clean only. Do not tumble dry.",
    images: [
      { public_id: "trench_1", url: IMG("1515886657613-9f3515b0c78f") },
      { public_id: "trench_2", url: IMG("1539109136881-3be0616acf4b") },
    ],
  },
  {
    name:        "Silk Satin Blouse",
    description: "Woven from pure Mysore silk with a lustrous satin finish. Relaxed-fit with hidden button placket and subtle ruching at the cuffs. Effortlessly elevates any ensemble from boardroom to soirée.",
    price:       8200,
    originalPrice: 11000,
    category:    "Women",
    subCategory: "Tops",
    sizes:       ["XS", "S", "M", "L", "XL"],
    colors:      ["#f0ebe0", "#c9a84c", "#1a2a4a"],
    stock:       40,
    tag:         "SALE",
    isFeatured:  true,
    fabric:      "100% Mysore Silk",
    careInstructions: "Dry clean recommended. Hand wash cold in gentle detergent if necessary.",
    images: [
      { public_id: "blouse_1", url: IMG("1485968579580-ee2a6b1e450f") },
      { public_id: "blouse_2", url: IMG("1490481651871-ab68de25d43d") },
    ],
  },
  {
    name:        "Cashmere Wrap Cardigan",
    description: "Ultra-soft wrap cardigan in Grade A Pashmina cashmere sourced from Ladakh. Generous drape and self-tie belt create cocooning warmth without bulk. A wardrobe investment that only improves with age.",
    price:       19500,
    originalPrice: 26000,
    category:    "Women",
    subCategory: "Knitwear",
    sizes:       ["XS", "S", "M", "L", "XL"],
    colors:      ["#e8e8e8", "#c8b080", "#1a1208"],
    stock:       15,
    tag:         "SALE",
    isFeatured:  true,
    fabric:      "Grade A Pashmina Cashmere (100%)",
    careInstructions: "Hand wash cold in gentle detergent. Lay flat to dry. Do not wring.",
    images: [
      { public_id: "cardigan_1", url: IMG("1434389677669-e08b4cac3105") },
      { public_id: "cardigan_2", url: IMG("1441984904996-e0b6ba687e04") },
    ],
  },
  {
    name:        "Pleated Midi Skirt",
    description: "Fluid pleated midi skirt cut from sand-washed crepe. The knife pleats fall gracefully from a hidden side zip. Pairs effortlessly with tucked blouses or relaxed knitwear.",
    price:       9800,
    category:    "Women",
    subCategory: "Skirts",
    sizes:       ["XS", "S", "M", "L", "XL"],
    colors:      ["#f0ebe0", "#c9a84c", "#1a2a4a"],
    stock:       28,
    tag:         "NEW",
    fabric:      "100% Sand-Washed Crepe",
    careInstructions: "Machine wash cold on gentle cycle. Hang to dry.",
    images: [
      { public_id: "skirt_1", url: IMG("1583496661106-8d4c31955d0a") },
      { public_id: "skirt_2", url: IMG("1552902865-b72c031ac5ea") },
    ],
  },
  {
    name:        "Draped Maxi Dress",
    description: "An evening statement in bias-cut Japanese crepe. The asymmetric drape and open back make this a collectors piece. Minimal seaming ensures a clean silhouette that flatters every figure.",
    price:       13900,
    category:    "Women",
    subCategory: "Dresses",
    sizes:       ["XS", "S", "M", "L"],
    colors:      ["#1a2a4a", "#c9a84c", "#e8e8e8"],
    stock:       12,
    tag:         "NEW",
    isFeatured:  false,
    fabric:      "100% Japanese Crepe",
    careInstructions: "Dry clean only.",
    images: [
      { public_id: "dress_1", url: IMG("1566174053879-31528523f8ae") },
      { public_id: "dress_2", url: IMG("1496747611176-887bac7f6d4c") },
    ],
  },

  // ── MEN ───────────────────────────────────────────────────────────────────
  {
    name:        "Navy Pinstripe Blazer",
    description: "Expertly crafted from 100% Italian wool with a classic pinstripe pattern. Two-button closure, notch lapels, and a tailored silhouette with structured shoulders. Fully lined in striped silk.",
    price:       18500,
    category:    "Men",
    subCategory: "Formalwear",
    sizes:       ["S", "M", "L", "XL", "XXL"],
    colors:      ["#1a2a4a", "#2a2a2a", "#c9a84c"],
    stock:       25,
    tag:         "NEW",
    isFeatured:  true,
    fabric:      "100% Italian Wool. Lining: 100% Silk.",
    careInstructions: "Dry clean only. Steam to remove creases.",
    images: [
      { public_id: "blazer_1", url: IMG("1594938298870-5100bf2e3c8c") },
      { public_id: "blazer_2", url: IMG("1507679799987-c73779587ccf") },
    ],
  },
  {
    name:        "Structured Wool Blazer",
    description: "Single-breasted, fully lined blazer in textured Rajasthani wool blend. Structured shoulder and tapered waist create an authoritative silhouette suited for all professional contexts.",
    price:       22000,
    originalPrice: 28000,
    category:    "Men",
    subCategory: "Formalwear",
    sizes:       ["S", "M", "L", "XL", "XXL"],
    colors:      ["#2a2a2a", "#8a6228", "#e8e8e8"],
    stock:       20,
    tag:         "SALE",
    fabric:      "Rajasthani Wool Blend (90% Wool, 10% Cashmere)",
    careInstructions: "Dry clean only.",
    images: [
      { public_id: "woolblazer_1", url: IMG("1617196034183-421b4040ed20") },
      { public_id: "woolblazer_2", url: IMG("1606107557195-0e29a4b5b4aa") },
    ],
  },
  {
    name:        "Slim Fit Dress Shirt",
    description: "Precision-cut slim-fit shirt in 2-ply poplin with a subtle herringbone weave. Spread collar, single-button cuffs, and a mother-of-pearl button placket. The foundation of any dressed wardrobe.",
    price:       5800,
    category:    "Men",
    subCategory: "Shirts",
    sizes:       ["S", "M", "L", "XL", "XXL"],
    colors:      ["#e8e8e8", "#1a2a4a", "#c9a84c"],
    stock:       45,
    tag:         null,
    fabric:      "100% Egyptian Cotton Poplin (2-ply)",
    careInstructions: "Machine wash 40°C. Iron on medium heat while damp.",
    images: [
      { public_id: "shirt_1", url: IMG("1598033129183-c4f50c736f10") },
      { public_id: "shirt_2", url: IMG("1620012351803-eae6eaaa78d8") },
    ],
  },
  {
    name:        "Shawl Collar Overcoat",
    description: "An investment piece in heavyweight double-faced cashmere-wool blend. The shawl collar drapes elegantly while side-seam pockets and a single back vent ensure practicality meets luxury.",
    price:       34500,
    category:    "Men",
    subCategory: "Outerwear",
    sizes:       ["S", "M", "L", "XL", "XXL"],
    colors:      ["#2a2a2a", "#6b5c44", "#e8e8e8"],
    stock:       10,
    isFeatured:  true,
    fabric:      "Cashmere-Wool Double-Face (70% Wool, 30% Cashmere)",
    careInstructions: "Dry clean only. Store on a broad hanger.",
    images: [
      { public_id: "overcoat_1", url: IMG("1520975916090-8105d898b5a1") },
      { public_id: "overcoat_2", url: IMG("1544441893-ki5gsfr1.jpg", 800, 1067) },
    ],
  },
  {
    name:        "Slim Fit Dress Trousers",
    description: "Precisely tailored from a lightweight Italian wool-blend. High-rise waist, straight leg with a clean break at the ankle. Four-pocket design with a French tack for belt loops.",
    price:       11200,
    category:    "Men",
    subCategory: "Trousers",
    sizes:       ["28", "30", "32", "34", "36", "38"],
    colors:      ["#1a1a1a", "#2a2a2a", "#6b5c44"],
    stock:       32,
    tag:         null,
    fabric:      "Italian Wool-Blend (80% Wool, 20% Polyester)",
    careInstructions: "Dry clean or machine wash cold on wool cycle.",
    images: [
      { public_id: "trousers_1", url: IMG("1560243563-062cb927a7ca") },
      { public_id: "trousers_2", url: IMG("1624378515843-28e0690def00") },
    ],
  },

  // ── ACCESSORIES ──────────────────────────────────────────────────────────
  {
    name:        "Chelsea Leather Boots",
    description: "Handcrafted from full-grain Rajasthani leather, these Chelsea boots combine heritage craftsmanship with a contemporary silhouette. Side elastic gussets ensure an effortless fit. Blake-stitched leather sole.",
    price:       12750,
    originalPrice: 18000,
    category:    "Accessories",
    subCategory: "Footwear",
    sizes:       ["38", "39", "40", "41", "42", "43", "44"],
    colors:      ["#1a1208", "#4a321e", "#c8b080"],
    stock:       30,
    tag:         "SALE",
    fabric:      "Full-Grain Rajasthani Leather. Sole: Blake-Stitched Leather.",
    careInstructions: "Wipe clean with a dry cloth. Apply leather conditioner monthly.",
    images: [
      { public_id: "boots_1", url: IMG("1638247025967-51873b8a5a6b") },
      { public_id: "boots_2", url: IMG("1542291026-7eec264c27ff") },
    ],
  },
  {
    name:        "Leather Crossbody Bag",
    description: "A compact everyday bag in smooth vegetable-tanned leather. Features an adjustable strap, gold-tone brass hardware, and a structured base that retains its shape through daily wear. Three interior pockets.",
    price:       16800,
    category:    "Accessories",
    subCategory: "Bags",
    sizes:       [],
    colors:      ["#4a321e", "#1a1208", "#c8b080"],
    stock:       22,
    tag:         "NEW",
    isFeatured:  true,
    fabric:      "Vegetable-Tanned Full-Grain Leather. Hardware: Solid Brass.",
    careInstructions: "Wipe clean with a slightly damp cloth. Store in the dust bag provided.",
    images: [
      { public_id: "bag_1", url: IMG("1548036161-65bde8cd75d4") },
      { public_id: "bag_2", url: IMG("1584917865442-de89df76afd3") },
    ],
  },
  {
    name:        "Heritage Silk Scarf",
    description: "Hand-printed on 18mm silk crepe in Surat. Each scarf features a unique block-printed geometric motif inspired by Mughal tilework. Finished with hand-rolled edges — no two are identical.",
    price:       6500,
    category:    "Accessories",
    subCategory: "Scarves",
    sizes:       [],
    colors:      ["#c9a84c", "#1a2a4a", "#e07070"],
    stock:       60,
    tag:         null,
    fabric:      "100% Silk Crepe (18mm). Hand block-printed in Surat.",
    careInstructions: "Hand wash cold or dry clean. Iron on silk setting.",
    images: [
      { public_id: "scarf_1", url: IMG("1601924638-f3a5efb9f5c9") },
      { public_id: "scarf_2", url: IMG("1603252109612-e9f3e0b73c27") },
    ],
  },
  {
    name:        "Gold-Tone Statement Belt",
    description: "A wide belt in smooth nappa leather with an oversized gold-tone buckle. The adjustable slide closure allows for precision fit. Adds structure and elegance to any silhouette.",
    price:       4800,
    category:    "Accessories",
    subCategory: "Belts",
    sizes:       ["XS", "S", "M", "L", "XL"],
    colors:      ["#1a1208", "#4a321e", "#c8b080"],
    stock:       35,
    tag:         null,
    fabric:      "Nappa Leather. Buckle: Gold-Tone Zinc Alloy.",
    careInstructions: "Wipe clean with a dry cloth. Avoid prolonged exposure to moisture.",
    images: [
      { public_id: "belt_1", url: IMG("1591561954557-26941169b49e") },
    ],
  },
  {
    name:        "Structured Tote Bag",
    description: "A generous everyday tote in pebbled calfskin leather. Open-top design with a magnetic snap, interior zip pocket, and brass D-ring for a key clip. The ideal companion for the modern professional.",
    price:       21500,
    category:    "Accessories",
    subCategory: "Bags",
    sizes:       [],
    colors:      ["#1a1208", "#4a321e", "#e8e8e8"],
    stock:       14,
    tag:         "NEW",
    isFeatured:  false,
    fabric:      "Pebbled Calfskin Leather. Hardware: Antique Brass.",
    careInstructions: "Use a leather protector spray. Store stuffed with tissue to retain shape.",
    images: [
      { public_id: "tote_1", url: IMG("1590874103328-eac38a683ce7") },
      { public_id: "tote_2", url: IMG("1575032617082-7acf9fabf1a2") },
    ],
  },
];

// ── Seed function ──────────────────────────────────────────────────────────────
const seedDB = async () => {
  await connectDB();

  // Wipe existing
  await Product.deleteMany();
  await User.deleteMany();
  console.log("🗑️  Cleared existing data");

  // ── Admin user ──────────────────────────────────────────────────────────────
  await User.create({
    name:     process.env.ADMIN_NAME,
    email:    process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role:     "admin",
    emailVerified: true,
  });

  // ── Demo user ───────────────────────────────────────────────────────────────
  await User.create({
    name:     process.env.DEMO_USER_NAME,
    email:    process.env.DEMO_USER_EMAIL,
    password: process.env.DEMO_USER_PASSWORD,
    role:     "user",
    emailVerified: true,
  });

  // ── Insert all products ─────────────────────────────────────────────────────
  const inserted = [];
  for (const p of PRODUCTS) {
    inserted.push(await Product.create(p));
  }
  console.log(`✅  Seeded ${inserted.length} products with images`);

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  MAISON Database Seeded Successfully!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  🔑 Admin:  ${process.env.ADMIN_EMAIL || "admin@maison.in"}   / ${process.env.ADMIN_PASSWORD || "Admin@123"}`);
  console.log(`  👤 User:   ${process.env.DEMO_USER_EMAIL || "arjun@example.com"} / ${process.env.DEMO_USER_PASSWORD || "User@123"}`);
  console.log(`  📦 Products seeded: ${inserted.length}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  process.exit(0);
};

seedDB().catch(err => {
  console.error("❌  Seed failed:", err.message);
  process.exit(1);
});
