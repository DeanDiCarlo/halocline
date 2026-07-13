export type MarketingCard = {
  title: string;
  body: string;
  detail?: string;
};

export type MarketingMetric = {
  label: string;
  value: string;
  detail: string;
};

export type ResearchReference = {
  citation: string;
};

type MarketingContent = {
  hero: {
    eyebrow: string;
    title: string;
    descriptor: string;
    summary: string;
    evidenceCue: string;
    disclaimer: string;
  };
  stakes: {
    title: string;
    body: string;
    cards: readonly MarketingCard[];
  };
  experience: {
    title: string;
    body: string;
    trustItems: readonly MarketingCard[];
  };
  validation: {
    title: string;
    body: string;
    steps: readonly MarketingCard[];
    evidence: {
      title: string;
      body: string;
      metrics: readonly MarketingMetric[];
      caveat: string;
    };
  };
  execution: {
    title: string;
    body: string;
    cards: readonly MarketingCard[];
  };
  finalCta: {
    title: string;
    body: string;
  };
  references: readonly ResearchReference[];
};

export const marketingContent = {
  hero: {
    eyebrow: "Coastal-aquifer planning instrument in development",
    title: "Know what’s under the surface. Decide with confidence.",
    descriptor: "Halocline is a digital-twin research platform for transparent coastal-aquifer scenario screening.",
    summary:
      "Stage 1 makes the relationships among recharge, sea level, canals, pumping, freshwater head, and interface depth inspectable in one map-native planning surface.",
    evidenceCue:
      "Held-out simplified synthetic Python Stage 1 oracle evidence: 4,000 / 500 / 500 train-validation-test split; 1.78 m head MAE; 8.02 m interface-depth MAE; up to 174.57x batched speedup at batch size 2,048.",
    disclaimer:
      "Stage 1 is provisional and non-regulatory. It is a simplified research and planning instrument, not a calibrated model or a substitute for site-specific engineering analysis.",
  },
  stakes: {
    title: "A planning gap opens before the boundary becomes visible",
    body:
      "Coastal aquifer choices are made across changing conditions, not a single forecast. The practical challenge is seeing which combinations deserve deeper investigation while keeping the assumptions in view.",
    cards: [
      {
        title: "Freshwater conditions can shift",
        body: "Pumping, recharge, coastal boundaries, and canal stages can change freshwater head and the estimated position of a freshwater-saltwater interface.",
      },
      {
        title: "The scenario space is large",
        body: "Testing many plausible combinations is difficult when each detailed groundwater workflow requires careful setup, calibration, and review.",
      },
      {
        title: "Early choices need a clear screen",
        body: "Teams need a way to compare assumptions and spatial consequences before committing scarce high-fidelity simulation and engineering effort.",
      },
    ],
  },
  experience: {
    title: "A scenario surface built for inspection",
    body:
      "Halocline connects editable planning inputs to spatial outputs and well-level signals. The purpose is not to hide uncertainty behind a score; it is to make a simplified Stage 1 chain legible enough to question, compare, and improve.",
    trustItems: [
      {
        title: "Visible inputs",
        body: "Recharge, sea level, canal stages, and pumping remain explicit scenario choices.",
      },
      {
        title: "Traceable outputs",
        body: "Head, interface-depth, risk, diagnostics, and warnings are shown together in the map experience.",
      },
      {
        title: "Clear limits",
        body: "Provisional assumptions and non-regulatory status travel with the result rather than appearing after it.",
      },
    ],
  },
  validation: {
    title: "Validation starts with an inspectable physics path",
    body:
      "Stage 1 keeps its simplified calculation sequence explicit. In parallel, the research workflow tests whether a learned surrogate can accelerate screening against that same synthetic reference—not stand in for field validation.",
    steps: [
      {
        title: "Solve freshwater head",
        body: "A steady-state Darcy solve estimates head across the active grid from the scenario boundary conditions.",
        detail: "Stage 1 physics",
      },
      {
        title: "Estimate interface depth",
        body: "A Ghyben-Herzberg sharp-interface estimate translates head into a provisional interface-depth field with display guardrails.",
        detail: "simplified interface",
      },
      {
        title: "Screen well-level risk",
        body: "A simplified upconing calculation identifies where a scenario warrants closer, higher-fidelity review.",
        detail: "planning signal",
      },
    ],
    evidence: {
      title: "Current surrogate research evidence",
      body:
        "A U-FNO surrogate was trained and evaluated against the synthetic Stage 1 Python physics oracle. These are held-out oracle results, not measurements against field observations.",
      metrics: [
        {
          label: "Train / validation / test",
          value: "4,000 / 500 / 500",
          detail: "synthetic Stage 1 Python oracle scenarios",
        },
        {
          label: "Head MAE",
          value: "1.78 m",
          detail: "against the synthetic Stage 1 Python oracle on held-out samples",
        },
        {
          label: "Interface-depth MAE",
          value: "8.02 m",
          detail: "against the synthetic Stage 1 Python oracle on held-out samples",
        },
        {
          label: "Up to batched speedup",
          value: "174.57x",
          detail: "over the synthetic Stage 1 Python oracle on held-out data at batch size 2,048",
        },
      ],
      caveat:
        "The oracle is a simplified 2D steady sharp-interface model. This is not field validation or calibrated MODFLOW, SEAWAT, or PFLOTRAN performance.",
    },
  },
  execution: {
    title: "Proof of execution, grounded in working artifacts",
    body:
      "The research platform is more than a product concept: its current workflow spans a parity-tested physics oracle, generated scenarios, trained surrogate evaluation, and a map-native Stage 1 frontend.",
    cards: [
      {
        title: "Python physics oracle",
        body: "A Python port of the Stage 1 chain provides sparse Darcy head, sharp-interface depth, and simplified upconing outputs against frozen reference snapshots.",
      },
      {
        title: "Synthetic scenario generation",
        body: "Deterministic scenario sampling and oracle generation create the research data used to train and assess the surrogate workflow.",
      },
      {
        title: "Trained U-FNO evaluation",
        body: "A trained U-FNO is evaluated on held-out oracle scenarios and benchmarked against the Python physics oracle.",
      },
      {
        title: "Map-native frontend",
        body: "The Stage 1 interface connects scenario controls, spatial outputs, diagnostics, warnings, and well evidence in a browser-first planning surface.",
      },
    ],
  },
  finalCta: {
    title: "Explore the planning instrument in development",
    body:
      "Open the Stage 1 scenario map to inspect the current planning surface, or read the research lineage and supporting references behind the work.",
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
  ].map((citation) => ({ citation })),
} as const satisfies MarketingContent;
