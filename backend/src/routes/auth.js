const express = require("express");
const { asyncHandler } = require("../utils/async-handler");
const { createDocument, findByField, updateDocument } = require("../data/firestore");
const { createId, getAuth, signInWithEmailPassword } = require("../firebase");

const router = express.Router();

router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const signInResult = await signInWithEmailPassword(normalizedEmail, String(password));
    const user = await findByField("users", "email", normalizedEmail);

    if (!user) {
      return res.status(404).json({ error: "User profile not found" });
    }

    return res.json({
      token: signInResult.idToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    if (String(error.message || "").startsWith("Firebase configuration missing")) {
      throw error;
    }
    return res.status(401).json({ error: "Invalid credentials" });
  }
}));

router.post("/register-invite", asyncHandler(async (req, res) => {
  const { inviteToken, email, password, firstName, lastName } = req.body || {};

  if (!inviteToken || !email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: "inviteToken, email, password, firstName and lastName are required" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const invitation = await findByField("invitations", "token", inviteToken);
  if (!invitation) {
    return res.status(404).json({ error: "Invitation token not found" });
  }
  if (invitation.usedAt) {
    return res.status(409).json({ error: "Invitation token already used" });
  }

  try {
    await getAuth().getUserByEmail(normalizedEmail);
    return res.status(409).json({ error: "User already exists" });
  } catch (error) {
    if (error.code !== "auth/user-not-found") {
      throw error;
    }
  }

  const authUser = await getAuth().createUser({
    email: normalizedEmail,
    password: String(password),
    displayName: `${String(firstName).trim()} ${String(lastName).trim()}`.trim()
  });

  const newUser = await createDocument("users", {
    email: normalizedEmail,
    role: invitation.role,
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
    createdAt: new Date().toISOString()
  }, authUser.uid);

  await updateDocument("invitations", invitation.id, {
    usedAt: new Date().toISOString(),
    usedByUserId: newUser.id
  });

  return res.status(201).json({
    user: {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      firstName: newUser.firstName,
      lastName: newUser.lastName
    }
  });
}));

router.get("/demo-users", (_req, res) => {
  return res.json({
    users: []
  });
});

module.exports = router;
