const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      index: true,
    },
    date: {
      type: Date,
    },
    time: {
      type: String,
    },
    message: { type: String },
    type: {
      type: String,
      enum: ["Push", "Custom", "App"],
      default: "Push",
    },
    isIndividual: {
      type: Boolean,
      default: true,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
  },
  { timestamps: true }
);

notificationSchema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
