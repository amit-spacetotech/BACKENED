const Category = require("../models/Category");
const { body, validationResult, query } = require("express-validator");
module.exports.createCategory = [
  body("categoryName")
    .not()
    .isEmpty()
    .withMessage("categoryName Field is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const createCategory = await Category.create({ ...req.body });
      if (createCategory) {
        res.status(200).json({ data: createCategory });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];
module.exports.updateCategory = [
  body("categoryId")
    .not()
    .isEmpty()
    .withMessage("categoryId Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const data = await Category.findByIdAndUpdate(
        { _id: req.body.categoryId },
        { ...req.body },
        { new: true }
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
// module.exports.getSingleVoucher = [
//   query("voucherId").not().isEmpty().withMessage("voucherId Field is required"),
//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }
//     try {
//       const { voucherId } = req.query;
//       const data = await Voucher.findById({ _id: voucherId });
//       if (data) {
//         res.status(200).json({ data });
//       } else throw Error("data not found");
//     } catch (err) {
//       let error = err.message;
//       res.status(400).json({ error: error });
//     }
//   },
// ];

module.exports.getAllCategory = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 100);
    let skipValue = (page - 1) * limit;
    let search = req.query.search ?? "";
    let obj = {};

    if (search) {
      obj["categoryName"] = { $regex: search, $options: "i" };
    }
    const data = await Category.find({ deleted: false, ...obj })
      .skip(skipValue)
      .limit(limit)
      .sort({ createdAt: -1 });

    let count = await Category.find({
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

const schedule = require('node-schedule');

let job; // Declare the job variable

// Function to schedule the task
function scheduleTask() {
    const rule = new schedule.RecurrenceRule();
    rule.second = new schedule.Range(0, 59, 2); // Run every 2 seconds

    // Schedule a task
    job = schedule.scheduleJob(rule, function() {
        console.log('Task executed every 2 seconds');
    });

    console.log('Task scheduled to run every 2 seconds');
}

// Function to cancel the scheduled task
function cancelScheduledTask() {
    if (job) {
        job.cancel();
        console.log('Scheduled task has been canceled');
    } else {
        console.log('No scheduled task to cancel');
    }
}

