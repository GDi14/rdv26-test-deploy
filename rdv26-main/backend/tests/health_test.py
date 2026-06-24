import os
import sys
from pathlib import Path
import pytest
import requests

# Resolve backend URL
def get_backend_url():
    # 1. Check environment variable
    env_url = os.environ.get('REACT_APP_BACKEND_URL')
    if env_url:
        return env_url.rstrip('/')

    # 2. Try to find frontend/.env in parent directories
    current_dir = Path(__file__).parent.resolve()
    for parent in current_dir.parents:
        frontend_env = parent / 'frontend' / '.env'
        if frontend_env.exists():
            try:
                content = frontend_env.read_text()
                for line in content.splitlines():
                    if line.startswith('REACT_APP_BACKEND_URL='):
                        return line.split('REACT_APP_BACKEND_URL=')[1].strip().rstrip('/')
            except Exception:
                pass
                
    # Default fallback
    return "http://localhost:8000"

BASE_URL = get_backend_url()
API = f"{BASE_URL}/api"

def test_health_check_endpoint():
    """Verify that the health check endpoint returns 200 and correct structure."""
    try:
        r = requests.get(f"{API}/health")
    except requests.exceptions.ConnectionError:
        pytest.fail(f"Could not connect to backend server at {BASE_URL}. Ensure uvicorn is running.")
        
    assert r.status_code == 200
    data = r.json()
    
    assert "status" in data
    assert data["status"] in ["UP", "DOWN", "DEGRADED"]
    assert "timestamp" in data
    assert "database" in data
    assert "configuration" in data
    
    db = data["database"]
    assert "status" in db
    assert "latency_ms" in db
    assert isinstance(db["latency_ms"], int)

def test_input_validation_email():
    """Verify that the API rejects invalid emails with 422 Unprocessable Entity."""
    payload = {
        "full_name": "Test Validator",
        "school": "Test School",
        "email": "not-an-email-at-all",
        "phone": "1234567890",
        "grade": "12",
        "event_id": "Melodia"
    }
    r = requests.post(f"{API}/registrations", json=payload)
    assert r.status_code == 422  # Pydantic validation failure

def test_input_validation_team_size():
    """Verify that the API rejects out-of-bound team sizes (> 20) with 422."""
    payload = {
        "full_name": "Test Validator",
        "school": "Test School",
        "email": "test@example.com",
        "phone": "1234567890",
        "grade": "12",
        "event_id": "Melodia",
        "team_size": 99  # Max limit is 20 in server.py
    }
    r = requests.post(f"{API}/registrations", json=payload)
    assert r.status_code == 422
