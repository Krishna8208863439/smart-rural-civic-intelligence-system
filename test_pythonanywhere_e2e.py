import sys
import os
import json

# Ensure python_backend and project root are in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(BASE_DIR, 'python_backend'))
sys.path.insert(0, BASE_DIR)

from pythonanywhere_app import application

client = application.test_client()

def run_pythonanywhere_e2e():
    print("==================================================================")
    print("  TESTING COMPLETE SYSTEM WORKFLOW VIA PYTHONANYWHERE WSGI APP")
    print("==================================================================")

    # 1. Test Health & Time Endpoints
    print("\n--- 1. Health & Server Info ---")
    res = client.get('/api/health')
    assert res.status_code == 200
    print("  [PASS] /api/health: OK", res.get_json())

    res = client.get('/api/time')
    assert res.status_code == 200
    print("  [PASS] /api/time: OK", res.get_json()['display'])

    # 2. Test SPA Static Serving (Flask serving frontend build)
    print("\n--- 2. Frontend Single Page Application (SPA) Serving ---")
    res = client.get('/')
    assert res.status_code == 200
    assert b'<div id="root">' in res.data or b'Smart Rural' in res.data
    print("  [PASS] Root SPA (/) served successfully (status 200)")

    res = client.get('/worker')
    assert res.status_code == 200
    assert b'<div id="root">' in res.data or b'Smart Rural' in res.data
    print("  [PASS] Worker Route (/worker) served successfully (status 200)")

    res = client.get('/admin/workers')
    assert res.status_code == 200
    assert b'<div id="root">' in res.data or b'Smart Rural' in res.data
    print("  [PASS] Admin Route (/admin/workers) served successfully (status 200)")

    # 3. Admin Authentication
    print("\n--- 3. Admin Login & Authorization ---")
    admin_login = client.post('/api/auth/login', json={
        "email": "krishna@gmail.com",
        "password": "Sgi@5555"
    })
    assert admin_login.status_code == 200, f"Admin login failed: {admin_login.get_json()}"
    a_data = admin_login.get_json()
    admin_token = a_data['token']
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print(f"  [PASS] Admin authenticated: {a_data['user']['name']} (role: {a_data['user']['role']})")

    # 4. Admin Creates New Worker
    print("\n--- 4. Admin Creates Field Worker Account ---")
    import time
    worker_email = f"pa_worker_{int(time.time())}@gramsetu.in"
    create_worker_res = client.post('/api/workers', json={
        "name": "Eknath Shinde",
        "phone": "9823011223",
        "email": worker_email,
        "assignedArea": "Sector 5 - Koyna",
        "workerRole": "Sanitation Supervisor",
        "status": "Active"
    }, headers=admin_headers)
    assert create_worker_res.status_code == 201, f"Worker creation failed: {create_worker_res.get_json()}"
    w_info = create_worker_res.get_json()['worker']
    worker_id = w_info['workerId']
    temp_password = w_info['temporaryPassword']
    print(f"  [PASS] Field Worker Created: {w_info['name']} (ID: {worker_id}, Email: {worker_email})")
    print(f"         Temporary Password Issued: {temp_password}")

    # 5. Worker Logs In With Temporary Password
    print("\n--- 5. Worker Login via Temporary Password ---")
    worker_login = client.post('/api/auth/login', json={
        "email": worker_email,
        "password": temp_password
    })
    assert worker_login.status_code == 200, f"Worker login failed: {worker_login.get_json()}"
    w_login_data = worker_login.get_json()
    assert w_login_data['user']['role'] == 'worker'
    assert w_login_data['user']['mustChangePassword'] is True
    worker_token = w_login_data['token']
    worker_headers = {"Authorization": f"Bearer {worker_token}"}
    print(f"  [PASS] Worker Login Successful! Role: {w_login_data['user']['role']}, mustChangePassword: True")

    # 6. Worker Dashboard API (/api/worker/dashboard)
    print("\n--- 6. Worker Dashboard Retrieval ---")
    dash_res = client.get('/api/worker/dashboard', headers=worker_headers)
    assert dash_res.status_code == 200, f"Worker dashboard failed: {dash_res.get_json()}"
    dash_data = dash_res.get_json()
    assert dash_data['success'] is True
    assert dash_data['worker']['workerId'] == worker_id
    assert dash_data['worker']['assignedArea'] == "Sector 5 - Koyna"
    assert dash_data['statistics']['totalTasks'] == 0
    print(f"  [PASS] Dashboard data verified for worker: {dash_data['worker']['name']} ({dash_data['worker']['workerId']})")
    print(f"         Assigned Area: {dash_data['worker']['assignedArea']}, Total Tasks: {dash_data['statistics']['totalTasks']}")

    # 7. First-Login Password Change
    print("\n--- 7. Worker First-Login Password Change ---")
    permanent_pass = "Eknath@Secure2026"
    chg_res = client.put('/api/auth/change-password', json={
        "currentPassword": temp_password,
        "newPassword": permanent_pass
    }, headers=worker_headers)
    assert chg_res.status_code == 200, f"Password change failed: {chg_res.get_json()}"
    assert chg_res.get_json()['mustChangePassword'] is False
    print("  [PASS] Password changed successfully. mustChangePassword is now False.")

    # 8. Re-Login with Permanent Password
    print("\n--- 8. Worker Re-Login with Updated Password ---")
    re_login = client.post('/api/auth/login', json={
        "email": worker_id, # Can also login with Worker ID
        "password": permanent_pass
    })
    assert re_login.status_code == 200
    assert re_login.get_json()['user']['mustChangePassword'] is False
    print(f"  [PASS] Re-login with Worker ID '{worker_id}' and permanent password succeeded!")

    # 9. Existing Lead Worker Task Flow
    print("\n--- 9. Lead Worker KD (GRAM-WKR-001) Task Lifecycle Flow ---")
    kd_login = client.post('/api/auth/login', json={
        "email": "kd@gmail.com",
        "password": "worker123"
    })
    assert kd_login.status_code == 200
    kd_token = kd_login.get_json()['token']
    kd_headers = {"Authorization": f"Bearer {kd_token}"}

    kd_dash = client.get('/api/worker/dashboard', headers=kd_headers)
    assert kd_dash.status_code == 200
    kd_tasks = kd_dash.get_json()['tasks']
    print(f"  [PASS] Lead Worker KD has {len(kd_tasks)} tasks assigned in dashboard.")

    print("\n==================================================================")
    print("  >>> ALL PYTHONANYWHERE WSGI PROCESSES VALIDATED SUCCESSFULLY! <<<")
    print("==================================================================")

if __name__ == '__main__':
    run_pythonanywhere_e2e()
