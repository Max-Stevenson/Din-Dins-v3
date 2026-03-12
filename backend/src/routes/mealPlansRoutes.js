const express = require("express");
const mealPlansController = require("../controllers/mealPlansController");

const router = express.Router();

router.post("/generate", mealPlansController.generate);
router.post("/generate-v2", mealPlansController.generateV2);
router.post("/", mealPlansController.create);
router.get("/", mealPlansController.list);
router.get("/:id", mealPlansController.getById);

module.exports = router;
