const express = require("express");
const { asyncHandler } = require("../utils/async-handler");
const { createDocument, listCollection, queryCollection } = require("../data/firestore");
const { createId } = require("../firebase");

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  const classId = req.query.classId;
  const items = classId
    ? await queryCollection("students", [{ field: "classId", value: classId }])
    : await listCollection("students");
  return res.json({ items });
}));

router.post("/", asyncHandler(async (req, res) => {
  const { userId, classId, firstName, lastName } = req.body || {};
  if (!classId || !firstName || !lastName) {
    return res.status(400).json({ error: "classId, firstName and lastName are required" });
  }

  const newItem = await createDocument("students", {
    userId: userId || null,
    classId,
    firstName,
    lastName
  }, createId("student"));

  return res.status(201).json(newItem);
}));

module.exports = router;
