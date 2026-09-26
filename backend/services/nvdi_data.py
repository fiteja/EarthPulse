# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    nvdi_data.py                                       :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: imuondo <imuondo@student.42.fr>            +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/09/26 17:01:43 by imuondo           #+#    #+#              #
#    Updated: 2026/09/26 17:02:07 by imuondo          ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

import rasterio

def get_nvdi(lat: float, lon: float, year: int):
	filename = f"data/nvdi/nvdi_{year}.tif"
	
	with rasterio.open(filename) as raster:
		row, col = raster.index(lon, lat)
		nvdi = raster.read(1)[row, col]
		return float(nvdi)
	


