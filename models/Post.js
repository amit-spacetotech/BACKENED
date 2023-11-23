const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const postSchema = new mongoose.Schema(
  {
    url: {
      type: String,
    },
    videoUrl: {
      type: String,
    },
    likeCount: {
      type: Number,
    },
    uploadedBy: {
      type: String,
      enum: ["User", "Admin"],
      default: "User",
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    comments: [
      {
        commentBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
        comment: String,
      },
    ],
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    location: {
      type: String,
    },
    tags: [],
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Requested", "Accepted", "Rejected"],
      default: "Requested",
    },
  },
  {
    timestamps: true,
  }
);

postSchema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const Post = mongoose.model("post", postSchema);

module.exports = Post;
