const Post = require("../models/Post");
const User = require("../models/User");
const SavePost = require("../models/SavePost");
const Likes = require("../models/Likes");
const { body, validationResult, query } = require("express-validator");
const mongoose = require("mongoose");
const AppNotification = require("../models/AppNotification");
const ReportAndBlock = require("../models/ReportAndBlock");
const { getBucketFolderFiles } = require("../util/uploadFile");
const { sendPushNotification } = require("../util/sendPushNotification");
module.exports.createPost = [
  async (req, res) => {
    try {
      const userId = req.user._id;
      const createPost = await Post.create({ ...req.body, userId });
      if (createPost) {
        res.status(200).json({ data: createPost });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.downloadPostVideoFiles = [
  query("videoUrl").not().isEmpty().withMessage("videoUrl Field is required"),
  async (req, res) => {
    try {
      const { videoUrl } = req.query;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const getFiles = await getBucketFolderFiles(videoUrl);
      console.log(getFiles);
      if (getFiles) {
        res.status(200).json({ data: getFiles });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];
module.exports.getAllPost = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 100);
    let skipValue = (page - 1) * limit;
    const { userProfile, userId, location, tags } = req.query;
    let obj = {};

    const blockedUserIds = await ReportAndBlock.find({
      user: mongoose.Types.ObjectId(req.user._id),
      type: "BLOCK",
      deleted: false,
    }).distinct("blockedUser");

    //@INFO: IF USER WANTS TO GET OWN POSTS
    if (userProfile === "true") {
      obj["userId"] = mongoose.Types.ObjectId(req.user._id);
    }
    let isBlocked = false;

    if (userId) {
      const userIdString = userId.toString();

      isBlocked = blockedUserIds.some(
        (blockedId) => blockedId.toString() === userIdString
      );
    }
    //@INFO: IF USER WANTS TO ACCESS OTHER POSTS
    if (userId && isBlocked) {
      res.status(400).json({ message: "You have blocked the user" });
      return;
    }
    if (userId && !isBlocked) {
      obj["userId"] = mongoose.Types.ObjectId(userId);
    }
    if (!userId && !userProfile) {
      obj["userId"] = { $nin: blockedUserIds };
    }
    if (location) {
      obj["location"] = location;
    }
    if (tags) {
      obj["tags"] = { $in: [tags] };
    }
    console.log({ obj });
    const reportedPostIds = await ReportAndBlock.find({
      user: mongoose.Types.ObjectId(req.user._id),
      type: "REPORT",
      deleted: false,
    }).distinct("postId");

    const data = await Post.aggregate([
      {
        $match: {
          ...obj,
          status: "Accepted",
          isActive: true,
          deleted: false,
          _id: { $nin: reportedPostIds },
        },
      },
      {
        $lookup: {
          from: "likes",
          let: { postId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$postId", "$$postId"] },
                    { $ne: ["$deleted", true] },
                  ],
                },
              },
            },
          ],
          as: "likes",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "categoryId",
        },
      },
      {
        $unwind: {
          path: "$categoryId",
          preserveNullAndEmptyArrays: true,
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
        $unwind: {
          path: "$comments",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "comments.commentBy",
          foreignField: "_id",
          as: "comments.commentBy",
        },
      },
      {
        $unwind: {
          path: "$comments.commentBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          url: { $first: "$url" },
          videoUrl: { $first: "$videoUrl" },
          likeCount: { $first: "$likeCount" },
          likes: { $first: "$likes" },
          uploadedBy: { $first: "$uploadedBy" },
          isPublic: { $first: "$isPublic" },
          comments: { $push: "$comments" },
          categoryId: { $first: "$categoryId" },
          userId: { $first: "$userId" },
          location: { $first: "$location" },
          tags: { $first: "$tags" },
          isActive: { $first: "$isActive" },
          description: { $first: "$description" },
          status: { $first: "$status" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
        },
      },
      {
        $facet: {
          data: [{ $skip: skipValue }, { $limit: limit }],
          totalCount: [
            { $group: { _id: null, count: { $sum: 1 } } },
            { $project: { _id: 0, count: 1 } },
          ],
        },
      },
    ]);

    res.status(200).json({
      data: data[0]["data"],
      perPage: limit,
      totalPage: Math.ceil(
        data[0].totalCount.length > 0 ? data[0].totalCount[0].count / limit : 0
      ),
      totalCount:
        data[0].totalCount.length > 0 ? data[0].totalCount[0].count : 0,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "Something Went Wrong" });
  }
};

module.exports.getSinglePost = [
  query("_id").not().isEmpty().withMessage("_id Field is required"),
  async (req, res) => {
    try {
      const { _id } = req.query;

      const data = await Post.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(_id),
            status: "Accepted",
          },
        },
        {
          $lookup: {
            from: "likes",
            let: { postId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$postId", "$$postId"] },
                      { $ne: ["$deleted", true] },
                    ],
                  },
                },
              },
            ],
            as: "likes",
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "categoryId",
          },
        },
        {
          $unwind: {
            path: "$categoryId",
            preserveNullAndEmptyArrays: true,
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
          $unwind: {
            path: "$comments",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "comments.commentBy",
            foreignField: "_id",
            as: "comments.commentBy",
          },
        },
        {
          $unwind: {
            path: "$comments.commentBy",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$_id",
            url: { $first: "$url" },
            videoUrl: { $first: "$videoUrl" },
            likeCount: { $first: "$likeCount" },
            likes: { $first: "$likes" },
            uploadedBy: { $first: "$uploadedBy" },
            isPublic: { $first: "$isPublic" },
            comments: { $push: "$comments" },
            categoryId: { $first: "$categoryId" },
            userId: { $first: "$userId" },
            location: { $first: "$location" },
            tags: { $first: "$tags" },
            isActive: { $first: "$isActive" },
            description: { $first: "$description" },
            status: { $first: "$status" },
            createdAt: { $first: "$createdAt" },
            updatedAt: { $first: "$updatedAt" },
          },
        },
      ]);

      console.log("Aggregation Result:", data); // Log the aggregation result

      if (data.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      res.status(200).json({
        data: data[0], // Since you expect a single post
      });
    } catch (err) {
      console.error("Error:", err);
      res.status(400).json({ error: "Something Went Wrong" });
    }
  },
];

module.exports.updatePost = [
  body("postId").not().isEmpty().withMessage("postId Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const data = await Post.findByIdAndUpdate(
        { _id: req.body.postId },
        { ...req.body },
        { new: true }
      );
      if (data) {
        if (req.body.deleted) {
          await SavePost.deleteMany({ postId: req.body.postId });
        }
        res.status(200).json({ data });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.updateLikes = [
  body("postId").not().isEmpty().withMessage("postId Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      if (req.body.deleted) {
        await Likes.deleteMany({
          postId: req.body.postId,
          userId: req.user._id,
        });

        res.status(200).json({ data: false, message: "Unliked successfully" });
      }
      const data = await Likes.findOneAndUpdate(
        { postId: req.body.postId, userId: req.user._id },
        { ...req.body, userId: req.user._id },
        { new: true, upsert: true }
      );
      if (data) {
        let findPost = await Post.findOne({ _id: req.body.postId }).populate(
          "userId"
        );
        if (findPost.userId._id !== req.user._id) {
          if (findPost && findPost.userId && findPost.userId.fcmToken) {
            let findNotification = await AppNotification.findOne({
              userId: findPost.userId._id,
              postId: findPost._id,
              actionBy: req.user._id,
              actionType: "Like",
            });
            if (!findNotification) {
              await sendPushNotification({
                title: req.user.userName,
                body: `Liked your post`,
                fcmToken: findPost.userId.fcmToken,
              });
            }
          }
          await AppNotification.findOneAndUpdate(
            {
              userId: findPost.userId._id,
              postId: findPost._id,
              actionBy: req.user._id,
              actionType: "Like",
            },
            {
              userId: findPost.userId._id,
              postId: findPost._id,
              actionBy: req.user._id,
              actionType: "Like",
            },
            { upsert: true, new: true }
          );
        }
        res.status(200).json({ data });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.updateCommentOnPost = [
  body("postId").not().isEmpty().withMessage("postId Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { commentBy, comment, postId } = req.body;

      const updatedPost = await Post.findOneAndUpdate(
        { _id: postId },
        { $push: { comments: { commentBy, comment } } },
        { new: true }
      ).populate("userId");

      if (!updatedPost) {
        return res.status(404).json({ error: "Post not found" });
      }
      if (updatedPost.userId != commentBy) {
        await AppNotification.create({
          userId: updatedPost?.userId?._id,
          postId: updatedPost?._id,
          actionBy: commentBy,
          actionType: "Comment",
          comment,
        });
        if (updatedPost && updatedPost.userId && updatedPost.userId.fcmToken) {
          const findActionBy = await User.findById(commentBy);
          await sendPushNotification({
            title: findActionBy.userName,
            body: `commented on your post: ${comment}`,
            fcmToken: updatedPost.userId.fcmToken,
          });
        }
      }
      res.status(201).json(updatedPost);
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.savePost = [
  async (req, res) => {
    try {
      const userId = req.user._id;
      const createSavePost = await SavePost.create({ ...req.body, userId });
      if (createSavePost) {
        res.status(200).json({ data: createSavePost });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];
module.exports.updateSavePost = [
  body("postId").not().isEmpty().withMessage("postId Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      await SavePost.deleteMany({
        userId: req.user._id,
        postId: req.body.postId,
      });
      res.status(200).json({ message: "Deleted Saved post" });
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.getAllSavedPost = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 100);
    let skipValue = (page - 1) * limit;

    const data = await SavePost.find({ deleted: false, userId: req.user._id })
      .populate({
        path: "userId",
      })
      .populate({
        path: "postId",
        populate: {
          path: "userId",
        },
      })
      .skip(skipValue)
      .limit(limit)
      .sort({ createdAt: -1 });

    let count = await SavePost.find({ deleted: false }).countDocuments();

    res.status(200).json({
      data: data,
      totalData: count,
      totalPage: Math.ceil(count / limit),
      perPage: limit,
      currentPage: page,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "Something Went Wrong" });
  }
};



