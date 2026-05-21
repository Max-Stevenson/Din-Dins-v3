const mongoose = require("mongoose");
const {
  CANONICAL_PROTEINS,
  isValidCookTimeValue,
  normalizeCookTimeValue,
  normalizeProteinValue,
} = require("../validators/recipeValidators");

const IngredientSchema = new mongoose.Schema(
  {
    quantity: { type: String, default: "" }, // keep as user-friendly raw string (supports 1/2, 1 1/2)
    unit: { type: String, default: "" },
    name: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const MethodStepSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const RecipeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },

    name: { type: String, required: true, trim: true },
    protein: {
      type: String,
      required: true,
      trim: true,
      enum: CANONICAL_PROTEINS,
      set: normalizeProteinValue,
    },
    portions: { type: Number, required: true, min: 1 },

    cookTime: {
      type: String,
      default: "",
      trim: true,
      set: normalizeCookTimeValue,
      validate: {
        validator: isValidCookTimeValue,
        message: "Cook time must be a positive whole number of minutes",
      },
    }, // later: consider minutes int
    tags: [{ type: String, trim: true }],

    ingredients: { type: [IngredientSchema], default: [] },
    method: { type: [MethodStepSchema], default: [] },

    imageUrl: { type: String, default: "" }, // Cloudinary
    imagePublicId: { type: String, default: "" }, // Cloudinary handle

    lastPlannedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Recipe", RecipeSchema);
