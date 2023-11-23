const { Router } = require("express");
const userController = require("../../controllers/Dashboard/userController");
const router = Router();

router.get("/getUser", userController.getUser);
router.put("/updateUser", userController.updateUser);
router.put("/updatePassword", userController.updatePassword);
module.exports = router;
