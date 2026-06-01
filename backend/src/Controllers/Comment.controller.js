import Comment from "../Models/Comment.model.js";
import AppError from "../Utils/AppError.js";
import { body } from "express-validator";

export const createCommentRules = [
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Comment cannot be empty")
    .isLength({ max: 500 })
    .withMessage("Comment cannot exeed 500 characters"),
  body("targetType")
    .notEmpty()
    .withMessage("targetType is required")
    .isIn(["match", "tournament"])
    .withMessage("targetType must be match or tournament"),
  body("targetId").notEmpty().withMessage("targetId is required"),
];

export const updateCommentRules = [
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Comment cannot be empty")
    .isLength({ max: 500 })
    .withMessage("Comment cannot exeed 500 characters"),
];

export const getComments = async (req, res, next) => {
  const { targetType, targetId } = req.query;

  if (!targetType || !targetId) {
    return next(new AppError("targetType and targetId are required", 400));
  }

  const comments = await Comment.find({ targetType, targetId })
    .populate("author", "username")
    .sort({ createdAt: -1 });

  res.status(200).json(comments);
};

export const createComment = async (req, res, next) => {
  const comment = await Comment.create({
    content: req.body.content,
    author: req.user._id,
    targetType: req.body.targetType,
    targetId: req.body.targetId,
  });
  await comment.populate("author", "username");

  res.status(201).json(comment);
};

export const updateComment = async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return next(new AppError("Comment not found", 404));

  if (comment.author.toString() !== req.user._id.toString()) {
    return next(new AppError("Not allowed", 403));
  }
  comment.content = req.body.content;
  await comment.save();
  res.status(200).json(comment);
};

export const deleteComment = async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return next(new AppError("Comment not found", 404));

  if (
    comment.author.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return next(new AppError("Not allowed", 403));
  }

  await Comment.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: "Comment deleted" });
};
