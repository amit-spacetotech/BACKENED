const jwt = require("jsonwebtoken");
const { USER_TOKEN_AGE } = require("../config/config");

module.exports.createToken = async (user) => {
  let expiresIn = USER_TOKEN_AGE;
  console.log(user);
  const token = await jwt.sign({ ...user._doc }, process.env.TOKEN_SECRET, {
    expiresIn,
  });
  return token;
};
