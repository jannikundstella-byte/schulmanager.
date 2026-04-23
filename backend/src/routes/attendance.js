const express = require("express");
const { asyncHandler } = require("../utils/async-handler");
const { createDocument, listCollection, queryCollection } = require("../data/firestore");
const { createId } = require("../firebase");

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  const { classId, studentId, date } = req.query;
  const filters = [];
  if (classId) {
    filters.push({ field: "classId", value: classId });
  }
  if (studentId) {
    filters.push({ field: "studentId", value: studentId });
  }
  if (date) {
    filters.push({ field: "date", value: date });
  }

  const items = filters.length ? await queryCollection("attendance", filters) : await listCollection("attendance");

  return res.json({ items });
}));

router.post("/", asyncHandler(async (req, res) => {
  const { studentId, classId, date, status, excused, note } = req.body || {};
  if (!studentId || !classId || !date || !status) {
    return res.status(400).json({ error: "studentId, classId, date and status are required" });
  }

  const isExcused = excused === true || excused === "true";
  const normalizedStatus = isExcused ? "absent_excused" : status;

  const newItem = await createDocument("attendance", {
    studentId,
    classId,
    date,
    status: normalizedStatus,
    excused: isExcused,
    note: note || "",
    recordedBy: req.user.id
  }, createId("attendance"));

  return res.status(201).json(newItem);
}));

module.exports = router;
