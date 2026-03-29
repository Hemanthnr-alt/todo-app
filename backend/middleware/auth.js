const jwt  = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      console.error("JWT verify failed:", jwtErr.message);
      return res.status(401).json({ error: "Not authorized, token failed" });
    }

    // ✅ FIX: Guard against missing id in token payload
    if (!decoded?.id) {
      return res.status(401).json({ error: "Token payload invalid" });
    }

    const user = await User.findByPk(decoded.id, {
      attributes: ["id", "name", "email", "notificationPreferences"],
    });

    if (!user) {
      console.error(`Auth failed: no user found for id=${decoded.id}`);
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(401).json({ error: "Not authorized, token failed" });
  }
};

module.exports = { protect };