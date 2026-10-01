
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
	"page_size": 100
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
		with open(nasa_file, "w") as f:
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
			if "population" in (entry.get("title") or "").lower() and "SEDAC" in (entry.get("data_center") or ""):
				population_entries.append({
					"id": entry.get("id"),
					"title": entry.get("title"),
					"summary": entry.get("summary"),
				})
			print("id:", entry.get("id"))
		with open(population_file, "w") as f:
			json.dump(population_entries, f, ensure_ascii=False, indent=4)



