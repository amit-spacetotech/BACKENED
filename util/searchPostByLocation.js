const Post = require("../models/Post");

module.exports.searchPostsByLocation = async (
  query,
  page = 1,
  limit = 10,
  blockedUserIds,
  reportedPostIds
) => {
  try {
    const regexQuery = new RegExp(query, "i");

    const matchingPosts = await Post.aggregate([
      {
        $match: {
          status: "Accepted",
          isActive: true,
          location: regexQuery,
          userId: { $nin: blockedUserIds },
          _id: { $nin: reportedPostIds },
        },
      },
      {
        $group: {
          _id: "$location",
          posts: { $push: "$$ROOT" },
          count: { $sum: 1 },
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
        $project: {
          _id: 0,
          location: "$_id",
          count: 1,
        },
      },

      {
        $facet: {
          data: [{ $skip: limit * (page - 1) }, { $limit: limit }],
          totalCount: [
            { $group: { _id: null, count: { $sum: 1 } } },
            { $project: { _id: 0, count: 1 } },
          ],
        },
      },
    ]);

    return {
      matchingPosts:
        matchingPosts[0].data.length > 0 ? matchingPosts[0].data : [],
      totalCount:
        matchingPosts[0].totalCount.length > 0
          ? matchingPosts[0].totalCount[0].count
          : 0,
    };
  } catch (error) {
    throw new Error("Error searching posts by location: " + error.message);
  }
};
