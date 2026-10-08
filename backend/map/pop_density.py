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

router = APIRouter(prefix="/api")


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