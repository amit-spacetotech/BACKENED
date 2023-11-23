const Post = require("../models/Post");

module.exports.searchPostsByTags = async (
  query,
  page,
  perPage,
  blockedUserIds,
  reportedPostIds
) => {
  try {
    const regexQuery = new RegExp(query, "i");
    const skipCount = (page - 1) * perPage;
    blockedUserIds, reportedPostIds;
    const matchingTags = await Post.aggregate([
      {
        $unwind: "$tags",
      },
      {
        $match: {
          tags: regexQuery,
          isActive: true,
          status: "Accepted",
          userId: { $nin: blockedUserIds },
          _id: { $nin: reportedPostIds },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userId",
        },
      },
      {
        $unwind: {
          path: "$userId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "userId.status": true, // Filter by user status
        },
      },
      {
        $group: {
          _id: "$tags",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          tag: "$_id",
          count: 1,
        },
      },
      {
        $skip: skipCount,
      },
      {
        $limit: perPage,
      },
    ]);

    const totalCount = await Post.aggregate([
      {
        $unwind: "$tags",
      },
      {
        $match: { tags: regexQuery },
      },
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
        },
      },
    ]);

    return { matchingTags, totalCount: totalCount[0]?.totalCount || 0 };
  } catch (error) {
    throw new Error("Error searching posts by location: " + error.message);
  }
};
