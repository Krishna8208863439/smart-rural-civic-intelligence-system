import sys
import os

# Ensure the app directory is on the python search path
project_dir = os.path.dirname(os.path.abspath(__file__))
if project_dir not in sys.path:
    sys.path.insert(0, project_dir)

parent_dir = os.path.dirname(project_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from app import app as application
