const express = require("express");
const { asyncHandler } = require("../utils/async-handler");
const { createDocument, listCollection, queryCollection } = require("../data/firestore");
const { createId } = require("../firebase");

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  const { classId, date } = req.query;
  const filters = [];
  if (classId) {
    filters.push({ field: "classId", value: classId });
  }
  if (date) {
    filters.push({ field: "date", value: date });
  }

  const items = filters.length ? await queryCollection("classbookEntries", filters) : await listCollection("classbookEntries");

  return res.json({ items });
}));

router.post("/", asyncHandler(async (req, res) => {
  const { classId, subject, date, topic, homework } = req.body || {};
  if (!classId || !subject || !date || !topic) {
    return res.status(400).json({ error: "classId, subject, date and topic are required" });
  }

  const newItem = await createDocument("classbookEntries", {
    classId,
    subject,
    date,
    topic,
    homework: homework || "",
    teacherId: req.user.id
  }, createId("classbook"));

  return res.status(201).json(newItem);
}));

module.exports = router;
