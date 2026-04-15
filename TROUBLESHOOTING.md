# Troubleshooting Guide

## Common Issues & Solutions

### 🔴 "Cannot connect to MongoDB"

**Problem:**
```
MongooseError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions:**

1. **Check if MongoDB is running:**
   ```bash
   # Windows
   mongod
   
   # Mac
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

2. **Update MONGO_URI in backend/.env:**
   ```
   # Local MongoDB
   MONGO_URI=mongodb://localhost:27017/jobgenius
   
   # MongoDB Atlas (cloud)
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/jobgenius?retryWrites=true&w=majority
   ```

3. **Verify connection:**
   ```bash
   mongosh "mongodb://localhost:27017"
   # or
   mongosh "mongodb+srv://username:password@cluster.mongodb.net/jobgenius"
   ```

---

### 🔴 Login Not Working

**Problem:**
- "Invalid credentials" error
- Login page stuck on loading
- Redirect to signup instead of dashboard

**Solutions:**

1. **Verify test users exist:**
   ```bash
   cd backend
   npm run seed
   ```

2. **Check backend is running:**
   ```
   http://localhost:5000 (should respond)
   ```

3. **Check API call in browser DevTools:**
   - Open DevTools (F12) → Network tab
   - Try login
   - Look for POST to `/api/auth/login`
   - Check Response tab for error message

4. **Clear browser storage:**
   ```javascript
   // In DevTools Console
   localStorage.clear()
   sessionStorage.clear()
   // Then refresh page
   ```

5. **Check backend logs for errors:**
   - Look at Terminal 1 where backend is running
   - Look for "login error" messages
   - Check if MongoDB is connected (should say "✅ MongoDB Connected")

---

### 🔴 "White Screen After Logout"

**Problem:**
- Page appears blank after clicking logout
- No error in console

**Solution:**
- This is normal behavior - auto-redirect to landing page
- Refresh page if needed
- Check browser console for actual errors (F12)

---

### 🔴 "Page Not Found" - 404 Error

**Problem:**
```
http://localhost:5173/ returns 404
```

**Solutions:**

1. **Verify index.html exists:**
   ```bash
   ls -la c:\Projects\JobGenius-FYP\index.html
   ```

2. **Check Vite is running:**
   - Terminal should show: "VITE v5.4.8 ready"
   - If not, restart: `npm run dev`

3. **Clear Vite cache:**
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

---

### 🔴 "OpenAI API Error"

**Problem:**
```
OpenAIError: Missing credentials. Please pass an `apiKey`
```

**Solutions:**

1. **Add real OpenAI key to backend/.env:**
   ```
   OPENAI_API_KEY=sk-your-actual-key-from-openai-dashboard
   ```

2. **Get API key from:**
   - Go to https://platform.openai.com/
   - Create account or login
   - Click API Keys
   - Create new secret key
   - Copy and paste into .env

3. **Restart backend after .env change:**
   ```bash
   cd backend
   npm run dev
   ```

---

### 🔴 "Port Already in Use"

**Problem:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solutions:**

1. **Kill process on port 5000:**
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   
   # Mac/Linux
   lsof -ti:5000 | xargs kill -9
   ```

2. **Change port in backend/.env:**
   ```
   PORT=5001
   ```
   Then update frontend API calls

---

### 🔴 "Dependencies Missing"

**Problem:**
```
Cannot find module 'react'
```

**Solutions:**

1. **Install dependencies:**
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

2. **Clean install:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Update npm:**
   ```bash
   npm install -g npm@latest
   ```

---

### 🔴 TypeScript/ESLint Errors

**Problem:**
```
Type 'X' is not assignable to type 'Y'
```

**Solutions:**

1. **Check types are imported:**
   ```typescript
   // Good
   import { User } from '../types';
   
   // Bad
   import User from '../types';
   ```

2. **Fix ESLint issues:**
   ```bash
   npm run lint
   # For auto-fix:
   npm run lint -- --fix
   ```

3. **Clear TypeScript cache:**
   ```bash
   # VSCode: Ctrl+Shift+P → "TypeScript: Restart TS Server"
   # Or reload window: Ctrl+Shift+P → "Reload Window"
   ```

---

### 🔴 "CORS Error"

**Problem:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solutions:**

1. **Verify CORS is enabled in backend (server.js):**
   ```javascript
   app.use(cors()); // Should be present
   ```

2. **Check API URL is correct in frontend:**
   - Should be `http://localhost:5000`
   - Not `localhost:5000` or with trailing slash

3. **Check both servers are running:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

---

### 🔴 "Database Query Error"

**Problem:**
```
Error: SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string
```

**Solution:**
- This is PostgreSQL connection error (optional feature)
- Don't worry - MongoDB handles main operations
- To fix: provide valid PostgreSQL credentials in .env

---

### 🔴 "Images Not Loading"

**Problem:**
- Profile pictures show broken image
- Logo doesn't display

**Solutions:**

1. **Check backend is serving uploads:**
   - Backend should have: `app.use(express.static('uploads'))`
   - Check backend logs for errors

2. **Verify image path:**
   ```javascript
   // In browser DevTools Network tab
   // Check if image URL returns 404
   ```

3. **Check uploads folder:**
   ```bash
   ls -la backend/uploads/profile-pictures/
   ```

---

### 🔴 "Session/Token Not Persisting"

**Problem:**
- Logged in user disappears after page refresh
- localStorage shows empty

**Solutions:**

1. **Check localStorage is working:**
   ```javascript
   // In DevTools Console
   localStorage.setItem('test', 'value');
   console.log(localStorage.getItem('test'));
   ```

2. **Check auth context loads user:**
   - Look for "✅ Loading user from localStorage" in console
   - Or add console.log in AuthContext.tsx

3. **Clear and re-login:**
   ```javascript
   // DevTools Console
   localStorage.clear()
   // Then login again
   ```

---

### 🟡 Performance Issues

**Problem:**
- App is slow
- Long loading times

**Solutions:**

1. **Check Network tab (DevTools):**
   - Look for slow API calls
   - Check bundle size

2. **Optimize images:**
   ```bash
   # Use ImageOptim or similar
   ```

3. **Check MongoDB performance:**
   - Add indexes to frequently queried fields
   - Review slow queries

---

## 📝 Debugging Tips

### 1. Browser DevTools
```javascript
// Console
console.log('Debug:', variable);

// Network tab
// Check API responses and status codes

// Application tab
// View localStorage and cookies
```

### 2. VS Code Debugging
```javascript
// Add debugger statement
debugger;

// Or use breakpoints (click line number)
```

### 3. Backend Logs
```bash
# Add console.log to backend routes
console.error('Error:', error);
console.log('Request received:', req.body);
```

### 4. MongoDB Debugging
```javascript
// Use MongoDB Compass GUI
// Or command line:
mongosh
db.users.find()
db.users.find({ email: 'test@example.com' })
```

---

## 🆘 Still Need Help?

1. **Check backend logs** - Most issues are there
2. **Check browser DevTools** (F12) - Console tab
3. **Verify all servers are running** - Check both Terminal windows
4. **Try clearing cache:**
   ```bash
   npm run dev  # Fresh start
   ```
5. **Create a GitHub Issue** with:
   - Error message (screenshot)
   - Steps to reproduce
   - Backend/Frontend logs
   - Environment (OS, Node version, etc)

---

**Remember:** 90% of issues are solved by restarting servers and clearing cache! 🔄
