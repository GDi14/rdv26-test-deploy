# GoDaddy Linux Hosting & Backend Security Guide

This document outlines the deployment process for hosting your React (Frontend) + FastAPI (Backend) + Supabase (Database) stack on a GoDaddy Linux environment and provides a detailed security review of the system.

---

## 🚀 Part 1: GoDaddy Linux Hosting Options

Depending on your GoDaddy plan, you will deploy to either **Shared Linux Hosting (cPanel)** or a **Linux VPS (Virtual Private Server)**.

### Option A: GoDaddy Shared Linux Hosting (cPanel)

Shared hosting is designed for PHP and doesn't allow long-running background processes (like raw `uvicorn`). To host FastAPI, we use cPanel's **Setup Python App** utility, which runs via Apache and Phusion Passenger (WSGI).

#### Step 1: Prepare the React Frontend
1. In your local development directory, open `frontend/.env.production` (or create one) and set:
   ```env
   REACT_APP_BACKEND_URL=https://yourdomain.com
   ```
2. Build the static assets:
   ```bash
   cd frontend
   npm run build
   ```
3. Upload all files inside the `frontend/build` folder to the `public_html` directory of your GoDaddy cPanel using **File Manager** or **FTP**.

#### Step 2: Configure the FastAPI Backend
Since cPanel uses **WSGI** (Passenger) and FastAPI is **ASGI**, you need an ASGI-to-WSGI bridge.
1. Add `a2wsgi` to your `backend/requirements.txt`:
   ```txt
   a2wsgi>=1.10.0
   ```
2. Create a file named `passenger_wsgi.py` in the root of your `backend/` directory:
   ```python
   # backend/passenger_wsgi.py
   import sys
   import os

   # Add application directory to python path
   sys.path.insert(0, os.path.dirname(__file__))

   # Import the ASGI-to-WSGI bridge
   from a2wsgi import ASGIMiddleware
   from server import app

   # Passenger looks for the variable 'application'
   application = ASGIMiddleware(app)
   ```

#### Step 3: Set Up Python App in cPanel
1. Log in to cPanel and search for **Setup Python App**.
2. Click **Create Application**.
3. Configure the fields:
   - **Python Version**: Select **3.9+** (preferably matches your development version).
   - **Application Root**: Type the folder name where your backend code is uploaded (e.g., `backend_app`).
   - **Application URL**: Select your domain and assign a route (e.g., `api` or a subdomain `api.yourdomain.com`).
   - **Application startup file**: Type `passenger_wsgi.py`.
   - **Application Entry point**: Leave blank or type `application`.
4. Click **Create**.
5. Upload your backend folder contents (excluding `venv` or `.pytest_cache`) to the root directory you specified (e.g., `backend_app`).
6. In cPanel Python App Manager, add your **Environment Variables** (from `.env`):
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CORS_ORIGINS` (e.g., `https://yourdomain.com`)
7. Run pip install: copy the virtual environment command shown at the top of the Setup Python App page, enter terminal via SSH, run it, and install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
8. Click **Restart** on the Python App dashboard. Your API is now live at `https://yourdomain.com/api` (or whichever URL was selected).

---

### Option B: GoDaddy Linux VPS (Virtual Private Server) - *Recommended*

A VPS gives you full SSH root access and is the industry-standard way to host modern apps using **Nginx** and **systemd**.

#### Step 1: System Provisioning
Log in via SSH to your VPS:
```bash
ssh root@your_vps_ip
sudo apt update && sudo apt upgrade -y
sudo apt install python3-pip python3-venv git nginx -y
```

#### Step 2: Deploy Backend
1. Clone your project code:
   ```bash
   git clone <your-repo-url> /var/www/rdv26
   cd /var/www/rdv26/backend
   ```
2. Create virtual environment and install packages:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt gunicorn
   ```
3. Set up the production `.env` file:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your_public_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   PORT=8000
   ```

#### Step 3: Run Backend with Systemd
Create a system service file to keep FastAPI running in the background and auto-restart on crashes or reboots:
```bash
sudo nano /etc/systemd/system/fastapi.service
```
Paste this configuration:
```ini
[Unit]
Description=FastAPI Daemon for RDV26
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/rdv26/backend
ExecStart=/var/www/rdv26/backend/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker -b 127.0.0.1:8000 server:app
Restart=always

[Install]
WantedBy=multi-user.target
```
Start and enable the daemon:
```bash
sudo systemctl daemon-reload
sudo systemctl start fastapi
sudo systemctl enable fastapi
```

#### Step 4: Deploy Frontend & Configure Nginx
1. Run `npm run build` on the frontend, then copy the folder contents to the VPS at `/var/www/html/frontend`.
2. Configure Nginx to serve the static frontend files and reverse proxy `/api` requests to Uvicorn:
```bash
sudo nano /etc/nginx/sites-available/rdv26
```
Paste this configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Static React Frontend
    location / {
        root /var/www/html/frontend;
        try_files $uri /index.html;
    }

    # API Proxy to FastAPI
    location /api {
        proxy_pass http://127.0.0.1:8000/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Activate the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/rdv26 /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```
3. Set up Let's Encrypt SSL:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

---

## 🔒 Part 2: Backend Security & Data Retrieval Audit

Here is a review of the current security setup and recommendations for production:

### 1. Supabase Row Level Security (RLS)
- **Current Status**: Excellent. You have active RLS policies in `supabase_rls_fix_corrected.sql`.
- **Policy Check**:
  - `INSERT`: Anyone can insert registrations/messages (anonymous). This is necessary for a public signup page.
  - `UPDATE` & `DELETE`: Denied for the public, which prevents unauthorized modifications or database wipes.
  - `SELECT`: `Allow public read registrations` currently uses `USING (true)`.
- **Warning**: Having `SELECT` set to `USING (true)` on the registrations table means **anyone can query the Supabase REST endpoint directly and download the entire registrations database** (including full names, phone numbers, and emails).
- **Hardening Action**:
  - Restrict the `SELECT` policy on the registrations table.
  - If users do not need to query registrations directly from the client, set the `SELECT` policy to false (`USING (false)`) or restrict it to authenticated administrators. If the backend needs to read it, use the service role client or set up basic authentication tokens.

### 2. Environment Variables & Credentials
- **Current Status**: All keys are loaded from a `.env` file which is correctly ignored by git.
- **Service Role Key**: The `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS policies. It is used in `server.py` to allow deletion and status check writes.
- **Warning**: Ensure the `SUPABASE_SERVICE_ROLE_KEY` is **never** sent or exposed to the frontend in any configuration file or API response. Keep it strictly inside the backend environment.

### 3. API Input Validation
- **Current Status**: Active. FastAPI leverages Pydantic schemas (e.g. `RegistrationCreate` and `ContactCreate`) which enforce structure, type constraints, and email validation (`EmailStr`).
- **Checklist**:
  - Boundaries: Strings are bounded (`max_length=100`, `max_length=2000`).
  - Numbers: `team_size` is constrained (`ge=1, le=20`).
  - Sanitization: FastAPI automatically handles type-casting, eliminating SQL injection vulnerability for inputs processed via the standard ORM/REST wrapper.

### 4. Recommended Security Hardening Steps
1. **API Rate Limiting**: Since registration is open to the public, bots can spam endpoints. Implement rate limiting using `slowapi` in your FastAPI app:
   ```python
   # Example implementation
   from slowapi import Limiter, _rate_limit_exceeded_handler
   from slowapi.util import get_remote_address
   from slowapi.errors import RateLimitExceeded

   limiter = Limiter(key_func=get_remote_address)
   app.state.limiter = limiter
   app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

   @api_router.post("/registrations")
   @limiter.limit("5/minute")
   def create_registration(...):
       ...
   ```
2. **CORS Configuration**: In production, avoid `allow_origins=["*"]`. Ensure `CORS_ORIGINS` is configured in `.env` to restrict requests to your frontend domain only.
3. **Database RLS refinement**: Set registrations SELECT policy to deny anonymous select. Ensure reading of registrations list is authenticated (e.g. password protected or admin-only).

---

## ☁️ Part 3: Alternative Hosting Solutions (Without GoDaddy)

If you want a more modern, automated, git-push-to-deploy workflow without using GoDaddy, you can host the application using dedicated developer cloud services. This setup splits the frontend and backend, resulting in higher performance and zero server management overhead.

### 1. Frontend Hosting: Vercel or Netlify (Free/Low-Cost)
These platforms are designed specifically for static frontend applications like React. They offer global CDNs, automatic SSL, and deploy automatically whenever you push code to GitHub.

#### How to Deploy:
1. Push your codebase to a Git repository (GitHub, GitLab, or Bitbucket).
2. Create an account on **[Vercel](https://vercel.com)** or **[Netlify](https://netlify.com)**.
3. Click **Add New Project** and import your Git repository.
4. Configure the Build settings:
   - **Framework Preset**: Create React App (or Vite if configured).
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build` (or `dist` for Vite).
5. In **Environment Variables**, add:
   - Key: `REACT_APP_BACKEND_URL`
   - Value: `https://your-backend-service.onrender.com` (your backend URL).
6. Click **Deploy**. Your frontend is now live with an automatic SSL certificate.

---

### 2. Backend Hosting: Render or Railway (Free/Low-Cost)
These services run your FastAPI web application in isolated containers. They listen to your Git repository, build the python environment, and serve it via Uvicorn.

#### Deploying on Render (render.com):
1. Create a Render account and connect your GitHub.
2. Click **New +** and select **Web Service**.
3. Select your Git repository.
4. Configure the service:
   - **Name**: `rdv26-backend`
   - **Runtime**: `Python`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python -m uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Under **Advanced**, add your environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CORS_ORIGINS` (e.g. `https://your-frontend-site.vercel.app`)
6. Click **Create Web Service**. It will build and provision an HTTPS endpoint (e.g., `https://rdv26-backend.onrender.com`).

#### Deploying on Railway (railway.app):
1. Create a Railway account.
2. Click **New Project** → **Deploy from GitHub repo** and select your repository.
3. In the Railway dashboard, select the deployed service, go to **Settings** → **Root Directory** and set it to `/backend`.
4. Under **Variables**, click **New Variable** or **Raw Config** to paste your `.env` values.
5. Railway automatically detects FastAPI and starts the server. It will assign an public domain name under the **Settings** tab.
