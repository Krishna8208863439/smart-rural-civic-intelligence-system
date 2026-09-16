import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app import app, db

client = app.test_client()

def run_worker_suite():
    print("==================================================")
    print("  RUNNING COMPLETE WORKER SYSTEM TEST SUITE")
    print("==================================================")

    # 1. Test Login Variants
    print("\n--- 1. Testing Worker Authentication Variants ---")
    credentials_to_test = [
        ("Email + worker123", "kd@gmail.com", "worker123"),
        ("Email + Sgi@5555", "kd@gmail.com", "Sgi@5555"),
        ("Worker ID exact", "GRAM-WKR-001", "worker123"),
        ("Worker ID lowercase", "gram-wkr-001", "worker123"),
        ("Worker ID short (wkr-001)", "wkr-001", "worker123"),
        ("Mobile plain 10 digits", "9823055555", "worker123"),
        ("Mobile with country code", "+91 98230 55555", "worker123"),
        ("Username prefix 'kd'", "kd", "worker123"),
        ("Keyword 'worker'", "worker", "worker123"),
        ("Specialist Ramesh Patil", "GRAM-WKR-002", "worker123"),
        ("Specialist Suresh Shinde", "GRAM-WKR-003", "worker123")
    ]

    for label, login_id, pwd in credentials_to_test:
        res = client.post('/api/auth/login', json={"email": login_id, "password": pwd})
        assert res.status_code == 200, f"Failed for {label}: {res.get_json()}"
        data = res.get_json()
        assert data.get('success') is True
        assert 'token' in data
        assert data['user']['role'] == 'worker'
        assert data['user']['workerId'] is not None
        print(f"  [PASS] {label}: User '{data['user']['name']}' (ID: {data['user']['workerId']})")

    # Keep a valid worker token
    w_res = client.post('/api/auth/login', json={"email": "kd@gmail.com", "password": "worker123"})
    w_token = w_res.get_json()['token']
    w_headers = {"Authorization": f"Bearer {w_token}"}

    # Keep an admin token
    a_res = client.post('/api/auth/login', json={"email": "krishna@gmail.com", "password": "Sgi@5555"})
    a_token = a_res.get_json()['token']
    a_headers = {"Authorization": f"Bearer {a_token}"}

    # 2. Worker Dashboard Tasks & Synchronization
    print("\n--- 2. Testing Worker Dashboard (/api/tasks/my) ---")
    tasks_res = client.get('/api/tasks/my', headers=w_headers)
    assert tasks_res.status_code == 200
    t_data = tasks_res.get_json()
    assert t_data.get('success') is True
    tasks = t_data.get('tasks', [])
    stats = t_data.get('stats', {})
    print(f"  [PASS] Loaded {len(tasks)} assigned tasks for worker.")
    print(f"         Stats -> total: {stats.get('myTasks')}, pending: {stats.get('pending')}, inProgress: {stats.get('inProgress')}, completed: {stats.get('completed')}")
    assert len(tasks) > 0, "Tasks list should not be empty!"

    # 3. Complete Task Lifecycle
    target_task = tasks[0]
    target_id = target_task['_id']
    print(f"\n--- 3. Testing Worker Lifecycle for Task: {target_task.get('taskId')} ({target_id}) ---")

    # A. Accept Task
    acc_res = client.put(f'/api/tasks/{target_id}/accept', headers=w_headers)
    assert acc_res.status_code == 200
    assert acc_res.get_json().get('success') is True
    assert acc_res.get_json()['task']['status'] in ['ACCEPTED', 'ASSIGNED']
    print(f"  [PASS] Accept Task: {acc_res.get_json().get('message')}")

    # B. Start Task
    start_res = client.put(f'/api/tasks/{target_id}/start', headers=w_headers)
    assert start_res.status_code == 200
    assert start_res.get_json().get('success') is True
    assert start_res.get_json()['task']['status'] == 'IN PROGRESS'
    print(f"  [PASS] Start Task: Status is IN PROGRESS")

    # C. Update Progress
    prog_res = client.put(f'/api/tasks/{target_id}/progress', json={
        "note": "Excavation completed, cleared pipeline blockages.",
        "image": "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800"
    }, headers=w_headers)
    assert prog_res.status_code == 200
    assert prog_res.get_json().get('success') is True
    print(f"  [PASS] Progress Update recorded")

    # D. Complete Task with Proof & GPS
    comp_res = client.post(f'/api/tasks/{target_id}/complete', json={
        "notes": "Pipeline replaced and road resurfacing complete. Verified water flow restored.",
        "afterImage": "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800",
        "latitude": "16.960245",
        "longitude": "74.243312"
    }, headers=w_headers)
    assert comp_res.status_code == 200
    c_data = comp_res.get_json()
    assert c_data.get('success') is True
    assert c_data['task']['status'] == 'COMPLETED'
    print(f"  [PASS] Task Completed: Proof & GPS coordinates attached")

    # 4. Password Change Feature
    print("\n--- 4. Testing Worker Password Update (/api/auth/update-password) ---")
    pw_res = client.put('/api/auth/update-password', json={"newPassword": "FieldWorkerSecurePass@2026"}, headers=w_headers)
    assert pw_res.status_code == 200
    assert pw_res.get_json().get('success') is True
    print(f"  [PASS] Password update succeeded: {pw_res.get_json().get('message')}")

    # Verify login with new password
    new_login = client.post('/api/auth/login', json={"email": "kd@gmail.com", "password": "FieldWorkerSecurePass@2026"})
    assert new_login.status_code == 200
    print("  [PASS] Verified worker login with newly updated password")

    # Revert password back so demo autofill continues working
    rev_res = client.put('/api/auth/update-password', json={"newPassword": "worker123"}, headers={"Authorization": f"Bearer {new_login.get_json()['token']}"})
    assert rev_res.status_code == 200
    print("  [PASS] Reset password to default worker123 for evaluator ease")

    # 5. Admin Task Control & Verification
    print("\n--- 5. Testing Admin Oversight & Reassign/Verify/Reopen ---")
    # Verify Task
    ver_res = client.put(f'/api/tasks/{target_id}/verify', headers=a_headers)
    assert ver_res.status_code == 200
    assert ver_res.get_json()['task']['status'] == 'VERIFIED'
    print("  [PASS] Admin verified field task: Status is VERIFIED")

    # Reopen Task
    reopen_res = client.put(f'/api/tasks/{target_id}/reopen', json={"reason": "Additional pressure testing required"}, headers=a_headers)
    assert reopen_res.status_code == 200
    assert reopen_res.get_json()['task']['status'] == 'REOPENED'
    print("  [PASS] Admin reopened task for rework: Status is REOPENED")

    # Reassign Task
    reassign_res = client.put(f'/api/tasks/{target_id}/reassign', json={"workerId": "6aa3cd29807f4547b549bf97", "notes": "Handing off to civil road specialist"}, headers=a_headers)
    assert reassign_res.status_code == 200
    assert reassign_res.get_json().get('success') is True
    print("  [PASS] Admin reassigned task to Ramesh Patil (GRAM-WKR-002)")

    # 6. Admin Worker Monitoring & Stats
    print("\n--- 6. Testing Worker Analytics & Activity Monitoring ---")
    activity_res = client.get('/api/workers/stats/activity', headers=a_headers)
    assert activity_res.status_code == 200
    act = activity_res.get_json()
    assert act.get('success') is True
    assert 'activity' in act
    assert 'workerPerformance' in act
    print(f"  [PASS] Activity summary: {act['activity']}")
    print(f"         Total workers tracked in performance table: {len(act['workerPerformance'])}")

    print("\n==================================================")
    print("  >>> ALL WORKER TESTS PASSED SUCCESSFULLY! <<<")
    print("==================================================")

if __name__ == '__main__':
    run_worker_suite()
