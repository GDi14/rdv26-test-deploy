import requests
import time

base_url = "http://localhost:8000/api"

# 1. create a registration
print("Creating...")
res = requests.post(f"{base_url}/registrations", json={
    "full_name": "Test Delete",
    "school": "Test School",
    "email": "test@test.com",
    "phone": "123",
    "grade": "10",
    "event_id": "Melodia",
    "confirmation_code": "XYZ"
})
print("Create Status:", res.status_code)
if res.status_code == 200:
    new_id = res.json().get('id')
    print("New ID:", new_id)

    # 2. Get list
    get_res = requests.get(f"{base_url}/registrations?school=Test School")
    print("Get Count:", len(get_res.json()))

    # 3. Delete it
    print("Deleting...")
    del_res = requests.delete(f"{base_url}/registrations/{new_id}")
    print("Delete Status:", del_res.status_code)
    print("Delete Response:", del_res.json())

    # 4. Get list again
    get_res2 = requests.get(f"{base_url}/registrations?school=Test School")
    print("Get 2 Count:", len(get_res2.json()))
