const User = require("../../models/User");
const { body, validationResult, query } = require("express-validator");
const mongoose = require("mongoose");

function generateRandomNumber() {
  return Math.floor(100 + Math.random() * 9000);
}

module.exports.createUser = [
  body("phoneNumber")
    .not()
    .isEmpty()
    .withMessage("phoneNumber Field is required"),
  body("fullName").not().isEmpty().withMessage("fullName Field is required"),
  body("lastName").not().isEmpty().withMessage("lastName Field is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    let userName = req.body.fullName + generateRandomNumber();

    let userWithSameUsername = await User.findOne({ userName });
    while (userWithSameUsername) {
      username = `${req.body.fullName}${generateRandomNumber()}`;
      userWithSameUsername = await User.findOne({ userName });
    }

    try {
      if (req.body.email) {
        let findSameEmail = await User.findOne({ email: req.body.email });
        if (findSameEmail) {
          res
            .status(400)
            .json({ message: "User already exists with same email" });
          return;
        }
      }
      if (req.body.phoneNumber) {
        let findSamePhone = await User.findOne({
          phoneNumber: req.body.phoneNumber,
        });
        if (findSamePhone) {
          res
            .status(400)
            .json({ message: "User already exists with same PhoneNumber" });
          return;
        }
      }
      const createUser = await User.create({ ...req.body, userName });
      if (createUser) {
        res.status(200).json({ data: createUser });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.updateUser = [
  body("userId").not().isEmpty().withMessage("phoneNumber Field is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      if (req.body.email) {
        let findSameEmail = await User.findOne({
          email: req.body.email,
          _id: { $ne: req.body.userId },
        });
        if (findSameEmail) {
          res
            .status(400)
            .json({ message: "User already exists with same email" });
          return;
        }
      }
      if (req.body.phoneNumber) {
        let findSamePhone = await User.findOne({
          phoneNumber: req.body.phoneNumber,
          _id: { $ne: req.body.userId  },
        });
        if (findSamePhone) {
          res
            .status(400)
            .json({ message: "User already exists with same PhoneNumber" });
          return;
        }
      }
      const updateUser = await User.findOneAndUpdate(
        { _id: req.body.userId },
        { ...req.body },
        { new: true, upsert: true }
      );
      if (updateUser) {
        res.status(200).json({ data: updateUser });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.getUser = [
  query("userId").not().isEmpty().withMessage("phoneNumber Field is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const findUser = await User.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(req.query.userId),
          },
        },
        {
          $lookup: {
            from: "posts",
            localField: "_id",
            foreignField: "userId",
            as: "posts",
          },
        },

        {
          $sort: {
            createdAt: -1,
          },
        },
      ]);
      console.log(findUser);
      if (findUser && findUser.length > 0) {
        res.status(200).json({ data: findUser[0] });
      } else throw Error("Something went wrong");
    } catch (err) {
      console.log(err.message);
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.getAllUsers = [
  async (req, res) => {
    try {
      let page = parseInt(req.query.page ? req.query.page : 1);
      let limit = parseInt(req.query.limit ? req.query.limit : 100);
      let obj = {};
      let search = req.query.search ?? "";
      if (search) {
        obj = {
          $or: [
            { userName: { $regex: search, $options: "i" } },
            { fullName: { $regex: search, $options: "i" } },
          ],
        };
      }
      const findUser = await User.aggregate([
        {
          $lookup: {
            from: "posts",
            localField: "_id",
            foreignField: "userId",
            as: "posts",
          },
        },
        {
          $addFields: {
            postCount: { $size: "$posts" },
          },
        },
        {
          $project: {
            posts: 0,
          },
        },
        // {
        //   $unwind: {
        //     path: "$posts",
        //     preserveNullAndEmptyArrays: true,
        //   },
        // },{}
        {
          $match: { ...obj, deleted: false },
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
      if (findUser) {
        let finalData = findUser[0].data;

        res.status(200).json({
          data: finalData,
          perPage: limit,
          totalPage: Math.ceil(
            findUser[0].totalCount.length > 0
              ? findUser[0].totalCount[0].count / limit
              : 0
          ),
          totalCount:
            findUser[0].totalCount.length > 0
              ? findUser[0].totalCount[0].count
              : 0,
        });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];
