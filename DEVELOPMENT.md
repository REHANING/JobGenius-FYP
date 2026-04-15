# Development Guide

## Project Architecture

### Frontend Stack
- **React 18** - UI library
- **TypeScript** - Type safety and development speed
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **React Router v7** - Client-side routing
- **Axios** - HTTP client for API calls
- **Context API** - State management (Auth, Theme)

### Backend Stack
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database (primary)
- **Mongoose** - MongoDB ODM
- **PostgreSQL** - SQL database (optional, for recruiter features)
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **OpenAI API** - Resume parsing and AI features
- **Multer** - File uploads

## Project Organization

### Frontend Structure (`src/`)

```
src/
├── components/          # Reusable React components
│   ├── admin/          # Admin-only components
│   ├── auth/           # Authentication UI
│   ├── layout/         # Layout components (Navbar, Footer, Sidebar)
│   └── ui/             # Reusable UI (Button, Card, Avatar, etc)
│
├── context/            # Context API for state
│   ├── AuthContext.tsx # Authentication state + methods
│   └── ThemeContext.tsx# Dark/Light mode state
│
├── pages/              # Page/Route components
│   ├── admin/          # Admin pages
│   ├── auth/           # Login, Signup pages
│   ├── jobseeker/      # Job seeker dashboard, profile, etc
│   ├── recruiter/      # Recruiter dashboard, post job, etc
│   ├── Home.tsx        # Home feed
│   ├── Landing.tsx     # Landing page
│   └── ...
│
├── services/           # API calls & utilities
│   ├── apiService.ts   # All API endpoints
│   └── pdfService.ts   # PDF handling
│
├── types/              # TypeScript definitions
│   └── index.ts        # Shared types
│
├── App.tsx             # Main app component with routing
├── main.tsx            # Entry point
└── index.css           # Global styles

```

### Backend Structure (`backend/`)

```
backend/
├── config/             # Configurations
│   ├── db.js          # PostgreSQL connection
│   └── mongo.js       # MongoDB connection
│
├── controllers/        # Business logic
│   └── authController.js
│
├── middleware/         # Custom middleware
│   └── authMiddleware.js
│
├── models/            # MongoDB schemas
│   └── User.js
│
├── routes/            # API endpoints
│   ├── authRoutes.js
│   ├── jobsRoutes.js
│   ├── profileRoutes.js
│   ├── recruiterRoutes.js
│   ├── adminRoutes.js
│   └── ...
│
├── uploads/           # User uploaded files
│   ├── profile-pictures/
│   └── resumes/
│
├── .env.example       # Environment template
├── seed.js            # Database seeder
└── server.js          # Entry point
```

## Authentication Flow

### 1. User Signs Up
```
Frontend (Signup.tsx)
    ↓ POST /api/auth/signup
Backend (authRoutes.js)
    ↓ Hash password with bcryptjs
    ↓ Create user in MongoDB
    ↓ Return success message
Frontend
    ↓ Show success modal
    ↓ Redirect to login
```

### 2. User Logs In
```
Frontend (Login.tsx)
    ↓ POST /api/auth/login { email, password, role }
Backend (authRoutes.js)
    ↓ Find user by email + role
    ↓ Compare password with bcrypt
    ↓ Generate JWT token
    ↓ Return token + user data
Frontend (AuthContext)
    ↓ Store token + user in localStorage
    ↓ Update context state
    ↓ Redirect to dashboard based on role
```

### 3. Protected Routes
```
Frontend Route
    ↓ Check useAuth() hook
    ↓ If user exists → show page
    ↓ If no user → redirect to /login
Backend Route
    ↓ Middleware checks Authorization header
    ↓ Verifies JWT token
    ↓ Decodes user ID
    ↓ Proceeds or returns 401
```

## Development Workflow

### Adding a New Feature

#### 1. Backend Route
```javascript
// backend/routes/newFeatureRoutes.js
const express = require("express");
const router = express.Router();

// GET /api/feature/items
router.get("/items", async (req, res) => {
  try {
    // Business logic here
    res.json({ data: [] });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

module.exports = router;
```

#### 2. Register Route in Server
```javascript
// backend/server.js
const newFeatureRoutes = require('./routes/newFeatureRoutes');
app.use("/api/feature", newFeatureRoutes);
```

#### 3. Create API Service
```typescript
// src/services/apiService.ts
export const featureAPI = {
  getItems: () => axios.get('/api/feature/items'),
  createItem: (data) => axios.post('/api/feature/items', data),
};
```

#### 4. Create Frontend Component
```typescript
// src/pages/Feature.tsx
import { useEffect, useState } from 'react';
import { featureAPI } from '../services/apiService';

export default function Feature() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data } = await featureAPI.getItems();
        setItems(data);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    fetchItems();
  }, []);

  return <div>{/* UI here */}</div>;
}
```

#### 5. Add Route to App
```typescript
// src/App.tsx
import Feature from './pages/Feature';

<Route path="/feature" element={<Feature />} />
```

### Code Style Standards

#### TypeScript
```typescript
// Always define types
interface User {
  id: string;
  name: string;
  email: string;
  role: 'jobseeker' | 'recruiter' | 'admin';
}

// Use const for immutability
const getUser = (id: string): User => {
  // ...
};

// Use async/await
const fetchUser = async (id: string) => {
  try {
    const response = await axios.get(`/api/users/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
```

#### React Components
```typescript
// Use functional components
const MyComponent: React.FC<Props> = ({ title, onClick }) => {
  const [state, setState] = useState<string>('');

  useEffect(() => {
    // Setup
    return () => {
      // Cleanup
    };
  }, []); // Add dependencies

  return <div>{/* JSX */}</div>;
};
```

#### Error Handling
```typescript
// Always catch errors
try {
  // Do something
} catch (error) {
  console.error('Operation failed:', error);
  // Show user-friendly message
  setError('Failed to complete action');
}
```

## Testing Locally

### Manual Testing Checklist
- [ ] Login with all three user types
- [ ] Test protected routes
- [ ] Try invalid credentials
- [ ] Check logout redirect
- [ ] Verify localStorage persistence
- [ ] Test API errors
- [ ] Check responsive design

### Using Browser DevTools

```javascript
// Check token in DevTools Console
localStorage.getItem('token')

// Monitor API calls
// Network tab → Filter by XHR/Fetch

// Check React component state
// Install React DevTools extension
```

## Performance Optimization

### Frontend
- Use React.memo for expensive components
- Lazy load routes with React.lazy()
- Optimize images
- Minimize bundle size

### Backend
- Add MongoDB indexes
- Use pagination for large datasets
- Cache frequently accessed data
- Optimize database queries

## Deployment Checklist

- [ ] Update API URL for production
- [ ] Set secure JWT_SECRET
- [ ] Enable HTTPS
- [ ] Set MongoDB Atlas for production
- [ ] Configure CORS for production domain
- [ ] Set up environment variables
- [ ] Run database migrations
- [ ] Test all features on production domain

## Debugging Tips

### Frontend
```javascript
// Add to App.tsx for debug info
useEffect(() => {
  console.log('Auth:', useAuth());
  console.log('Location:', window.location);
}, []);
```

### Backend
```javascript
// Add logging
console.log('Request body:', req.body);
console.log('User:', req.user);
console.error('Database error:', err);
```

### MongoDB
```javascript
// Query data directly
db.users.find({ email: 'test@example.com' })
```

## Useful VS Code Extensions

- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Thunder Client (API testing)
- MongoDB for VS Code
- Prettier - Code formatter
- GitLens
- REST Client

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot find module" | Run `npm install` |
| Type errors | Check TypeScript types |
| API 404 | Verify backend route exists |
| Blank page | Check browser console (F12) |
| Slow performance | Check Network tab, optimize queries |
| State not updating | Check React DevTools, verify setState |

---

Happy coding! 🚀
