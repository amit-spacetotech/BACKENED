const { Router } = require("express");
const userController = require("../controllers/userController");

const router = Router();

router.get("/getUser", userController.getUser);
router.post("/sendNotification", userController.sendNotification);
router.get("/getAllUserNotifications", userController.getAllUserNotifications);
router.get("/searchOverPlatform", userController.searchOverPlatform);
router.get("/getAllUser", userController.getAllUser);
router.get("/getUserById", userController.getUserById);
router.put("/updateUser", userController.updateUser);
router.put("/updatePassword", userController.updatePassword);
router.get("/getRecentHistories", userController.getAllRecentHistory);
router.put("/updateHistory", userController.updateHistory);
router.get(
  "/getMatchingInterestUser",
  userController.getMostFollowedWithMatchingInterestUsers
);
module.exports = router;
