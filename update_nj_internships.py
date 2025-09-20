import requests
import json
import sys
from pathlib import Path
from datetime import datetime, UTC

url = "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/refs/heads/dev/.github/scripts/listings.json"

# Fetch new jobs
try:
    response = requests.get(url, timeout=30)
    response.raise_for_status()
except requests.exceptions.RequestException as e:
    print(f"Failed to fetch listings.json: {e}")
    sys.exit(1)

all_jobs = response.json()
new_nj_jobs = []

for job in all_jobs:
    # Check locations and keep only NJ locations
    if "locations" not in job:
        continue
    nj_locs = [loc for loc in job["locations"] if loc and ("nj" in loc.lower() or "new jersey" in loc.lower())]
    if not nj_locs:
        continue
    job["locations"] = nj_locs

    # Use date_updated to filter jobs from 2026 or later
    if "date_updated" not in job:
        continue
    job_date = datetime.fromtimestamp(job["date_updated"], tz=UTC)
    if job_date.year < 2026:
        continue

    # Add temporary _sort_date for sorting
    job["_sort_date"] = job_date
    new_nj_jobs.append(job)

# Load existing NJ internships if file exists and is valid
nj_file = Path("nj-internships.json")
existing_nj_jobs = []

if nj_file.exists():
    try:
        with open(nj_file) as f:
            existing_nj_jobs = json.load(f)
    except json.JSONDecodeError:
        print("Warning: nj-internships.json is empty or corrupted, starting fresh.")
        existing_nj_jobs = []

# Merge and remove duplicates by 'id'
existing_ids = {job.get("id") for job in existing_nj_jobs if "id" in job}
merged_nj_jobs = existing_nj_jobs + [job for job in new_nj_jobs if job.get("id") not in existing_ids]

# Sort by date_updated (newest first)
merged_nj_jobs.sort(key=lambda x: x.get("_sort_date") or datetime.max, reverse=True)

# Remove temporary _sort_date before saving
for job in merged_nj_jobs:
    if "_sort_date" in job:
        del job["_sort_date"]

# Save to nj-internships.json
with open("nj-internships.json", "w") as f:
    json.dump(merged_nj_jobs, f, indent=4)

print(f"Fetched {len(new_nj_jobs)} new NJ jobs")
print(f"Existing file had {len(existing_nj_jobs)} jobs")
print(f"Final merged file has {len(merged_nj_jobs)} jobs")
