const { Router } = require("express");
const userManagementController = require("../../controllers/Dashboard/userManagementController");
const router = Router();

router.post("/createUser", userManagementController.createUser);
router.put("/updateUser", userManagementController.updateUser);
router.get("/getUser", userManagementController.getUser);
router.get("/getAllUsers", userManagementController.getAllUsers);

module.exports = router;
