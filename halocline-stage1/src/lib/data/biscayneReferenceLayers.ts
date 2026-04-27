export type LngLat = [number, number];
export type LngLatLine = LngLat[];

export type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: Record<string, string | number | null>;
    geometry:
      | {
          type: "LineString";
          coordinates: LngLatLine;
        }
      | {
          type: "MultiLineString";
          coordinates: LngLatLine[];
        }
      | {
          type: "Polygon";
          coordinates: LngLatLine[];
        };
  }>;
};

export type BiscayneReferenceLayer = {
  id: string;
  label: string;
  kind: "domain" | "canals" | "isochlor";
  sourceAgency: string;
  data: GeoJsonFeatureCollection;
};

export type BiscayneDataProvenanceEntry = {
  id: string;
  label: string;
  sourceAgency: string;
  sourceUrl: string;
  accessedDate: string;
  licenseOrRights: string;
  transformation: string;
  stage1Limitation: string;
};

export const biscayneReferenceBounds = {
  west: -80.56,
  south: 25.32,
  east: -80.16,
  north: 25.98,
};

const modelDomainRing: LngLatLine = [
  [-80.53, 25.98],
  [-80.165, 25.98],
  [-80.165, 25.92],
  [-80.19, 25.88],
  [-80.19, 25.8],
  [-80.22, 25.71],
  [-80.25, 25.62],
  [-80.28, 25.52],
  [-80.36, 25.43],
  [-80.44, 25.32],
  [-80.53, 25.32],
  [-80.53, 25.98],
];

const sfwmdCanalReferenceLines = [
  {
    name: "C-1",
    alias: "Black Creek Canal",
    coordinates: [
      [-80.29753, 25.52531],
      [-80.275, 25.48888],
    ],
  },
  {
    name: "C-2",
    alias: "Snapper Creek Canal",
    coordinates: [
      [-80.35414, 25.6956],
      [-80.34697, 25.69188],
      [-80.34404, 25.69129],
      [-80.31078, 25.69225],
      [-80.29686, 25.69086],
    ],
  },
  {
    name: "C-4",
    alias: "Tamiami Canal",
    coordinates: [
      [-80.47635, 25.76121],
      [-80.44867, 25.76131],
    ],
  },
  {
    name: "C-6",
    alias: "Miami Canal",
    coordinates: [
      [-80.34102, 25.86734],
      [-80.30439, 25.84011],
    ],
  },
  {
    name: "C-7",
    alias: "Little River Canal",
    coordinates: [
      [-80.29096, 25.87034],
      [-80.23441, 25.87149],
    ],
  },
  {
    name: "C-8",
    alias: "Biscayne Canal",
    coordinates: [
      [-80.1971, 25.90598],
      [-80.1953, 25.90275],
      [-80.19413, 25.89121],
      [-80.18495, 25.87718],
      [-80.18121, 25.87322],
    ],
  },
  {
    name: "C-9",
    alias: "Snake Creek Canal",
    coordinates: [
      [-80.22357, 25.96043],
      [-80.2027, 25.95949],
      [-80.18479, 25.94718],
    ],
  },
  {
    name: "C-100",
    alias: "Cutler Drain Canal",
    coordinates: [
      [-80.38904, 25.66037],
      [-80.38758, 25.65254],
      [-80.38517, 25.65248],
      [-80.3839, 25.65122],
      [-80.38344, 25.64606],
      [-80.3771, 25.64617],
      [-80.37579, 25.64159],
      [-80.36792, 25.63847],
      [-80.36583, 25.6384],
      [-80.36241, 25.63574],
      [-80.35967, 25.63555],
      [-80.35227, 25.63115],
      [-80.34918, 25.63109],
      [-80.34819, 25.6298],
      [-80.3482, 25.628],
      [-80.34507, 25.62396],
      [-80.34289, 25.62358],
    ],
  },
  {
    name: "C-102",
    alias: "Princeton Canal",
    coordinates: [
      [-80.44373, 25.58472],
      [-80.4392, 25.58228],
      [-80.43875, 25.57712],
      [-80.43565, 25.57642],
      [-80.43498, 25.57344],
      [-80.42803, 25.5733],
      [-80.42664, 25.56986],
      [-80.42354, 25.56921],
      [-80.42312, 25.56314],
      [-80.42115, 25.56107],
      [-80.4209, 25.55943],
      [-80.4182, 25.55691],
      [-80.41528, 25.55652],
      [-80.41472, 25.55411],
      [-80.41212, 25.55346],
      [-80.41116, 25.55142],
      [-80.41105, 25.54396],
      [-80.40955, 25.54252],
    ],
  },
  {
    name: "C-103",
    alias: "Mowry Canal",
    coordinates: [
      [-80.34028, 25.47031],
      [-80.33771, 25.47034],
      [-80.32096, 25.47894],
      [-80.275, 25.48888],
    ],
  },
  {
    name: "C-111",
    alias: null,
    coordinates: [
      [-80.55959, 25.44414],
      [-80.55943, 25.40698],
      [-80.55835, 25.40322],
    ],
  },
] satisfies Array<{ name: string; alias: string | null; coordinates: LngLatLine }>;

const isochlor2022Lines: LngLatLine[] = [
  [[-80.26991, 25.79156], [-80.26746, 25.79788], [-80.26696, 25.80711], [-80.26282, 25.81147], [-80.25084, 25.8134], [-80.23212, 25.81105]],
  [[-80.51265, 25.32762], [-80.51862, 25.32584], [-80.52329, 25.33015], [-80.52574, 25.3307], [-80.52799, 25.32904], [-80.52986, 25.32449]],
  [[-80.46456, 25.3783], [-80.46285, 25.38426], [-80.46369, 25.39039]],
  [[-80.46369, 25.39039], [-80.46172, 25.39278], [-80.45902, 25.39347], [-80.45851, 25.39588], [-80.45983, 25.40098], [-80.45939, 25.40758], [-80.46483, 25.4173], [-80.46443, 25.41919], [-80.46181, 25.4197], [-80.45911, 25.41853], [-80.45591, 25.4107], [-80.45171, 25.40858], [-80.44687, 25.40963], [-80.44105, 25.4141]],
  [[-80.43529, 25.43941], [-80.4342, 25.44169], [-80.43415, 25.45297], [-80.43281, 25.45666], [-80.4283, 25.46178], [-80.41562, 25.47193], [-80.40285, 25.48685], [-80.3903, 25.51368], [-80.38948, 25.51947], [-80.39135, 25.52328]],
  [[-80.35277, 25.56699], [-80.31688, 25.60496], [-80.31397, 25.61164], [-80.30741, 25.63885], [-80.29591, 25.66246], [-80.28537, 25.67973], [-80.28439, 25.6988], [-80.28822, 25.72498], [-80.2868, 25.73907], [-80.28106, 25.74494], [-80.25762, 25.75863], [-80.25249, 25.76364], [-80.24981, 25.76912], [-80.25035, 25.77301], [-80.25245, 25.77603], [-80.26318, 25.78247]],
  [[-80.38705, 25.53279], [-80.36828, 25.54929], [-80.35277, 25.56699]],
  [[-80.23212, 25.81105], [-80.22063, 25.81316], [-80.21597, 25.81539], [-80.21397, 25.81796], [-80.21197, 25.82948], [-80.21126, 25.84454], [-80.20598, 25.86725]],
  [[-80.44105, 25.4141], [-80.43477, 25.42321], [-80.43428, 25.43113]],
  [[-80.43428, 25.43113], [-80.43535, 25.43383], [-80.43958, 25.43474], [-80.43845, 25.43695]],
  [[-80.16759, 25.94764], [-80.16504, 25.96108], [-80.16546, 25.97753]],
  [[-80.16914, 25.94109], [-80.16759, 25.94764]],
  [[-80.26318, 25.78247], [-80.26624, 25.7849]],
  [[-80.26624, 25.7849], [-80.26884, 25.78767], [-80.26991, 25.79156]],
  [[-80.39135, 25.52328], [-80.39102, 25.52781], [-80.38705, 25.53279]],
  [[-80.46557, 25.37218], [-80.46456, 25.3783]],
  [[-80.46557, 25.37218], [-80.46526, 25.36928]],
  [[-80.46526, 25.36928], [-80.4654, 25.36214], [-80.46851, 25.35752], [-80.47572, 25.35349], [-80.48571, 25.35026]],
  [[-80.48571, 25.35026], [-80.49311, 25.34721], [-80.50028, 25.34001]],
  [[-80.43845, 25.43695], [-80.43529, 25.43941]],
  [[-80.18069, 25.92032], [-80.17303, 25.93019], [-80.16914, 25.94109]],
  [[-80.19351, 25.90795], [-80.18054, 25.92041]],
  [[-80.20598, 25.86725], [-80.19994, 25.89959], [-80.19807, 25.9034], [-80.19341, 25.90799]],
  [[-80.50028, 25.34001], [-80.50759, 25.33154], [-80.51265, 25.32762]],
];

const isochlor2018Lines: LngLatLine[] = [
  [[-80.26247, 25.78719], [-80.26591, 25.7936], [-80.2673, 25.80103], [-80.26642, 25.80614], [-80.2635, 25.81022], [-80.25931, 25.81226], [-80.25255, 25.81299], [-80.232, 25.81154]],
  [[-80.4652, 25.37233], [-80.46602, 25.35961], [-80.46852, 25.35308], [-80.47149, 25.34929], [-80.49596, 25.34034], [-80.51417, 25.32669], [-80.5189, 25.32594], [-80.52278, 25.32992], [-80.52551, 25.33061], [-80.52812, 25.32889], [-80.52986, 25.32449]],
  [[-80.4652, 25.37233], [-80.46544, 25.37574], [-80.46279, 25.38227], [-80.46386, 25.3896], [-80.46283, 25.39195]],
  [[-80.46283, 25.39187], [-80.45907, 25.39342], [-80.45851, 25.39594], [-80.45982, 25.40087], [-80.45935, 25.40744], [-80.46492, 25.41754], [-80.46425, 25.41936], [-80.45897, 25.4184], [-80.45608, 25.41095], [-80.45249, 25.40878], [-80.44621, 25.40979], [-80.43902, 25.41381]],
  [[-80.43251, 25.43173], [-80.43309, 25.44773], [-80.43162, 25.45566], [-80.42687, 25.46241], [-80.41061, 25.47605], [-80.40258, 25.48563], [-80.38994, 25.51276], [-80.38893, 25.51909], [-80.39057, 25.52213]],
  [[-80.3524, 25.56679], [-80.31698, 25.6048], [-80.31369, 25.61223], [-80.31054, 25.62877], [-80.30585, 25.64109], [-80.29669, 25.65997], [-80.28452, 25.68092], [-80.28372, 25.68743], [-80.28822, 25.72486], [-80.28682, 25.73904], [-80.28066, 25.74496], [-80.25549, 25.75961], [-80.25236, 25.76276], [-80.25044, 25.76724], [-80.25144, 25.77484], [-80.26247, 25.78719]],
  [[-80.39057, 25.52213], [-80.39156, 25.52553], [-80.38965, 25.52999], [-80.3677, 25.54968], [-80.3524, 25.56676]],
  [[-80.232, 25.81154], [-80.22588, 25.81139], [-80.2198, 25.81304], [-80.21547, 25.81552], [-80.21313, 25.8193], [-80.2107, 25.84782], [-80.1989, 25.89722], [-80.19151, 25.90796], [-80.17256, 25.92801], [-80.16664, 25.93965], [-80.16555, 25.9557], [-80.16647, 25.97784]],
  [[-80.43902, 25.41381], [-80.43662, 25.41666], [-80.43251, 25.43173]],
];

function lineFeature(
  id: string,
  coordinates: LngLatLine,
  properties: Record<string, string | number | null>,
): GeoJsonFeatureCollection["features"][number] {
  return {
    type: "Feature",
    properties: { id, ...properties },
    geometry: {
      type: "LineString",
      coordinates,
    },
  };
}

export const biscayneReferenceLayers = {
  domain: {
    id: "reference-domain",
    label: "Biscayne reference domain",
    kind: "domain",
    sourceAgency: "Halocline",
    data: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            id: "biscayne-reference-domain",
            name: "Eastern Miami-Dade/Biscayne Stage 1 reference domain",
          },
          geometry: {
            type: "Polygon",
            coordinates: [modelDomainRing],
          },
        },
      ],
    },
  },
  canals: {
    id: "reference-canals",
    label: "SFWMD canal reference",
    kind: "canals",
    sourceAgency: "South Florida Water Management District",
    data: {
      type: "FeatureCollection",
      features: sfwmdCanalReferenceLines.map((canal) =>
        lineFeature(`sfwmd-${canal.name.toLowerCase()}`, canal.coordinates, {
          name: canal.name,
          alias: canal.alias,
          sourceAgency: "SFWMD",
        }),
      ),
    },
  },
  isochlor2018: {
    id: "isochlor-2018",
    label: "USGS 2018 isochlor",
    kind: "isochlor",
    sourceAgency: "U.S. Geological Survey",
    data: {
      type: "FeatureCollection",
      features: isochlor2018Lines.map((line, index) =>
        lineFeature(`usgs-2018-${index + 1}`, line, {
          year: 2018,
          concentrationMgPerLiter: 1000,
          sourceAgency: "USGS",
        }),
      ),
    },
  },
  isochlor2022: {
    id: "isochlor-2022",
    label: "USGS 2022 isochlor",
    kind: "isochlor",
    sourceAgency: "U.S. Geological Survey",
    data: {
      type: "FeatureCollection",
      features: isochlor2022Lines.map((line, index) =>
        lineFeature(`usgs-2022-${index + 1}`, line, {
          year: 2022,
          concentrationMgPerLiter: 1000,
          sourceAgency: "USGS",
        }),
      ),
    },
  },
} satisfies Record<string, BiscayneReferenceLayer>;

export const biscayneDataProvenance: BiscayneDataProvenanceEntry[] = [
  {
    id: "reference-domain",
    label: "Biscayne reference domain",
    sourceAgency: "Halocline",
    sourceUrl: "Derived from USGS 2018/2022 isochlor spatial extents and Stage 1 Miami-Dade focus area.",
    accessedDate: "2026-04-24",
    licenseOrRights: "Internal simplified processing layer.",
    transformation:
      "Hand-smoothed polygon around the eastern Miami-Dade/Biscayne aquifer focus area used to frame Stage 1 reference layers.",
    stage1Limitation:
      "This is a product reference domain, not an authoritative hydrogeologic model boundary.",
  },
  {
    id: "reference-canals",
    label: "SFWMD canal reference",
    sourceAgency: "South Florida Water Management District",
    sourceUrl:
      "https://geoweb.sfwmd.gov/agsext1/rest/services/WaterManagementSystem/Canals/FeatureServer/5",
    accessedDate: "2026-04-24",
    licenseOrRights: "Public SFWMD GIS service; copyright text: SFWMD Geospatial Services.",
    transformation:
      "Selected named Miami-Dade canals were queried in WGS84 GeoJSON and simplified for the Stage 1 map reference layer.",
    stage1Limitation:
      "This layer provides reference canal alignments. Sprint 7C rasterizes nearby 2 km model cells with simplified fixed-head stages that are not observed stage records.",
  },
  {
    id: "isochlor-2018",
    label: "USGS 2018 1,000 mg/L isochlor",
    sourceAgency: "U.S. Geological Survey",
    sourceUrl: "https://doi.org/10.5066/P9ZIC1O4",
    accessedDate: "2026-04-24",
    licenseOrRights: "Public USGS data release.",
    transformation:
      "ScienceBase shapefile coordinates in NAD83 / Florida East StatePlane feet were converted to WGS84 lon/lat and simplified for browser rendering.",
    stage1Limitation:
      "Reference/validation context only. The displayed Stage 1 interface layer is a simplified model estimate, not this observed isochlor.",
  },
  {
    id: "isochlor-2022",
    label: "USGS 2022 1,000 mg/L isochlor",
    sourceAgency: "U.S. Geological Survey",
    sourceUrl: "https://doi.org/10.5066/P13TSEEA",
    accessedDate: "2026-04-24",
    licenseOrRights: "Public USGS data release; rights noted as CC0 1.0 Universal in USGS metadata.",
    transformation:
      "ScienceBase shapefile coordinates in NAD83 / Florida East StatePlane feet were converted to WGS84 lon/lat and simplified for browser rendering.",
    stage1Limitation:
      "Reference/validation context only. The displayed Stage 1 interface layer is a simplified model estimate, not this observed isochlor.",
  },
];
