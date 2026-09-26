# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    download_data.py                                   :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: imuondo <imuondo@student.42.fr>            +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/09/22 19:46:59 by imuondo           #+#    #+#              #
#    Updated: 2026/09/26 18:40:06 by imuondo          ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

from pathlib import Path
import rasterio
from rasterio.transform import from_origin
import os
import xarray as xr

BASE_DIR = Path(__file__).resolve().parents[2]

NASA_DIR = BASE_DIR / "data" / "nasa" / "population.nc"



def get_nasa_data(year):

    dataset = xr.open_dataset(
        "data/nasa/population.nc"
    )

    matriz = dataset["population"].sel(
        year=year
    ).values

    return matriz

for year in range(2000, 2101):

    caminho = f"data/population/population_{year}.tif"

    print(f"Processando {year}...")
    matriz = get_nasa_data(year)
    with rasterio.open(
        caminho,
        "w",
        driver="GTiff",
        height=matriz.shape[0],
        width=matriz.shape[1],
        count=1,
        dtype=matriz.dtype,
        crs="EPSG:4326"
    ) as dst:

        dst.write(matriz, 1)

    print(f"Guardado: {caminho}")