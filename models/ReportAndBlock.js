const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const reportAndBlockSchema = new mongoose.Schema(
  {
    category: {
      type: String,
    },
    message: { type: String },
    type: {
      type: String,
      enum: ["REPORT", "BLOCK"],
      default: "REPORT",
      index: true,
    },
    blockedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      index: true,
    },
  },
  { timestamps: true }
);

reportAndBlockSchema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const ReportAndBlock = mongoose.model("ReportAndBlock", reportAndBlockSchema);

module.exports = ReportAndBlock;
