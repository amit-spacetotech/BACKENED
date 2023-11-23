const { Router } = require("express");
const followController = require("../controllers/followController");

const router = Router();

router.post("/addFollower", followController.addFollower);
router.post("/removeFollower", followController.removeFollower);
router.get("/getAllFollowing", followController.getAllFollowing);
router.get("/getAllFollowers", followController.getAllFollowers);
module.exports = router;
