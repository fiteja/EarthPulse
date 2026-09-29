import rasterio

def get_temperature(lat: float, lon: float, year: int):
	filename = f"data/temperature/temperature_{year}.tif"
	
	with rasterio.open(filename) as raster:
		row, col = raster.index(lon, lat)
		temperature = raster.read(1)[row, col]
		return float(temperature)
	
