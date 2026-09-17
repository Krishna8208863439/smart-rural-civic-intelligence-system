# Complete PythonAnywhere Deployment & Configuration Guide
### Smart Rural Civic Intelligence System (SRCI) | GramSetu AI

This guide provides the complete, end-to-end process to run and deploy the entire SRCI system (including **Admin Portal**, **Citizen Reporting**, **Worker Creation**, **Worker Login**, **Worker Dashboard**, **Task Lifecycle**, and **First-Login Password Updates**) on **PythonAnywhere**.

---

## 1. How the Architecture Works on PythonAnywhere

On PythonAnywhere, you do **not** need Node.js running concurrently. The Python backend (`python_backend/app.py` or `pythonanywhere_app.py`) is a unified, production-ready WSGI application that:
1. **Serves all REST API endpoints** under `/api/*` (Authentication, Workers, Tasks, Issues, History, Evidence, Analytics).
2. **Serves the compiled React 18 SPA frontend** directly from `python_backend/dist/` (or `frontend/dist/`), handling client-side routing (`/worker`, `/admin/workers`, `/login`, `/report`, etc.) without 404 errors.
3. **Serves static assets and uploads** (`/assets/*`, `/uploads/*`, icons, images, favicons).
4. **Handles persistence automatically** using the embedded file-backed database `python_backend/data_store.json` (with initial seed data from `seed_data.json`), avoiding external MongoDB connection timeouts on free PythonAnywhere accounts.

---

## 2. Step-by-Step Setup on PythonAnywhere

### Step 2.1 — Open a Bash Console on PythonAnywhere
1. Log in to your [PythonAnywhere Dashboard](https://www.pythonanywhere.com/).
2. Go to the **Consoles** tab and start a new **Bash** console.

### Step 2.2 — Clone or Pull Your Repository
In the Bash console, navigate to your home directory and clone/pull the repository:
```bash
cd ~
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git "Smart Rural Civic Intelligence System"
cd "Smart Rural Civic Intelligence System"
```
*(If the folder is already present, just run `git pull` to fetch all the latest fixes and files).*

---

### Step 2.3 — Create a Virtual Environment & Install Dependencies
Run the following commands in the PythonAnywhere Bash console:
```bash
# Create a virtual environment using Python 3.10 (or 3.11)
mkvirtualenv --python=/usr/bin/python3.10 srci-env

# Verify you are in the project directory
cd ~/Smart\ Rural\ Civic\ Intelligence\ System

# Install all required Python packages
pip install -r requirements.txt
```

The packages installed are:
- `Flask>=2.3.0,<3.1.0`
- `bcrypt>=4.0.0`
- `pymongo>=4.6.0`
- `requests>=2.31.0`
- `gunicorn>=21.2.0`

---

### Step 2.4 — Configure the Web App in PythonAnywhere Web Tab

1. Go to the **Web** tab in your PythonAnywhere dashboard.
2. If you haven't created a web app yet:
   - Click **Add a new web app**.
   - Select **Manual configuration** (do NOT choose default Django/Flask template, choose **Manual configuration**).
   - Select **Python 3.10** (matching your virtual environment).
3. Under the **Code** section of the Web tab:
   - **Source code**: `/home/YOUR_USERNAME/Smart Rural Civic Intelligence System`
   - **Working directory**: `/home/YOUR_USERNAME/Smart Rural Civic Intelligence System`
4. Under the **Virtualenv** section:
   - Enter: `/home/YOUR_USERNAME/.virtualenvs/srci-env` (click the blue checkmark to save).
5. Under the **Static Files** section (Optional, enhances asset loading speed):
   - **URL**: `/assets/` ➔ **Directory**: `/home/YOUR_USERNAME/Smart Rural Civic Intelligence System/python_backend/dist/assets`
   - **URL**: `/uploads/` ➔ **Directory**: `/home/YOUR_USERNAME/Smart Rural Civic Intelligence System/python_backend/uploads`
6. Under the **Security** section:
   - Turn **Force HTTPS** to **ON** (Crucial: Modern mobile & desktop browsers block HTML5 GPS Geolocation on non-HTTPS origins).

---

### Step 2.5 — Configure the WSGI File

1. In the **Web** tab, click the link next to **Configuration file**:
   `/var/www/YOUR_USERNAME_pythonanywhere_com_wsgi.py`
2. **Delete all existing code** in that file.
3. Paste the following configuration (already provided in `pythonanywhere_wsgi_config.py`):

```python
import sys
import os

# Set your PythonAnywhere username
PYTHONANYWHERE_USERNAME = 'YOUR_USERNAME' # <-- REPLACE WITH YOUR PYTHONANYWHERE USERNAME

project_dir = f'/home/{PYTHONANYWHERE_USERNAME}/Smart Rural Civic Intelligence System'
python_backend_dir = os.path.join(project_dir, 'python_backend')

# Add to system path
if python_backend_dir not in sys.path:
    sys.path.insert(0, python_backend_dir)
if project_dir not in sys.path:
    sys.path.insert(0, project_dir)

# Import production Flask application
from app import app as application

# Environment flags
os.environ['FLASK_ENV'] = 'production'
os.environ['JWT_SECRET'] = 'srci_jwt_secret_production_ready_rural_intelligence_2025'
```
4. Click the green **Save** button in the top right.

---

### Step 2.6 — Reload the Web App

1. Go back to the **Web** tab.
2. Click the large green button: **Reload YOUR_USERNAME.pythonanywhere.com**.
3. Your site is now live at `https://YOUR_USERNAME.pythonanywhere.com`!

---

## 3. Verifying the Entire Process on PythonAnywhere

### 3.1 Run Automated Validation in PythonAnywhere Bash Console
You can run the end-to-end verification script directly in your PythonAnywhere bash terminal:
```bash
workon srci-env
cd ~/Smart\ Rural\ Civic\ Intelligence\ System
python test_pythonanywhere_e2e.py
```

This verifies in under 5 seconds:
- Flask server health (`/api/health`)
- Live Indian Standard Time (`/api/time`)
- React SPA serving (`/`, `/worker`, `/admin/workers`)
- Admin Login (`krishna@gmail.com` / `Sgi@5555`)
- Admin creating a new Field Worker (`POST /api/workers`)
- Worker logging in with temporary password (`mustChangePassword: True`)
- Worker fetching dashboard (`GET /api/worker/dashboard`) with 0 tasks
- Worker updating temporary password (`PUT /api/auth/change-password`)
- Worker re-logging in with new permanent password
- Lead Worker KD (`GRAM-WKR-001`) task lifecycle retrieval

---

### 3.2 Visual In-Browser Testing on `YOUR_USERNAME.pythonanywhere.com`

1. **Admin Portal**:
   - Navigate to `https://YOUR_USERNAME.pythonanywhere.com/login`.
   - Sign in with:
     - **Email**: `krishna@gmail.com`
     - **Password**: `Sgi@5555`
   - Navigate to **Workers Management** (`/admin/workers`).
   - Click **+ Add Worker**.
   - Enter Full Name (e.g. `Santosh More`), Mobile (`9823054321`), Email (`santosh.more@gramsetu.in`), select Assigned Area and Role.
   - Click **Create Worker**. Copy the generated **Worker ID** and **Temporary Password**.
   - Click **Logout**.

2. **Worker Login**:
   - Navigate to `https://YOUR_USERNAME.pythonanywhere.com/worker/login`.
   - Enter the newly created Worker's Email or Worker ID and the temporary password.
   - Click **Sign In**.

3. **Worker Dashboard & Password Change**:
   - The browser redirects to `https://YOUR_USERNAME.pythonanywhere.com/worker`.
   - **No Blank Screen**: The dashboard renders immediately with:
     - Worker Header (Name, Badge, Active Pill, Logout button).
     - Worker Profile Card (Name, ID, Email, Mobile, Assigned Ward, Department).
     - 4 Task Summary Metric Cards (Total: 0, Pending: 0, In Progress: 0, Completed: 0).
     - Empty Task Queue message: *"No tasks assigned yet. You're all caught up!"*.
   - **First-Login Modal**: The prompt *"Please Change Your Temporary Password"* opens automatically.
   - Enter the Temporary Password as Current Password, choose a New Password, and click **Save & Unlock Portal**.
   - Profile status updates to **Password Status: Secured & Active**.
