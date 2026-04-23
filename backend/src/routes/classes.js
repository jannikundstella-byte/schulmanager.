const express = require("express");
const { asyncHandler } = require("../utils/async-handler");
const { createDocument, listCollection } = require("../data/firestore");
const { createId } = require("../firebase");

const router = express.Router();

router.get("/", asyncHandler(async (_req, res) => {
  const items = await listCollection("classes");
  return res.json({ items });
}));

router.post("/", asyncHandler(async (req, res) => {
  const { name, gradeLevel, teacherId } = req.body || {};
  if (!name || !gradeLevel) {
    return res.status(400).json({ error: "name and gradeLevel are required" });
  }

  const newItem = await createDocument("classes", {
    name,
    gradeLevel: Number(gradeLevel),
    teacherId: teacherId || null
  }, createId("class"));

  return res.status(201).json(newItem);
}));

module.exports = router;
