export type MarketingCard = {
  title: string;
  body: string;
  detail?: string;
};

export type ResearchReference = {
  citation: string;
};

export const marketingContent = {
  hero: {
    eyebrow: "Halocline | coastal aquifer research",
    title: "Coastal aquifer decisions under saltwater pressure",
    summary:
      "Saltwater intrusion can threaten freshwater supply wells and the coastal aquifers that support them. Repeating scenario analysis across recharge, sea level, canals, and pumping is difficult with high-fidelity groundwater workflows. Halocline is researching a faster, inspectable way to screen those scenarios.",
    disclaimer:
      "Current work is synthetic and provisional. Stage 1 is not a calibrated regulatory model or a substitute for site-specific engineering analysis.",
  },
  decisionCards: [
    {
      title: "Freshwater at risk",
      body: "Coastal pumping, reduced recharge, and elevated coastal boundaries can change freshwater head and move the freshwater-saltwater interface toward supply wells.",
    },
    {
      title: "Repeated analysis is expensive",
      body: "Calibration, uncertainty analysis, and operational scenario sweeps require many forward runs in groundwater simulators that represent the subsurface in more detail.",
    },
    {
      title: "A decision-support gap",
      body: "Teams need a transparent way to identify which scenarios deserve expensive simulator time while keeping assumptions and limits visible.",
    },
  ] satisfies readonly MarketingCard[],
  approach: [
    {
      title: "Set boundary conditions",
      body: "Express recharge, sea level, canal stages, and pumping as a scenario.",
      detail: "inputs",
    },
    {
      title: "Solve the Stage 1 chain",
      body: "Run steady-state Darcy head, a Ghyben-Herzberg interface estimate, and well-level upconing risk.",
      detail: "inspectable physics",
    },
    {
      title: "Screen with a surrogate",
      body: "Test whether a learned approximation can narrow candidate scenarios before high-fidelity calibration runs.",
      detail: "research direction",
    },
  ] satisfies readonly MarketingCard[],
  evidence: {
    title: "Current experimental evidence",
    body:
      "The current U-FNO experiment was trained against a simplified synthetic physics oracle. It is a compute and workflow test, not a MODFLOW, SEAWAT, or field-validated aquifer model.",
    metrics: [
      { label: "Training split", value: "4k / 500 / 500", detail: "synthetic oracle train, validation, held-out test" },
      { label: "Head error", value: "1.78 m MAE", detail: "held-out synthetic test set" },
      { label: "Interface error", value: "8.02 m MAE", detail: "held-out synthetic test set" },
      { label: "Batch inference", value: "174.57x", detail: "versus the Python oracle" },
    ],
  },
  commitment: {
    title: "Research commitment and working-paper direction",
    body:
      "Halocline is testing whether surrogate architectures can preserve the spatial structure needed to select better MODFLOW, SEAWAT, or PFLOTRAN calibration runs. The aim is to prioritize expensive simulations, not replace validation or site calibration.",
    cards: [
      {
        title: "Research lineage",
        body: "GeoFUSE provides the working precedent for surrogate-based seawater-intrusion analysis using PFLOTRAN-generated simulations, U-FNO inference, PCA parameterization, and ESMDA data assimilation.",
      },
      {
        title: "Working-paper question",
        body: "Can WNO and graph-network methods better preserve localized salinity fronts, irregular geometry, wells, canals, boundaries, and geologic heterogeneity?",
      },
      {
        title: "Practical target",
        body: "Use surrogate sweeps to narrow many candidates to the smaller set that deserves full simulator time and explicit uncertainty analysis.",
      },
    ] satisfies readonly MarketingCard[],
  },
  references: [
    "Werner et al. 2013 seawater intrusion review",
    "Ketabchi et al. 2016 sea-level-rise review",
    "Langevin and Guo 2006; SEAWAT 2008",
    "Provost and Voss 2019 SUTRA",
    "Hammond et al. 2014 PFLOTRAN",
    "Yabusaki et al. 2020 Beaver Creek",
    "Emerick and Reynolds 2013 ESMDA",
    "Arora et al. 2011 / 2012 inverse estimation",
    "Bhattacharjya and Datta 2009 ANN-GA",
    "Sreekanth and Datta 2010 surrogate management",
    "Hussain et al. 2015 simulation optimization",
    "Rajabi and Ketabchi 2017 Gaussian emulation",
    "Mo et al. 2019 deep autoregressive groundwater",
    "Tang et al. 2020 dynamic subsurface surrogate",
    "Li et al. 2020 Fourier neural operator",
    "Wen et al. 2022 U-FNO multiphase flow",
    "Meray et al. 2024 groundwater contamination surrogate",
    "Cao et al. 2024 coastal-aquifer data assimilation",
    "Han et al. 2024 CO2 storage surrogate",
    "Jiang and Durlofsky 2023 multifidelity surrogates",
    "Jiang and Durlofsky 2024 data-space inversion",
    "Goebel et al. 2017 resistivity intrusion imaging",
    "Dodangeh et al. 2022 joint coastal aquifer inversion",
    "Yoon et al. 2017 saline aquifer pressure data",
    "Zhou et al. 2022 simultaneous property inference",
    "Zhou and Tartakovsky 2021 NN-surrogate MCMC",
    "Sonnenborg et al. 2015 geology uncertainty",
    "He et al. 2015 hydrological predictive uncertainty",
    "Ebong et al. 2020 stochastic petrophysical modeling",
    "Messier et al. 2015 groundwater radon estimation",
    "Remy et al. 2009 SGeMS geostatistics",
    "Siler et al. 2019 3D geothermal geology",
    "Torresan et al. 2020 3D hydrogeology",
    "Strati et al. 2017 integrated 3D crust model",
    "Dwivedi et al. 2018 riparian hot moments",
    "Zhong et al. 2019 cDC-GAN plume prediction",
    "Kingma and Ba 2014 Adam optimizer",
  ].map((citation) => ({ citation })) satisfies readonly ResearchReference[],
} as const;
