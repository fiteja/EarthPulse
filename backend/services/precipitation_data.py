import rasterio

def get_precipitation(lat: float, lon: float, year: int):
	filename = f"data/precipitation/precipitation_{year}.tif"
	
	with rasterio.open(filename) as raster:
		row, col = raster.index(lon, lat)
		precipitation = raster.read(1)[row, col]
		return float(precipitation)
