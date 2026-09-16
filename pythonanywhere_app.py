import os
from flask import Flask, send_from_directory

# Automatically locate the compiled frontend dist directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, 'frontend', 'dist')

app = Flask(__name__, static_folder=DIST_DIR)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    return send_from_directory(DIST_DIR, 'index.html')

if __name__ == '__main__':
    app.run(debug=True)
