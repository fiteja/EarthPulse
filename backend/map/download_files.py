import zipfile
from pathlib import Path

import earthaccess
import geopandas as gpd
import numpy as np
import rasterio
from rasterio.mask import mask

from map.map import draw_map


# ============================================================
# 1. CONFIGURATION
# ============================================================

YEAR = 2020

RESOLUTION = "30_sec"
# Exemples:
# "30_sec"
# "2pt5_min"
# "15_min"
# "30_min"
# "1_deg"

COLECTION = "CIESIN_SEDAC_GPWv4_POPDENS_R11"
DIR_NASA = Path("nasa_data")
resultados = ""
DIR_EXTRACT = ""
DIR_EXIT = ""
tifs = []

# ============================================================
# 2. DIRECTORY
# ============================================================

def directory():
    DIR_NASA = Path("nasa_data")
    DIR_NASA.mkdir(parents=True, exist_ok=True)
    DIR_EXTRACT = DIR_NASA / "extract"
    DIR_EXTRACT.mkdir(parents=True, exist_ok=True)
    DIR_EXIT = DIR_NASA / "processed"
    DIR_EXIT.mkdir(parents=True, exist_ok=True)

# ============================================================
# 3. LIMITE DE ANGOLA
# ============================================================

def angola_map():
    ANGOLA_MAP = DIR_NASA / "angola.gpkg"
    # If the file do not exist, try to create
    if not ANGOLA_MAP.exists():
        print("Angola limits not found.")
        print("Executing draw_map()...")
        draw_map()

    if not ANGOLA_MAP.exists():
        raise FileNotFoundError(f"Angola's limits not found in: {ANGOLA_MAP}")

# ============================================================
# 4. LOGIN NA NASA EARTHDATA
# ============================================================

def login_nasa():
    print("\nAutenticating in NASA Earthdata...")
    earthaccess.login()
    print("Login succeful.")

# ============================================================
# 5. TO FIND THE DATASET
# ============================================================

def find_dataset():
    print("\nFind data...")
    print(f"Year: {YEAR}")
    print(f"Resolution: {RESOLUTION}")
    print(f"Colection: {COLECTION}")
    results = earthaccess.search_data(
        short_name=COLECTION,
        temporal=(f"{YEAR}-01-01", f"{YEAR}-12-31",
        ),
    )
    print(f"\nFound Granules: {len(results)}")
    for i, result in enumerate(results, start=1):
        try:
            url = result["umm"]["GranuleUR"]
        except (KeyError, TypeError):
            url = str(result)
        print(f"{i}. {url}")
    return results

# ============================================================
# 6. FILTRAR O GRANULE CORRETO
# ============================================================

def filtrate_granule():
    target = []
    results = find_dataset()
    for result in results:

        try:
            url = str(result["umm"]["GranuleUR"])
        except (KeyError, TypeError):
            continue

        url_lower = url.lower()

        year_ok = str(YEAR) in url_lower
        resolution_ok = RESOLUTION.lower() in url_lower

        if year_ok and resolution_ok:
            target.append(result)

    # Se não encontrou usando ano + resolução,
    # tenta pelo menos pelo ano.
    if not target:
        print("\nNão foi encontrado nenhum granule "
            "com ano + resolução no nome."
        )
        target = []
        for result in results:

            try:
                url = str(result["umm"]["GranuleUR"])
            except (KeyError, TypeError):
                continue

            if str(YEAR) in url:
                target.append(result)


    if not target:
        raise RuntimeError(
            "Nenhum granule corresponde ao ano solicitado."
        )

    results = target

    print(
        f"\nGranules selecionados para download: "
        f"{len(results)}"
    )
    return results


# ============================================================
# 7. DOWNLOAD
# ============================================================

def download_files():
    print("\nStarting download...")
    results = filtrate_granule()
    files = earthaccess.download(
        results,
        local_path=str(DIR_NASA),
    )

    print("\nFiles downloaded:")

    for file in files:
        print(" -", file)
    return files

# ============================================================
# 8. DESCOMPACTAR E PROCURAR GEOTIFF
# ============================================================

def extract_geotiff():
    files = download_files()
    for file in files:

        file = Path(file)

        # ------------------------------------------
        # ZIP
        # ------------------------------------------

        if file.suffix.lower() == ".zip":

            print(f"\nExtraindo: {file.name}")

            with zipfile.ZipFile(file, "r") as zip_ref:
                zip_ref.extractall(DIR_EXTRACT)

        # ------------------------------------------
        # TIFF direto
        # ------------------------------------------

        elif file.suffix.lower() in (".tif", ".tiff"):

            tifs.append(file)


    # Procurar todos os TIFFs extraídos
    tifs.extend(
        DIR_EXTRACT.rglob("*.tif")
    )

    tifs.extend(
        DIR_EXTRACT.rglob("*.tiff")
    )

    # Remover duplicados
    tifs = list(dict.fromkeys(tifs))

    print("\nGeoTIFFs encontrados:")

    for tif in tifs:
        print(" -", tif)


    if not tifs:
        raise RuntimeError(
            "Nenhum arquivo .tif/.tiff foi encontrado."
        )

# ============================================================
# 9. ESCOLHER O RASTER CORRETO
# ============================================================

def choose_raster():
    candidates = []
    for tif in tifs:
        nome = tif.name.lower()
        year_ok = str(YEAR) in nome
        resolution_ok = RESOLUTION.lower() in nome
        if year_ok and resolution_ok:
            candidates.append(tif)
    # Se não encontrar por ano + resolução,
    # tenta apenas pelo ano.
    if not candidates:
        print(
            "\nNenhum TIFF correspondeu simultaneamente "
            "ao ano e à resolução."
        )
        candidates = [
            tif
            for tif in tifs
            if str(YEAR) in tif.name
        ]
    if not candidates:
        print("\nTIFFs disponíveis:")
        for tif in tifs:
            print(" -", tif.name)
        raise RuntimeError(
            "Nenhum TIFF adequado foi encontrado."
        )
    arquivo = candidates[0]
    print("\nRaster selected:")
    print(arquivo)

# ============================================================
# 10. ABRIR LIMITE DE ANGOLA
# ============================================================

def open_angola_map():
    print("\nLoading Angola's limits...")
    angola = gpd.read_file(ANGOLA_MAP)
    if angola.empty:
        raise RuntimeError(
            "O arquivo de Angola não contém nenhuma geometria."
        )
    # Remover geometrias vazias
    angola = angola[
        angola.geometry.notna()
        & ~angola.geometry.is_empty
    ]
    if angola.empty:
        raise RuntimeError(
            "Não existem geometrias válidas no limite de Angola."
        )
    # Corrigir geometria, quando possível
    angola["geometry"] = angola.geometry.make_valid()
    print("CRS do limite:", angola.crs)


# ============================================================
# 11. ABRIR RASTER
# ============================================================
def open_raster():
    with rasterio.open(file) as src:

        print("\nInformações do raster:")
        print("CRS:", src.crs)
        print("Largura:", src.width)
        print("Altura:", src.height)
        print("Bandas:", src.count)
        print("Nodata:", src.nodata)

        if src.crs is None:
            raise RuntimeError(
                "O raster não possui CRS definido."
            )

        # ------------------------------------------
        # Reprojetar Angola para o CRS do raster
        # ------------------------------------------

        angola_raster = angola.to_crs(src.crs)

        # ------------------------------------------
        # Recortar raster
        # ------------------------------------------

        imagem, transform = mask(
            src,
            angola_raster.geometry,
            crop=True,
            filled=False,
        )

        # ------------------------------------------
        # Copiar perfil original
        # ------------------------------------------

        perfil = src.profile.copy()

        perfil.update(
            {
                "height": imagem.shape[1],
                "width": imagem.shape[2],
                "transform": transform,
            }
        )


# =============================================================
#   
# ============================================================
def download():
    directory()
    angola_map()
    login_nasa()
    find_dataset()
    filtrate_granule()
    download_files()
    extract_geotiff()

