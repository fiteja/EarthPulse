# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    precipitation_data.py                              :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: imuondo <imuondo@student.42.fr>            +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/09/26 17:02:46 by imuondo           #+#    #+#              #
#    Updated: 2026/09/26 17:02:58 by imuondo          ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

import rasterio

def get_precipitation(lat: float, lon: float, year: int):
	filename = f"data/precipitation/precipitation_{year}.tif"
	
	with rasterio.open(filename) as raster:
		row, col = raster.index(lon, lat)
		precipitation = raster.read(1)[row, col]
		return float(precipitation)
