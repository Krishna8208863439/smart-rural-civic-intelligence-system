import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app import app

client = app.test_client()

def test_all():
    print("Testing /api/health...")
    res = client.get('/api/health')
    assert res.status_code == 200, f"Health failed: {res.status_code}"
    print("Health response:", res.get_json())

    print("\nTesting /api/auth/login (Admin)...")
    res = client.post('/api/auth/login', json={"email": "krishna@gmail.com", "password": "Sgi@5555"})
    assert res.status_code == 200, f"Admin login failed: {res.status_code} {res.get_json()}"
    admin_data = res.get_json()
    token = admin_data['token']
    print("Admin login success. Token:", token[:20] + "...")

    print("\nTesting /api/auth/me...")
    res = client.get('/api/auth/me', headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200, f"Auth me failed: {res.status_code}"
    print("Me response:", res.get_json()['user']['name'])

    print("\nTesting /api/admin/dashboard...")
    res = client.get('/api/admin/dashboard', headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200, f"Dashboard failed: {res.status_code}"
    dash = res.get_json()
    print("Total issues:", dash['kpis']['totalIssues'])
    print("Total workers:", dash['kpis']['totalWorkers'])
    print("Categories:", len(dash['charts']['categories']))

    print("\nTesting /api/issues...")
    res = client.get('/api/issues')
    assert res.status_code == 200, f"Issues failed: {res.status_code}"
    issues_data = res.get_json()
    print("Issues retrieved:", len(issues_data['issues']), "Total:", issues_data['total'])

    print("\nTesting /api/issues/map-pins...")
    res = client.get('/api/issues/map-pins')
    assert res.status_code == 200
    pins = res.get_json()
    print("Map pins count:", pins['count'])

    print("\nTesting / (Frontend SPA index.html)...")
    res = client.get('/')
    assert res.status_code == 200
    print("Frontend HTML length:", len(res.data), "bytes")

    print("\nALL FLASK APP TESTS PASSED PERFECTLY!")

if __name__ == '__main__':
    test_all()
