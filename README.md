# 📋 AttendX — Attendance & Leave Management System

A full-stack web application for automated attendance tracking and leave management for students and employees, with secure JWT authentication and role-based access control.

---

## 🏗️ Tech Stack

| Layer     | Technology                         |
|-----------|------------------------------------|
| Frontend  | React 18, React Router v6, Recharts |
| Backend   | Node.js, Express.js                |
| Database  | MongoDB + Mongoose                 |
| Auth      | JWT (JSON Web Tokens) + bcryptjs   |
| Styling   | Custom CSS Design System (Syne + DM Sans fonts) |

---

## 👥 Roles & Permissions

| Role       | Can Do                                                                 |
|------------|------------------------------------------------------------------------|
| **Admin**  | Full access — manage all users, view all data, review leaves           |
| **Manager**| Manage dept users, mark bulk attendance, approve/reject leaves         |
| **Teacher**| Same as Manager (school context)                                       |
| **Employee**| Mark own attendance, apply/cancel leaves, view own records            |
| **Student** | Mark own attendance, apply/cancel leaves, view own records            |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)

### 1. Clone & Setup

```bash
git clone <your-repo-url>
cd attendance-system
```

### 2. Backend Setup

```bash
cd backend
npm install

# Copy env file and configure
cp .env.example .env
# Edit .env — set your MONGO_URI and JWT_SECRET
```

`.env` file:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/attendance_system
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRE=7d
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

### 4. Seed Demo Data

```bash
# From project root
cd ..
node seed.js
```

### 5. Run the App

Open **two terminals**:

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# Server starts at http://localhost:5000
```

```bash
# Terminal 2 — Frontend
cd frontend
npm start
# App opens at http://localhost:3000
```

---

## 🔑 Demo Login Credentials

| Role     | Email                    | Password    |
|----------|--------------------------|-------------|
| Admin    | admin@attendx.com        | admin123    |
| Manager  | manager@attendx.com      | manager123  |
| Teacher  | teacher@attendx.com      | teacher123  |
| Employee | employee@attendx.com     | employee123 |
| Student  | student@attendx.com      | student123  |

---

## 📂 Project Structure

```
attendance-system/
├── backend/
│   ├── models/
│   │   ├── User.js          # User schema (all roles)
│   │   ├── Attendance.js    # Attendance records
│   │   └── Leave.js         # Leave requests
│   ├── routes/
│   │   ├── auth.js          # Login, register, /me
│   │   ├── users.js         # User CRUD
│   │   ├── attendance.js    # Mark, bulk mark, summary
│   │   ├── leaves.js        # Apply, review, cancel
│   │   └── dashboard.js     # Stats & charts data
│   ├── middleware/
│   │   └── auth.js          # JWT protect + RBAC
│   ├── server.js
│   └── .env.example
│
├── frontend/
│   └── src/
│       ├── context/
│       │   └── AuthContext.js    # Global auth state
│       ├── utils/
│       │   └── api.js            # Axios API helpers
│       ├── pages/
│       │   ├── Login.js          # Auth page
│       │   ├── Dashboard.js      # Stats + charts
│       │   ├── AttendancePage.js # Calendar + list + mark
│       │   ├── LeavePage.js      # Apply + review leaves
│       │   ├── UsersPage.js      # Admin user management
│       │   └── ProfilePage.js    # Profile + change password
│       ├── components/
│       │   └── Layout.js         # Sidebar + navigation
│       ├── index.css             # Design system styles
│       └── App.js                # Routes + providers
│
└── seed.js                       # Demo data seeder
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint                    | Description          |
|--------|-----------------------------|----------------------|
| POST   | `/api/auth/register`        | Register new user    |
| POST   | `/api/auth/login`           | Login & get token    |
| GET    | `/api/auth/me`              | Get current user     |
| PUT    | `/api/auth/change-password` | Change password      |

### Users
| Method | Endpoint         | Access        |
|--------|------------------|---------------|
| GET    | `/api/users`     | Admin/Manager |
| POST   | `/api/users`     | Admin only    |
| PUT    | `/api/users/:id` | Admin/Self    |
| DELETE | `/api/users/:id` | Admin only    |

### Attendance
| Method | Endpoint                        | Description        |
|--------|---------------------------------|--------------------|
| GET    | `/api/attendance`               | List records       |
| POST   | `/api/attendance`               | Mark/bulk mark     |
| PUT    | `/api/attendance/:id`           | Update record      |
| GET    | `/api/attendance/summary/:uid`  | Monthly summary    |

### Leaves
| Method | Endpoint                    | Description      |
|--------|-----------------------------|------------------|
| GET    | `/api/leaves`               | List requests    |
| POST   | `/api/leaves`               | Apply for leave  |
| PUT    | `/api/leaves/:id/review`    | Approve/reject   |
| PUT    | `/api/leaves/:id/cancel`    | Cancel (self)    |

### Dashboard
| Method | Endpoint              | Description         |
|--------|-----------------------|---------------------|
| GET    | `/api/dashboard/stats`| Overview stats      |

---

## ✨ Features

- ✅ **Secure Authentication** — JWT tokens, bcrypt password hashing
- ✅ **Role-Based Access Control** — 5 roles with granular permissions
- ✅ **Attendance Calendar** — Visual month-view with color-coded statuses
- ✅ **Bulk Attendance Marking** — Mark entire class/team at once
- ✅ **Self Check-in** — Employees/students mark own attendance
- ✅ **Leave Workflow** — Apply → Review → Approve/Reject (auto-marks attendance)
- ✅ **Dashboard Analytics** — Weekly trend chart + leave type breakdown
- ✅ **Monthly Summary** — Per-user present/absent/late/leave counts
- ✅ **User Management** — Admin CRUD with soft-delete (deactivate)
- ✅ **Profile Management** — Edit profile + change password
- ✅ **Overlap Detection** — Prevents duplicate leave applications

---

## 🔒 Security Features

- Password hashing with bcryptjs (salt rounds: 10)
- JWT expiry (7 days by default)
- Route-level role authorization middleware
- Soft-delete (users deactivated, not deleted)
- Input validation with express-validator
- CORS configured for frontend origin only

---

## 🚀 Production Deployment

### Backend (e.g. Railway, Render)
1. Set environment variables in your hosting dashboard
2. Use MongoDB Atlas for cloud database
3. Change `JWT_SECRET` to a strong random string

### Frontend (e.g. Vercel, Netlify)
1. Set `REACT_APP_API_URL=https://your-backend-url.com/api`
2. Run `npm run build`
3. Deploy the `build/` folder

---

## 📈 Future Enhancements

- [ ] Email notifications (Nodemailer) for leave status
- [ ] QR code / geofence-based check-in
- [ ] Export attendance to Excel/PDF
- [ ] Holiday calendar management
- [ ] Leave balance tracking
- [ ] Mobile app (React Native)

---

Built with ❤️ using React + Node.js + MongoDB
# attendanceLeave-
