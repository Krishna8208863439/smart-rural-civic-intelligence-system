import sys
import os

# Ensure python_backend is prioritized on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PYTHON_BACKEND_DIR = os.path.join(CURRENT_DIR, 'python_backend')

if PYTHON_BACKEND_DIR not in sys.path:
    sys.path.insert(0, PYTHON_BACKEND_DIR)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

# Import the production Flask application with full REST API and frontend SPA static serving
from app import app as application
app = application

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
