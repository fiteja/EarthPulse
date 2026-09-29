from fastapi import FastAPI
from services.population_data import get_population
from services.nvdi_data import get_nvdi
from services.precipitation_data import get_precipitation
from services.temperature_data import get_temperature
from nasa.population import download_nasa_data
from nasa.population import download_population_data

app = FastAPI()

@app.get("/api/earth-data")

# def	get_earth_data(lat: float, lon: float, year: int):
#     population = get_population(lat, lon, year)
#     temperature = get_temperature(lat, lon, year)
#     nvdi = get_nvdi(lat, lon, year)
#     precipitation = get_precipitation(lat, lon, year)
#     print("Teste")
#     return {
#         "population" : population,
#         "temperature" : temperature,
#         "nvdi" : nvdi,
#         "precipitation" : precipitation,
#     }

# get_earth_data(-8.34,13.32,2025)

def main():
    download_nasa_data()
    download_population_data()

if __name__ == "__main__":
    main()