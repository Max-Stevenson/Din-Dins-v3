const mongoose = require("mongoose");

const IngredientSchema = new mongoose.Schema(
  {
    quantity: { type: String, default: "" }, // keep as user-friendly raw string (supports 1/2, 1 1/2)
    unit: { type: String, default: "" },
    name: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const MethodStepSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const RecipeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },

    name: { type: String, required: true, trim: true },
    protein: { type: String, required: true, trim: true },
    portions: { type: Number, required: true, min: 1 },

    cookTime: { type: String, default: "" }, // later: consider minutes int
    tags: [{ type: String, trim: true }],

    ingredients: { type: [IngredientSchema], default: [] },
    method: { type: [MethodStepSchema], default: [] },

    imageUrl: { type: String, default: "" }, // later: Cloudinary

    lastPlannedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recipe", RecipeSchema);
