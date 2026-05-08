import SiteContent from "../models/SiteContent.js";
import { cloudinary } from "../config/cloudinary.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

// ── Cloudinary storage for site/story images ──────────────────────────────────
const storyStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          "maison/story",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation:  [{ width: 1400, height: 1050, crop: "limit", quality: "auto:good" }],
  },
});
export const uploadStoryImage = multer({ storage: storyStorage }).single("image");

// ── Helper: get or create the "about" document ───────────────────────────────
async function getAboutDoc() {
  let doc = await SiteContent.findOne({ section: "about" });
  if (!doc) {
    doc = await SiteContent.create({
      section:        "about",
      atelierGallery: [],
      journeyItems:   [],
      values:         [],
      team:           [],
    });
  }
  return doc;
}

// ── GET /api/site-content/about ──────────────────────────────────────────────
export const getAboutContent = async (req, res, next) => {
  try {
    const doc = await getAboutDoc();
    res.json({ success: true, content: doc });
  } catch (err) { next(err); }
};

// ── PUT /api/site-content/about/hero ────────────────────────────────────────
// Replace hero background image
export const updateHeroImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image uploaded" });
    const doc = await getAboutDoc();

    // Delete old image from Cloudinary
    if (doc.heroImage?.public_id) {
      try { await cloudinary.uploader.destroy(doc.heroImage.public_id); } catch {}
    }

    doc.heroImage = { public_id: req.file.filename, url: req.file.path };
    await doc.save();
    res.json({ success: true, heroImage: doc.heroImage });
  } catch (err) { next(err); }
};

// ── PUT /api/site-content/about/cta ─────────────────────────────────────────
export const updateCtaImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image uploaded" });
    const doc = await getAboutDoc();
    if (doc.ctaImage?.public_id) {
      try { await cloudinary.uploader.destroy(doc.ctaImage.public_id); } catch {}
    }
    doc.ctaImage = { public_id: req.file.filename, url: req.file.path };
    await doc.save();
    res.json({ success: true, ctaImage: doc.ctaImage });
  } catch (err) { next(err); }
};

// ── PUT /api/site-content/about/story/:slot ──────────────────────────────────
// slot: "main" | "topRight" | "bottomRight"
export const updateStoryImage = async (req, res, next) => {
  try {
    const { slot } = req.params;
    const allowed = ["main", "topRight", "bottomRight"];
    if (!allowed.includes(slot)) {
      return res.status(400).json({ success: false, message: `Invalid slot. Must be one of: ${allowed.join(", ")}` });
    }
    if (!req.file) return res.status(400).json({ success: false, message: "No image uploaded" });

    const doc = await getAboutDoc();

    // Delete old
    const old = doc.storyImages?.[slot];
    if (old?.public_id) try { await cloudinary.uploader.destroy(old.public_id); } catch {}

    if (!doc.storyImages) doc.storyImages = {};
    doc.storyImages[slot] = { public_id: req.file.filename, url: req.file.path, label: req.body.label || slot };
    doc.markModified("storyImages");
    await doc.save();

    res.json({ success: true, storyImages: doc.storyImages });
  } catch (err) { next(err); }
};

// ── POST /api/site-content/about/atelier ────────────────────────────────────
// Add image to atelier gallery
export const addAtelierImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image uploaded" });
    const doc = await getAboutDoc();
    if (doc.atelierGallery.length >= 8) {
      return res.status(400).json({ success: false, message: "Maximum 8 atelier gallery images allowed" });
    }
    doc.atelierGallery.push({ public_id: req.file.filename, url: req.file.path, label: req.body.label || "" });
    await doc.save();
    res.json({ success: true, atelierGallery: doc.atelierGallery });
  } catch (err) { next(err); }
};

// ── DELETE /api/site-content/about/atelier/:publicId ────────────────────────
export const removeAtelierImage = async (req, res, next) => {
  try {
    const doc = await getAboutDoc();
    const idx = doc.atelierGallery.findIndex(img => img.public_id === req.params.publicId);
    if (idx === -1) return res.status(404).json({ success: false, message: "Image not found" });
    try { await cloudinary.uploader.destroy(req.params.publicId); } catch {}
    doc.atelierGallery.splice(idx, 1);
    await doc.save();
    res.json({ success: true, atelierGallery: doc.atelierGallery });
  } catch (err) { next(err); }
};

// ── Journey items ─────────────────────────────────────────────────────────────
// POST /api/site-content/about/journey
export const addJourneyItem = async (req, res, next) => {
  try {
    const { year, title, text } = req.body;
    if (!year || !title || !text) return res.status(400).json({ success: false, message: "year, title and text are required" });
    const doc = await getAboutDoc();
    const item = { year, title, text };
    if (req.file) item.image = { public_id: req.file.filename, url: req.file.path };
    doc.journeyItems.push(item);
    doc.journeyItems.sort((a, b) => Number(a.year) - Number(b.year));
    await doc.save();
    res.status(201).json({ success: true, journeyItems: doc.journeyItems });
  } catch (err) { next(err); }
};

// PUT /api/site-content/about/journey/:id
export const updateJourneyItem = async (req, res, next) => {
  try {
    const doc = await getAboutDoc();
    const item = doc.journeyItems.id(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Journey item not found" });
    if (req.body.year)  item.year  = req.body.year;
    if (req.body.title) item.title = req.body.title;
    if (req.body.text)  item.text  = req.body.text;
    if (req.file) {
      if (item.image?.public_id) try { await cloudinary.uploader.destroy(item.image.public_id); } catch {}
      item.image = { public_id: req.file.filename, url: req.file.path };
    }
    doc.journeyItems.sort((a, b) => Number(a.year) - Number(b.year));
    await doc.save();
    res.json({ success: true, journeyItems: doc.journeyItems });
  } catch (err) { next(err); }
};

// DELETE /api/site-content/about/journey/:id
export const deleteJourneyItem = async (req, res, next) => {
  try {
    const doc = await getAboutDoc();
    const item = doc.journeyItems.id(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Journey item not found" });
    if (item.image?.public_id) try { await cloudinary.uploader.destroy(item.image.public_id); } catch {}
    item.deleteOne();
    await doc.save();
    res.json({ success: true, journeyItems: doc.journeyItems });
  } catch (err) { next(err); }
};

// ── Values ────────────────────────────────────────────────────────────────────
// PUT /api/site-content/about/values/:index  (0,1,2)
export const updateValue = async (req, res, next) => {
  try {
    const idx = parseInt(req.params.index);
    const doc = await getAboutDoc();
    if (!doc.values[idx]) doc.values[idx] = {};
    if (req.body.icon)  doc.values[idx].icon  = req.body.icon;
    if (req.body.title) doc.values[idx].title = req.body.title;
    if (req.body.text)  doc.values[idx].text  = req.body.text;
    if (req.file) {
      const old = doc.values[idx].image;
      if (old?.public_id) try { await cloudinary.uploader.destroy(old.public_id); } catch {}
      doc.values[idx].image = { public_id: req.file.filename, url: req.file.path };
    }
    doc.markModified("values");
    await doc.save();
    res.json({ success: true, values: doc.values });
  } catch (err) { next(err); }
};

// ── Team ──────────────────────────────────────────────────────────────────────
// PUT /api/site-content/about/team/:index  (0,1,2)
export const updateTeamMember = async (req, res, next) => {
  try {
    const idx = parseInt(req.params.index);
    const doc = await getAboutDoc();
    if (!doc.team[idx]) doc.team[idx] = {};
    if (req.body.name)  doc.team[idx].name  = req.body.name;
    if (req.body.title) doc.team[idx].title = req.body.title;
    if (req.file) {
      const old = doc.team[idx].image;
      if (old?.public_id) try { await cloudinary.uploader.destroy(old.public_id); } catch {}
      doc.team[idx].image = { public_id: req.file.filename, url: req.file.path };
    }
    doc.markModified("team");
    await doc.save();
    res.json({ success: true, team: doc.team });
  } catch (err) { next(err); }
};
