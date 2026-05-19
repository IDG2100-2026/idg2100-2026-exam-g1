import { Router } from "express";
import * as commentController from "../Controllers/Comment.controller.js";
import auth from "../Middleware/Auth.js";
import { validateRequest } from "../Middleware/Validate.js";

const router = Router();

router.get("/", commentController.getComments); //Get all comments - public
//Create comment - auth required
router.post(
  "/",
  auth,
  commentController.createCommentRules,
  validateRequest,
  commentController.createComment,
);
router.delete("/:id", auth, commentController.deleteComment); //Delete comment - auth required

export default router;
