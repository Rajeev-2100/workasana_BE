# Workasana Backend

This repository contains the backend API for a Workasana-style task management application. The project is implemented in Node.js with Express and uses MongoDB via Mongoose for persistence. It includes authentication, user management, team/project/task/tag APIs, and a Vercel deployment configuration.

## Project overview

The application entry point is `index.js`. Database initialization is handled in `db/db.connect.js`, and schema definitions live under the `models/` directory.

The API exposes endpoints for:

- user registration and login
- listing and managing users
- creating and retrieving teams
- creating, updating, and deleting projects
- creating, updating, and deleting tasks
- creating and listing tags
- bulk insertion of team/task/tag records

Protected routes are secured with a JWT middleware. The app also enables CORS for a hosted frontend and local frontend development.

## Features

- User signup and login with email/password validation
- JWT-based authentication for protected routes
- User CRUD operations and password change flow
- Team creation and retrieval
- Project creation, listing, update, and deletion
- Task creation, listing, update, and deletion
- Tag creation and listing
- Bulk seed endpoints for teams, tasks, and tags
- MongoDB connection via Mongoose
- Local server startup and Vercel deployment support

## Tech stack

- Node.js
- Express 5.2.1
- MongoDB
- Mongoose 9.7.2
- JWT (`jsonwebtoken`)
- bcrypt / bcryptjs
- dotenv
- cors
- Vercel (`vercel.json`)

## Project structure

```text
workasana_BE/
├── .env
├── .gitignore
├── db/
│   └── db.connect.js
├── index.js
├── models/
│   ├── project.model.js
│   ├── tag.model.js
│   ├── task.model.js
│   ├── team.model.js
│   └── user.model.js
├── package.json
├── package-lock.json
├── vercel.json
├── README.md
└── node_modules/
```

## Setup and installation

1. Open a terminal in the project root.
2. Install dependencies:

```bash
npm install
```

3. Configure the required environment variables in a `.env` file.
4. Start the server:

```bash
node index.js
```

The app listens on `process.env.PORT || 3000` when not running in the Vercel environment.

## Environment variables

The project uses `dotenv` to load environment variables.

### Required

- `MONGO_URL`: MongoDB connection string used by `db/db.connect.js`

### Optional

- `PORT`: local port for the Node.js server (defaults to `3000`)
- `VERCEL`: runtime flag used in `index.js` to decide whether to initialize the database during serverless execution

### JWT secret

The code does not load the JWT secret from an environment variable. It is hardcoded in `index.js`:

```js
const JWT_SECRET = "mySuperSecretKey123";
```

The repository includes a `.env` file with a configured `MONGO_URL` value.

## Usage and run commands

From the project root:

```bash
npm install
node index.js
```

Optional local port override:

```bash
PORT=3000 node index.js
```

The root route is:

```bash
GET /
```

This returns a JSON response that lists the API groups and available endpoints.

## API documentation

The application exposes the following routes.

### Authentication

- `POST /api/add-user` — creates a new user and returns a JWT
- `POST /api/login` — validates an email/password pair and returns a JWT

### Users

- `GET /api/all-user` — returns all users
- `GET /api/get-user/:userId` — returns one user by ID
- `PUT /api/update-user/:userId` — updates a user name or email
- `PUT /api/change-password/:userId` — changes a password after validating the current one
- `DELETE /api/delete-user/:userId` — deletes a user by ID

### Teams

- `POST /api/add-team` — creates a team
- `GET /api/all-team` — lists all teams

### Projects

- `POST /api/add-project` — creates a project
- `GET /api/all-project` — lists all projects
- `PUT /api/update-project/:projectId` — updates a project
- `DELETE /api/delete-project/:projectId` — deletes a project

### Tasks

- `POST /api/add-task` — creates a task
- `GET /api/all-task` — lists tasks and populates `project`, `team`, and `owners`
- `PUT /api/update-task/:taskId` — updates a task
- `DELETE /api/delete-task/:taskId` — deletes a task

### Tags

- `POST /api/add-tag` — creates a tag
- `GET /api/all-tag` — lists all tags

### Bulk seed endpoints

- `POST /api/seedBulkData-team`
- `POST /api/seedBulkData-task`
- `POST /api/seedBulkData-tag`

### Root endpoint

- `GET /` — returns the API status message and grouped endpoint list

## Database and authentication details

### Database

The project connects to MongoDB with Mongoose in `db/db.connect.js`.

```js
const MONGO_URI = process.env.MONGO_URL;

const connect = await mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

The connection is cached to avoid repeated reconnects.

### Models

#### User

- `name`: required string
- `email`: required, unique string
- `password`: required string

#### Team

- `name`: required, unique string
- `description`: optional string

#### Project

- `name`: required, unique string
- `description`: optional string
- `createdAt`: default date value

#### Task

- `name`: required string
- `project`: required `ObjectId` reference to `Project`
- `team`: required `ObjectId` reference to `Team`
- `owners`: required array of `ObjectId` references to `User`
- `tags`: array of strings
- `timeToComplete`: required number
- `status`: one of `To Do`, `In Progress`, `Completed`, or `Blocked`; default is `To Do`
- `dueDate`: optional date
- timestamps enabled (`createdAt` and `updatedAt`)

#### Tag

- `name`: required, unique string

### Authentication flow

Authentication is implemented with JWT and bcrypt.

- user registration and login create JWTs with `jsonwebtoken.sign(...)`
- protected routes use the `verifyJWT` middleware
- the middleware reads the `Authorization` header and accepts either a raw token or a Bearer-prefixed token
- `jwt.verify(token, JWT_SECRET)` validates the token
- if the token is missing or invalid, the API returns a `401` response
- passwords are hashed with `bcrypt.hash(...)` and compared using `bcrypt.compare(...)`

## Testing

There is no automated test suite configured in the repository.

The current `package.json` includes:

```json
"test": "echo \"Error: no test specified\" && exit 1"
```

This means `npm test` currently exits with the placeholder message shown above.

## Deployment

The project includes a Vercel deployment configuration in `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.js"
    }
  ]
}
```

The backend configures CORS for:

- `https://workasana-fe.vercel.app`
- `http://localhost:5173`

This is the deployment and runtime configuration verified in the repository.

