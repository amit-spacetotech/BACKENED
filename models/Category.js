const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      index: true,
    },
  },
  { timestamps: true }
);

categorySchema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const Category = mongoose.model("category", categorySchema);

module.exports = Category;
