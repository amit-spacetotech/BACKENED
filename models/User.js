const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const userSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      index: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    email: {
      type: String,
      index: true,
      lowercase: true,
    },
    userName: {
      type: String,
      index: true,
    },
    fullName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    isNotificationEnabled: {
      type: Boolean,
      default: true,
    },
    interest: [],
    gender: {
      type: String,
    },
    fcmToken: {
      type: String,
    },
    profilePic: {
      type: String,
    },
    status: {
      type: Boolean,
      default: true,
    },
    verificationType: {
      type: String,
      enum: ["GOOGLE", "FACEBOOK", "EMAIL", "PHONE"],
      default: "PHONE",
    },
    password: {
      type: String,
    },
    address: {
      type: String,
    },
    userType: {
      type: String,
      required: true,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const User = mongoose.model("user", userSchema);

module.exports = User;
