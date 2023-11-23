const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const savePostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      index: true,
    },

    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

savePostSchema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const SavePost = mongoose.model("savePost", savePostSchema);

module.exports = SavePost;
