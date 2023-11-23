const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const searchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      index: true,
    },
    peopleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
    },
    tags: {
      type: String,
    },
    places: { type: String },
    searchType: {
      type: String,
      enum: ["Post", "People", "Tags", "Placess"],
    },
  },
  {
    timestamps: true,
  }
);

searchHistorySchema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const SearchHistory = mongoose.model("searchHistory", searchHistorySchema);

module.exports = SearchHistory;
