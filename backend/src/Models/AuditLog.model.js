import mongoose, { Schema } from "mongoose";

const auditLogSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["rate_limit", "ip_change"],
      required: true,
    },

    ip: {
      type: String,
      required: true,
    },

    userAgent: {
      type: String,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
