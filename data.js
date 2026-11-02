// ============================================================
// data.js — product copy and sample plants for the prototype.
// Plant data is stored in the browser by app.js.
// ============================================================

const STARTUP = {
  name: "Sproutly",
  tagline: "Know which plant needs you next.",
  pitch: "A simple watering planner for busy plant owners who want to keep every leaf healthy without guessing."
};

const SAMPLE_PLANTS = [
  { id: "fern", name: "Boston Fern", location: "Living room", interval: 3, lastWatered: 5, priority: "high" },
  { id: "snake", name: "Snake Plant", location: "Bedroom", interval: 14, lastWatered: 8, priority: "low" },
  { id: "monstera", name: "Monstera", location: "Office", interval: 7, lastWatered: 6, priority: "medium" },
  { id: "herb", name: "Basil", location: "Kitchen", interval: 2, lastWatered: 2, priority: "high" }
];
