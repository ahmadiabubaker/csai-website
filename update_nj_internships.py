import requests
import json
import sys
from pathlib import Path
from datetime import datetime

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
    # Check location
    if "locations" not in job:
        continue
    nj_locs = [loc for loc in job["locations"] if loc and ("nj" in loc.lower() or "new jersey" in loc.lower())]
    if not nj_locs:
        continue

    # Check date/year
    job_date = None
    if "start_date" in job:
        try:
            job_date = datetime.strptime(job["start_date"], "%Y-%m-%d")
        except Exception:
            continue
    elif "year" in job:
        try:
            job_date = datetime(int(job["year"]), 1, 1)
        except Exception:
            continue

    if job_date and job_date.year >= 2026:
        # Keep only NJ locations
        job["locations"] = nj_locs
        # Add start_date as a datetime object for sorting later
        job["_sort_date"] = job_date
        new_nj_jobs.append(job)

# Load existing NJ internships if file exists
nj_file = Path("nj-internships.json")
if nj_file.exists():
    with open(nj_file) as f:
        existing_nj_jobs = json.load(f)
else:
    existing_nj_jobs = []

# Merge and remove duplicates by 'id' if available
existing_ids = {job.get("id") for job in existing_nj_jobs if "id" in job}
merged_nj_jobs = existing_nj_jobs + [job for job in new_nj_jobs if job.get("id") not in existing_ids]

# Sort by start date
merged_nj_jobs.sort(key=lambda x: x.get("_sort_date"))

# Remove the temporary _sort_date before saving
for job in merged_nj_jobs:
    if "_sort_date" in job:
        del job["_sort_date"]

# Save merged data
with open("nj-internships.json", "w") as f:
    json.dump(merged_nj_jobs, f, indent=4)

print(f"Updated nj-internships.json with {len(merged_nj_jobs)} NJ internships from 2026 or later, sorted by start date.")
