import requests
import geopandas as gpd
from pathlib import Path

url = "https://www.geoboundaries.org/api/current/gbOpen/AGO/ADM0/"

params = {

}

def draw_map():
    info = requests.get(url).json()

    map = info["gjDownloadURL"]

    gdf = gpd.read_file(map)
    print(gdf)

    BASE_DIR = Path(__file__).resolve().parents[1]
    DIR = BASE_DIR / "nasa_data"

    DIR.mkdir(parents=True, exist_ok=True)

    PATH = DIR / "angola.gpkg" 
    gdf.to_file(PATH, driver="GPKG")
    print("Criado angola.gpkg")
