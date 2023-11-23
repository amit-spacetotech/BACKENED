const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const likeSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      index: true,
    },
  },
  { timestamps: true }
);

likeSchema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const Likes = mongoose.model("like", likeSchema);

module.exports = Likes;
