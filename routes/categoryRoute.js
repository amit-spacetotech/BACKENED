const { Router } = require("express");
const categoryController = require("../controllers/categoryController");
const { checkGuestAccess } = require("../middleware/checkGuestAccess");
const { checkPermission } = require("../middleware/checkPermission");

const router = Router();

router.post(
  "/createCategory",
  checkPermission("ADMIN"),
  categoryController.createCategory
);
router.get("/getAllCategory", categoryController.getAllCategory);
router.put(
  "/updateCategory",
  [checkPermission("ADMIN")],
  categoryController.updateCategory
);

module.exports = router;
