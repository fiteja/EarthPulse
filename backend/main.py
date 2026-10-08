from fastapi import FastAPI

from nasa.population import router as population_router


app = FastAPI(
    title="ANIMOOS EarthPulse API",
    description="API para consulta de dados ambientais e populacionais",
    version="1.0.0",
)


app.include_router(
    population_router,
    prefix="/api",
)


@app.get("/")
def root():
    return {
        "name": "ANIMOOS EarthPulse API",
        "version": "1.0.0",
        "status": "online",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }