# from fastapi import FastAPI
# from services.population_data import get_population
# from services.nvdi_data import get_nvdi
# from services.precipitation_data import get_precipitation
# from services.temperature_data import get_temperature
# from nasa.population import download_nasa_data
# from nasa.population import download_population_data

# app = FastAPI()

# @app.get("/api/earth-data")

# # def	get_earth_data(lat: float, lon: float, year: int):
# #     population = get_population(lat, lon, year)
# #     temperature = get_temperature(lat, lon, year)
# #     nvdi = get_nvdi(lat, lon, year)
# #     precipitation = get_precipitation(lat, lon, year)
# #     print("Teste")
# #     return {
# #         "population" : population,
# #         "temperature" : temperature,
# #         "nvdi" : nvdi,
# #         "precipitation" : precipitation,
# #     }

# # get_earth_data(-8.34,13.32,2025)

# def main():
#     download_nasa_data()
#     download_population_data()

# if __name__ == "__main__":
#     main()

# pip install earthaccess rasterio geopandas

import zipfile
from pathlib import Path

import earthaccess
import geopandas as gpd
import numpy as np
import rasterio
from rasterio.mask import mask

from map.map import draw_map
from map.download_files import download

# ============================================================
# 1. CONFIGURAÇÃO
# ============================================================

# ANO = 2020

# RESOLUCAO = "30_sec"
# # Exemplos:
# # "30_sec"
# # "2pt5_min"
# # "15_min"
# # "30_min"
# # "1_deg"

# COLECAO = "CIESIN_SEDAC_GPWv4_POPDENS_R11"


# # ============================================================
# # 2. PASTAS
# # ============================================================



# PASTA_NASA = Path("nasa_data")
# PASTA_NASA.mkdir(parents=True, exist_ok=True)

# PASTA_EXTRAIDO = PASTA_NASA / "extraido"
# PASTA_EXTRAIDO.mkdir(parents=True, exist_ok=True)

# PASTA_SAIDA = PASTA_NASA / "processado"
# PASTA_SAIDA.mkdir(parents=True, exist_ok=True)


# # ============================================================
# # 3. LIMITE DE ANGOLA
# # ============================================================

# MAPA_ANGOLA = PASTA_NASA / "angola.gpkg"

# # Se o ficheiro não existir, tenta criá-lo
# if not MAPA_ANGOLA.exists():
#     print("Limite de Angola não encontrado.")
#     print("A executar draw_map()...")

#     draw_map()

# if not MAPA_ANGOLA.exists():
#     raise FileNotFoundError(
#         f"Não encontrei o limite de Angola em: {MAPA_ANGOLA}"
#     )


# # ============================================================
# # 4. LOGIN NA NASA EARTHDATA
# # ============================================================

# print("\nAutenticando na NASA Earthdata...")

# earthaccess.login()

# print("Login concluído.")


# # ============================================================
# # 5. PROCURAR O DATASET
# # ============================================================

# print("\nProcurando dados...")
# print(f"Ano: {ANO}")
# print(f"Resolução: {RESOLUCAO}")
# print(f"Coleção: {COLECAO}")

# resultados = earthaccess.search_data(
#     short_name=COLECAO,
#     temporal=(
#         f"{ANO}-01-01",
#         f"{ANO}-12-31",
#     ),
# )

# print(f"\nGranules encontrados: {len(resultados)}")


# for i, resultado in enumerate(resultados, start=1):
#     try:
#         url = resultado["umm"]["GranuleUR"]
#     except (KeyError, TypeError):
#         url = str(resultado)

#     print(f"{i}. {url}")


# # ============================================================
# # 6. FILTRAR O GRANULE CORRETO
# # ============================================================

# alvo = []

# for resultado in resultados:

#     try:
#         url = str(resultado["umm"]["GranuleUR"])
#     except (KeyError, TypeError):
#         continue

#     url_lower = url.lower()

#     ano_ok = str(ANO) in url_lower
#     resolucao_ok = RESOLUCAO.lower() in url_lower

#     if ano_ok and resolucao_ok:
#         alvo.append(resultado)


# # Se não encontrou usando ano + resolução,
# # tenta pelo menos pelo ano.
# if not alvo:

#     print(
#         "\nNão foi encontrado nenhum granule "
#         "com ano + resolução no nome."
#     )

#     alvo = []

#     for resultado in resultados:

#         try:
#             url = str(resultado["umm"]["GranuleUR"])
#         except (KeyError, TypeError):
#             continue

#         if str(ANO) in url:
#             alvo.append(resultado)


# if not alvo:
#     raise RuntimeError(
#         "Nenhum granule corresponde ao ano solicitado."
#     )


# resultados = alvo

# print(
#     f"\nGranules selecionados para download: "
#     f"{len(resultados)}"
# )


# # ============================================================
# # 7. DOWNLOAD
# # ============================================================

# print("\nIniciando download...")

# arquivos = earthaccess.download(
#     resultados,
#     local_path=str(PASTA_NASA),
# )

# print("\nArquivos baixados:")

# for arquivo in arquivos:
#     print(" -", arquivo)

download()

# # ============================================================
# # 8. DESCOMPACTAR E PROCURAR GEOTIFF
# # ============================================================

# tifs = []


# for arquivo in arquivos:

#     arquivo = Path(arquivo)

#     # ------------------------------------------
#     # ZIP
#     # ------------------------------------------

#     if arquivo.suffix.lower() == ".zip":

#         print(f"\nExtraindo: {arquivo.name}")

#         with zipfile.ZipFile(arquivo, "r") as zip_ref:
#             zip_ref.extractall(PASTA_EXTRAIDO)

#     # ------------------------------------------
#     # TIFF direto
#     # ------------------------------------------

#     elif arquivo.suffix.lower() in (".tif", ".tiff"):

#         tifs.append(arquivo)


# # Procurar todos os TIFFs extraídos
# tifs.extend(
#     PASTA_EXTRAIDO.rglob("*.tif")
# )

# tifs.extend(
#     PASTA_EXTRAIDO.rglob("*.tiff")
# )


# # Remover duplicados
# tifs = list(dict.fromkeys(tifs))


# print("\nGeoTIFFs encontrados:")

# for tif in tifs:
#     print(" -", tif)


# if not tifs:
#     raise RuntimeError(
#         "Nenhum arquivo .tif/.tiff foi encontrado."
#     )


# ============================================================
# 9. ESCOLHER O RASTER CORRETO
# ============================================================

candidatos = []

for tif in tifs:

    nome = tif.name.lower()

    ano_ok = str(ANO) in nome
    resolucao_ok = RESOLUCAO.lower() in nome

    if ano_ok and resolucao_ok:
        candidatos.append(tif)


# Se não encontrar por ano + resolução,
# tenta apenas pelo ano.
if not candidatos:

    print(
        "\nNenhum TIFF correspondeu simultaneamente "
        "ao ano e à resolução."
    )

    candidatos = [
        tif
        for tif in tifs
        if str(ANO) in tif.name
    ]


if not candidatos:

    print("\nTIFFs disponíveis:")

    for tif in tifs:
        print(" -", tif.name)

    raise RuntimeError(
        "Nenhum TIFF adequado foi encontrado."
    )


arquivo = candidatos[0]

print("\nRaster selecionado:")
print(arquivo)


# ============================================================
# 10. ABRIR LIMITE DE ANGOLA
# ============================================================

print("\nCarregando limite de Angola...")

angola = gpd.read_file(MAPA_ANGOLA)


if angola.empty:
    raise RuntimeError(
        "O arquivo de Angola não contém nenhuma geometria."
    )


# Remover geometrias vazias
angola = angola[
    angola.geometry.notna()
    & ~angola.geometry.is_empty
]


if angola.empty:
    raise RuntimeError(
        "Não existem geometrias válidas no limite de Angola."
    )


# Corrigir geometria, quando possível
angola["geometry"] = angola.geometry.make_valid()


print("CRS do limite:", angola.crs)


# ============================================================
# 11. ABRIR RASTER
# ============================================================

with rasterio.open(arquivo) as src:

    print("\nInformações do raster:")
    print("CRS:", src.crs)
    print("Largura:", src.width)
    print("Altura:", src.height)
    print("Bandas:", src.count)
    print("Nodata:", src.nodata)

    if src.crs is None:
        raise RuntimeError(
            "O raster não possui CRS definido."
        )

    # ------------------------------------------
    # Reprojetar Angola para o CRS do raster
    # ------------------------------------------

    angola_raster = angola.to_crs(src.crs)

    # ------------------------------------------
    # Recortar raster
    # ------------------------------------------

    imagem, transform = mask(
        src,
        angola_raster.geometry,
        crop=True,
        filled=False,
    )

    # ------------------------------------------
    # Copiar perfil original
    # ------------------------------------------

    perfil = src.profile.copy()

    perfil.update(
        {
            "height": imagem.shape[1],
            "width": imagem.shape[2],
            "transform": transform,
        }
    )


# ============================================================
# 12. PROCESSAR DADOS
# ============================================================

# Estamos interessados na primeira banda
dados = imagem[0].astype("float32")


# Pixels fora de Angola -> NaN
dados = dados.filled(np.nan)


# Densidade populacional não pode ser negativa
dados[dados < 0] = np.nan


# Verificar se existem dados válidos
pixels_validos = np.isfinite(dados)


if not np.any(pixels_validos):
    raise RuntimeError(
        "O recorte de Angola não possui pixels válidos."
    )


# ============================================================
# 13. ESTATÍSTICAS
# ============================================================

densidade_maxima = np.nanmax(dados)
densidade_media = np.nanmean(dados)
densidade_minima = np.nanmin(dados)


print("\nEstatísticas:")
print(
    f"Densidade mínima: {densidade_minima:.2f} hab/km²"
)

print(
    f"Densidade máxima: {densidade_maxima:.2f} hab/km²"
)

print(
    f"Densidade média: {densidade_media:.2f} hab/km²"
)


# ============================================================
# 14. SALVAR GEOTIFF FINAL
# ============================================================

saida = (
    PASTA_SAIDA
    / f"angola_densidade_{ANO}_{RESOLUCAO}.tif"
)


perfil.update(
    {
        "dtype": "float32",
        "count": 1,
        "nodata": -9999.0,
        "compress": "deflate",
        "predictor": 2,
    }
)


# Converter NaN para NoData
dados_saida = np.nan_to_num(
    dados,
    nan=-9999.0
).astype("float32")


# ============================================================
# 15. ESCREVER GEOTIFF
# ============================================================

with rasterio.open(
    saida,
    "w",
    **perfil
) as dst:

    dst.write(dados_saida, 1)


print("\n========================================")
print("PROCESSAMENTO CONCLUÍDO")
print("========================================")

print("Raster original:")
print(arquivo)

print("\nRaster final:")
print(saida)

print("\nDensidade máxima:")
print(f"{densidade_maxima:.2f} hab/km²")

print("\nDensidade média:")
print(f"{densidade_media:.2f} hab/km²")