const { Router } = require("express");
const postController = require("../controllers/postController");

const router = Router();

router.post("/createPost", postController.createPost);
router.get("/downloadPostVideoFiles", postController.downloadPostVideoFiles);
router.get("/getAllPost", postController.getAllPost);
router.get("/getSinglePost", postController.getSinglePost);
router.put("/updatePost", postController.updatePost);
router.put("/updateLikes", postController.updateLikes);
router.put("/updateCommentOnPost", postController.updateCommentOnPost);

router.post("/savePost", postController.savePost);
router.get("/getAllSavedPost", postController.getAllSavedPost);
router.put("/updateSavePost", postController.updateSavePost);
module.exports = router;
