const mongoose = require("mongoose");

const DinnerSchema = new mongoose.Schema(
  {
    entryId: { type: String, default: "" },
    date: { type: String, required: true }, // YYYY-MM-DD (simple + timezone-safe)
    type: {
      type: String,
      enum: ["cook", "leftovers", "fresh", "leftover"],
      required: true,
    },
    entryType: { type: String, enum: ["fresh", "leftover"], default: null },
    legacyType: { type: String, enum: ["cook", "leftovers"], default: null },

    // If type === "cook"
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe", default: null },
    leftoverSlots: { type: Number, default: 0, min: 0, max: 2 },

    // If type === "leftovers"
    leftoverOfRecipeId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe", default: null },
    sourceCookEntryId: { type: String, default: null },
    leftoverOfEntryId: { type: String, default: null },

    title: { type: String, default: "" }, // optional display text
    protein: { type: String, default: "" },
  },
  { _id: false }
);

const MealPlanSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },

    startDate: { type: String, required: true }, // YYYY-MM-DD
    days: { type: Number, required: true, min: 1, max: 31 },
    people: { type: Number, required: true, min: 1, max: 20 },

    meatRatio: { type: Number, default: 0.5, min: 0, max: 1 }, // 0..1
    allowLeftovers: { type: Boolean, default: true },

    dinners: { type: [DinnerSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MealPlan", MealPlanSchema);
