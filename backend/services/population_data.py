import rasterio

def get_population(lat: float, lon: float, year: int):
	filename = f"data/population/population_{year}.tif"
	
	with rasterio.open(filename) as raster:
		row, col = raster.index(lon, lat)
		population = raster.read(1)[row, col]
		return float(population)
	
