# JobGenius - Your Career Companion Platform

A comprehensive full-stack application for job seekers and recruiters, built with React, TypeScript, Node.js, and MongoDB.

## 🚀 Features

### For Job Seekers
- **Resume Parsing**: Upload and parse resumes using AI (OpenAI)
- **Job Marketplace**: Browse internships and job postings
- **Profile Management**: Create and manage professional profiles
- **Interview Tracking**: Track interviews and offers
- **Cover Letter Generator**: AI-powered cover letter suggestions
- **Job Notifications**: Real-time job alerts

### For Recruiters
- **Post Jobs**: Create and manage job postings
- **Browse Profiles**: Search and view candidate profiles
- **Manage Applications**: Review and track applications
- **Interview Scheduling**: Schedule and manage interviews
- **Offer Management**: Send and track job offers

### For Admins
- **User Management**: Manage user accounts and roles
- **Analytics & Reports**: View platform analytics
- **Content Moderation**: Monitor and manage content
- **System Administration**: Overall platform management

## 📋 Prerequisites

Before running this project, ensure you have:

- **Node.js** (v18+)
- **MongoDB** (v5+) - [Install](https://docs.mongodb.com/manual/installation/)
- **PostgreSQL** (optional, for recruiter features) - [Install](https://www.postgresql.org/download/)
- **npm** or **yarn** package manager
- **Git** for version control

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/JobGenius-FYP.git
cd JobGenius-FYP
```

### 2. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your actual credentials
# - MongoDB URI
# - OpenAI API Key
# - PostgreSQL credentials (optional)
# - JWT Secret
# - Google OAuth credentials (optional)

# Start backend server (development mode with hot-reload)
npm run dev

# Or start in production mode
npm start
```

**Backend will run on:** `http://localhost:5000`

### 3. Frontend Setup

```bash
# Navigate to root directory (if not already there)
cd ..

# Install dependencies
npm install

# Start frontend development server
npm run dev
```

**Frontend will run on:** `http://localhost:5173`

### 4. Access the Application

- **Main App**: http://localhost:5173/
- **Backend API**: http://localhost:5000/api/

## 👥 Test Accounts

### Job Seeker
- **Email**: `jobseeker@example.com`
- **Password**: `password123`
- **Role**: Job Seeker

### Recruiter
- **Email**: `recruiter@example.com`
- **Password**: `password123`
- **Role**: Recruiter

### Admin
- **Email**: `admin@gmail.com`
- **Password**: `123456`
- **Role**: Admin

## 📁 Project Structure

```
JobGenius-FYP/
│
├── backend/                    # Express.js API server
│   ├── config/                # Database configurations
│   ├── controllers/           # Route handlers
│   ├── middleware/            # Custom middleware
│   ├── models/                # MongoDB schemas
│   ├── routes/                # API routes
│   ├── uploads/               # User uploads (resumes, pictures)
│   ├── .env.example          # Environment variables template
│   └── server.js             # Entry point
│
├── src/                        # React + TypeScript Frontend
│   ├── components/            # Reusable React components
│   │   ├── admin/            # Admin-specific components
│   │   ├── auth/             # Authentication components
│   │   ├── layout/           # Layout components (Navbar, Footer)
│   │   └── ui/               # UI components (Button, Card, etc)
│   ├── context/              # Context API (Auth, Theme)
│   ├── pages/                # Page components
│   │   ├── admin/            # Admin dashboard pages
│   │   ├── auth/             # Login/Signup pages
│   │   ├── jobseeker/        # Job seeker pages
│   │   └── recruiter/        # Recruiter pages
│   ├── services/             # API services (axios)
│   ├── types/                # TypeScript type definitions
│   └── main.tsx              # React entry point
│
├── package.json              # Frontend dependencies
├── vite.config.ts            # Vite configuration
├── tailwind.config.js        # Tailwind CSS config
└── index.html                # HTML entry point
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Google OAuth login

### Jobs (Job Seeker)
- `GET /api/jobs` - List all jobs
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs/:id/apply` - Apply for job

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `POST /api/profile/upload-picture` - Upload profile picture

### Recruiter
- `POST /api/recruiter/post` - Create job posting
- `GET /api/recruiter/applications` - Get applications
- `PUT /api/recruiter/offers/:id` - Send offer

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/reports` - Get analytics
- `PUT /api/admin/users/:id/status` - Change user status

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Navigation
- **Axios** - HTTP client
- **Lucide React** - Icons

### Backend
- **Express.js** - Web framework
- **Node.js** - Runtime
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **PostgreSQL** - SQL database (optional)
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **OpenAI API** - Resume parsing & AI features

## 📝 Development Scripts

### Frontend
```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

### Backend
```bash
npm run dev        # Start with nodemon (hot-reload)
npm start          # Start production server
```

## 🔐 Environment Variables Guide

See [backend/.env.example](backend/.env.example) for all required environment variables.

**Critical variables:**
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `OPENAI_API_KEY` - OpenAI API key for resume parsing
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - For Google OAuth

## 🚀 Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Connect to Vercel
3. Deploy automatically

### Backend (Render / Railway / Heroku)
1. Set environment variables
2. Deploy from GitHub
3. Update API URL in frontend `.env`

## 📸 Screenshots

Screenshots are available in the `screenshots/` folder:
- `landing-page.png` - Landing page
- `login-signup.png` - Authentication pages
- `jobseeker-dashboard.png` - Job seeker dashboard
- `recruiter-dashboard.png` - Recruiter dashboard
- `admin-dashboard.png` - Admin dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ✉️ Contact

For questions or support, please reach out to:
- **Email**: support@jobgenius.com
- **GitHub Issues**: [Create an issue](https://github.com/yourusername/JobGenius-FYP/issues)

## 🎯 Future Enhancements

- [ ] Video interview integration
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Real-time chat messaging
- [ ] AI skill assessment
- [ ] Integration with LinkedIn
- [ ] Salary predictions
- [ ] Company reviews

---

**Last Updated**: April 2026
**Version**: 1.0.0
