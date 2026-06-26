const mongoose = require("mongoose");
// Tag Schema workasana.mongoose.models 4

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  // Tag names must be unique
});

module.exports = mongoose.model("Tag", tagSchema);

