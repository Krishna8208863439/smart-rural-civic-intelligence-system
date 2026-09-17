# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# PythonAnywhere WSGI Configuration
# Smart Rural Civic Intelligence System (SRCI) | GramSetu AI
#
# HOW TO USE ON PYTHONANYWHERE:
# 1. Open your PythonAnywhere Dashboard -> Go to "Web" tab.
# 2. Click on your WSGI configuration file link:
#    (e.g., /var/www/yourusername_pythonanywhere_com_wsgi.py)
# 3. Delete everything in that file and paste THIS ENTIRE FILE.
# 4. Replace 'yourusername' below with your actual PythonAnywhere username!
# 5. Save the file and click the green "Reload yourusername.pythonanywhere.com" button.
# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

import sys
import os

# ---> SET YOUR PYTHONANYWHERE USERNAME HERE <---
PYTHONANYWHERE_USERNAME = os.environ.get('USER', 'yourusername')

# Candidate project directories (handles spaces, dashes, or subfolders automatically)
candidates = [
    f'/home/{PYTHONANYWHERE_USERNAME}/Smart Rural Civic Intelligence System',
    f'/home/{PYTHONANYWHERE_USERNAME}/Smart-Rural-Civic-Intelligence-System',
    f'/home/{PYTHONANYWHERE_USERNAME}/srci',
    f'/home/{PYTHONANYWHERE_USERNAME}/mysite',
    os.path.dirname(os.path.abspath(__file__)),
]

project_dir = None
for candidate in candidates:
    if os.path.exists(candidate) and os.path.exists(os.path.join(candidate, 'python_backend', 'app.py')):
        project_dir = candidate
        break
    elif os.path.exists(candidate) and os.path.exists(os.path.join(candidate, 'app.py')):
        project_dir = os.path.dirname(candidate)
        break

if not project_dir:
    # Fallback to standard path
    project_dir = f'/home/{PYTHONANYWHERE_USERNAME}/Smart Rural Civic Intelligence System'

python_backend_dir = os.path.join(project_dir, 'python_backend')

# Priority path insertion
if python_backend_dir not in sys.path:
    sys.path.insert(0, python_backend_dir)
if project_dir not in sys.path:
    sys.path.insert(0, project_dir)

# Import production Flask application
try:
    from app import app as application
except ImportError:
    # If app.py is in python_backend and sys.path needed full resolution
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'python_backend'))
    from app import app as application

# Optional environment variables
os.environ.setdefault('JWT_SECRET', 'srci_jwt_secret_production_ready_rural_intelligence_2025')
os.environ.setdefault('FLASK_ENV', 'production')
