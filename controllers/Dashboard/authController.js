const User = require("../../models/User");
const { createToken } = require("../../middleware/createToken");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

module.exports.login = [
  body("email").not().isEmpty().withMessage("email Field is required"),
  body("password").not().isEmpty().withMessage("password Field is required"),
  async (req, res) => {
    const { email, password } = req.body;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findOne({ email, userType: "ADMIN" }).select(
        "_id email userType password"
      );
      const auth = await bcrypt.compare(password, user.password);

      if (auth) {
        if (user) {
          const token = await createToken(user);
          res.status(200).json({ user, token });
        } else throw Error("User not found");
      } else throw Error("Please enter correct password");
    } catch (err) {
      console.log(err);
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.register = [
  body("email").not().isEmpty().withMessage("Email field is required"),
  body("password").not().isEmpty().withMessage("password Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      req.body.password = hashedPassword;
      const user = await User.create({
        ...req.body,
        userType: "ADMIN",
        verificationType: "EMAIL",
      });
      const selectedFields = {
        _id: user._id,
        email: user.email,
        userType: user.userType,
      };
      const token = await createToken(user);
      res.status(201).json({ user: selectedFields, token: token });
    } catch (err) {
      console.log(err);
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
