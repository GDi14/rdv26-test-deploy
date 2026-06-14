# RDV26 Festival Website - Setup & Run Guide

## 📦 Prerequisites

### Required
- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org)
- **Python 3.9+** - Download from [python.org](https://www.python.org)
- **Git** - For version control
- **Supabase Account** - Free tier at [supabase.com](https://supabase.com)

### Verify Installation
```bash
node --version    # Should be v18+
npm --version     # Should be v9+
python --version  # Should be 3.9+
```

---

## 🗄️ Database Setup (Supabase)

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Wait for provisioning (2-3 minutes)
4. Note your **Project URL** and **Public Anon Key** (needed later)

### Step 2: Apply Database Schema
1. Go to **SQL Editor** in Supabase dashboard
2. Click **New Query**
3. Copy entire contents of `backend/schema.sql`
4. Paste into editor and click **Execute**

### Step 3: Enable Row-Level Security (CRITICAL!)
1. In **SQL Editor**, create new query
2. Copy entire contents of `backend/supabase_rls_fix.sql`
3. Paste and **Execute**
4. Verify in **Authentication** → **Policies** that policies are created

---

## 🛠️ Backend Setup (Python/FastAPI)

### Step 1: Create Environment File
Create `.env` file in `backend/` directory:

```bash
# backend/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_public_anon_key_here
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
LOG_LEVEL=INFO
```

**How to get values:**
- `SUPABASE_URL`: From Supabase dashboard → Settings → API
- `SUPABASE_KEY`: From same location (labeled "anon public")

### Step 2: Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 3: Verify Installation
```bash
# Test imports
python -c "import fastapi; print('✓ FastAPI installed')"
python -c "import pydantic; print('✓ Pydantic installed')"
python -c "import requests; print('✓ Requests installed')"
```

### Step 4: Start Backend Server

**Development Mode (with auto-reload):**
```bash
cd backend
uvicorn server:app --reload --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

**Access API:**
- Health check: http://localhost:8000/api/
- Events: http://localhost:8000/api/events
- Docs: http://localhost:8000/docs (Swagger UI)

### Step 5: Run Backend Tests
```bash
cd backend
pytest tests/backend_test.py -v
```

---

## 🎨 Frontend Setup (React/Vite)

### Step 1: Create Environment File
Create `.env` file in `frontend/` directory:

```bash
# frontend/.env
REACT_APP_BACKEND_URL=http://localhost:8000
```

### Step 2: Install Dependencies
```bash
cd frontend
npm install
```

**Time:** 3-5 minutes (first time)

### Step 3: Verify Installation
```bash
# Check React installed
npm list react

# Check critical packages
npm list framer-motion lucide-react react-router-dom
```

### Step 4: Start Development Server

```bash
cd frontend
npm start
```

**Expected Output:**
```
✓ React development server
✓ App compiled successfully
✓ Listening on http://localhost:3000
```

**Open in browser:**
- http://localhost:3000 (App loads)
- http://localhost:3000/events (Events page)
- http://localhost:3000/register (Registration page)
- http://localhost:3000/contact (Contact page)

### Step 5: Build for Production
```bash
cd frontend
npm run build
```

**Output:** Optimized build in `frontend/build/` directory

---

## 🧪 Running Tests

### Frontend Tests
```bash
cd frontend
npm test
```

### Backend Tests
```bash
cd backend
pytest tests/backend_test.py -v

# Run specific test
pytest tests/backend_test.py::test_get_events -v

# Run with coverage
pytest tests/backend_test.py --cov=server --cov-report=html
```

---

## 📝 Running Both Simultaneously

### Terminal 1: Backend
```bash
cd backend
uvicorn server:app --reload --port 8000
```

### Terminal 2: Frontend
```bash
cd frontend
npm start
```

### Terminal 3: Watch for Issues
```bash
# Keep a terminal open to check logs
tail -f backend.log  # If you add logging
```

**You should now have:**
- ✅ Backend running on http://localhost:8000
- ✅ Frontend running on http://localhost:3000
- ✅ Database connected via Supabase
- ✅ Registration and contact forms working

---

## 🐛 Troubleshooting

### "Cannot find module" Error (Frontend)
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### "ModuleNotFoundError" (Backend)
```bash
# Reinstall Python packages
pip install --force-reinstall -r requirements.txt
```

### "Connection refused" to Backend
- Verify backend is running on port 8000
- Check `REACT_APP_BACKEND_URL` in frontend `.env`
- Ensure CORS_ORIGINS includes your frontend URL

### "Supabase connection failed"
- Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
- Test connection: 
  ```python
  import requests
  response = requests.get(f"{SUPABASE_URL}/rest/v1/registrations", 
                          headers={"Authorization": f"Bearer {SUPABASE_KEY}"})
  print(response.status_code)  # Should be 200
  ```

### Port Already in Use
```bash
# Change backend port
uvicorn server:app --port 8001

# Change frontend port
PORT=3001 npm start
```

---

## 📦 Production Deployment

### Environment Variables (Production)

**Frontend (.env.production):**
```
REACT_APP_BACKEND_URL=https://api.your-domain.com
```

**Backend (.env.production):**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_public_anon_key
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
LOG_LEVEL=WARNING
```

### Build for Production

**Frontend:**
```bash
cd frontend
npm run build
# Output in frontend/build/ - ready to deploy to Vercel, Netlify, etc.
```

**Backend:**
```bash
# Option 1: Deploy to Heroku, Railway, Render
# Option 2: Docker container
# Option 3: Traditional VPS with gunicorn

# Using gunicorn (production ASGI server)
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker server:app
```

---

## 📊 Project Structure

```
rdv26-main/
├── backend/                    # Python FastAPI backend
│   ├── server.py              # Main application
│   ├── schema.sql             # Database schema
│   ├── supabase_rls_fix.sql   # Security policies
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Environment variables
│   └── tests/                 # Test suite
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── App.js             # Main component
│   │   ├── index.js           # Entry point
│   │   ├── config.js          # API configuration ⭐ NEW
│   │   ├── components/
│   │   │   ├── rdv/           # Main page components
│   │   │   └── ui/            # Reusable UI components
│   │   └── pages/             # Page components
│   ├── public/                # Static files
│   ├── package.json           # NPM dependencies
│   ├── .env                   # Environment variables
│   └── craco.config.js        # Build configuration
│
├── data/                       # Static data files
├── scripts/                    # Utility scripts
├── CLEANUP_REPORT.md          # Recent cleanups ⭐ NEW
└── README.md                   # Project overview
```

---

## ✅ Verification Checklist

- [ ] Node.js and Python installed
- [ ] Backend `.env` file created with Supabase credentials
- [ ] Frontend `.env` file created
- [ ] Database schema applied in Supabase
- [ ] RLS policies applied
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Backend tests passing (`pytest`)
- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:3000
- [ ] Can register a student
- [ ] Can submit contact form
- [ ] No errors in browser console or terminal

---

## 📞 Support & Debugging

### Check Backend Health
```bash
curl http://localhost:8000/api/
```

### View API Documentation
- Open http://localhost:8000/docs in browser
- Interactive Swagger UI to test endpoints

### Check Frontend Build
```bash
npm run build && npm start
```

### Environment Variable Check
```bash
# Backend
python -c "import os; print('SUPABASE_URL:', os.getenv('SUPABASE_URL'))"

# Frontend
echo $REACT_APP_BACKEND_URL
```

---

**Last Updated:** 2026-06-13  
**Status:** Ready to deploy after cleanup completion
