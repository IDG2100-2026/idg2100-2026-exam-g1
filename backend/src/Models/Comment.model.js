import mongoose, { Schema } from "mongoose";
const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      maxLength: 500,
      trim: true,
    },

    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    targetType: {
      type: String,
      enum: ["match", "tournament"],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
  },
  { timestamps: true },
);

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
