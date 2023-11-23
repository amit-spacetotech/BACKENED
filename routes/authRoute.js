const { Router } = require("express");
const authController = require("../controllers/authController");
const router = Router();

router.post("/login",authController.login);
router.put("/forgotPassword", authController.forgotPassword);
router.put("/socialAuth", authController.socialAuth);
router.post("/checkUserName", authController.checkUserName);
router.post("/checkUserEmail",authController.checkUserEmail);
module.exports = router;
