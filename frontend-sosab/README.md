# Construction Company Attendance Management System

A modern, full-stack web application for managing worker attendance in construction companies. Built with Next.js 16, React 19, TailwindCSS, and integrated with a backend API.

## 🎯 Features

### Admin Dashboard
- **Overview Dashboard**: Real-time attendance statistics with visual charts
- **Analytics & Reports**: Attendance trends, worker performance metrics, and detailed analytics
- **Worker Management**: Add, edit, delete, and manage construction workers
- **User Management**: Manage system users (Admin and Gerant roles)
- **Settings**: Configure company information and attendance preferences

### Site Manager (Gerant) Interface
- **Quick Attendance Marking**: Fast and intuitive interface for marking worker attendance
- **Worker History**: View individual worker attendance records and performance
- **Site Dashboard**: Daily overview with attendance summaries and trends

### Security & Authentication
- JWT-based authentication with automatic token injection
- Role-based access control (Admin vs Gerant)
- Protected routes with automatic redirects
- Secure token storage and session management

## 🏗️ Architecture

### Tech Stack
- **Frontend Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: TailwindCSS 4.2
- **HTTP Client**: Axios with interceptors
- **Charts & Analytics**: Recharts
- **Icons**: Lucide React
- **Language**: TypeScript

### Project Structure
```
/app
  /admin           # Admin dashboard routes
    /page.tsx      # Overview page
    /workers       # Worker management
    /users         # User management
    /reports       # Analytics & reports
    /settings      # System settings
  /gerant          # Site manager routes
    /page.tsx      # Dashboard
    /mark          # Attendance marking
    /workers       # Worker history
  /login           # Login page
  /dashboard       # Role router
  layout.tsx       # Root layout with auth provider
  page.tsx         # Home page redirect

/components
  header.tsx       # Header with user menu
  sidebar.tsx      # Navigation sidebar

/lib
  api.ts          # API client with interceptors
  auth-context.tsx # Authentication context
  use-protected-route.ts # Route protection hook
  utils.ts        # Utility functions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (or npm/yarn)

### Installation

1. **Install dependencies**:
```bash
pnpm install
```

2. **Set up environment variables** in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

3. **Start the development server**:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔐 Authentication

### Test Credentials

**Admin User**
- Email: `admin@company.com`
- Password: `password123`

**Site Manager (Gerant)**
- Email: `gerant@company.com`
- Password: `password123`

## 📡 API Integration

The application connects to a backend API at `http://localhost:5000`. The API service layer is in `/lib/api.ts` with the following endpoints:

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Workers
- `GET /workers` - List all workers
- `GET /workers/:id` - Get worker details
- `POST /workers` - Create new worker
- `PUT /workers/:id` - Update worker
- `DELETE /workers/:id` - Delete worker

### Attendance
- `POST /attendance/mark` - Mark attendance
- `GET /attendance/:workerId` - Get worker attendance
- `GET /attendance/history/:workerId` - Get attendance history
- `GET /attendance/report` - Get attendance reports

### Users
- `GET /users` - List all users
- `POST /users` - Create new user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

## 🎨 Design System

### Color Palette
- **Primary**: Orange (`#f97316`) - Safety and energy
- **Dark**: Slate 900 (`#0f172a`) - Professional
- **Neutrals**: Slate grays for balance
- **Status Colors**:
  - Green (`#10b981`) - Present/Success
  - Red (`#ef4444`) - Absent/Error
  - Orange (`#f59e0b`) - Leave/Warning
  - Blue (`#3b82f6`) - Info

### Typography
- **Headings**: Geist Sans (Bold)
- **Body**: Geist Sans (Regular)
- **Mono**: Geist Mono (Code)

### Components
- Responsive sidebar navigation
- Data tables with search and filtering
- Modal dialogs for forms
- Status badges and indicators
- Charts for analytics (Bar, Line, Pie)
- Form inputs with validation

## 📱 Responsive Design

The application is fully responsive:
- **Mobile**: Optimized for 375px+ screens
- **Tablet**: Enhanced layout for 768px+ screens
- **Desktop**: Full features at 1024px+ screens

Mobile features include:
- Hamburger menu for navigation
- Collapsible sidebar
- Touch-friendly buttons and inputs
- Optimized chart layouts

## 🔄 State Management

The application uses React Context for auth state and local component state for UI:
- **Auth Context**: Manages authentication state, user info, login/logout
- **Local State**: Form inputs, modals, sidebar visibility
- **API State**: Handled through Axios with interceptors

## 🛡️ Security Features

1. **JWT Authentication**: Tokens stored in localStorage
2. **Request Interceptors**: Automatic token injection in headers
3. **Response Interceptors**: Automatic 401 redirect on token expiry
4. **Protected Routes**: Role-based access control
5. **Environment Variables**: API URL from `.env.local`

## 📊 Pages Overview

### Admin Routes
- `/admin` - Overview dashboard with statistics
- `/admin/reports` - Detailed analytics and reports
- `/admin/workers` - Worker CRUD management
- `/admin/users` - User management
- `/admin/settings` - System configuration

### Gerant Routes
- `/gerant` - Site dashboard with quick stats
- `/gerant/mark` - Daily attendance marking interface
- `/gerant/workers` - Worker history and details

### Public Routes
- `/login` - Authentication page
- `/dashboard` - Role-based router
- `/` - Home page redirect

## 🔧 Development

### Available Scripts

```bash
# Development server
pnpm dev

# Build production bundle
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint

# Type check
pnpm type-check
```

### Debugging

Console logs use the format `console.log("[v0] ...")` for v0 debugging:
```typescript
console.log("[v0] User data received:", userData);
console.log("[v0] API error:", error.message);
```

## 📈 Next Steps for Backend Integration

1. **Replace Mock Data**: Update pages to fetch real data from API endpoints
2. **Implement API Calls**: Use the Axios client to call real endpoints
3. **Add Error Handling**: Show proper error messages for API failures
4. **Form Submission**: Connect forms to POST/PUT endpoints
5. **Real-time Updates**: Consider adding WebSocket for live updates

### Example API Integration
```typescript
import { workerAPI } from '@/lib/api';

// Fetch workers
const { data: workers } = await workerAPI.getAll();

// Mark attendance
await attendanceAPI.markAttendance({
  workerId: 1,
  status: 'present',
  date: new Date().toISOString(),
});
```

## 📝 License

This project is part of the Construction Management Suite.

## 🤝 Support

For issues or questions, please contact the development team or check the backend API documentation.

---

**Built with ❤️ for construction companies**
