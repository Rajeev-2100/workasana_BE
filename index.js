const express = require("express");
const app = express();
const initializeDatabase = require("./db/db.connect");
const Team = require('./models/team.model')
const Task = require("./models/task.model");
const Project = require("./models/project.model");
const User = require("./models/user.model");
const Tag = require("./models/tag.model");
const NewTeam = require('./models/newTeam.model')
const NewTask = require('./models/newTask.model')

app.use(express.json());
initializeDatabase();

// * New Team added

async function createATeam(newTeam) {
  try {
    const team = Team(newTeam);
    const savedTeam = await team.save();
    return savedTeam;
  } catch (error) {
    throw error;
  }
}

app.post("/api/add-team", async (req, res) => {
  try {
    const team = await createATeam(req.body);
    if (team) {
      res.status(201).json({ message: "Added new team detail successfully" });
    } else {
      res.status(404).json({ error: "Something went wrong in the Data" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Data" });
  }
});

// * Get all Team

async function getAllTeamDetails() {
    try{
    const team = await Team.find();
    return team
  } catch (error) {
    throw error;
  }
}

app.get("/api/all-team/", async (req, res) => {
  try {
    const team = await getAllTeamDetails();
    if (team) {
      res.status(201).json({ message: "All Team Data is this", data: team });
    } else {
      res.status(404).json({ error: "Something went wrong in the data" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Data" });
    console.error(error.message);
  }
});

app.listen(3000, console.log("Server is running on 3000"));

