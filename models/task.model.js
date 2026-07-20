const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
  },
  tags: [{ type: String }],
  timeToComplete: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["To Do", "In Progress", "Completed", "Blocked"],
    default: "To Do",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  update: {
    type: Date,
    default: Date.now,
  },
});

taskSchema.pre("save", function (next) {
  this.updateAt = Date.now();
  next();
});

module.exports = mongoose.model("Task", taskSchema);
