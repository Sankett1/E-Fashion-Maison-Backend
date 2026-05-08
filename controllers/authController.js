import User from "../models/User.js";

// ── Helper: send token as cookie + JSON ───────────────────────────────────────
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.generateToken();

  const cookieOptions = {
    expires:  new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  const { password: _, ...userData } = user.toObject();

  res
    .status(statusCode)
    .cookie("token", token, cookieOptions)
    .json({ success: true, token, user: userData });
};

// ── @route  POST /api/auth/register ──────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const user = await User.create({ name, email, password });
    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// ── @route  POST /api/auth/login ──────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account has been deactivated" });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// ── @route  POST /api/auth/logout ─────────────────────────────────────────────
export const logout = (req, res) => {
  res
    .cookie("token", "", { expires: new Date(0), httpOnly: true })
    .json({ success: true, message: "Logged out successfully" });
};

// ── @route  GET /api/auth/me ──────────────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist", "name price images");
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ── @route  PUT /api/auth/update-profile ──────────────────────────────────────
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ── @route  PUT /api/auth/change-password ─────────────────────────────────────
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// ── @route  PUT /api/auth/avatar ──────────────────────────────────────────────
export const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload an image" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        avatar: {
          public_id: req.file.filename,
          url:       req.file.path,
        },
      },
      { new: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ── @route  POST /api/auth/address ─── add address ───────────────────────────
export const addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses.push(req.body);
    await user.save();
    res.status(201).json({ success: true, addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

// ── @route  DELETE /api/auth/address/:id ─── remove address ──────────────────
export const removeAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.id);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};
