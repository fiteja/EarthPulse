
# from pathlib import Path
# import requests
# import rasterio
# from rasterio.transform import from_origin
# import json

# url = "https://cmr.earthdata.nasa.gov/search/collections"

# headers = {
# 	"Authorization": f"Bearer {TOKEN}",
#     "Accept": "application/json",
#     "Client-Id": "imuondo"
# }

# params = {
#     "keyword": "population",
# 	"page_size": 100
# }

# BASE_DIR = Path(__file__).resolve().parents[2]

# NASA_DIR = BASE_DIR / "data" / "nasa"

# NASA_DIR.mkdir(parents=True, exist_ok=True)

# def download_nasa_data():
# 	"""
# 	Download the nasa data from NASA's CMR API.
# 	"""
# 	nasa_file = NASA_DIR / "nasa_data.json"
# 	response = requests.get(url, headers=headers, params=params)

# 	if (response.ok):
# 		print("Succefull request")
# 		data = response.json()
# 		with open(nasa_file, "w") as f:
# 			json.dump(data, f, ensure_ascii=False, indent=4)

# 	else:
# 		print(f"Error: {response.status_code}")

# def download_population_data():
# 	"""
# 	Download the population data from NASA's CMR API.
# 	"""
# 	population_file = NASA_DIR / "population_data.json"
# 	response = requests.get(url, headers=headers, params=params)
# 	if (response.ok):
# 		print("Succefull request")
# 		data = response.json()
# 		population_entries = []
# 		for entry in data.get("feed", {}).get("entry", []):
# 			if "population" in (entry.get("title") or "").lower() and "SEDAC" in (entry.get("data_center") or ""):
# 				population_entries.append({
# 					"id": entry.get("id"),
# 					"title": entry.get("title"),
# 					"summary": entry.get("summary"),
# 				})
# 			print("id:", entry.get("id"))
# 		with open(population_file, "w") as f:
# 			json.dump(population_entries, f, ensure_ascii=False, indent=4)


import threading
import zipfile
from pathlib import Path

import earthaccess
import numpy as np
import rasterio
from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from fastapi.responses import JSONResponse
from rasterio.warp import transform as warp_transform

# ============================================================
# CONFIGURAÇÃO
# ============================================================

COLECTION = "CIESIN_SEDAC_GPWv4_POPDENS_R11"
RESOLUTION = "30_sec"
ALLOWED_YEARS = (2000, 2005, 2010, 2015, 2020)   # anos que o GPWv4 tem
DIR_RAW = Path("nasa_data/raw")                  # muda para o goinfre se faltar espaço

_locks = {y: threading.Lock() for y in ALLOWED_YEARS}
_jobs = {}            # ano -> "downloading" | "error: ..."
_logged_in = False


# ============================================================
# DOWNLOAD (uma vez por ano, fica em cache)
# ============================================================

def _login():
    global _logged_in
    if not _logged_in:
        # Não interactivo: corre antes, uma vez no terminal:
        #   python -c "import earthaccess; earthaccess.login(persist=True)"
        earthaccess.login(strategy="netrc")
        _logged_in = True


def _tifs(year):
    folder = DIR_RAW / str(year)
    if not folder.exists():
        return []
    return sorted(
        t for t in folder.rglob("*.tif") if RESOLUTION in t.name.lower()
    )


def ensure_year(year):
    """Garante que os .tif desse ano estão no disco."""
    if year not in ALLOWED_YEARS:
        raise ValueError(f"Ano inválido: {year}")

    with _locks[year]:                    # evita dois downloads do mesmo ano
        if _tifs(year):
            return

        _login()
        folder = DIR_RAW / str(year)
        folder.mkdir(parents=True, exist_ok=True)

        results = earthaccess.search_data(
            short_name=COLECTION,
            temporal=(f"{year}-01-01", f"{year}-12-31"),
        )

        target = []
        for r in results:
            name = str(r["umm"]["GranuleUR"]).lower()
            if str(year) in name and RESOLUTION in name and "_tif" in name:
                target.append(r)

        if not target:
            raise RuntimeError(f"Nenhum granule para {year} / {RESOLUTION}")

        files = earthaccess.download(target, local_path=str(folder))

        for f in files:
            f = Path(f)
            if f.suffix.lower() == ".zip":
                with zipfile.ZipFile(f) as z:
                    z.extractall(folder)
                f.unlink()                # apaga o zip para poupar espaço


def _prepare(year):
    _jobs[year] = "downloading"
    try:
        ensure_year(year)
        _jobs.pop(year, None)
    except Exception as e:
        _jobs[year] = f"error: {e}"


# ============================================================
# LEITURA DO PONTO
# ============================================================

def density_at(year, lat, lon):
    for tif in _tifs(year):
        with rasterio.open(tif) as src:
            x, y = lon, lat
            if src.crs and src.crs.to_epsg() != 4326:
                xs, ys = warp_transform("EPSG:4326", src.crs, [lon], [lat])
                x, y = xs[0], ys[0]

            b = src.bounds
            if not (b.left <= x <= b.right and b.bottom <= y <= b.top):
                continue                  # este ficheiro não cobre o ponto

            val = next(src.sample([(x, y)], masked=True))[0]
            if np.ma.is_masked(val) or val < 0:
                density = None            # oceano / sem dados
            else:
                density = float(val)

            return {
                "year": year,
                "lat": lat,
                "lon": lon,
                "density_hab_km2": density,
                "file": tif.name,
            }

    return {"year": year, "lat": lat, "lon": lon,
            "density_hab_km2": None, "file": None}


# ============================================================
# ROTAS FASTAPI
# ============================================================

router = APIRouter(prefix="/population", tags=["Population"])


@router.get("/density/years")
def years():
    return {"years": list(ALLOWED_YEARS)}


@router.get("/density")
def density(
    bg: BackgroundTasks,
    year: int = Query(...),
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
):
    if year not in ALLOWED_YEARS:
        raise HTTPException(422, f"Ano deve ser um de {list(ALLOWED_YEARS)}")

    if not _tifs(year):
        status = _jobs.get(year)
        if status is None:
            bg.add_task(_prepare, year)
            status = "downloading"
        elif status.startswith("error"):
            _jobs.pop(year, None)         # deixa tentar de novo no próximo pedido
            raise HTTPException(500, status)
        return JSONResponse(status_code=202, content={"status": status})

    return density_at(year, lat, lon)
