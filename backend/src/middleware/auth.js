const { getAuth } = require("../firebase");
const { getDocument } = require("../data/firestore");

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    const profile = await getDocument("users", decodedToken.uid);

    if (!profile) {
      return res.status(401).json({ error: "User profile not found" });
    }

    req.user = {
      id: decodedToken.uid,
      email: profile.email || decodedToken.email || "",
      role: profile.role,
      firstName: profile.firstName || "",
      lastName: profile.lastName || ""
    };
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Authentication required" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};
