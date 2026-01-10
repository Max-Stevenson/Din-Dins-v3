import {
  Bird,
  Fish,
  Leaf,
  Drumstick,
  PiggyBank,
  CircleHelp,
  Beef,
} from "lucide-react";

export const proteinTiles = [
  { value: "Chicken", label: "Chicken", Icon: Bird },
  { value: "Beef", label: "Beef", Icon: Beef },
  { value: "Fish", label: "Fish", Icon: Fish },
  { value: "Pork", label: "Pork", Icon: PiggyBank },
  { value: "Turkey", label: "Turkey", Icon: Drumstick },
  { value: "Vegetarian", label: "Veg", Icon: Leaf },
  { value: "Other", label: "Other", Icon: CircleHelp },
];

export const steps = [
  { key: "basics", label: "Basics" },
  { key: "ingredients", label: "Ingredients" },
  { key: "photo", label: "Photo" },
  { key: "review", label: "Review" },
];

export const emptyRecipe = {
  name: "",
  protein: "",
  portions: 1,
  cookTime: "",
  tags: "",
  ingredients: [{ quantity: "", unit: "", name: "" }],
  image: null,
};
