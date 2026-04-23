const express = require("express");
const { asyncHandler } = require("../utils/async-handler");
const { createDocument, deleteDocument, getDocument, listCollection, replaceDocument } = require("../data/firestore");
const { createId } = require("../firebase");

const router = express.Router();

router.get("/", asyncHandler(async (_req, res) => {
  const items = await listCollection("lessons");
  return res.json({ items });
}));

router.post("/", asyncHandler(async (req, res) => {
  const { day, lessonSlot, className, subject, room, teacherName } = req.body || {};
  if (!day || !lessonSlot || !className || !subject || !room || !teacherName) {
    return res.status(400).json({ error: "day, lessonSlot, className, subject, room and teacherName are required" });
  }

  const newLesson = await createDocument("lessons", {
    day: String(day).trim(),
    lessonSlot: String(lessonSlot).trim(),
    className: String(className).trim(),
    subject: String(subject).trim(),
    room: String(room).trim(),
    teacherName: String(teacherName).trim(),
    createdBy: req.user.id
  }, createId("lesson"));

  return res.status(201).json(newLesson);
}));

router.patch("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { day, lessonSlot, className, subject, room, teacherName } = req.body || {};
  if (!day || !lessonSlot || !className || !subject || !room || !teacherName) {
    return res.status(400).json({ error: "day, lessonSlot, className, subject, room and teacherName are required" });
  }

  const existing = await getDocument("lessons", id);
  if (!existing) {
    return res.status(404).json({ error: "Lesson not found" });
  }

  const updatedLesson = await replaceDocument("lessons", id, {
    ...existing,
    day: String(day).trim(),
    lessonSlot: String(lessonSlot).trim(),
    className: String(className).trim(),
    subject: String(subject).trim(),
    room: String(room).trim(),
    teacherName: String(teacherName).trim()
  });

  return res.json(updatedLesson);
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await getDocument("lessons", id);
  if (!existing) {
    return res.status(404).json({ error: "Lesson not found" });
  }

  await deleteDocument("lessons", id);

  return res.status(204).end();
}));

module.exports = router;
