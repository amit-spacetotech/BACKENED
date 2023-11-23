const ReportAndBlock = require("../models/ReportAndBlock");
const { body, validationResult, query } = require("express-validator");
const mongoose = require("mongoose");
module.exports.createData = [
  body("type").not().isEmpty().withMessage("type Field is required"),
  async (req, res) => {
    try {
      const userId = req.user._id;
      const data = await ReportAndBlock.create({ ...req.body, user: userId });
      if (data) {
        res.status(200).json({ data });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.getAllData = async (req, res) => {
  let page = parseInt(req.query.page ? req.query.page : 1);
  let limit = parseInt(req.query.limit ? req.query.limit : 100);
  let skipValue = (page - 1) * limit;
  const { search, type, userId } = req.query;
  let obj = { deleted: false };
  if (req.query.search) {
    obj = {
      $or: [
        { "userDetails.userName": { $regex: search, $options: "i" } },
        { "userDetails.email": { $regex: search, $options: "i" } },
      ],
    };
  }
  if (userId) {
    obj["user"] = mongoose.Types.ObjectId(userId);
  }

  try {
    const data = await ReportAndBlock.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "blockedUser",
          foreignField: "_id",
          as: "blockedByDetails",
        },
      },
      {
        $unwind: {
          path: "$blockedByDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "posts",
          localField: "postId",
          foreignField: "_id",
          as: "postId",
        },
      },
      {
        $unwind: {
          path: "$postId",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: { ...obj, type } },
      { $sort: { createdAt: -1 } },
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
  } catch (error) {
    console.error("Failed to fetch data.", error);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
};

module.exports.getSingleData = [
  query("_id").not().isEmpty().withMessage("_id Field is required"),
  async (req, res) => {
    try {
      const data = await ReportAndBlock.findOne({ _id }).populate(
        "userId blockedUser postId"
      );
      if (data) {
        res.status(200).json({ data });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.unBlockUser = [
  async (req, res) => {
    try {
      const userId = req.user._id;
      const data = await ReportAndBlock.deleteMany({
        blockedUser: req.body.blockedUser,
        userId,
      });

      res.status(200).json({ message: "Unblocked successfuly" });
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];
module.exports.deleteReport = [
  async (req, res) => {
    try {
      await ReportAndBlock.deleteOne({
        _id: req.body._id,
      });

      res.status(200).json({ message: "Deleted successfuly" });
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];
