import requests
import json
import os

# --- Step 1: Fetch the full internship listings ---
url = "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/main/.github/scripts/listings.json"
response = requests.get(url)

if response.status_code != 200:
    print("Failed to fetch listings.json")
    exit(1)

all_jobs = response.json()

# --- Step 2: Filter for NJ internships ---
nj_jobs = [job for job in all_jobs if "nj" in job.get("location", "").lower()]

print(f"Found {len(nj_jobs)} NJ internships.")

# --- Step 3: Save to your repo's nj-internships.json ---
# Path to the JSON file in your website repo
output_file = "nj-internships.json"

with open(output_file, "w") as f:
    json.dump(nj_jobs, f, indent=4)

print(f"Updated {output_file} successfully.")
