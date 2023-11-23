const User = require("../../models/User");
const { createToken } = require("../../middleware/createToken");
const { body, validationResult } = require("express-validator");

module.exports.getUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (user) {
      res.status(200).json({ user });
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
            { _id: user._id },
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
