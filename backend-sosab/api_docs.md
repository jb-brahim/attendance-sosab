# Construction Company Attendance System API Documentation

This document describes the folder structure, setup instructions, and details for every REST API endpoint, including sample requests and responses (Postman/Curl format).

---

## Folder Structure

The project is structured following clean coding guidelines, separating concerns into controllers, routes, models, configuration, and middleware:

```text
sosab-attendance/
├── config/
│   └── db.js                 # MongoDB connection using Mongoose
├── controllers/
│   ├── authController.js     # User Registration & Login handlers
│   ├── workerController.js   # Worker CRUD handlers
│   └── attendanceController.js # Attendance & Reporting handlers
├── middleware/
│   ├── authMiddleware.js     # JWT protection & Role validation guards
│   ├── errorMiddleware.js    # Global error handler and database exception parser
│   └── validationMiddleware.js # Input validation helpers (if any)
├── models/
│   ├── User.js               # Mongoose schema for Admins & Gerants
│   ├── Worker.js             # Mongoose schema for Construction Workers
│   └── Attendance.js         # Mongoose schema for Daily Attendance Logs
├── utils/
│   └── generateToken.js      # JWT signing helper
├── .env                      # Local environment configuration file
├── .env.example              # Template for environment variables
├── package.json              # NPM script and dependency declarations
├── server.js                 # Entry point of the application
└── api_docs.md               # This documentation file
```

---

## Installation & Setup

1. **Prerequisites**: Ensure you have [Node.js](https://nodejs.org/) (v16+) and [MongoDB](https://www.mongodb.com/) installed and running on your system.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment**:
   Ensure `.env` exists and contains your configuration. The system automatically creates a default Admin account on first startup if the database is empty:
   - **Admin Email**: `admin@company.com`
   - **Admin Password**: `AdminSecurePassword123!`
4. **Start the Server**:
   - For production: `npm start`
   - For development (with hot-reloading via nodemon):
     ```bash
     npm run dev
     ```

---

## API Endpoint Reference

All endpoints are prefixed with `/api`. All protected routes require a Bearer token in the `Authorization` header:
`Authorization: Bearer <your_jwt_token_here>`

---

### 1. Authentication Endpoints (`/api/auth`)

#### 🔑 A. User Login (Public)
Authenticates an administrator or a gerant and returns a JWT token.
* **Route**: `POST /api/auth/login`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "email": "admin@company.com",
    "password": "AdminSecurePassword123!"
  }
  ```
* **Curl Example**:
  ```bash
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@company.com", "password": "AdminSecurePassword123!"}'
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logged in successfully",
    "data": {
      "_id": "667ae9b0d1e57c6b5cb560b1",
      "name": "System Admin",
      "email": "admin@company.com",
      "role": "admin",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

#### ➕ B. Register User (Admin Only)
Creates a new Gerant or Admin account. Allowed roles: `"admin"`, `"gerant"`.
* **Route**: `POST /api/auth/register`
* **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer <admin_token>`
* **Request Body**:
  ```json
  {
    "name": "Gerant Brahim",
    "email": "brahim@company.com",
    "password": "GerantPassword123!",
    "role": "gerant"
  }
  ```
* **Curl Example**:
  ```bash
  curl -X POST http://localhost:5000/api/auth/register \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <admin_token>" \
    -d '{"name": "Gerant Brahim", "email": "brahim@company.com", "password": "GerantPassword123!", "role": "gerant"}'
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "_id": "667ae9ccd1e57c6b5cb560b5",
      "name": "Gerant Brahim",
      "email": "brahim@company.com",
      "role": "gerant",
      "createdAt": "2026-06-25T10:00:00.000Z"
    }
  }
  ```

---

### 2. Worker Endpoints (`/api/workers`)

#### ➕ A. Create Worker (Admin Only)
Registers a new construction worker.
* **Route**: `POST /api/workers`
* **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer <admin_token>`
* **Request Body**:
  ```json
  {
    "name": "Alex Mercer",
    "phone": "+212600112233",
    "jobRole": "Brickmason"
  }
  ```
* **Curl Example**:
  ```bash
  curl -X POST http://localhost:5000/api/workers \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <admin_token>" \
    -d '{"name": "Alex Mercer", "phone": "+212600112233", "jobRole": "Brickmason"}'
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Worker created successfully",
    "data": {
      "_id": "667ae9ebd1e57c6b5cb560bd",
      "name": "Alex Mercer",
      "phone": "+212600112233",
      "jobRole": "Brickmason",
      "isActive": true,
      "createdAt": "2026-06-25T10:05:00.000Z",
      "updatedAt": "2026-06-25T10:05:00.000Z"
    }
  }
  ```

#### 📋 B. Get Workers List (Admin + Gerant)
Fetches a list of all workers, sorted alphabetically by name. Optional filter: `?active=true` or `?active=false`.
* **Route**: `GET /api/workers` or `GET /api/workers?active=true`
* **Headers**: `Authorization: Bearer <token>`
* **Curl Example**:
  ```bash
  curl -X GET http://localhost:5000/api/workers?active=true \
    -H "Authorization: Bearer <token>"
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "_id": "667ae9ebd1e57c6b5cb560bd",
        "name": "Alex Mercer",
        "phone": "+212600112233",
        "jobRole": "Brickmason",
        "isActive": true,
        "createdAt": "2026-06-25T10:05:00.000Z"
      }
    ]
  }
  ```

#### ✏️ C. Update Worker (Admin Only)
Modifies worker details or deactivates a worker.
* **Route**: `PUT /api/workers/:id`
* **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer <admin_token>`
* **Request Body** (All fields are optional):
  ```json
  {
    "jobRole": "Master Mason",
    "isActive": false
  }
  ```
* **Curl Example**:
  ```bash
  curl -X PUT http://localhost:5000/api/workers/667ae9ebd1e57c6b5cb560bd \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <admin_token>" \
    -d '{"jobRole": "Master Mason", "isActive": false}'
  ```

#### ❌ D. Delete Worker (Admin Only)
Removes a worker permanently from the system.
* **Route**: `DELETE /api/workers/:id`
* **Headers**: `Authorization: Bearer <admin_token>`
* **Curl Example**:
  ```bash
  curl -X DELETE http://localhost:5000/api/workers/667ae9ebd1e57c6b5cb560bd \
    -H "Authorization: Bearer <admin_token>"
  ```

---

### 3. Attendance Endpoints (`/api/attendance`)

#### 📝 A. Submit Daily Attendance (Gerant + Admin)
Logs or updates the attendance of multiple workers for a specific day. This is an **upsert** operation, meaning resubmissions on the same day will update the statuses/notes without creating duplicate entries.
* **Route**: `POST /api/attendance/mark`
* **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer <gerant_or_admin_token>`
* **Request Body**:
  ```json
  {
    "date": "2026-06-25",
    "records": [
      {
        "workerId": "667ae9ebd1e57c6b5cb560bd",
        "status": "present",
        "notes": "Arrived on time"
      },
      {
        "workerId": "667aeab0d1e57c6b5cb560c5",
        "status": "absent",
        "notes": "Called in sick, has medical note"
      },
      {
        "workerId": "667aeabed1e57c6b5cb560c9",
        "status": "late",
        "notes": "15 mins late due to public transit delays"
      }
    ]
  }
  ```
* **Curl Example**:
  ```bash
  curl -X POST http://localhost:5000/api/attendance/mark \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <gerant_token>" \
    -d '{"date": "2026-06-25", "records": [{"workerId": "667ae9ebd1e57c6b5cb560bd", "status": "present", "notes": "On time"}]}'
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Attendance recorded successfully",
    "summary": {
      "matchedCount": 0,
      "modifiedCount": 0,
      "upsertedCount": 1
    }
  }
  ```

#### 📊 B. Daily Summary & Logs (Admin Only)
Fetches stats for a specific day: total active workers, present count, absent count, late count, and full list of populated logs.
* **Route**: `GET /api/attendance/daily/:date` (Parameter `:date` in format `YYYY-MM-DD`)
* **Headers**: `Authorization: Bearer <admin_token>`
* **Curl Example**:
  ```bash
  curl -X GET http://localhost:5000/api/attendance/daily/2026-06-25 \
    -H "Authorization: Bearer <admin_token>"
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "summary": {
      "date": "2026-06-25",
      "totalActiveWorkers": 3,
      "totalMarked": 1,
      "present": 1,
      "absent": 0,
      "late": 0
    },
    "data": [
      {
        "_id": "667aebccd1e57c6b5cb560d2",
        "workerId": {
          "_id": "667ae9ebd1e57c6b5cb560bd",
          "name": "Alex Mercer",
          "phone": "+212600112233",
          "jobRole": "Brickmason",
          "isActive": true
        },
        "date": "2026-06-25",
        "status": "present",
        "markedBy": {
          "_id": "667ae9ccd1e57c6b5cb560b5",
          "name": "Gerant Brahim",
          "email": "brahim@company.com"
        },
        "notes": "On time",
        "createdAt": "2026-06-25T10:10:00.000Z"
      }
    ]
  }
  ```

#### 📈 C. Worker Attendance History & Metrics (Admin + Gerant)
Fetches total days logged, days present, days absent, days late, calculated attendance percentage, and the chronological list of all logs for a specific worker.
* **Route**: `GET /api/attendance/worker/:workerId`
* **Headers**: `Authorization: Bearer <token>`
* **Curl Example**:
  ```bash
  curl -X GET http://localhost:5000/api/attendance/worker/667ae9ebd1e57c6b5cb560bd \
    -H "Authorization: Bearer <token>"
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "worker": {
      "_id": "667ae9ebd1e57c6b5cb560bd",
      "name": "Alex Mercer",
      "phone": "+212600112233",
      "jobRole": "Brickmason",
      "isActive": true
    },
    "metrics": {
      "totalDaysLogged": 1,
      "presentDays": 1,
      "absentDays": 0,
      "lateDays": 0,
      "attendancePercentage": 100
    },
    "history": [
      {
        "_id": "667aebccd1e57c6b5cb560d2",
        "workerId": "667ae9ebd1e57c6b5cb560bd",
        "date": "2026-06-25",
        "status": "present",
        "markedBy": {
          "_id": "667ae9ccd1e57c6b5cb560b5",
          "name": "Gerant Brahim"
        },
        "notes": "On time",
        "createdAt": "2026-06-25T10:10:00.000Z"
      }
    ]
  }
  ```

#### 📅 D. Date Range Report Grouped By Worker (Admin Only)
Generates a comprehensive report for all workers between a `start` and `end` date (inclusive). Groups logs by worker, aggregates counts (present, absent, late, total), calculates attendance rates, and embeds individual logs.
* **Route**: `GET /api/attendance/range?start=YYYY-MM-DD&end=YYYY-MM-DD`
* **Headers**: `Authorization: Bearer <admin_token>`
* **Curl Example**:
  ```bash
  curl -X GET "http://localhost:5000/api/attendance/range?start=2026-06-01&end=2026-06-30" \
    -H "Authorization: Bearer <admin_token>"
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "dateRange": {
      "start": "2026-06-01",
      "end": "2026-06-30"
    },
    "count": 1,
    "data": [
      {
        "worker": {
          "_id": "667ae9ebd1e57c6b5cb560bd",
          "name": "Alex Mercer",
          "phone": "+212600112233",
          "jobRole": "Brickmason",
          "isActive": true
        },
        "metrics": {
          "totalDaysLogged": 1,
          "presentDays": 1,
          "absentDays": 0,
          "lateDays": 0,
          "attendancePercentage": 100
        },
        "history": [
          {
            "_id": "667aebccd1e57c6b5cb560d2",
            "date": "2026-06-25",
            "status": "present",
            "notes": "On time"
          }
        ]
      }
    ]
  }
  ```
