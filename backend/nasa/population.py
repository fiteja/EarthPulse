
from pathlib import Path
import requests
import rasterio
from rasterio.transform import from_origin
import json

TOKEN = "eyJ0eXAiOiJKV1QiLCJvcmlnaW4iOiJFYXJ0aGRhdGEgTG9naW4iLCJzaWciOiJlZGxqd3RwdWJrZXlfb3BzIiwiYWxnIjoiUlMyNTYifQ.eyJ0eXBlIjoiVXNlciIsInVpZCI6ImltdW9uZG8iLCJleHAiOjE3OTUyNjk0OTcsImlhdCI6MTc5MDA4NTQ5NywiaXNzIjoiaHR0cHM6Ly91cnMuZWFydGhkYXRhLm5hc2EuZ292IiwiaWRlbnRpdHlfcHJvdmlkZXIiOiJlZGxfb3BzIiwiYWNyIjoiZWRsIiwiYXNzdXJhbmNlX2xldmVsIjozfQ.gEqHrdMVBvWKirvhSy7ljnGXp-5iqcDoA2-RgQ8a9v34nlKzXFQDaJnU-Str-0CSOZcvzgGE4LlqL1-QpRLCIvD5sjmquGuZkH6VvoS332-SGPrlo-6mIUC95rWOAzVEmD6rJPEslVrn88rnimckm3ugPWoSawi4GLzOitlbfvlgZ81FyWmlDZ6JDSLH60E0zcao4vDFasLuo2r3QbuDJvc5npfZMCLLK3bzy9mhd1aB20Bk7vxMwkoQjVjerutBSCyMWaltFJyBKv7V51esd_t8F1uLrwG8M_0ajZkCM69Uakpupfsw8YJr1QdO_i5FPwyWBSxqAPw-DnSpmXDv6g"

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



