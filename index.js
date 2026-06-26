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

// * Get aLl Team

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

// * New Project Added

async function createNewProject(newProject) {
  try {
    const project = Project(newProject);
    const savedProject = await project.save();
    return savedProject;
  } catch (error) {
    throw error;
  }
}

app.post("/api/add-project/", async (req, res) => {
  try {
    const project = await createNewProject(req.body);
    if (project) {
      res.status(201).json({ message: "Added new project detail successfully", data: project });
    } else {
      res.status(404).json({ error: "Something went wrong in the data" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Data" });
    console.error(error.message);
  }
});

// * Get all project

async function getAllProjectDetails() {
  try {
    const project = await Project.find();
    return project;
  } catch (error) {
    throw error;
  }
}

app.get("/api/all-project/", async (req, res) => {
  try {
    const project = await getAllProjectDetails();
    if (project) {
      res.status(201).json({ message: "All Project Data is this", data: project });
    } else {
      res.status(404).json({ error: "Something went wrong in the data" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Data" });
    console.error(error.message);
  }
});

// * New User Added

async function createNewUser(newUser) {
  try {
    const user = User(newUser);
    const savedUser = await user.save();
    return savedUser;
  } catch (error) {
    throw error;
  }
}

app.post("/api/add-user/", async (req, res) => {
  try {
    const user = await createNewUser(req.body);
    if (user) {
      res.status(201).json({ message: "Added new user details successfully", data: user });
    } else {
      res.status(404).json({ error: "Something went wrong in the data" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Data" });
    console.error(error.message);
  }
});

// * Get All User

async function getAllUserDetails() {
  try {
    const user = await User.find();
    return user;
  } catch (error) {
    throw error;
  }
}

app.get("/api/all-user/", async (req, res) => {
  try {
    const user = await getAllUserDetails();
    if (user) {
      res.status(201).json({ message: "All User Data is this", data: user });
    } else {
      res.status(404).json({ error: "Something went wrong in the data" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Data" });
    console.error(error.message);
  }
});


// * New Tag Added

async function createNewTag(newTag) {
  try {
    const tag = Tag(newTag);
    const savedTag = await tag.save();
    return savedTag;
  } catch (error) {
    throw error;
  }
}

app.post("/api/add-tag/", async (req, res) => {
  try {
    const tag = await createNewTag(req.body);
    if (tag) {
      res.status(201).json({ message: "Added new tag details successfully ", data: tag });
    } else {
      res.status(404).json({ error: "Something went wrong in the data" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Data" });
    console.error(error.message);
  }
});

// * Get all Tag

async function getAllTagDetails() {
  try {
    const user = await Tag.find();
    return user;
  } catch (error) {
    throw error;
  }
}

app.get("/api/all-tag/", async (req, res) => {
  try {
    const tag = await getAllTagDetails();
    if (tag) {
      res.status(201).json({ message: "All Tag Data is this", data: tag });
    } else {
      res.status(404).json({ error: "Something went wrong in the data" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Data" });
    console.error(error.message);
  }
});


// * New Task Added

async function createNewTag(newtask) {
  try {
    const task = Task(newtask);
    const savedTask = await task.save();
    return savedTask;
  } catch (error) {
    throw error;
  }
}

app.post("/api/add-tag/", async (req, res) => {
  try {
    const task = await createNewTag(req.body);
    if (task) {
      res.status(201).json({ message: "Added new task details successfully ", data: task });
    } else {
      res.status(404).json({ error: "Something went wrong in the data" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Data" });
    console.error(error.message);
  }
});

// * Get all Tag

async function getAllTaskDetails() {
  try {
    const user = await Tag.find();
    return user;
  } catch (error) {
    throw error;
  }
}

app.get("/api/all-task/", async (req, res) => {
  try {
    const task = await getAllTaskDetails();
    if (task) {
      res.status(201).json({ message: "All task Data is this", data: task });
    } else {
      res.status(404).json({ error: "Something went wrong in the data" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Data" });
    console.error(error.message);
  }
});

app.listen(3000, console.log("Server is running on 3000"));

