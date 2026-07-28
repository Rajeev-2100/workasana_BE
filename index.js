const cors = require("cors");
const express = require("express");
const app = express();
const mongoose = require('mongoose')
const initializeDatabase = require("./db/db.connect");
const Team = require("./models/team.model");
const Task = require("./models/task.model");
const Project = require("./models/project.model");
const User = require("./models/user.model");
const Tag = require("./models/tag.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(express.json());
app.use(cors(corsOptions));
initializeDatabase();

const JWT_SECRET = "mySuperSecretKey123";

// ─────────────────────────────────────────
// JWT Middleware (use on protected routes)
// ─────────────────────────────────────────

const verifyJWT = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ message: "No token found" });
  try {
    const decodedToken = jwt.verify(token, JWT_SECRET);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ─────────────────────────────────────────
// USER APIs
// ─────────────────────────────────────────

async function createNewUser(newUser) {
  try {
    const user = new User(newUser);
    const savedUser = await user.save();
    return savedUser;
  } catch (error) {
    throw error;
  }
}

// POST /api/add-user
app.post("/api/add-user", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, Email and Password are required.",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: "User already exists with this email.",
      });
    }

    if (password.length !== 6) {
      return res.status(400).json({
        error: "Password must be exactly 6 characters.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createNewUser({ name, email, password: hashedPassword });

    const token = jwt.sign(
      { _id: user._id, name: user.name, email: user.email, role: "admin" },
      JWT_SECRET,
      { expiresIn: "24h" }
    );


    return res.status(201).json({
      message: "New User Added Successfully",
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: "admin" },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create user." });
  }
});

// POST /api/login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and Password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign(
      { _id: user._id, name: user.name, email: user.email, role: "admin" },
      JWT_SECRET,
      { expiresIn: "24h" },
    );


    return res.status(200).json({
      message: "Login Successful",
      token,
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Failed to Login" });
  }
});

// GET /api/all-user
async function getAllUserDetails() {
  try {
    const users = await User.find().select('-password')
    return users;
  } catch (error) {
    throw error;
  }
}

app.get("/api/all-user", async (req, res) => {
  try {
    const users = await getAllUserDetails();
    // ✅ FIX #7: changed 201 → 200 for GET
    res.status(200).json({ message: "All User Data", data: users });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch User Data" });
  }
});

// GET /api/get-user/:userId
async function getSpecificUserDetails(userId) {
  try {
    // ✅ FIX #2: removed .populate("") empty string — crashes Mongoose
    const user = await User.findById(userId).select('-password')
    return user;
  } catch (error) {
    throw error;
  }
}

app.get("/api/get-user/:userId", async (req, res) => {
  try {
    const user = await getSpecificUserDetails(req.params.userId)
    if (user) {
      // ✅ FIX #7: changed 201 → 200 for GET
      res.status(200).json({ message: "User Details", data: user });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch User Data" });
  }
});

// PUT /api/update-user/:userId

async function updateUserDetailByUserId(userId, dataToUpdate){
  try {
    const user = await User.findByIdAndUpdate(userId, dataToUpdate, {returnDocument: 'after', runValidators: true})
    return user
  } catch (error) {
    throw error
  }
}

app.put('/api/update-user/:userId', async (req,res) => {
  try {
    const { userId } = req.params;
    const { name, email } = req.body;


    // Validate userId exists
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Validate at least one field is provided
    if (!name && !email) {
      return res.status(400).json({ error: "At least one field (name or email) is required" });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
    }

    // Check if email already exists (if updating email)
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ error: "Email already in use by another user" });
      }
    }

    // Build update object with only provided fields
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const user = await updateUserDetailByUserId(userId, updateData);
    
    if (user) {
      res.status(200).json({ 
        message: 'User updated successfully', 
        data: user 
      });
    } else {
      // Fixed: Removed console.error(error.message) since error is undefined
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    // Fixed: Better error logging with context
    console.error("Update user error:", error);
    res.status(500).json({ error: 'Failed to update User Data' });
  }
} )

// PUT /api/update-password/:userId  

app.put('/api/change-password/:userId', async (req,res) => {
  try {
    const { userId } = req.params
    const { currentPassword, newPassword } = req.body

    if(!currentPassword || !newPassword){
      return res.status(400).json({error: 'Current and new passwords are required'})
    }

    if(newPassword.length !== 6){
      return res.status(400).json({error: 'New Password must be exactly 6 characters'})
    }
    
    const user = await User.findById(userId)

    if(!user){
      return res.status(404).json({error: 'User not found'})
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if(!isMatch){
      return res.status(400).json({error: 'Current password is incorrect'})
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    user.password = hashedPassword
    await user.save()

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
})

// DELETE /api/delete-user/:userId 

async function deleteUserDetailByUserId(userId){
  try {
    const user = await User.findByIdAndDelete(userId)
    return user
  } catch (error) {
    throw error
  }
}

app.delete('/api/delete-user/:userId', async (req,res) => {
  try {
    const user = await deleteUserDetailByUserId(req.params.userId)
    if(user){
      res.status(201).json({message: 'User Id deleted successfully', data: user})
    }else{
      res.status(404).json({error: 'This userId not found'})
      console.error(error.message)
    }
  } catch (error) {
    res.status(500).json({error: 'Failed to fetch User Data'})
  }
})

// ─────────────────────────────────────────
// TEAM APIs
// ─────────────────────────────────────────

async function createATeam(newTeam) {
  try {
    const team = new Team(newTeam);
    const savedTeam = await team.save();
    return savedTeam;
  } catch (error) {
    throw error;
  }
}

// POST /api/add-team
app.post("/api/add-team", async (req, res) => {
  try {
    // ✅ FIX #1: was `new createATeam(req.body)` — async fn is NOT a constructor
    const team = await createATeam(req.body);
    if (team) {
      // ✅ FIX #8: now returns saved team data in response
      res
        .status(201)
        .json({ message: "Added new team successfully", data: team });
    } else {
      res.status(404).json({ error: "Something went wrong" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to add team" });
  }
});

// GET /api/all-team
async function getAllTeamDetails() {
  try {
    const teams = await Team.find();
    return teams;
  } catch (error) {
    throw error;
  }
}

app.get("/api/all-team", async (req, res) => {
  try {
    const teams = await getAllTeamDetails();
    // ✅ FIX #7: changed 201 → 200 for GET
    res.status(200).json({ message: "All Team Data", data: teams });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

// ─────────────────────────────────────────
// PROJECT APIs
// ─────────────────────────────────────────

async function createNewProject(newProject) {
  try {
    const project = new Project(newProject);
    const savedProject = await project.save();
    return savedProject;
  } catch (error) {
    throw error;
  }
}

// POST /api/add-project
app.post("/api/add-project", async (req, res) => {
  try {
    const project = await createNewProject(req.body);
    if (project) {
      res
        .status(201)
        .json({ message: "Project added successfully", data: project });
    } else {
      res.status(404).json({ error: "Something went wrong" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to add project" });
  }
});

// GET /api/all-project
async function getAllProjectDetails() {
  try {
    const projects = await Project.find();
    return projects;
  } catch (error) {
    throw error;
  }
}

app.get("/api/all-project", async (req, res) => {
  try {
    const projects = await getAllProjectDetails();
    // ✅ FIX #7: changed 201 → 200 for GET
    res.status(200).json({ message: "All Projects", data: projects });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// DELETE /api/delete-project/:projectId
async function deletedProjectDetailByProjectId(projectId) {
  try {
    const project = await Project.findByIdAndDelete(projectId);
    return project;
  } catch (error) {
    throw error;
  }
}

app.delete("/api/delete-project/:projectId", async (req, res) => {
  try {
    const project = await deletedProjectDetailByProjectId(req.params.projectId);
    if (project) {
      res
        .status(200)
        .json({ message: "Project deleted successfully", data: project });
    } else {
      res.status(404).json({ error: "Project not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// PUT /api/update-project/:projectId
async function updatedProjectDetailByProjectId(projectId, updateData) {
  try {
    // ✅ FIX #3: was findByIdAndUpdate(id) — missing updateData & {new:true}
    const project = await Project.findByIdAndUpdate(projectId, updateData, {
      returnDocument: 'after',
      runValidators: true, // Ensures schema validation runs on update
    });
    return project;
  } catch (error) {
    throw error;
  }
}

app.put("/api/update-project/:projectId", async (req, res) => {
  try {
    const project = await updatedProjectDetailByProjectId(
      req.params.projectId,
      req.body,
    );
    if (project) {
      res
        .status(200)
        .json({ message: "Project updated successfully", data: project });
    } else {
      res.status(404).json({ error: "Project not found" });
      console.error(error.message);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to update project" });
    console.error(error.message);
  }
});

// ─────────────────────────────────────────
// TASK APIs
// ─────────────────────────────────────────

async function createNewTask(newtask) {
  try {
    const task = new Task(newtask);
    const savedTask = await task.save();
    return savedTask;
  } catch (error) {
    throw error;
  }
}

// POST /api/add-task
app.post("/api/add-task", async (req, res) => {
  try {
    const task = await createNewTask(req.body);
    if (task) {
      res.status(201).json({ message: "Task added successfully", data: task });
    } else {
      res.status(404).json({ error: "Something went wrong" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to add task" });
  }
});

// GET /api/all-task
async function getAllTaskDetails() {
  try {
    const tasks = await Task.find()
      .populate("project")
      .populate("team")
      .populate("owners");
    return tasks;
  } catch (error) {
    throw error;
  }
}

app.get("/api/all-task", async (req, res) => {
  try {
    const tasks = await getAllTaskDetails();
    // ✅ FIX #7: changed 201 → 200 for GET
    res.status(200).json({ message: "All Tasks", data: tasks });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// DELETE /api/delete-task/:taskId
async function deletedTaskDetailByTaskId(taskId) {
  try {
    // ✅ FIX #4: was Task.findByIdByDelete() — method doesn't exist in Mongoose
    const task = await Task.findByIdAndDelete(taskId);
    return task;
  } catch (error) {
    throw error;
  }
}

app.delete("/api/delete-task/:taskId", async (req, res) => {
  try {
    const task = await deletedTaskDetailByTaskId(req.params.taskId);
    if (task) {
      res
        .status(200)
        .json({ message: "Task deleted successfully", data: task });
    } else {
      res.status(404).json({ error: "Task not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// PUT /api/update-task/:taskId
async function updatedTaskDetailByTaskId(taskId, updateData) {
  try {
    // ✅ FIX #5: was Task.findByIdByDelete() — method doesn't exist
    const task = await Task.findByIdAndUpdate(taskId, updateData, {
      returnDocument: 'after',
      runValidators: true 

    });
    return task;
  } catch (error) {
    throw error;
  }
}

// ✅ FIX #6: was app.delete — update must use app.put
app.put("/api/update-task/:taskId", async (req, res) => {
  try {
    const task = await updatedTaskDetailByTaskId(req.params.taskId, req.body);
    if (task) {
      res
        .status(200)
        .json({ message: "Task updated successfully", data: task });
    } else {
      res.status(404).json({ error: "Task not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to update task" });
  }
});

// ─────────────────────────────────────────
// TAG APIs
// ─────────────────────────────────────────

async function createNewTag(newTag) {
  try {
    const tag = new Tag(newTag);
    const savedTag = await tag.save();
    return savedTag;
  } catch (error) {
    throw error;
  }
}

// POST /api/add-tag
app.post("/api/add-tag", async (req, res) => {
  try {
    const tag = await createNewTag(req.body);
    if (tag) {
      res.status(201).json({ message: "Tag added successfully", data: tag });
    } else {
      res.status(404).json({ error: "Something went wrong" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to add tag" });
  }
});

// GET /api/all-tag
async function getAllTagDetails() {
  try {
    const tags = await Tag.find();
    return tags;
  } catch (error) {
    throw error;
  }
}

app.get("/api/all-tag", async (req, res) => {
  try {
    const tags = await getAllTagDetails();
    // ✅ FIX #7: changed 201 → 200 for GET
    res.status(200).json({ message: "All Tags", data: tags });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
});

// ─────────────────────────────────────────
// BULK SEED APIs
// ─────────────────────────────────────────

// POST /seedBulkData-team
app.post("/api/seedBulkData-team", async (req, res) => {
  try {
    const data = await Team.insertMany(req.body);
    if (data) {
      res.status(201).json({ message: "Team bulk data added", seedData: data });
    } else {
      res.status(404).json({ error: "Something went wrong" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to seed team data" });
    console.error(error.message)
  }
});

// POST /api/seedBulkData-task
app.post("/api/seedBulkData-task", async (req, res) => {
  try {
    const data = await Task.insertMany(req.body);
    if (data) {
      res.status(201).json({ message: "Task bulk data added", seedData: data });
    } else {
      res.status(404).json({ error: "Something went wrong" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to seed task data" });
  }
});

// POST /api/seedBulkData-tag
app.post("/api/seedBulkData-tag", async (req, res) => {
  try {
    const data = await Tag.insertMany(req.body);
    if (data) {
      res.status(201).json({ message: "Tag bulk data added", seedData: data });
    } else {
      res.status(404).json({ error: "Something went wrong" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to seed tag data" });
  }
});

// ─────────────────────────────────────────

const PORT = 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
