import requests

base_url = "http://localhost:8000/api"

get_res = requests.get(f"{base_url}/registrations")
data = get_res.json()

if len(data) > 0:
    first_id = data[0]['id']
    print("Deleting:", first_id)
    del_res = requests.delete(f"{base_url}/registrations/{first_id}")
    print("Delete Status:", del_res.status_code)
    print("Delete Response Text:", del_res.text)
