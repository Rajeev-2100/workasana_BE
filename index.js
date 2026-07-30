const cors = require("cors");
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Team = require("./models/team.model");
const Task = require("./models/task.model");
const Project = require("./models/project.model");
const User = require("./models/user.model");
const Tag = require("./models/tag.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const initializationDatabase = require("./db/db.connect");
initializationDatabase;

// : Apply CORS once
app.use(
  cors({
    origin: ["https://workasana-fe.vercel.app", "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  }),
);

app.use(express.json());

const isVercel = process.env.VERCEL === "1";
const JWT_SECRET = "mySuperSecretKey123";

// Initialize DB before routes in serverless
if (isVercel) {
  // ✅ FIX 2: Use correct function name with parentheses
  initializationDatabase().catch(console.error);
}

// ===== JWT Middleware =====
const verifyJWT = (req, res, next) => {
  // ✅ Check both lowercase and uppercase
  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];

  if (!authHeader) {
    // console.log("❌ No authorization header found");
    return res.status(401).json({ message: "No token found" });
  }

  // ✅ Remove "Bearer " prefix if present
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  // console.log(
  //   "🔍 Token received:",
  //   token ? token.substring(0, 20) + "..." : "none",
  // );

  try {
    const decodedToken = jwt.verify(token, JWT_SECRET);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    res.status(401).json({ message: "Invalid token" });
  }
};

// =============================================
// USER APIs
// =============================================

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
    await initializationDatabase(); // Ensure DB is connected

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
      { expiresIn: "24h" },
    );

    return res.status(201).json({
      message: "New User Added Successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Add user error:", error);
    return res.status(500).json({ error: "Failed to create user." });
  }
});

// POST /api/login
app.post("/api/login", async (req, res) => {
  try {
    await initializationDatabase(); // Ensure DB is connected

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
    const users = await User.find().select("-password");
    return users;
  } catch (error) {
    throw error;
  }
}

app.get("/api/all-user", verifyJWT, async (req, res) => {
  try {
    await initializationDatabase(); // Ensure DB is connected
    const users = await getAllUserDetails();
    res.status(200).json({ message: "All User Data", data: users });
  } catch (error) {
    console.error("Get all users error:", error.message);
    res.status(500).json({ error: "Failed to fetch User Data" });
  }
});

// GET /api/get-user/:userId
async function getSpecificUserDetails(userId) {
  try {
    const user = await User.findById(userId).select("-password");
    return user;
  } catch (error) {
    throw error;
  }
}

app.get("/api/get-user/:userId", verifyJWT, async (req, res) => {
  try {
    await initializationDatabase(); // Ensure DB is connected
    const user = await getSpecificUserDetails(req.params.userId);
    if (user) {
      res.status(200).json({ message: "User Details", data: user });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to fetch User Data" });
  }
});

// PUT /api/update-user/:userId
async function updateUserDetailByUserId(userId, dataToUpdate) {
  try {
    const user = await User.findByIdAndUpdate(userId, dataToUpdate, {
      returnDocument: "after",
      runValidators: true,
    });
    return user;
  } catch (error) {
    throw error;
  }
}

app.put("/api/update-user/:userId", verifyJWT, async (req, res) => {
  try {
    await initializationDatabase(); // Ensure DB is connected

    const { userId } = req.params;
    const { name, email } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!name && !email) {
      return res
        .status(400)
        .json({ error: "At least one field (name or email) is required" });
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
    }

    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res
          .status(400)
          .json({ error: "Email already in use by another user" });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const user = await updateUserDetailByUserId(userId, updateData);

    if (user) {
      res.status(200).json({
        message: "User updated successfully",
        data: user,
      });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Failed to update User Data" });
  }
});

// PUT /api/change-password/:userId
app.put("/api/change-password/:userId", verifyJWT, async (req, res) => {
  try {
    await initializationDatabase(); // Ensure DB is connected

    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current and new passwords are required" });
    }

    if (newPassword.length !== 6) {
      return res
        .status(400)
        .json({ error: "New Password must be exactly 6 characters" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// DELETE /api/delete-user/:userId
async function deleteUserDetailByUserId(userId) {
  try {
    const user = await User.findByIdAndDelete(userId);
    return user;
  } catch (error) {
    throw error;
  }
}

app.delete("/api/delete-user/:userId", verifyJWT, async (req, res) => {
  try {
    await initializationDatabase(); // Ensure DB is connected

    const user = await deleteUserDetailByUserId(req.params.userId);
    if (user) {
      res
        .status(200)
        .json({ message: "User deleted successfully", data: user });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete User" });
  }
});

// =============================================
// TEAM APIs
// =============================================

async function createATeam(newTeam) {
  try {
    const team = new Team(newTeam);
    const savedTeam = await team.save();
    return savedTeam;
  } catch (error) {
    throw error;
  }
}

app.post("/api/add-team", verifyJWT, async (req, res) => {
  try {
    await initializationDatabase(); // Ensure DB is connected
    const team = await createATeam(req.body);
    if (team) {
      res
        .status(201)
        .json({ message: "Added new team successfully", data: team });
    } else {
      res.status(404).json({ error: "Something went wrong" });
    }
  } catch (error) {
    console.error("Add team error:", error.message);
    res.status(500).json({ error: "Failed to add team" });
  }
});

async function getAllTeamDetails() {
  try {
    const teams = await Team.find();
    return teams;
  } catch (error) {
    throw error;
  }
}

app.get("/api/all-team", verifyJWT, async (req, res) => {
  try {
    await initializationDatabase(); // Ensure DB is connected
    const teams = await getAllTeamDetails();
    res.status(200).json({ message: "All Team Data", data: teams });
  } catch (error) {
    console.error("Get teams error:", error.message);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

// =============================================
// PROJECT APIs
// =============================================

async function createNewProject(newProject) {
  try {
    const project = new Project(newProject);
    const savedProject = await project.save();
    return savedProject;
  } catch (error) {
    throw error;
  }
}

app.post("/api/add-project", verifyJWT, async (req, res) => {
  try {
    await initializationDatabase(); // Ensure DB is connected
    const project = await createNewProject(req.body);
    if (project) {
      res
        .status(201)
        .json({ message: "Project added successfully", data: project });
    } else {
      res.status(404).json({ error: "Something went wrong" });
    }
  } catch (error) {
    console.error("Add project error:", error.message);
    res.status(500).json({ error: "Failed to add project" });
  }
});

async function getAllProjectDetails() {
  try {
    const projects = await Project.find();
    return projects;
  } catch (error) {
    throw error;
  }
}

app.get("/api/all-project", verifyJWT, async (req, res) => {
  try {
    await initializationDatabase(); // Ensure DB is connected
    const projects = await getAllProjectDetails();
    res.status(200).json({ message: "All Projects", data: projects });
  } catch (error) {
    console.error("Get projects error:", error.message);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

async function deletedProjectDetailByProjectId(projectId) {
  try {
    const project = await Project.findByIdAndDelete(projectId);
    return project;
  } catch (error) {
    throw error;
  }
}

app.delete("/api/delete-project/:projectId", verifyJWT, async (req, res) => {
  try {
    await initializationDatabase(); // Ensure DB is connected
    const project = await deletedProjectDetailByProjectId(req.params.projectId);
    if (project) {
      res
        .status(200)
        .json({ message: "Project deleted successfully", data: project });
    } else {
      res.status(404).json({ error: "Project not found" });
    }
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

async function updatedProjectDetailByProjectId(projectId, updateData) {
  try {
    const project = await Project.findByIdAndUpdate(projectId, updateData, {
      returnDocument: "after",
      runValidators: true,
    });
    return project;
  } catch (error) {
    throw error;
  }
}

app.put("/api/update-project/:projectId", verifyJWT, async (req, res) => {
  try {
    await initializationDatabase(); // Ensure DB is connected
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
    }
  } catch (error) {
    console.error("Update project error:", error.message);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// =============================================
// TASK APIs
// =============================================

async function createNewTask(newtask) {
  try {
    const task = new Task(newtask);
    const savedTask = await task.save();
    return savedTask;
  } catch (error) {
    throw error;
  }
}

app.post("/api/add-task", verifyJWT, async (req, res) => {
  try {
    await initializationDatabase(); // Ensure DB is connected
    const task = await createNewTask(req.body);
    if (task) {
      res.status(201).json({ message: "Task added successfully", data: task });
    } else {
      res.status(404).json({ error: "Something went wrong" });
    }
  } catch (error) {
    console.error("Add task error:", error.message);
    res.status(500).json({ error: "Failed to add task" });
  }
});

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

app.get("/api/all-task", verifyJWT, async (req, res) => {
  try {
    await initializationDatabase(); // Ensure DB is connected
    const tasks = await getAllTaskDetails();
    res.status(200).json({ message: "All Tasks", data: tasks });
  } catch (error) {
    console.error("Get tasks error:", error.message);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

async function deletedTaskDetailByTaskId(taskId) {
  try {
    const task = await Task.findByIdAndDelete(taskId);
    return task;
  } catch (error) {
    throw error;
  }
}

app.delete("/api/delete-task/:taskId", verifyJWT, async (req, res) => {
  try {
    await initializationDatabase(); // Ensure DB is connected
    const task = await deletedTaskDetailByTaskId(req.params.taskId);
    if (task) {
      res
        .status(200)
        .json({ message: "Task deleted successfully", data: task });
    } else {
      res.status(404).json({ error: "Task not found" });
    }
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

async function updatedTaskDetailByTaskId(taskId, updateData) {
  try {
    const task = await Task.findByIdAndUpdate(taskId, updateData, {
      returnDocument: "after",
      runValidators: true,
    });
    return task;
  } catch (error) {
    throw error;
  }
}

app.put("/api/update-task/:taskId", verifyJWT, async (req, res) => {
  try {
    await initializationDatabase(); // Ensure DB is connected
    const task = await updatedTaskDetailByTaskId(req.params.taskId, req.body);
    if (task) {
      res
        .status(200)
        .json({ message: "Task updated successfully", data: task });
    } else {
      res.status(404).json({ error: "Task not found" });
    }
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// =============================================
// TAG APIs
// =============================================

async function createNewTag(newTag) {
  try {
    const tag = new Tag(newTag);
    const savedTag = await tag.save();
    return savedTag;
  } catch (error) {
    throw error;
  }
}

app.post("/api/add-tag", verifyJWT, async (req, res) => {
  try {
    await initializationDatabase(); // Ensure DB is connected
    const tag = await createNewTag(req.body);
    if (tag) {
      res.status(201).json({ message: "Tag added successfully", data: tag });
    } else {
      res.status(404).json({ error: "Something went wrong" });
    }
  } catch (error) {
    console.error("Add tag error:", error.message);
    res.status(500).json({ error: "Failed to add tag" });
  }
});

async function getAllTagDetails() {
  try {
    const tags = await Tag.find();
    return tags;
  } catch (error) {
    throw error;
  }
}

app.get("/api/all-tag", verifyJWT, async (req, res) => {
  try {
    await initializationDatabase(); // Ensure DB is connected
    const tags = await getAllTagDetails();
    res.status(200).json({ message: "All Tags", data: tags });
  } catch (error) {
    console.error("Get tags error:", error.message);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
});

// =============================================
// BULK SEED APIs
// =============================================

app.post("/api/seedBulkData-team", verifyJWT, async (req, res) => {
  try {
    await initializationDatabase(); // Ensure DB is connected
    const data = await Team.insertMany(req.body);
    if (data) {
      res.status(201).json({ message: "Team bulk data added", seedData: data });
    } else {
      res.status(404).json({ error: "Something went wrong" });
    }
  } catch (error) {
    console.error("Seed team error:", error.message);
    res.status(500).json({ error: "Failed to seed team data" });
  }
});

app.post("/api/seedBulkData-task", verifyJWT, async (req, res) => {
  try {
    await initializationDatabase(); // Ensure DB is connected
    const data = await Task.insertMany(req.body);
    if (data) {
      res.status(201).json({ message: "Task bulk data added", seedData: data });
    } else {
      res.status(404).json({ error: "Something went wrong" });
    }
  } catch (error) {
    console.error("Seed task error:", error.message);
    res.status(500).json({ error: "Failed to seed task data" });
  }
});

app.post("/api/seedBulkData-tag", verifyJWT, async (req, res) => {
  try {
    await initializationDatabase(); // Ensure DB is connected
    const data = await Tag.insertMany(req.body);
    if (data) {
      res.status(201).json({ message: "Tag bulk data added", seedData: data });
    } else {
      res.status(404).json({ error: "Something went wrong" });
    }
  } catch (error) {
    console.error("Seed tag error:", error.message);
    res.status(500).json({ error: "Failed to seed tag data" });
  }
});

// =============================================
// ROOT ENDPOINT
// =============================================

// ROOT ENDPOINT
app.get("/", (req, res) => {
  res.json({
    message: "Workasana API is running!",
    endpoints: {
      auth: ["/api/add-user", "/api/login"],
      users: [
        "/api/all-user",
        "/api/get-user/:userId",
        "/api/update-user/:userId",
        "/api/change-password/:userId",
        "/api/delete-user/:userId",
      ],
      teams: ["/api/add-team", "/api/all-team"],
      projects: [
        "/api/add-project",
        "/api/all-project",
        "/api/update-project/:projectId",
        "/api/delete-project/:projectId",
      ],
      tasks: [
        "/api/add-task",
        "/api/all-task",
        "/api/update-task/:taskId",
        "/api/delete-task/:taskId",
      ],
      tags: ["/api/add-tag", "/api/all-tag"],
    },
  });
});
// ===== EXPORT FOR VERCEL =====
module.exports = app;

// ===== LOCAL SERVER START (Only when not on Vercel) =====
if (!isVercel) {
  const PORT = process.env.PORT || 3000;
  initializationDatabase()
    .then(() => {
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((error) => {
      console.error("Failed to start server:", error);
      process.exit(1);
    });
}
