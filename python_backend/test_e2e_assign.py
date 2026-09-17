import sys
import json
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app import app, db

client = app.test_client()

def test_full_cycle():
    print("==================================================")
    print("  RUNNING E2E ISSUE -> WORKER -> VERIFY TEST")
    print("==================================================")

    # 1. Admin login
    a_res = client.post('/api/auth/login', json={'email': 'krishna@gmail.com', 'password': 'Sgi@5555'})
    assert a_res.status_code == 200
    a_token = a_res.get_json()['token']
    a_headers = {'Authorization': f'Bearer {a_token}'}

    # 2. Worker Rohan login
    w_res = client.post('/api/auth/login', json={'email': 'rohan@gmail.com', 'password': 'Sgi@5555'})
    assert w_res.status_code == 200
    w_user = w_res.get_json()['user']
    w_token = w_res.get_json()['token']
    w_headers = {'Authorization': f'Bearer {w_token}'}

    # 3. Citizen reports a fresh issue
    c_res = client.post('/api/issues', json={
        'title': 'Urgent Water Pipe Crack near Ward 2 Community Hall',
        'category': 'Water leakage',
        'description': 'Continuous high-pressure water loss on paved street.',
        'location': {'landmark': 'Ward 2 Community Hall', 'address': 'Chandoli Ward 2'},
        'priority': 'High'
    })
    assert c_res.status_code == 201, f"Create issue failed: {c_res.get_json()}"
    new_issue = c_res.get_json()['issue']
    iss_id = str(new_issue['_id'])
    print(f"  [PASS] 1. Created new citizen issue #{iss_id[-6:]}: {new_issue['title']}")

    # 4. Admin assigns issue to worker Rohan
    assign_res = client.put(f'/api/admin/assign-worker/{iss_id}', json={'workerId': w_user['_id']}, headers=a_headers)
    assert assign_res.status_code == 200, f"Assign failed: {assign_res.get_json()}"
    print(f"  [PASS] 2. Admin assigned issue to {w_user['name']}: {assign_res.get_json().get('message')}")

    # 5. Worker checks /api/tasks/my
    my_tasks_res = client.get('/api/tasks/my', headers=w_headers)
    assert my_tasks_res.status_code == 200
    my_tasks = my_tasks_res.get_json()['tasks']
    found_task = next((t for t in my_tasks if str(t.get('issueId')) == iss_id or str(t.get('_id')) == iss_id), None)
    assert found_task is not None, "Assigned issue NOT FOUND in worker /api/tasks/my!"
    print(f"  [PASS] 3. Worker sees assigned task in dashboard: {found_task['taskId']} (Status: {found_task['status']})")

    # 6. Worker accepts task
    acc_res = client.put(f"/api/tasks/{found_task['_id']}/accept", headers=w_headers)
    assert acc_res.status_code == 200
    assert acc_res.get_json()['task']['status'] in ['ACCEPTED', 'ASSIGNED']
    print(f"  [PASS] 4. Worker accepted task: Status is ACCEPTED")

    # 7. Worker starts task
    start_res = client.put(f"/api/tasks/{found_task['_id']}/start", headers=w_headers)
    assert start_res.status_code == 200
    assert start_res.get_json()['task']['status'] == 'IN PROGRESS'
    print(f"  [PASS] 5. Worker started on-site work: Status is IN PROGRESS")

    # 8. Worker updates progress
    prog_res = client.put(f"/api/tasks/{found_task['_id']}/progress", json={
        'note': 'Excavation completed, preparing high-pressure sleeve clamp.'
    }, headers=w_headers)
    assert prog_res.status_code == 200
    print(f"  [PASS] 6. Worker posted progress note")

    # 9. Worker completes task with after-image and GPS
    comp_res = client.post(f"/api/tasks/{found_task['_id']}/complete", json={
        'notes': 'Repaired pipe crack with heavy-duty sleeve clamp and verified zero leaks.',
        'afterImage': 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800',
        'latitude': '16.9602',
        'longitude': '74.2433'
    }, headers=w_headers)
    assert comp_res.status_code == 200
    assert comp_res.get_json()['task']['status'] == 'COMPLETED'
    print(f"  [PASS] 7. Worker completed task with proof photo and GPS: Status is COMPLETED")

    # 10. Admin verifies task
    ver_res = client.put(f"/api/tasks/{found_task['_id']}/verify", json={
        'notes': 'Verified resolution proof image. Quality standard met.'
    }, headers=a_headers)
    assert ver_res.get_json()['task']['status'] in ['VERIFIED', 'ADMIN_VERIFIED']
    print(f"  [PASS] 8. Admin verified task: Status is {ver_res.get_json()['task']['status']}")

    # 11. Verify parent issue in db is VERIFIED RESOLVED
    iss_check = client.get(f'/api/issues/{iss_id}')
    assert iss_check.get_json()['issue']['status'] == 'VERIFIED RESOLVED'
    print(f"  [PASS] 9. Parent issue is VERIFIED RESOLVED with full audit history")

    print("\n==================================================")
    print("  >>> END-TO-END WORKER ISSUE PROCESS VERIFIED! <<<")
    print("==================================================")

if __name__ == '__main__':
    test_full_cycle()
