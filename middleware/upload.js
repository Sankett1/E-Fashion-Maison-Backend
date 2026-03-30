import multer from "multer";
import path from "path";

// ── Allowed MIME types ────────────────────────────────────────────────────────
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB   = 5;

// ── File filter ───────────────────────────────────────────────────────────────
const imageFilter = (req, file, cb) => {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type: ${file.mimetype}. Only JPG, PNG, WEBP, GIF allowed.`), false);
  }
  cb(null, true);
};

// ── Memory storage (for Cloudinary streaming) ─────────────────────────────────
const memoryStorage = multer.memoryStorage();

// ── Multer instances ──────────────────────────────────────────────────────────
export const uploadSingle = multer({
  storage:  memoryStorage,
  fileFilter: imageFilter,
  limits:   { fileSize: MAX_SIZE_MB * 1024 * 1024 },
}).single("image");

export const uploadMultiple = multer({
  storage:  memoryStorage,
  fileFilter: imageFilter,
  limits:   { fileSize: MAX_SIZE_MB * 1024 * 1024, files: 8 },
}).array("images", 8);

// ── Wraps multer in a promise (use in controllers) ───────────────────────────
export const handleUpload = (multerFn) => (req, res) =>
  new Promise((resolve, reject) =>
    multerFn(req, res, (err) => (err ? reject(err) : resolve()))
  );

// ── Middleware: validate that at least one file was uploaded ──────────────────
export const requireFile = (req, res, next) => {
  if (!req.file && !req.files?.length) {
    return res.status(400).json({ success: false, message: "At least one image is required" });
  }
  next();
};

// ── Middleware: validate file size explicitly (belt-and-suspenders) ───────────
export const fileSizeGuard = (maxMB = MAX_SIZE_MB) => (err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: `File too large. Maximum size is ${maxMB} MB.`,
    });
  }
  if (err.code === "LIMIT_FILE_COUNT") {
    return res.status(413).json({
      success: false,
      message: "Too many files uploaded at once. Maximum is 8.",
    });
  }
  next(err);
};
