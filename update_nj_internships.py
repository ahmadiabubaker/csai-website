import requests
import json
import sys

url = "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/refs/heads/dev/.github/scripts/listings.json"

try:
    response = requests.get(url, timeout=30)
    response.raise_for_status()
except requests.exceptions.RequestException as e:
    print(f"Failed to fetch listings.json: {e}")
    sys.exit(1)

all_jobs = response.json()

# Filter for NJ internships
nj_jobs = [
    job for job in all_jobs
    if "locations" in job and any(
        "nj" in loc.lower() or "new jersey" in loc.lower()
        for loc in job["locations"]
    )
]

with open("nj-internships.json", "w") as f:
    json.dump(nj_jobs, f, indent=4)

print(f"Updated nj-internships.json with {len(nj_jobs)} NJ internships.")
