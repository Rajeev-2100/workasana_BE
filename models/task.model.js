const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
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
  owners: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
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
  dueDate: {
    type: Date,
  },
}, {
  timestamps: true 
});


module.exports = mongoose.model("Task", taskSchema);