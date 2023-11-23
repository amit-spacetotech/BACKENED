const jwt = require("jsonwebtoken");
const { secret_key } = require("../config/config");

module.exports.getUser = async (token, next) => {
  await jwt.verify(token, process.env.TOKEN_SECRET, async (err, user) => {
    if (err) {
      next(err);
    }
    next(user);
  });
};
