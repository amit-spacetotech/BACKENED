const { default: mongoose } = require("mongoose");
const Post = require("../../models/Post");
const { body, validationResult } = require("express-validator");

module.exports.updatePost = [
  body("userId").not().isEmpty().withMessage("userId Field is required"),
  async (req, res) => {
    const { postId } = req.body;
    let obj = {};
    if (postId) {
      obj["_id"] = postId;
    }
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      let updatePost;
      if (postId) {
        await Post.updateOne(
          {
            _id: postId,
          },
          { $set: { ...req.body } },
          { upsert: true, new: true }
        );
        updatePost = await Post.findOne({ _id: postId });
      }

      if (!postId && !req.body.deleted) {
        updatePost = await Post.create({
          ...req.body,
        });
      }

      if (req.body.deleted) {
        updatePost = await Post.deleteOne({
          _id: postId,
        });
      }

      if (updatePost) {
        res.status(200).json({
          data: !req.body.deleted && updatePost,
          message: req.body.deleted
            ? "Deleted Successfuly"
            : "Updated successfuly",
        });
      } else throw Error("No post found");
    } catch (err) {
      console.log(err);
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.getAllPost = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 100);

    const { status, userId } = req.query;
    let obj = {};
    let search = req.query.search ?? "";
    if (search) {
      obj = {
        ...obj,
        $or: [
          { "userId.fullName": { $regex: search, $options: "i" } },
          { "userId.userName": { $regex: search, $options: "i" } },
        ],
      };
    }
    if (userId) {
      obj["userId._id"] = mongoose.Types.ObjectId(userId);
    }
    if (status) {
      obj["status"] = status;
    }

    const data = await Post.aggregate([
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
        $match: { ...obj },
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
    let count = data[0].totalCount.length > 0 ? data[0].totalCount[0].count : 0;

    res.status(200).json({
      data: data.length > 0 ? data[0].data : [],
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

module.exports.getSinglePost = async (req, res) => {
  try {
    const { _id } = req.query;
    const data = await Post.find({ deleted: false, _id }).populate("userId");
    res.status(200).json({
      data: data,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "Something Went Wrong" });
  }
};
