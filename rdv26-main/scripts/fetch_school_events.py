import argparse
import requests


def fetch_school_events(base_url: str, school_name: str):
    url = f"{base_url.rstrip('/')}/registrations"
    params = {"school": school_name}
    response = requests.get(url, params=params, timeout=30)
    response.raise_for_status()

    rows = response.json()
    if not rows:
        print(f"No registrations found for school: {school_name}")
        return

    print(f"Found {len(rows)} registration rows for school: {school_name}\n")

    # Group by event and summarize
    by_event = {}
    for row in rows:
        event_id = row.get("event_id", "unknown")
        by_event.setdefault(event_id, []).append(row)

    for event_id, entries in sorted(by_event.items()):
        print(f"Event: {event_id}")
        print(f"  Entries: {len(entries)}")
        for entry in entries:
            print(f"  - Name: {entry.get('full_name', '')}")
            print(f"    Phone: {entry.get('phone', '')}")
            print(f"    Grade: {entry.get('grade', '')}")
            print(f"    Notes: {entry.get('notes', '')}")
            print(f"    Email: {entry.get('email', '')}")
        print()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fetch all registrations for a single school from the RDV server")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000", help="Base URL of the backend server")
    parser.add_argument("--school", required=True, help="School name as stored in the server")
    args = parser.parse_args()

    fetch_school_events(args.base_url, args.school)
