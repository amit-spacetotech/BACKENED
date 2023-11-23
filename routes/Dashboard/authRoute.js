const { Router } = require("express");
const authController = require("../../controllers/Dashboard/authController");
const router = Router();

router.post("/login", authController.login);
router.post("/register", authController.register);
router.put("/forgotPassword", authController.forgotPassword);

module.exports = router;
