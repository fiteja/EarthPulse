from pathlib import Path
import json

import requests
import rasterio


BASE_DIR = Path(__file__).resolve().parents[2]

NASA_DIR = BASE_DIR / "data" / "nasa"
POPULATION_DIR = BASE_DIR / "data" / "population"

NASA_SERVICE = (
    "https://gis.earthdata.nasa.gov"
    "/image/rest/services/SEDAC/"
    "ciesin_sedac_pd_sspbsyr_1_8th/ImageServer"
)

YEARS = [
    2000,
    2010,
    2020,
    2030,
    2040,
    2050,
    2060,
    2070,
    2080,
    2090,
    2100,
]

# Angola
WEST = 11.5
SOUTH = -18.1
EAST = 24.1
NORTH = -4.3


def get_service_info():
    """
    Get the NASA ImageServer information.
    """

    url = NASA_SERVICE

    response = requests.get(
        url,
        params={"f": "json"},
        timeout=60
    )

    response.raise_for_status()

    return response.json()


def show_service_info():
    """
    Show important information about the NASA service.
    """

    info = get_service_info()

    print("\n=== NASA SEDAC ImageServer ===")
    print(f"Name: {info.get('name')}")
    print(f"Description: {info.get('description')}")
    print(f"Pixel X: {info.get('pixelSizeX')}")
    print(f"Pixel Y: {info.get('pixelSizeY')}")
    print(f"SR: {info.get('spatialReference')}")

    print("\nDimensions:")
    print(json.dumps(
        info.get("dimensions", {}),
        indent=4
    ))

    return info


def download_year(year):
    """
    Download the population raster for Angola for a given year.
    """

    POPULATION_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    output = POPULATION_DIR / f"population_{year}.tif"

    if output.exists():
        print(f"Already exists: {output}")
        return True

    print(f"\nDownloading population {year}...")

    export_url = f"{NASA_SERVICE}/exportImage"

    params = {
        "f": "image",
        "bbox": f"{WEST},{SOUTH},{EAST},{NORTH}",
        "bboxSR": "4326",
        "imageSR": "4326",
        "size": "106,111",
        "format": "tiff",
        "pixelType": "S32",
        "interpolation": "Nearest",
    }

    response = requests.get(
        export_url,
        params=params,
        timeout=120
    )

    response.raise_for_status()

    content_type = response.headers.get(
        "Content-Type",
        ""
    )

    if "image" not in content_type.lower():
        print("NASA did not return an image.")
        print(response.text[:1000])
        return False

    output.write_bytes(
        response.content
    )

    print(f"Saved: {output}")

    return True


def main():

    NASA_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    POPULATION_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    print("Connecting to NASA Earthdata...")
    show_service_info()

    for year in YEARS:

        success = download_year(year)

        if not success:
            print(
                f"Failed to download population for {year}"
            )
            break


if __name__ == "__main__":
    main()