import os
from dotenv import load_dotenv
import requests

load_dotenv('.env')

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

url = f"{SUPABASE_URL}/rest/v1/registrations"
headers = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# we'll just try to select something first to verify auth
res = requests.get(url, headers=headers)
print("GET STATUS:", res.status_code)
if res.status_code == 200:
    data = res.json()
    print("COUNT:", len(data))
    if len(data) > 0:
        first_id = data[0]['id']
        print("FIRST ID:", first_id)
        # try to delete it
        del_res = requests.delete(url, params={"id": f"eq.{first_id}"}, headers=headers)
        print("DELETE STATUS:", del_res.status_code)
        try:
            print("DELETE RESPONSE:", del_res.json())
        except Exception as e:
            print("NO JSON", e)
