import { Router } from "express";
import * as commentController from "../Controllers/Comment.controller.js";
import auth from "../Middleware/Auth.js";
import { validateRequest } from "../Middleware/Validate.js";

const router = Router();

router.get("/", commentController.getComments);
router.delete("/:id", auth, commentController.deleteComment);

router.post(
  "/",
  auth,
  commentController.createCommentRules,
  validateRequest,
  commentController.createComment,
);

router.put(
  "/:id",
  auth,
  commentController.updateCommentRules,
  validateRequest,
  commentController.updateComment,
);

export default router;
