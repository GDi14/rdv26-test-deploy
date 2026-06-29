# Hostinger VPS (KVM 2) Deployment Guide - RDV26 Festival Website

This guide walks you through the end-to-end setup and deployment of your React frontend and Python FastAPI backend on a single **Hostinger KVM 2 VPS** running **Ubuntu 24.04 LTS**.

---

## 🗺️ Architecture Overview
*   **GoDaddy Domain** points to the **Hostinger VPS IP**.
*   **Nginx** runs on the VPS, handles SSL/HTTPS certificates, and acts as the gatekeeper:
    *   Requests to `/api/*` are reverse-proxied to the FastAPI server running locally on port `8000`.
    *   All other requests serve the compiled static React frontend files directly from `/var/www/html`.
*   **systemd** runs the FastAPI backend as a persistent background service.
*   **Supabase** hosts your database (external cloud).

---

## ⏱️ Phase 1: Hostinger VPS Selection & OS Setup
1.  Log in to **Hostinger** and purchase a **KVM 2** VPS plan.
2.  In the setup wizard:
    *   **OS:** Select **Ubuntu 24.04 LTS** (or Ubuntu 22.04 LTS).
    *   **Data Center Location:** Select the region closest to your primary user base (e.g., India or Asia/Pacific).
    *   **Root Password:** Set a secure password and save it safely.
3.  Once setup completes, note your **VPS IPv4 Address** (e.g., `185.124.32.11`).

---

## 🌐 Phase 2: Point GoDaddy Domain to VPS
1.  Log in to your **GoDaddy Domain Control Center**.
2.  Select your domain and click **Manage DNS**.
3.  Find the **A Record** (Name: `@`) and update its **Value/IP Address** to your **Hostinger VPS IP**.
4.  Ensure there is a **CNAME** (Name: `www`) pointing to `@`.
5.  Wait for DNS changes to propagate (usually 10–30 minutes).

---

## 🔑 Phase 3: Server Initialization & Dependency Installation
Connect to your VPS via SSH (using Terminal, PowerShell, or Git Bash):
```bash
ssh root@YOUR_VPS_IP
```
*(Enter the root password you created during Hostinger setup.)*

Run the following commands to update the system and install the required tools:
```bash
# 1. Update package lists and upgrade system
sudo apt update && sudo apt upgrade -y

# 2. Install Git, Python3, pip, and virtual environment utilities
sudo apt install git python3 python3-pip python3-venv nginx -y

# 3. Install Node.js & npm (needed if you want to build frontend on server)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# Verify installations
git --version
python3 --version
node -v
nginx -v
```

---

## ⚙️ Phase 4: Backend Setup & Daemon Configuration
1.  **Clone the Repository:**
    ```bash
    cd /var/www
    git clone https://github.com/YOUR_USERNAME/rdv26-main.git
    cd rdv26-main/backend
    ```

2.  **Create a Python Virtual Environment & Install dependencies:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    pip install uvicorn gunicorn  # Install production servers
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file inside `/var/www/rdv26-main/backend/`:
    ```bash
    nano .env
    ```
    Paste your credentials:
    ```env
    SUPABASE_URL=https://your-project.supabase.co
    SUPABASE_KEY=your_public_anon_key_here
    CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://yourdomain.com,https://www.yourdomain.com
    LOG_LEVEL=INFO
    ```
    *(Press `Ctrl + O` to save, `Enter`, then `Ctrl + X` to exit.)*

4.  **Create a systemd Service to keep FastAPI running in the background:**
    ```bash
    sudo nano /etc/systemd/system/fastapi.service
    ```
    Paste the following service configuration:
    ```ini
    [Unit]
    Description=FastAPI Application
    After=network.target

    [Service]
    User=root
    WorkingDirectory=/var/www/rdv26-main/backend
    Environment="PATH=/var/www/rdv26-main/backend/venv/bin"
    ExecStart=/var/www/rdv26-main/backend/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker server:app --bind 127.0.0.1:8000

    [Install]
    WantedBy=multi-user.target
    ```
    *(Note: `-w 4` starts 4 parallel workers, utilizing your KVM 2 CPU cores optimally).*

5.  **Start and Enable the Service:**
    ```bash
    sudo systemctl daemon-reload
    sudo systemctl start fastapi
    sudo systemctl enable fastapi

    # Check that it started successfully:
    sudo systemctl status fastapi
    ```

---

## 🎨 Phase 5: Frontend Build & Nginx Setup

To avoid CORS and absolute URL mismatches, the React frontend should query `/api` relatively.

1.  **Build React App locally (Option A - Recommended):**
    Open a terminal on your own PC, navigate to the `frontend/` folder, and run:
    ```bash
    # Set backend URL to empty string so React queries relative to domain root
    $env:REACT_APP_BACKEND_URL=""
    npm run build
    ```
    *   This creates a `frontend/build/` directory on your PC.
    *   Upload the contents of this folder to `/var/www/html` on your VPS using SCP or an SFTP tool like FileZilla:
    ```bash
    scp -r build/* root@YOUR_VPS_IP:/var/www/html/
    ```

2.  **Build React App on the VPS (Option B):**
    If you'd rather build it directly on the server:
    ```bash
    cd /var/www/rdv26-main/frontend
    REACT_APP_BACKEND_URL="" npm run build
    sudo cp -r build/* /var/www/html/
    ```

3.  **Configure Nginx to Route Traffic:**
    Open the Nginx configuration file:
    ```bash
    sudo nano /etc/nginx/sites-available/default
    ```
    Replace the entire contents with this configuration:
    ```nginx
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com; # Replace with your GoDaddy domain

        # Frontend: Serve React static files
        location / {
            root /var/www/html;
            index index.html index.htm;
            try_files $uri $uri/ /index.html;
        }

        # Backend: Reverse proxy API requests to FastAPI
        location /api/ {
            proxy_pass http://127.0.0.1:8000/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    ```
    *(Press `Ctrl + O` to save, `Enter`, then `Ctrl + X` to exit.)*

4.  **Test Nginx configuration and restart:**
    ```bash
    sudo nginx -t
    sudo systemctl restart nginx
    ```

---

## 🔒 Phase 6: Enable Free SSL/HTTPS (Let's Encrypt)
A secure site is critical for user trust. Use Certbot to generate and auto-renew free SSL certificates:
```bash
# 1. Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# 2. Generate and configure SSL for your GoDaddy domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
*   Select option **2** (Redirect all HTTP requests to HTTPS) when prompted.
*   Certbot will automatically modify your Nginx file and handle renewal in the background.

---

## 🚀 Verification checklist
- [ ] Domain points to Hostinger VPS IP.
- [ ] Visiting `https://yourdomain.com` loads the React interface.
- [ ] Navigating between pages is fast and error-free.
- [ ] Submitting a form sends requests to `https://yourdomain.com/api/...` and successfully updates Supabase.
- [ ] SSL padlock icon is visible in the browser address bar.
