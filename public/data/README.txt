Ficheiros opcionais (a app detecta-os sozinha, sem erros se faltarem):

- /data/angola-adm1.geojson -> limites das províncias. Gerado por "npm run data" (validado).
                               Propriedade do nome: "name" (ou "shapeName").
                               Se faltar, a app tenta as fontes online de src/config/mapSources.ts.
- /data/countries.geojson   -> fronteiras nacionais (Natural Earth).
- /data/SOURCES.json        -> origem e atribuição dos ficheiros acima.
- /textures/clouds.png      -> textura de nuvens (opcional, ainda não usada).

Execute "npm run data" numa máquina com Internet e inclua os ficheiros no repositório,
se a licença o permitir (geoBoundaries CC BY 4.0, Natural Earth domínio público).
