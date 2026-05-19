import Comment from "../Models/Comment.model.js";
import AppError from "../Utils/AppError.js";

//Get comments
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

//Post commnent
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

//Delete comment
export const deleteComment = async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return next(new AppError("Comment not found", 404));

  //Check ownership
  if (
    comment.author.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return next(new AppError("Not allowed", 403));
  }

  await comment.deleteOne();
  res.status(200).json({ message: "Comment deleted" });
};
