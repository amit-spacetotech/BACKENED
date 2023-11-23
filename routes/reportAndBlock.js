const { Router } = require("express");
const reportAndBlockController = require("../controllers/reportAndBlockController");
const router = Router();

router.post("/createReportOrBlock", reportAndBlockController.createData);
router.get("/getAllReportOrBlock", reportAndBlockController.getAllData);
router.get("/getSingleReportOrBlock", reportAndBlockController.getSingleData);
router.put("/UnblockUser", reportAndBlockController.unBlockUser);
router.delete("/deleteReport", reportAndBlockController.deleteReport);
module.exports = router;
