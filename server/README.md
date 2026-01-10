# Website EDu - Backend Server

## Overview
Node.js + Express.js backend API for the Website EDu educational platform using MongoDB and Mongoose.

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **ODM:** Mongoose
- **Authentication:** JWT + bcryptjs
- **Language:** TypeScript

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally on port 27017 or MongoDB Atlas)

### Installation

```bash
# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Update .env with your MongoDB connection string
```

### Running the Server

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Seed database with sample data
npm run seed
```

## Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/websit-edu
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

## API Documentation

### Authentication

#### POST /api/auth/signup
Register a new user
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student" // optional: student, teacher, admin
}
```

#### POST /api/auth/login
Login user
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### GET /api/auth/me
Get current user (requires authentication)

### Courses

#### GET /api/courses
Get all courses (supports filtering)
- Query params: `category`, `level`, `search`

#### GET /api/courses/:id
Get single course by ID

#### POST /api/courses
Create new course (Admin/Teacher only)

#### PUT /api/courses/:id
Update course (Admin/Teacher only)

#### DELETE /api/courses/:id
Delete course (Admin only)

### Quiz

#### GET /api/quiz/:id
Get quiz by ID (hides answers for students)

#### POST /api/quiz/:id/submit
Submit quiz answers
```json
{
  "answers": [0, 2, 1, 3]
}
```

#### GET /api/quiz/:id/results
Get user's quiz results

#### POST /api/quiz
Create new quiz (Admin/Teacher only)

### Notes

#### GET /api/notes
Get all notes (filter by courseId)

#### GET /api/notes/:id
Get single note

#### POST /api/notes
Create new note (Admin/Teacher only)

#### DELETE /api/notes/:id
Delete note (Admin/Teacher only)

### Shop

#### GET /api/shop/products
Get all products

#### GET /api/shop/products/:id
Get single product

#### POST /api/shop/orders
Create new order (requires authentication)

#### GET /api/shop/orders
Get user's orders

#### GET /api/shop/orders/:id
Get single order

#### PUT /api/shop/orders/:id
Update order status (Admin only)

## Database Models

- **User:** Student, teacher, and admin accounts
- **Course:** Course information with lessons
- **Quiz:** Quizzes with questions and answers
- **QuizResult:** User quiz submissions and scores
- **Note:** Course materials and study notes
- **Product:** Shop products
- **Order:** User orders with items and shipping

## Authentication

All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Error Handling

All API errors return JSON in this format:
```json
{
  "success": false,
  "message": "Error description",
  "stack": "..." // only in development
}
```

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── database.ts       # MongoDB connection
│   ├── middleware/
│   │   ├── auth.ts           # JWT authentication
│   │   └── error.ts          # Error handling
│   ├── models/
│   │   ├── User.ts
│   │   ├── Course.ts
│   │   ├── Quiz.ts
│   │   ├── Note.ts
│   │   └── Product.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── courses.ts
│   │   ├── quiz.ts
│   │   ├── notes.ts
│   │   └── shop.ts
│   ├── index.ts              # Main server file
│   └── seed.ts               # Database seeding script
├── package.json
├── tsconfig.json
└── .env
```

## Health Check

```bash
GET http://localhost:5000/health
```

Returns:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-12-05T12:00:00.000Z"
}
```
