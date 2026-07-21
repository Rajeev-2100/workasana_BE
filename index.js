const cors = require("cors");
const express = require("express");
const app = express();
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

// * New User Added

async function createNewUser(newUser) {
  try {
    const user = new User(newUser);
    const savedUser = await user.save();
    return savedUser;
  } catch (error) {
    throw error;
  }
}

const verifyJWT = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ message: "No token found" });
  // console.log("Token:", token);
  try {
    const decodedToken = jwt.verify(token, JWT_SECRET);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

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

    const user = await createNewUser({
      name,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: "admin",
      },
      JWT_SECRET,
      {
        expiresIn: "24h",
      },
    );

    return res.status(201).json({
      message: "New User Added Successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: "admin",
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to create user.",
    });
  }
});

// * Verify the login

const verifyLogin = async (userEmail) => {
  try {
    const user = await User.findOne({ email: userEmail });
    return user;
  } catch (error) {
    throw error;
  }
};

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and Password are required",
      });
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
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: "admin",
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    return res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Failed to Login" });
  }
});

// * Get Specific User Detail

const getSpecificUserDetails = async (userEmail) => {
  try {
    const user = await User.find({ email: userEmail })
      .populate("Project")
      .populate("Team")
      .populate("");
    return user;
  } catch (error) {
    throw error;
  }
};

app.get("/api/user/:userId", async (req, res) => {
  const user = await getSpecificUserDetails(req.params.userId);
  try {
    if (user) {
      res.status(201).json({ message: "User Details", data: user });
    } else {
      res.status(404).json({ error: "User email not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch User Data" });
  }
});

// * New Team added

async function createATeam(newTeam) {
  try {
    const team = new Team(newTeam);
    const savedTeam = await team.save();
    return savedTeam;
  } catch (error) {
    throw error;
  }
}

app.post("/api/add-team", async (req, res) => {
  try {
    const team = new createATeam(req.body);
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
  try {
    const team = await Team.find();
    return team;
  } catch (error) {
    throw error;
  }
}

app.get("/api/all-team", async (req, res) => {
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

app.post("/api/add-project", async (req, res) => {
  try {
    const project = new createNewProject(req.body);
    if (project) {
      res.status(201).json({
        message: "Added new project detail successfully",
        data: project,
      });
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

app.get("/api/all-project", async (req, res) => {
  try {
    const project = await getAllProjectDetails();
    if (project) {
      res
        .status(201)
        .json({ message: "All Project Data is this", data: project });
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
    const tag = new Tag(newTag);
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
      res
        .status(201)
        .json({ message: "Added new tag details successfully ", data: tag });
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

async function createNewTask(newtask) {
  try {
    const task = new Task(newtask);
    const savedTask = await task.save();
    return savedTask;
  } catch (error) {
    throw error;
  }
}

app.post("/api/add-task", async (req, res) => {
  try {
    const task = new createNewTask(req.body);
    if (task) {
      res
        .status(201)
        .json({ message: "Added new task details successfully ", data: task });
    } else {
      res.status(404).json({ error: "Something went wrong in the data" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Data" });
    console.error(error.message);
  }
});

// * Get all Task

async function getAllTaskDetails() {
  try {
    const task = await Task.find()
      .populate("project")
      .populate("team")
      .populate("owners");
    return task;
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

async function getAllUserDetails(){
  try {
    const user = await User.find()
    return user
  } catch (error) {
   throw error 
  }
}

app.get('/api/all-user', async (req,res) => {
  try {
    const user = await getAllUserDetails()
    if (user) {
      res.status(201).json({ message: "All User Data is this", data: user });
    } else {
      res.status(404).json({ error: "Something went wrong in the data" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Data" });
    console.error(error.message);
  }
})

// seedBulkData

async function seedBulkDataTeam(bulkData) {
  try {
    const data = await Team.insertMany(bulkData);
    // console.log("Projects seeded successfully.");
    // console.log("Data:", data);
    return data;
  } catch (error) {
    console.log("Error seeding projects:", error);
  }
}

app.post("/seedBulkData-team", async (req, res) => {
  try {
    const data = await seedBulkDataTeam(req.body);
    if (data) {
      res
        .status(201)
        .json({ message: "Data Added successfuly done", seedData: data });
    } else {
      res
        .status(404)
        .json({ error: "Something went wrong in feeding the data" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Bulk Team Data" });
  }
});

async function seedBulkDataForTask(bulkData) {
  try {
    const savedTask = await Task.insertMany(bulkData);
    return savedTask;
  } catch (error) {
    throw error;
  }
}

app.post("/api/seedBulkData-task", async (req, res) => {
  try {
    const data = await seedBulkDataForTask(req.body);
    if (data) {
      res
        .status(201)
        .json({ message: "Data Added successfuly done", seedData: data });
    } else {
      res
        .status(404)
        .json({ error: "Something went wrong in feeding the data" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Bulk Task Data" });
    console.error(error.message)
  }
});

const PORT = 3000;
app.listen(PORT, console.log("Server is running on 3000"));
