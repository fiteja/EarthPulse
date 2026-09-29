
from pathlib import Path
import requests
import rasterio
from rasterio.transform import from_origin
import json

url = "https://cmr.earthdata.nasa.gov/search/collections"

headers = {
	"Authorization": f"Bearer {TOKEN}",
    "Accept": "application/json",
    "Client-Id": "imuondo"
}

params = {
    "keyword": "population",
    "page_size": 100,
	 "bounding_box[]": "11.6,-18.1,24.1,-4.3"
}

BASE_DIR = Path(__file__).resolve().parents[2]

NASA_DIR = BASE_DIR / "data" / "nasa"

NASA_DIR.mkdir(parents=True, exist_ok=True)

def download_nasa_data():
	"""
	Download the nasa data from NASA's CMR API.
	"""
	nasa_file = NASA_DIR / "nasa_data.json"
	response = requests.get(url, headers=headers, params=params)

	if (response.ok):
		print("Succefull request")
		data = response.json()
		with open(nasa_file, "w", encoding="utf-8") as f:
			json.dump(data, f, ensure_ascii=False, indent=4)

	else:
		print(f"Error: {response.status_code}")

def download_population_data():
	"""
	Download the population data from NASA's CMR API.
	"""
	population_file = NASA_DIR / "population_data.json"
	response = requests.get(url, headers=headers, params=params)
	if (response.ok):
		print("Succefull request")
		data = response.json()
		population_entries = []
		for entry in data.get("feed", {}).get("entry", []):
			if entry.get("title"):
				population_entries.append({
					"id": entry.get("id"),
					"title": entry.get("title"),
					"summary": entry.get("summary"),
					"start_date": entry.get("start_date"),
					"end_date": entry.get("end_date"),
				})
		with open(population_file, "w", encoding="utf-8") as f:
			json.dump(population_entries, f, ensure_ascii=False, indent=4)



