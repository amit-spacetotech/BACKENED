const { Router } = require("express");
const utilController = require("../controllers/utilController");
const { checkGuestAccess } = require("../middleware/checkGuestAccess");

const router = Router();

router.post("/uploadFile", checkGuestAccess(), utilController.uploadFile);
router.post("/uploadFileVid", checkGuestAccess(), utilController.uploadFileVid);
router.get("/statusCheck", utilController.statusCheck);
router.post(
  "/uploadVideoFile",
  checkGuestAccess(),
  utilController.uploadVideoFile
);
module.exports = router;
