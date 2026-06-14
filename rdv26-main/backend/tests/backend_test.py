"""Backend API tests for RDV Festival app."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/') or \
    open('/app/frontend/.env').read().split('REACT_APP_BACKEND_URL=')[1].split('\n')[0].strip()
API = f"{BASE_URL}/api"

EVENT_IDS = ["Melodia", "invogue", "seismic", "gourmet crusade", "game f"]


def test_root():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("message") == "RDV API ONLINE"


def test_events_list():
    r = requests.get(f"{API}/events")
    assert r.status_code == 200
    data = r.json()
    assert "events" in data
    ids = [e["id"] for e in data["events"]]
    for eid in EVENT_IDS:
        assert eid in ids


def test_event_detail_ok():
    r = requests.get(f"{API}/events/Melodia")
    assert r.status_code == 200
    assert r.json()["id"] == "Melodia"


def test_event_detail_404():
    r = requests.get(f"{API}/events/nonexistent")
    assert r.status_code == 404


def test_registration_create_and_persist():
    payload = {
        "full_name": "TEST User",
        "school": "TEST School",
        "email": "test_user@example.com",
        "phone": "+911234567890",
        "grade": "11",
        "event_id": "Melodia",
        "team_name": "TEST Team",
        "team_size": 3,
        "notes": "TEST notes"
    }
    r = requests.post(f"{API}/registrations", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["confirmation_code"].startswith("RDV-")
    assert data["full_name"] == "TEST User"
    assert data["event_id"] == "Melodia"
    # Verify persistence via list
    r2 = requests.get(f"{API}/registrations")
    assert r2.status_code == 200
    codes = [x["confirmation_code"] for x in r2.json()]
    assert data["confirmation_code"] in codes


def test_registration_invalid_event():
    payload = {
        "full_name": "TEST X",
        "school": "TEST",
        "email": "x@example.com",
        "phone": "+911234567890",
        "grade": "10",
        "event_id": "bogus-id",
    }
    r = requests.post(f"{API}/registrations", json=payload)
    assert r.status_code == 400


def test_registration_invalid_email():
    payload = {
        "full_name": "TEST X",
        "school": "TEST",
        "email": "not-an-email",
        "phone": "+911234567890",
        "grade": "10",
        "event_id": "Melodia",
    }
    r = requests.post(f"{API}/registrations", json=payload)
    assert r.status_code == 422


def test_registrations_list_sorted_desc():
    r = requests.get(f"{API}/registrations")
    assert r.status_code == 200
    items = r.json()
    if len(items) >= 2:
        for a, b in zip(items, items[1:]):
            assert a["created_at"] >= b["created_at"]


def test_contact_submit():
    payload = {
        "name": "TEST Contact",
        "email": "test_contact@example.com",
        "subject": "TEST subject",
        "message": "TEST message body."
    }
    r = requests.post(f"{API}/contact", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["name"] == "TEST Contact"
    assert "id" in data


def test_stats():
    r = requests.get(f"{API}/stats")
    assert r.status_code == 200
    data = r.json()
    assert "total" in data
    assert "by_event" in data
    for eid in EVENT_IDS:
        assert eid in data["by_event"]


def test_registration_batch_overwrite():
    school_name = "TEST Overwrite School"
    payload1 = [
        {
            "full_name": "Student A",
            "school": school_name,
            "email": "studenta@overwrite.com",
            "phone": "0000000000",
            "grade": "10 A",
            "event_id": "Melodia",
            "notes": "Role: Member 1"
        },
        {
            "full_name": "Student B",
            "school": school_name,
            "email": "studentb@overwrite.com",
            "phone": "0000000000",
            "grade": "10 B",
            "event_id": "Melodia",
            "notes": "Role: Member 2"
        }
    ]
    # First batch registration
    r = requests.post(f"{API}/registrations/batch", json=payload1)
    assert r.status_code == 200, r.text
    assert len(r.json()) == 2

    # Verify they exist
    r_list = requests.get(f"{API}/registrations", params={"school": school_name})
    assert r_list.status_code == 200
    assert len(r_list.json()) == 2
    names = [x["full_name"] for x in r_list.json()]
    assert "Student A" in names
    assert "Student B" in names

    # Second batch registration (should overwrite the first batch)
    payload2 = [
        {
            "full_name": "Student C",
            "school": school_name,
            "email": "studentc@overwrite.com",
            "phone": "0000000000",
            "grade": "11 A",
            "event_id": "Melodia",
            "notes": "Role: Member 1"
        }
    ]
    r_overwrite = requests.post(f"{API}/registrations/batch", json=payload2)
    assert r_overwrite.status_code == 200, r_overwrite.text
    assert len(r_overwrite.json()) == 1

    # Verify only Student C exists now
    r_list2 = requests.get(f"{API}/registrations", params={"school": school_name})
    assert r_list2.status_code == 200
    regs = r_list2.json()
    assert len(regs) == 1
    assert regs[0]["full_name"] == "Student C"

    # Cleanup
    reg_id = regs[0]["id"]
    r_del = requests.delete(f"{API}/registrations/{reg_id}")
    assert r_del.status_code == 200

