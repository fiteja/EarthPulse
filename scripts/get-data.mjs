// Guarda os limites geográficos em public/data para a app não depender da rede: npm run data
//
// Produz:
//   public/data/angola-adm1.geojson   províncias (validadas, com o nome em properties.name)
//   public/data/countries.geojson     fronteiras nacionais (Natural Earth)
//   public/data/SOURCES.json          origem e atribuição de cada ficheiro
import { mkdir, writeFile } from 'node:fs/promises';

const GEOB_PATH = 'wmgeolab/geoBoundaries/main/releaseData/gbOpen/AGO/ADM1/geoBoundaries-AGO-ADM1_simplified.geojson';
const NAME_KEYS = ['name', 'shapeName', 'NAME_1', 'name_pt', 'name_en', 'NAME', 'admin1', 'ADM1_PT', 'ADM1_EN'];
const EXPECTED = 21;

const sources = [
  { id: 'geoboundaries-api', api: 'https://www.geoboundaries.org/api/current/gbOpen/AGO/ADM1/', attribution: 'geoBoundaries (CC BY 4.0)' },
  { id: 'geoboundaries-media', url: `https://media.githubusercontent.com/media/${GEOB_PATH}`, attribution: 'geoBoundaries (CC BY 4.0)' },
  { id: 'geoboundaries-raw', url: `https://raw.githubusercontent.com/${GEOB_PATH}`, attribution: 'geoBoundaries (CC BY 4.0)' },
  // Último recurso: ficheiro grande (dezenas de MB), filtrado para Angola e guardado já pequeno.
  {
    id: 'natural-earth-10m',
    url: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson',
    filter: (f) => f.properties?.admin === 'Angola' || f.properties?.adm0_a3 === 'AGO',
    attribution: 'Natural Earth (domínio público)',
  },
];

const text = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  return res.text();
};

const nameOf = (p) => NAME_KEYS.map((k) => p?.[k]).find((v) => typeof v === 'string' && v.trim())?.trim();

function normalize(raw, filter) {
  if (raw?.type !== 'FeatureCollection' || !Array.isArray(raw.features)) throw new Error('não é um FeatureCollection');
  const features = raw.features
    .filter((f) => (filter ? filter(f) : true))
    .filter((f) => ['Polygon', 'MultiPolygon'].includes(f.geometry?.type) && nameOf(f.properties))
    .map((f) => ({ type: 'Feature', properties: { ...f.properties, name: nameOf(f.properties) }, geometry: f.geometry }));
  if (features.length < 10) throw new Error(`apenas ${features.length} províncias válidas`);
  return { type: 'FeatureCollection', features };
}

await mkdir('public/data', { recursive: true });
const record = {};

let provinces = null;
for (const s of sources) {
  try {
    let url = s.url;
    if (s.api) {
      const meta = JSON.parse(await text(s.api));
      const info = Array.isArray(meta) ? meta[0] : meta;
      url = info.simplifiedGeometryGeoJSON ?? info.gjDownloadURL;
    }
    provinces = normalize(JSON.parse(await text(url)), s.filter);
    record.provinces = { source: s.id, url, attribution: s.attribution, count: provinces.features.length };
    console.log(`Províncias: ${provinces.features.length} (fonte: ${s.id})`);
    break;
  } catch (err) {
    console.warn(`  ${s.id} falhou: ${err.message}`);
  }
}
if (!provinces) {
  console.error('Não foi possível obter os limites das províncias por nenhuma fonte.');
  process.exit(1);
}
if (provinces.features.length !== EXPECTED) {
  console.warn(`AVISO: ${provinces.features.length} províncias, mas a divisão actual tem ${EXPECTED}. Pode ser uma versão antiga: confirmar com a equipa.`);
}
console.log(provinces.features.map((f) => f.properties.name).sort().join(', '));
await writeFile('public/data/angola-adm1.geojson', JSON.stringify(provinces));

const countriesUrl = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';
await writeFile('public/data/countries.geojson', await text(countriesUrl));
record.countries = { url: countriesUrl, attribution: 'Natural Earth (domínio público)' };

await writeFile('public/data/SOURCES.json', JSON.stringify(record, null, 2));
console.log('Limites guardados em public/data/');
