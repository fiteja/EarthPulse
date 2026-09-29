import rasterio

def get_nvdi(lat: float, lon: float, year: int):
	filename = f"data/nvdi/nvdi_{year}.tif"
	
	with rasterio.open(filename) as raster:
		row, col = raster.index(lon, lat)
		nvdi = raster.read(1)[row, col]
		return float(nvdi)
	


