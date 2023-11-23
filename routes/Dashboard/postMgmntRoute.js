const { Router } = require("express");
const postMgmntController = require("../../controllers/Dashboard/postMgmntController");
const router = Router();

router.put("/createOrUpdate", postMgmntController.updatePost);
router.get("/getAllPost", postMgmntController.getAllPost);
router.get("/getSinglePost", postMgmntController.getSinglePost);

module.exports = router;
