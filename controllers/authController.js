const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { createToken } = require("../middleware/createToken");
const { body, validationResult } = require("express-validator");

module.exports.login = [
  body("phoneNumber")
    .not()
    .isEmpty()
    .withMessage("phoneNumber Field is required"),

  async (req, res) => {
    const { phoneNumber } = req.body;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const user = await User.findOneAndUpdate(
        { phoneNumber },
        { phoneNumber },
        { new: true, upsert: true }
      );
      if (user) {
        const token = await createToken(user);
        res.status(200).json({ user, token });
      }
    } catch (err) {
      console.log(err);
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.socialAuth = [
  body("email").not().isEmpty().withMessage("email Field is required"),
  async (req, res) => {
    const { email, type } = req.body;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const findUser = await User.findOne({ email });
      if (findUser) {
        if (findUser.verificationType !== type) {
          throw Error(
            `Please Use ${findUser.verificationType ?? "Phone"} to login`
          );
        } else {
          const token = await createToken(findUser);
          res.status(200).json({ user: findUser, token });
        }
      } else {
        const createUser = await User.create({
          ...req.body,
          verificationType: type,
        });
        if (createUser) {
          const token = await createToken(createUser);
          res.status(200).json({ user: createUser, token });
        }
      }
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.forgotPassword = [
  body("email").not().isEmpty().withMessage("email Field is required"),
  body("password").not().isEmpty().withMessage("password Field is required"),
  async (req, res) => {
    const { email, password } = req.body;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const user = await User.findOne({ email });
      if (user) {
        const auth = await bcrypt.compare(password, user.password);
        if (auth) {
          res
            .status(400)
            .json({ message: "Old and New password can't be same" });
        } else {
          const salt = await bcrypt.genSalt();
          const hashedPassword = await bcrypt.hash(password, salt);
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
      } else throw Error("User not found with given Email");
    } catch (err) {
      console.log(err);
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.checkUserEmail = [
  body("email").not().isEmpty().withMessage("email Field is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email } = req.body;
    try {
      let findUser = await User.findOne({ email, deleted: false });
      if (findUser) {
        res
          .status(200)
          .json({ status: true, message: "Email already registered" });
      } else {
        res
          .status(200)
          .json({ status: false, message: "Email Not registered" });
      }
    } catch (err) {
      let error = err.message;
      if (err.code == 11000) {
        error = ` Email already exists`;
      }
      res.status(400).json({ error: error });
    }
  },
];

module.exports.checkUserName = [
  body("userName").not().isEmpty().withMessage("userName Field is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { userName } = req.body;
    try {
      let findUser = await User.findOne({
        userName: { $regex: `^${userName}`, $options: "i" },
        deleted: false,
      });
      if (findUser) {
        res
          .status(200)
          .json({ status: true, message: "Username already taken" });
      } else {
        res.status(200).json({ status: false, message: "Username Not taken" });
      }
    } catch (err) {
      let error = err.message;
      if (err.code == 11000) {
        error = ` Username already exists`;
      }
      res.status(400).json({ error: error });
    }
  },
];

