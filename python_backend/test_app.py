import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app import app, db

client = app.test_client()

def test_features():
    # Login Admin
    login_res = client.post('/api/auth/login', json={"email": "krishna@gmail.com", "password": "Sgi@5555"})
    assert login_res.status_code == 200
    token = login_res.get_json()['token']
    headers = {"Authorization": f"Bearer {token}"}

    print("--- 1. Testing Village Digital Memory ---")
    res = client.get('/api/village-memory')
    assert res.status_code == 200
    data = res.get_json()
    assert 'records' in data, "res.data.records missing!"
    print(f"Total village memory records: {len(data['records'])}")
    assert len(data['records']) > 0

    # Test filtering by category & risk
    first_cat = data['records'][0].get('category')
    first_risk = data['records'][0].get('recurrenceLevel')
    res_filtered = client.get(f'/api/village-memory?category={first_cat}&riskLevel={first_risk}')
    assert res_filtered.status_code == 200
    assert 'records' in res_filtered.get_json()
    print(f"Filtered records ({first_cat}, {first_risk}): {len(res_filtered.get_json()['records'])}")

    print("\n--- 2. Testing Community Validation Bulletin ---")
    issues_res = client.get('/api/issues')
    issues = issues_res.get_json()['issues']
    target_issue = issues[0]
    target_id = target_issue['_id']

    print(f"Voting on issue: {target_id} - {target_issue.get('title')}")
    # Vote CONFIRM
    val_res1 = client.post(f'/api/issues/{target_id}/validate', json={"response": "CONFIRM"}, headers=headers)
    assert val_res1.status_code == 200
    stats1 = val_res1.get_json()['communityValidationStats']
    print(f"Stats after CONFIRM: {stats1}")
    assert stats1['confirms'] >= 1

    # Vote STILL_EXISTS
    val_res2 = client.post(f'/api/issues/{target_id}/validate', json={"response": "STILL_EXISTS"}, headers=headers)
    assert val_res2.status_code == 200
    stats2 = val_res2.get_json()['communityValidationStats']
    print(f"Stats after STILL_EXISTS: {stats2}")
    assert stats2['stillExists'] >= 1

    # Vote RESOLVED
    val_res3 = client.post(f'/api/issues/{target_id}/validate', json={"response": "RESOLVED"}, headers=headers)
    assert val_res3.status_code == 200
    stats3 = val_res3.get_json()['communityValidationStats']
    print(f"Stats after RESOLVED: {stats3}")
    assert stats3['resolved'] >= 1

    print("\n--- 3. Testing Admin Control & Verification ---")
    # A. Assign worker
    workers_res = client.get('/api/workers')
    workers = workers_res.get_json()['workers']
    worker_id = workers[0]['id']
    assign_res = client.put(f'/api/admin/assign-worker/{target_id}', json={"workerId": worker_id}, headers=headers)
    assert assign_res.status_code == 200
    print(f"Worker assigned. Status: {assign_res.get_json()['issue']['status']}")

    # B. Update status
    status_res = client.put(f'/api/issues/{target_id}/status', json={"status": "ACTION COMPLETED", "comment": "Work finished"}, headers=headers)
    assert status_res.status_code == 200
    print(f"Status updated. Status: {status_res.get_json()['issue']['status']}")

    # C. Admin Verify Resolution & Forward to Citizen
    verify_res = client.put(f'/api/issues/{target_id}/admin-verify', json={"notes": "Inspected and approved by Admin"}, headers=headers)
    assert verify_res.status_code == 200
    v_data = verify_res.get_json()['issue']
    print(f"Admin verify success. New Status: {v_data['status']}")
    assert v_data['status'] == 'VERIFIED RESOLVED'
    assert 'adminVerification' in v_data

    # D. Get issue by id
    detail_res = client.get(f'/api/issues/{target_id}')
    assert detail_res.status_code == 200
    det = detail_res.get_json()
    assert 'history' in det
    print(f"Issue detail history entries: {len(det['history'])}")

    print("\n>>> ALL 3 FEATURES VALIDATED AND TESTED SUCCESSFULLY! <<<")

if __name__ == '__main__':
    test_features()
