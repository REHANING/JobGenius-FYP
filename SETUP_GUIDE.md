# Quick Start Guide for JobGenius

## 5-Minute Setup

### Prerequisites
- Node.js v18+
- MongoDB running locally or MongoDB Atlas URI

### Step 1: Install & Configure (2 minutes)

```bash
# Clone and install frontend
npm install

# Install backend dependencies
cd backend
npm install

# Create .env from template
cp .env.example .env
# Edit .env with your MongoDB URI
```

### Step 2: Start Servers (1 minute)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Runs on http://localhost:5173
```

### Step 3: Test Login (2 minutes)

Go to http://localhost:5173/login and use:

**Job Seeker:**
```
Email: jobseeker@example.com
Password: password123
```

**Recruiter:**
```
Email: recruiter@example.com
Password: password123
```

**Admin:**
```
Email: admin@gmail.com
Password: 123456
```

## ⚠️ Troubleshooting

### "Cannot connect to MongoDB"
- Ensure MongoDB is running: `mongod`
- Check `MONGO_URI` in backend/.env
- For Atlas: use connection string from MongoDB dashboard

### "Login not working"
- Check backend console for errors
- Verify API is running on port 5000
- Clear browser cache and localStorage

### "White screen on logout"
- This is normal, auto-redirect to landing page
- Refresh if needed

### "OpenAI API errors"
- Replace `OPENAI_API_KEY` in .env with your actual key
- Or leave placeholder for now (features requiring AI will show error)

## 📚 Useful Commands

```bash
# Backend
npm run dev          # Development with hot-reload
npm start            # Production mode

# Frontend
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Check code
npm run preview      # Test production build
```

## 🔑 Environment Setup

Copy the important variables:

```env
# CRITICAL - Must set these
MONGO_URI=mongodb://localhost:27017/jobgenius
JWT_SECRET=your-secret-key

# OPTIONAL - Nice to have
OPENAI_API_KEY=sk-your-key
GOOGLE_CLIENT_ID=your-google-id
```

## 📝 Default Test Users

| Role | Email | Password |
|------|-------|----------|
| Job Seeker | jobseeker@example.com | password123 |
| Recruiter | recruiter@example.com | password123 |
| Admin | admin@gmail.com | 123456 |

**Note:** Create new accounts with signup page to test user registration

## 🚀 Ready to Deploy?

1. ✅ All servers running locally without errors
2. ✅ Login working for all roles  
3. ✅ Environment variables set
4. ✅ Database connected
5. ✅ Push to GitHub

Then deploy frontend to **Vercel** and backend to **Render** or **Railway**

## 📞 Need Help?

Check the main [README.md](README.md) for:
- Full API documentation
- Project structure details
- Technology stack info
- Contributing guidelines

---

**Pro Tip:** Use VS Code extensions:
- ES7+ React/Redux/React-Native snippets
- MongoDB for MongoDB Explorer
- REST Client for testing APIs
