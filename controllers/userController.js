const User = require("../models/User");
const Follow = require("../models/Follows");
const Post = require("../models/Post");
const { body, validationResult, query } = require("express-validator");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const History = require("../models/SearchHistory");
const { searchPostsByTags } = require("../util/searchPostByTags");
const { searchPostsByLocation } = require("../util/searchPostByLocation");
const AppNotification = require("../models/AppNotification");
const { sendPushNotification } = require("../util/sendPushNotification");
const ReportAndBlock = require("../models/ReportAndBlock");
module.exports.getUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId),
          deleted: false,
        },
      },
      {
        $lookup: {
          from: "follows",
          localField: "_id",
          foreignField: "followerId",
          as: "followedTo",
        },
      },

      {
        $lookup: {
          from: "follows",
          localField: "_id",
          foreignField: "followingId",
          as: "followedBy",
        },
      },
    ]);
    if (user && user.length > 0) {
      res.status(200).json({ user: user[0] });
    } else throw Error("User not found");
  } catch (err) {
    let error = err.message;
    res.status(400).json({ error: error });
  }
};

module.exports.updateUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findByIdAndUpdate(
      { _id: userId },
      { ...req.body },
      { new: true }
    );
    if (user) {
      res.status(200).json({ user });
    } else throw Error("User not found");
  } catch (err) {
    let error = err.message;
    res.status(400).json({ error: error });
  }
};
module.exports.updatePassword = [
  body("oldPassword")
    .not()
    .isEmpty()
    .withMessage("oldPassword Field is required"),
  body("newPassword")
    .not()
    .isEmpty()
    .withMessage("newPassword Field is required"),
  async (req, res) => {
    const { newPassword, oldPassword } = req.body;
    let userId = req.user._id;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const user = await User.findOne({ _id: userId });
      if (user) {
        const auth = await bcrypt.compare(oldPassword, user.password);
        if (!auth) {
          res.status(400).json({ message: "Please Enter Correct Password" });
        } else {
          const salt = await bcrypt.genSalt();
          const hashedPassword = await bcrypt.hash(newPassword, salt);
          const updatePassword = await User.findOneAndUpdate(
            { email },
            { password: hashedPassword },
            { new: true, useFindAndModify: false }
          );
          res.status(200).json({
            message: "Password Updated Successfuly",
            user: updatePassword,
          });
        }
      } else throw Error("User not found");
    } catch (err) {
      console.log(err);
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.getAllUser = async (req, res) => {
  try {
    const user = await User.aggregate([
      {
        $lookup: {
          from: "follows",
          localField: "_id",
          foreignField: "followerId",
          as: "followedTo",
        },
      },

      {
        $lookup: {
          from: "follows",
          localField: "_id",
          foreignField: "followingId",
          as: "followedBy",
        },
      },
    ]);
    if (user && user.length > 0) {
      res.status(200).json({ user: user });
    } else throw Error("User not found");
  } catch (err) {
    let error = err.message;
    res.status(400).json({ error: error });
  }
};

module.exports.updateHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { searchType, peopleId, postId, tags, places } = req.body;
    let obj = {};
    if (peopleId) {
      obj["peopleId"] = peopleId;
    }
    if (postId) {
      obj["postId"] = postId;
    }
    if (tags) {
      obj["tags"] = tags;
    }
    if (places) {
      obj["tags"] = places;
    }
    const updateHistory = await History.findOneAndUpdate(
      { searchType, userId, ...obj },
      { ...req.body, userId },
      { new: true, upsert: true }
    ).populate("peopleId postId userId");
    if (updateHistory) {
      res.status(200).json({ updateHistory });
    } else throw Error("User not found");
  } catch (err) {
    let error = err.message;
    res.status(400).json({ error: error });
  }
};

module.exports.getAllUserNotifications = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 100);
    let skipValue = (page - 1) * limit;

    const data = await AppNotification.find({
      deleted: false,
      userId: req.user._id,
    })
      .populate("actionBy postId userId")
      .skip(skipValue)
      .limit(limit)
      .sort({ createdAt: -1 });

    let count = await AppNotification.find({
      deleted: false,
      userId: req.user._id,
    }).countDocuments();

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

module.exports.getAllRecentHistory = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 100);
    let skipValue = (page - 1) * limit;

    const data = await History.find({ deleted: false, userId: req.user._id })
      .populate("peopleId postId userId")
      .skip(skipValue)
      .limit(limit)
      .sort({ createdAt: -1 });

    let count = await History.find({
      deleted: false,
    }).countDocuments();

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

module.exports.searchOverPlatform = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 100);
    let { type, search } = req.query;
    //
    const blockedUserIds = await ReportAndBlock.find({
      user: mongoose.Types.ObjectId(req.user._id),
      type: "BLOCK",
      deleted: false,
    }).distinct("blockedUser");

    const reportedPostIds = await ReportAndBlock.find({
      user: mongoose.Types.ObjectId(req.user._id),
      type: "REPORT",
      deleted: false,
    }).distinct("postId");
    let finalData;
    if (type === "Post") {
      let data = await Post.aggregate([
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
            $or: [
              { "userId.fullName": { $regex: search, $options: "i" } },
              { "userId.userName": { $regex: search, $options: "i" } },
            ],
            isActive: true,
            status: "Accepted",
            "userId.status": true, // Filter by user status
            "userId._id": { $nin: blockedUserIds },
            _id: { $nin: reportedPostIds },
          },
        },
        {
          $sort: {
            createdAt: -1,
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
      let count =
        data[0].totalCount.length > 0 ? data[0].totalCount[0].count : 0;
      finalData = {
        data: data.length > 0 ? data[0].data : [],
        totalData: count,
        totalPage: Math.ceil(count / limit),
        perPage: limit,
        currentPage: page,
      };
    }

    if (type === "User") {
      data = await User.aggregate([
        {
          $match: {
            deleted: false,
            $or: [
              { fullName: { $regex: search, $options: "i" } },
              { userName: { $regex: search, $options: "i" } },
            ],
            _id: { $nin: blockedUserIds },
            status: true,
          },
        },
        {
          $lookup: {
            from: "follows",
            localField: "_id",
            foreignField: "followerId",
            as: "followedTo",
          },
        },

        {
          $lookup: {
            from: "follows",
            localField: "_id",
            foreignField: "followingId",
            as: "followedBy",
          },
        },
        {
          $sort: {
            createdAt: -1,
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
      let count =
        data[0].totalCount.length > 0 ? data[0].totalCount[0].count : 0;
      finalData = {
        data: data.length > 0 ? data[0].data : [],
        totalData: count,
        totalPage: Math.ceil(count / limit),
        perPage: limit,
        currentPage: page,
      };
    }

    if (type === "Tags") {
      data = await searchPostsByTags(
        search,
        page,
        limit,
        blockedUserIds,
        reportedPostIds
      );

      let count = data.totalCount;
      finalData = {
        data: data.matchingTags,
        totalData: count,
        totalPage: Math.ceil(count / limit),
        perPage: limit,
        currentPage: page,
      };
    }
    if (type === "Location") {
      data = await searchPostsByLocation(
        search,
        page,
        limit,
        blockedUserIds,
        reportedPostIds
      );

      let count = data.totalCount;
      finalData = {
        data: data.matchingPosts,
        totalData: count,
        totalPage: Math.ceil(count / limit),
        perPage: limit,
        currentPage: page,
      };
    }

    res.status(200).json({
      data: finalData ? finalData.data : [],
      totalData: finalData ? finalData.totalData : 0,
      totalPage: finalData ? finalData.totalPage : 0,
      perPage: finalData ? finalData.perPage : 0,
      currentPage: finalData ? finalData.currentPage : 0,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "Something Went Wrong" });
  }
};

module.exports.getUserById = [
  query("_id").not().isEmpty().withMessage("_id Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const userId = req.query._id;
      const user = await User.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(userId),
            deleted: false,
          },
        },
        {
          $lookup: {
            from: "follows",
            localField: "_id",
            foreignField: "followerId",
            as: "followedTo",
          },
        },

        {
          $lookup: {
            from: "follows",
            localField: "_id",
            foreignField: "followingId",
            as: "followedBy",
          },
        },
      ]);
      if (user && user.length > 0) {
        res.status(200).json({ user: user[0] });
      } else throw Error("User not found");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.getMostFollowedWithMatchingInterestUsers = async (req, res) => {
  try {
    const topUsers = await Follow.aggregate([
      {
        $lookup: {
          from: "users", // Collection name of the User model
          localField: "followingId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $match: {
          "user.interest": { $in: [req.query.interest] },
        },
      },
      {
        $group: {
          _id: "$followingId",
          followerCount: { $sum: 1 },
          user: { $first: "$user" },
        },
      },
      {
        $sort: {
          followerCount: -1,
        },
      },
      {
        $limit: 10,
      },
    ]);
    if (topUsers) {
      res.status(200).json({ topUsers });
    } else throw Error("User not found");
  } catch (err) {
    let error = err.message;
    res.status(400).json({ error: error });
  }
};

module.exports.sendNotification = async (req, res) => {
  try {
    const { title, body, toSend } = req.body;
    const findUser = await User.findOne({
      _id: mongoose.Types.ObjectId(toSend),
      fcmToken: { $ne: null },
    });
    if (findUser && findUser.isNotificationEnabled) {
      await sendPushNotification({
        title,
        body,
        fcmToken: findUser.fcmToken,
      });
    } else {
      res.status(400).json({
        message: !findUser.isNotificationEnabled
          ? "Toggle is disabled"
          : "Another user does not have fcm token yet",
      });
    }
  } catch (err) {
    console.log(err);
    let error = err.message;
    res.status(400).json({ error: error });
  }
};
