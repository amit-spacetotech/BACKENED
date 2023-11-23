const { Router } = require("express");
const notificationController = require("../../controllers/Dashboard/notificationController");
const router = Router();

router.post(
  "/createOrUpdate",
  notificationController.createOrUpdateNotification
);
router.get("/getAllNotifications", notificationController.getAllNotifications);
router.get(
  "/getSingleNotification",
  notificationController.getSingleNotification
);

module.exports = router;
