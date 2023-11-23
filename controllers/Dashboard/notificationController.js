const Notification = require("../../models/Notification");
const { body, validationResult, query } = require("express-validator");
const mongoose = require("mongoose");
const moment = require("moment");
module.exports.createOrUpdateNotification = [
  async (req, res) => {
    try {
      const { notificationId } = req.body;
      const data = await Notification.findOneAndUpdate(
        {
          _id: notificationId
            ? mongoose.Types.ObjectId(notificationId)
            : mongoose.Types.ObjectId(),
        },
        { ...req.body },
        { new: true, upsert: true }
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

module.exports.getAllNotifications = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 100);
    let skipValue = (page - 1) * limit;
    const { startDate, endDate, type, search } = req.query;
    let obj = {};
    if (search) {
      obj = {
        $or: [{ title: { $regex: search, $options: "i" } }],
      };
    }
    if (startDate) {
      obj["date"] = {
        $gte: new Date(startDate),
      };
    }
    if (endDate) {
      obj["date"] = {
        $lte: new Date(moment(endDate).endOf("day")),
      };
    }
    if (startDate && endDate) {
      obj["date"] = {
        $gte: new Date(startDate),
        $lte: new Date(moment(endDate).endOf("day")),
      };
    }
    console.log(obj);
    if (type) {
      obj["type"] = type;
    }
    const data = await Notification.find({ deleted: false, ...obj })
      .populate("users")
      .skip(skipValue)
      .limit(limit)
      .sort({ createdAt: -1 });

    let count = await Notification.find({
      deleted: false,
      ...obj,
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

module.exports.getSingleNotification = async (req, res) => {
  try {
    const { _id } = req.query;
    const data = await Notification.find({ deleted: false, _id }).populate(
      "userId"
    );
    res.status(200).json({
      data: data,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "Something Went Wrong" });
  }
};
