const { default: mongoose } = require("mongoose");
const Follow = require("../models/Follows");
const { body, validationResult, query } = require("express-validator");
module.exports.addFollower = [
  body("followerId")
    .not()
    .isEmpty()
    .withMessage("followerId Field is required"),
  body("followingId")
    .not()
    .isEmpty()
    .withMessage("followingId Field is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const createFollow = await Follow.create({ ...req.body });
      if (createFollow) {
        res.status(200).json({ data: createFollow });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.removeFollower = [
  body("followerId")
    .not()
    .isEmpty()
    .withMessage("followerId Field is required"),
  body("followingId")
    .not()
    .isEmpty()
    .withMessage("followingId Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const removeFollow = await Follow.deleteMany({ ...req.body });
      if (removeFollow) {
        res.status(200).json({ message: "Follower removed successfully" });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.getAllFollowers = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 100);
    let skipValue = (page - 1) * limit;
    let userId = req.query._id;

    const data = await Follow.aggregate([
      {
        $match: {
          deleted: false,
          followingId: mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "followerId",
          foreignField: "_id",
          as: "followerId",
        },
      },
      {
        $unwind: {
          path: "$followerId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "followingId",
          foreignField: "_id",
          as: "followingId",
        },
      },
      {
        $unwind: {
          path: "$followingId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "follows", // Assuming your follow collection name is "follow"
          localField: "followingId._id",
          foreignField: "followingId",
          as: "followingIdFollowerCount",
        },
      },
      {
        $addFields: {
          followingIdFollowerCount: { $size: "$followingIdFollowerCount" },
        },
      },
      {
        $lookup: {
          from: "follows",
          localField: "followerId._id",
          foreignField: "followingId",
          as: "followerIdFollowerCount",
        },
      },
      {
        $addFields: {
          followerIdFollowerCount: { $size: "$followerIdFollowerCount" },
        },
      },
      {
        $skip: skipValue,
      },
      {
        $limit: limit,
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    let count = await Follow.find({
      deleted: false,
      followingId: mongoose.Types.ObjectId(userId),
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

module.exports.getAllFollowing = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 100);
    let skipValue = (page - 1) * limit;
    let userId = req.query._id;

    const data = await Follow.aggregate([
      {
        $match: {
          deleted: false,
          followerId: mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "followerId",
          foreignField: "_id",
          as: "followerId",
        },
      },
      {
        $unwind: {
          path: "$followerId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "followingId",
          foreignField: "_id",
          as: "followingId",
        },
      },
      {
        $unwind: {
          path: "$followingId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "follows", // Assuming your follow collection name is "follow"
          localField: "followingId._id",
          foreignField: "followingId",
          as: "followingIdFollowerCount",
        },
      },
      {
        $addFields: {
          followingIdFollowerCount: { $size: "$followingIdFollowerCount" },
        },
      },
      {
        $lookup: {
          from: "follows",
          localField: "followerId._id",
          foreignField: "followingId",
          as: "followerIdFollowerCount",
        },
      },
      {
        $addFields: {
          followerIdFollowerCount: { $size: "$followerIdFollowerCount" },
        },
      },
      {
        $skip: skipValue,
      },
      {
        $limit: limit,
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    let count = await Follow.find({
      deleted: false,
      followingId: mongoose.Types.ObjectId(userId),
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


