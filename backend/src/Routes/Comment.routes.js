import { Router } from "express";
import * as commentController from "../Controllers/Comment.controller.js";
import auth from "../Middleware/Auth.js";

const router = Router();

router.get("/", commentController.getComments);
router.post("/", auth, commentController.createComment);
router.delete("/:id", auth, commentController.deleteComment);

export default router;
