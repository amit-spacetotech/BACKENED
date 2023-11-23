const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      index: true,
    },
    comment: {
      type: String,
    },
    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
    },
    actionType: {
      type: String,
      enum: ["Like", "Comment"],
    },
  },
  { timestamps: true }
);

notificationSchema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const AppNotification = mongoose.model("AppNotification", notificationSchema);

module.exports = AppNotification;
