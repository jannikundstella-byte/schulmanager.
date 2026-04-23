const express = require("express");
const crypto = require("crypto");
const { asyncHandler } = require("../utils/async-handler");
const { createDocument, deleteDocument, findByField, getDocument, listCollection, queryCollection, updateDocument } = require("../data/firestore");
const { createId, getAuth } = require("../firebase");

const router = express.Router();

router.get("/", asyncHandler(async (_req, res) => {
  const users = await listCollection("users");
  const items = users.map((user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName
  }));

  return res.json({ items });
}));

router.get("/invitations", asyncHandler(async (_req, res) => {
  const invitations = await listCollection("invitations");
  const items = invitations.map((invite) => ({
    id: invite.id,
    token: invite.token,
    role: invite.role,
    createdAt: invite.createdAt,
    usedAt: invite.usedAt || null,
    status: invite.usedAt ? "used" : "open"
  }));

  return res.json({ items });
}));

router.post("/invitations", asyncHandler(async (req, res) => {
  const { role } = req.body || {};

  const allowedRoles = ["admin", "teacher", "student", "parent"];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  const invitation = {
    id: createId("invite"),
    token: crypto.randomBytes(12).toString("hex"),
    role,
    createdAt: new Date().toISOString(),
    createdBy: req.user.id,
    usedAt: null,
    usedByUserId: null
  };

  await createDocument("invitations", {
    token: invitation.token,
    role: invitation.role,
    createdAt: invitation.createdAt,
    createdBy: invitation.createdBy,
    usedAt: invitation.usedAt,
    usedByUserId: invitation.usedByUserId
  }, invitation.id);

  return res.status(201).json({
    id: invitation.id,
    token: invitation.token,
    role: invitation.role,
    createdAt: invitation.createdAt,
    status: "open"
  });
}));

router.patch("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email, role, firstName, lastName, password } = req.body || {};
  const allowedRoles = ["admin", "teacher", "student", "parent"];

  if (!email || !role || !firstName || !lastName) {
    return res.status(400).json({ error: "email, role, firstName and lastName are required" });
  }

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  const user = await getDocument("users", id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const emailTaken = await findByField("users", "email", normalizedEmail);
  if (emailTaken) {
    if (emailTaken.id !== id) {
      return res.status(409).json({ error: "User already exists" });
    }
  }

  const authPatch = {
    email: normalizedEmail,
    displayName: `${String(firstName).trim()} ${String(lastName).trim()}`.trim()
  };

  if (password) {
    authPatch.password = String(password);
  }

  await getAuth().updateUser(id, authPatch);
  await updateDocument("users", id, {
    email: normalizedEmail,
    role,
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim()
  });

  return res.json({
    id,
    email: normalizedEmail,
    role,
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim()
  });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await getDocument("users", id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (req.user.id === id) {
    return res.status(400).json({ error: "You cannot delete your own admin account" });
  }

  const invitations = await queryCollection("invitations", [{ field: "usedByUserId", value: id }]);
  await Promise.all(invitations.map((entry) => deleteDocument("invitations", entry.id)));
  await deleteDocument("users", id);
  await getAuth().deleteUser(id);

  return res.status(204).end();
}));

module.exports = router;
