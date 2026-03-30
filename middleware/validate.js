import Joi from "joi";

// ── Generic schema validator factory ──────────────────────────────────────────
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const message = error.details.map(d => d.message.replace(/['"]/g, "")).join(", ");
    return res.status(400).json({ success: false, message });
  }
  next();
};

// ── Auth schemas ──────────────────────────────────────────────────────────────
export const validateRegister = validate(Joi.object({
  name:     Joi.string().min(2).max(60).required().messages({ "string.min": "Name must be at least 2 characters", "any.required": "Name is required" }),
  email:    Joi.string().email().lowercase().required().messages({ "string.email": "Enter a valid email address", "any.required": "Email is required" }),
  password: Joi.string().min(6).max(128).required().messages({ "string.min": "Password must be at least 6 characters", "any.required": "Password is required" }),
}));

export const validateLogin = validate(Joi.object({
  email:    Joi.string().email().lowercase().required().messages({ "string.email": "Enter a valid email", "any.required": "Email is required" }),
  password: Joi.string().min(1).required().messages({ "any.required": "Password is required" }),
}));

export const validateChangePassword = validate(Joi.object({
  currentPassword: Joi.string().required().messages({ "any.required": "Current password is required" }),
  newPassword:     Joi.string().min(6).max(128).required().messages({ "string.min": "New password must be at least 6 characters" }),
}));

export const validateAddress = validate(Joi.object({
  label:     Joi.string().max(40).default("Home"),
  line1:     Joi.string().min(5).max(200).required().messages({ "any.required": "Address line is required" }),
  city:      Joi.string().min(2).max(80).required().messages({ "any.required": "City is required" }),
  state:     Joi.string().min(2).max(80).required().messages({ "any.required": "State is required" }),
  pincode:   Joi.string().pattern(/^\d{6}$/).required().messages({ "string.pattern.base": "Enter a valid 6-digit pincode", "any.required": "Pincode is required" }),
  phone:     Joi.string().pattern(/^[6-9]\d{9}$/).optional().messages({ "string.pattern.base": "Enter a valid 10-digit mobile number" }),
  isDefault: Joi.boolean().default(false),
}));

// ── Product schemas ───────────────────────────────────────────────────────────
export const validateProduct = validate(Joi.object({
  name:             Joi.string().min(3).max(120).required().messages({ "any.required": "Product name is required" }),
  description:      Joi.string().min(10).max(2000).required().messages({ "any.required": "Description is required" }),
  price:            Joi.number().positive().required().messages({ "any.required": "Price is required", "number.positive": "Price must be positive" }),
  originalPrice:    Joi.number().positive().optional(),
  category:         Joi.string().valid("Women", "Men", "Accessories", "Kids").required().messages({ "any.only": "Category must be Women, Men, Accessories, or Kids" }),
  subCategory:      Joi.string().max(80).optional(),
  sizes:            Joi.alternatives().try(Joi.array(), Joi.string()).optional(),
  colors:           Joi.alternatives().try(Joi.array(), Joi.string()).optional(),
  stock:            Joi.number().integer().min(0).required().messages({ "any.required": "Stock quantity is required" }),
  tag:              Joi.string().valid("NEW", "SALE", "TRENDING", "").allow(null).optional(),
  isFeatured:       Joi.alternatives().try(Joi.boolean(), Joi.string()).optional(),
  fabric:           Joi.string().max(120).optional(),
  careInstructions: Joi.string().max(300).optional(),
}));

// ── Order schemas ─────────────────────────────────────────────────────────────
export const validateOrder = validate(Joi.object({
  items: Joi.array().items(Joi.object({
    product: Joi.string().required(),
    qty:     Joi.number().integer().min(1).required(),
    size:    Joi.string().required(),
  })).min(1).required().messages({ "array.min": "Order must have at least one item" }),
  shippingAddress: Joi.object({
    firstName: Joi.string().required(),
    lastName:  Joi.string().optional(),
    email:     Joi.string().email().required(),
    phone:     Joi.string().required(),
    address:   Joi.string().required(),
    city:      Joi.string().required(),
    state:     Joi.string().required(),
    pincode:   Joi.string().required(),
  }).required(),
  paymentMethod: Joi.string().valid("cod", "card", "upi", "netbanking", "stripe", "razorpay").required(),
  couponCode:    Joi.string().max(20).optional().allow(""),
}));

export const validateReview = validate(Joi.object({
  rating:  Joi.number().integer().min(1).max(5).required().messages({ "number.min": "Rating must be between 1 and 5", "any.required": "Rating is required" }),
  comment: Joi.string().min(5).max(500).required().messages({ "string.min": "Comment must be at least 5 characters" }),
}));
