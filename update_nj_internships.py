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

# Filter for NJ internships in 2026 or later
new_nj_jobs = []
for job in all_jobs:
    # Check location
    if "locations" not in job:
        continue
    if not any(loc and ("nj" in loc.lower() or "new jersey" in loc.lower()) for loc in job["locations"]):
        continue

    # Check date/year
    # Assume the job has 'start_date' in format 'YYYY-MM-DD' or 'year' field
    job_year = None
    if "start_date" in job:
        try:
            job_year = int(job["start_date"].split("-")[0])
        except Exception:
            continue
    elif "year" in job:
        try:
            job_year = int(job["year"])
        except Exception:
            continue

    if job_year and job_year >= 2026:
        new_nj_jobs.append(job)

# Load existing NJ internships if file exists
nj_file = Path("nj-internships.json")
if nj_file.exists():
    with open(nj_file) as f:
        existing_nj_jobs = json.load(f)
else:
    existing_nj_jobs = []

# Merge and remove duplicates (by 'id' if it exists, otherwise by title+company)
existing_ids = {job.get("id") for job in existing_nj_jobs if "id" in job}
merged_nj_jobs = existing_nj_jobs + [job for job in new_nj_jobs if job.get("id") not in existing_ids]

# Save merged data
with open("nj-internships.json", "w") as f:
    json.dump(merged_nj_jobs, f, indent=4)

print(f"Updated nj-internships.json with {len(merged_nj_jobs)} NJ internships from 2026 or later.")
