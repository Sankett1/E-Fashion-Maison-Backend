import Product from "../models/Product.js";
import { cloudinary } from "../config/cloudinary.js";

export const getProducts = async (req, res, next) => {
  try {
    const { keyword, category, minPrice, maxPrice, sort = "-createdAt", page = 1, limit = 12, tag, isFeatured } = req.query;
    const query = { isActive: true };
    if (keyword) query.$text = { $search: keyword };
    if (category) query.category = category;
    if (tag) query.tag = tag;
    if (isFeatured) query.isFeatured = isFeatured === "true";
    if (minPrice || maxPrice) { query.price = {}; if (minPrice) query.price.$gte = Number(minPrice); if (maxPrice) query.price.$lte = Number(maxPrice); }
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query).sort(sort).skip(skip).limit(Number(limit)).select("-reviews");
    res.json({ success: true, count: products.length, total, pages: Math.ceil(total / Number(limit)), page: Number(page), products });
  } catch (error) { next(error); }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate("reviews.user", "name avatar");
    if (!product || !product.isActive) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (error) { next(error); }
};

export const createProduct = async (req, res, next) => {
  try {
    const images = req.files?.map(f => ({ public_id: f.filename, url: f.path })) || [];
    const product = await Product.create({ ...req.body, images });
    res.status(201).json({ success: true, product });
  } catch (error) { next(error); }
};

export const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    if (req.files?.length) { const newImages = req.files.map(f => ({ public_id: f.filename, url: f.path })); req.body.images = [...(product.images || []), ...newImages]; }
    product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, product });
  } catch (error) { next(error); }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    for (const img of product.images) await cloudinary.uploader.destroy(img.public_id);
    await product.deleteOne();
    res.json({ success: true, message: "Product deleted" });
  } catch (error) { next(error); }
};

export const deleteProductImage = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    const imgIdx = product.images.findIndex(i => i.public_id === req.params.imageId);
    if (imgIdx === -1) return res.status(404).json({ success: false, message: "Image not found" });
    await cloudinary.uploader.destroy(req.params.imageId);
    product.images.splice(imgIdx, 1);
    await product.save();
    res.json({ success: true, images: product.images });
  } catch (error) { next(error); }
};

export const createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user._id.toString());
    if (alreadyReviewed) return res.status(400).json({ success: false, message: "You have already reviewed this product" });
    product.reviews.push({ user: req.user._id, name: req.user.name, rating: Number(rating), comment });
    product.recalcRating();
    await product.save();
    res.status(201).json({ success: true, message: "Review added" });
  } catch (error) { next(error); }
};

export const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true }).limit(8).select("-reviews");
    res.json({ success: true, products });
  } catch (error) { next(error); }
};

export const toggleWishlist = async (req, res, next) => {
  try {
    const user = req.user;
    const productId = req.params.id;
    const idx = user.wishlist.indexOf(productId);
    if (idx === -1) user.wishlist.push(productId); else user.wishlist.splice(idx, 1);
    await user.save();
    const populated = await user.populate("wishlist", "name price images");
    res.json({ success: true, wishlist: populated.wishlist });
  } catch (error) { next(error); }
};
