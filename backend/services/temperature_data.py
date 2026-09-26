# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    temperature_data.py                                :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: imuondo <imuondo@student.42.fr>            +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/09/26 17:00:25 by imuondo           #+#    #+#              #
#    Updated: 2026/09/26 17:01:02 by imuondo          ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

import rasterio

def get_temperature(lat: float, lon: float, year: int):
	filename = f"data/temperature/temperature_{year}.tif"
	
	with rasterio.open(filename) as raster:
		row, col = raster.index(lon, lat)
		temperature = raster.read(1)[row, col]
		return float(temperature)
	
