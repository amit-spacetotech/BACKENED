const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const folllowSchema = new mongoose.Schema(
  {
    followerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      index: true,
    },
    followingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      index: true,
    },
  },
  { timestamps: true }
);

folllowSchema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const Follow = mongoose.model("follow", folllowSchema);

module.exports = Follow;
