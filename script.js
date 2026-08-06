// ---------- Utilidades ----------

function normalize(str) {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

// ---------- Preferências de exibição (Data/Hora) ----------
const prefs = {
  dateFormat: "ddmmyy",  // ddmm | ddmmyy | ddmmyyyy
  showTime: false,
  viewMode: "line"       // line | categories
};

function parseColetadoEmLine(line) {
  // Coletado em: 09/12/2025 08:29
  const m = line.match(/Coletado em:\s*(\d{2}\/\d{2}\/\d{4})(?:\s+(\d{2}):(\d{2}))?/i);
  if (!m) return null;
  return {
    date: m[1],
    time: (m[2] && m[3]) ? `${m[2]}:${m[3]}` : ""
  };
}

function formatDateStr(dateStr) {
  const m = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return dateStr;
  const dd = m[1], mm = m[2], yyyy = m[3];

  if (prefs.dateFormat === "ddmm") return `${dd}/${mm}`;
  if (prefs.dateFormat === "ddmmyy") return `${dd}/${mm}/${yyyy.slice(-2)}`;
  return `${dd}/${mm}/${yyyy}`; // ddmmyyyy
}

function formatDateTimeLabel(dateStr, timeStr) {
  const d = formatDateStr(dateStr);
  if (!prefs.showTime) return d;
  if (!timeStr) return d;
  return `${d} ${timeStr}`;
}

// Mapa de exames -> abreviação e categoria
const examDefinitions = [
  // Líquor
  { match: "CELULAS", abbr: "Cel", category: "Líquor", onlyLiquor: true },
  { match: "HEMACIAS", abbr: "Hem", category: "Líquor", onlyLiquor: true },
  { match: "PROTEINAS TOTAIS", abbr: "Pt", category: "Líquor", onlyLiquor: true },
  { match: "GLICOSE", abbr: "Gli", category: "Líquor", onlyLiquor: true },
  { match: "LACTATO", abbr: "Lac", category: "Líquor", onlyLiquor: true },
  { match: "ADENOSINA DEAMINASE", abbr: "ADA", category: "Líquor", onlyLiquor: true },
  { match: "EXAME BACTERIOSCOPICO", abbr: "Gram", category: "Líquor", onlyLiquor: true },
  { match: "CULTURA AEROBIA", abbr: "cBAC", category: "Líquor", onlyLiquor: true },
  { match: "PESQUISA DE FUNGOS", abbr: "pFUN", category: "Líquor", onlyLiquor: true },
  { match: "PESQUISA DE ANTIGENO DE CRIPTOCOCCUS", abbr: "CrAg", category: "Líquor", onlyLiquor: true },
  { match: "CULTURA PARA FUNGOS", abbr: "cFUN", category: "Líquor", onlyLiquor: true },
  { match: "CULTURA DE FUNGOS", abbr: "cFUN", category: "Líquor", onlyLiquor: true },
  { match: "CULTURA P/ FUNGOS", abbr: "cFUN", category: "Líquor", onlyLiquor: true },
  { match: "CULTURA P FUNGOS", abbr: "cFUN", category: "Líquor", onlyLiquor: true },
  { match: "PESQUISA DE BACILO ALCOOL-ACIDO RESISTENTE", abbr: "pBAAR", category: "Líquor", onlyLiquor: true },
  { match: "TESTE RAPIDO MOLECULAR PARA TUBERCULOSE", abbr: "TRM-TB", category: "Líquor", onlyLiquor: true },
  { match: "CULTURA PARA MICOBACTERIAS", abbr: "cMIC", category: "Líquor", onlyLiquor: true },
  { match: "ENTEROVIRUS (EV)", abbr: "EV", category: "Líquor", onlyLiquor: true },
  { match: "VARICELA ZOSTER (VZV)", abbr: "VZV", category: "Líquor", onlyLiquor: true },
  { match: "EPSTEIN-BARR (EBV)", abbr: "EBV", category: "Líquor", onlyLiquor: true },
  { match: "CITOMEGALOVIRUS (CMV)", abbr: "CMV", category: "Líquor", onlyLiquor: true },
  { match: "ADENOVIRUS (HADV)", abbr: "HAdV", category: "Líquor", onlyLiquor: true },
  { match: "HERPES SIMPLEX I", abbr: "HSV1", category: "Líquor", onlyLiquor: true },
  { match: "HERPES SIMPLEX II", abbr: "HSV2", category: "Líquor", onlyLiquor: true },
  { match: "HERPESVIRUS HUMANO 6", abbr: "HHV6", category: "Líquor", onlyLiquor: true },
  { match: "HERPESVIRUS HUMANO 7", abbr: "HHV7", category: "Líquor", onlyLiquor: true },
  { match: "ERITROVIRUS B19", abbr: "PVB19", category: "Líquor", onlyLiquor: true },
  { match: "VDRL", abbr: "VDRL-LCR", category: "Líquor", onlyLiquor: true },
  { match: "LINFOCITOS", abbr: "LinfLiquor", category: "Líquor", internal: true },
  { match: "MONOCITOS", abbr: "MonoLiquor", category: "Líquor", internal: true },
  { match: "NEUTROFILOS", abbr: "PMN", category: "Líquor", onlyLiquor: true },

  // HEMOGLOBINA GLICADA deve preceder HEMOGLOBINA do hemograma para que o algoritmo
  // de melhor-match-por-comprimento sempre prefira a definição mais específica (Bug 4)
  { match: "HEMOGLOBINA GLICADA", abbr: "HbA1c", category: "Hormônios/Marcadores" },

  // Hemograma
  { match: "HEMOGLOBINA", abbr: "Hb", category: "Hemograma" },
  { match: "HEMATOCRITO", abbr: "Ht", category: "Hemograma" },
  { match: "LEUCOCITOS", abbr: "Leuco", category: "Hemograma" },
  { match: "PLAQUETAS", abbr: "Plaq", category: "Hemograma" },

  // Marcadores inflamatórios
  { match: "PROTEINA C REATIVA", abbr: "PCR", category: "Marcadores inflamatórios" },
  { match: "VELOCIDADE DE HEMOSSEDIMENTACAO", abbr: "VHS", category: "Marcadores inflamatórios" },
  
  // Eletrólitos / Renal
  { match: "SODIO", abbr: "Na", category: "Eletrólitos/Renal" },
  { match: "POTASSIO", abbr: "K", category: "Eletrólitos/Renal" },
  { match: "CLORO", abbr: "Cl", category: "Eletrólitos/Renal" },
  { match: "CREATININA", abbr: "Cr", category: "Eletrólitos/Renal" },
  { match: "UREIA", abbr: "Ur", category: "Eletrólitos/Renal" },
  { match: "MAGNESIO", abbr: "Mg", category: "Eletrólitos/Renal" },
  { match: "FOSFORO", abbr: "P", category: "Eletrólitos/Renal" },
  { match: "CALCIO TOTAL", abbr: "CaT", category: "Eletrólitos/Renal" },
  { match: "CALCIO IONICO", abbr: "CaIon", category: "Eletrólitos/Renal" },
  { match: "ACIDO URICO", abbr: "AcUrico", category: "Eletrólitos/Renal" },
  { match: "RELACAO DE MICROALBUMINURIA/CREATININA", abbr: "RelAlb/Cr", category: "Eletrólitos/Renal" },

  // Gasometria (entrada manual só serve para filtros; a leitura é por parser separado)
  { match: "GASOMETRIA ARTERIAL", abbr: "GasArterial", category: "Gasometria" },
  { match: "GASOMETRIA VENOSA", abbr: "GasVenosa", category: "Gasometria" },

  // Hepático
  { match: "ALANINA AMINOTRANSFERASE", abbr: "ALT", category: "Hepático" },
  { match: "ASPARTATO AMINO TRANSFERASE", abbr: "AST", category: "Hepático" },
  { match: "FOSFATASE ALCALINA", abbr: "FA", category: "Hepático" },
  { match: "GAMA GLUTAMIL TRANSFERASE", abbr: "GGT", category: "Hepático" },
  { match: "BILIRRUBINA TOTAL", abbr: "BT", category: "Hepático" },
  { match: "BILIRRUBINA DIRETA", abbr: "BD", category: "Hepático" },
  { match: "BILIRRUBINA INDIRETA", abbr: "BI", category: "Hepático" },

  // Perfil lipídico
  { match: "TRIGLICERIDES", abbr: "TGL", category: "Perfil lipídico" },
  { match: "VLDL - COLESTEROL", abbr: "VLDL", category: "Perfil lipídico" },
  { match: "HDL - COLESTEROL", abbr: "HDL", category: "Perfil lipídico" },
  { match: "LDL - COLESTEROL", abbr: "LDL", category: "Perfil lipídico" },
  { match: "COLESTEROL NAO HDL", abbr: "nHDL", category: "Perfil lipídico" },
  { match: "COLESTEROL", abbr: "CT", category: "Perfil lipídico", exact: true },

  // Proteínas
  { match: "PROTEINAS TOTAIS", abbr: "ProtTot", category: "Proteínas" },
  { match: "ALBUMINA", abbr: "Alb", category: "Proteínas" },
  { match: "GLOBULINAS", abbr: "Glob", category: "Proteínas" },
  { match: "CREATINO FOSFOQUINASE", abbr: "CPK", category: "Proteínas" },
  { match: "DESIDROGENASE LACTICA", abbr: "LDH", category: "Proteínas" },

  // Anemia
  { match: "RETICULOCITOS", abbr: "Ret", category: "Anemia" },
  { match: "HAPTOGLOBINA", abbr: "Hapto", category: "Anemia" },
  { match: "VITAMINA B 12", abbr: "VitB12", category: "Anemia" },
  { match: "ACIDO FOLICO", abbr: "AF", category: "Anemia" },
  { match: "FERRO", abbr: "Ferro", category: "Anemia" },
  { match: "FERRITINA", abbr: "Ferritina", category: "Anemia" },
  { match: "CAPACIDADE TOTAL DE LIGAÇÃO DE FERRO", abbr: "CTLF", category: "Anemia" },
  { match: "SATURACAO DA TRANSFERRINA", abbr: "SatTransf", category: "Anemia" },
  { match: "TRANSFERRINA", abbr: "Transf", category: "Anemia" },
  
  // Hormônios / marcadores
  { match: "25-HIDROXIVITAMINA D", abbr: "VitD25", category: "Hormônios/Marcadores" },
  { match: "PARATORMONIO (PTH)", abbr: "PTH", category: "Hormônios/Marcadores" },
  { match: "TROPONINA", abbr: "Tropo", category: "Hormônios/Marcadores" },
  { match: "NT-PROBNP", abbr: "NTproBNP", category: "Hormônios/Marcadores" },
  { match: "GLICOSE", abbr: "Glic", category: "Hormônios/Marcadores" },
  { match: "INSULINA", abbr: "Insulina", category: "Hormônios/Marcadores" },
  // HEMOGLOBINA GLICADA foi movida para antes do bloco Hemograma (ver topo do array)
  { match: "TRIIODOTIRONINA (T3)", abbr: "T3", category: "Hormônios/Marcadores" },
  { match: "TIROXINA (T4)", abbr: "T4", category: "Hormônios/Marcadores" },
  { match: "TIROXINA LIVRE (T4L)", abbr: "T4L", category: "Hormônios/Marcadores" },
  { match: "HORMONIO TIREO-ESTIMULANTE (TSH)", abbr: "TSH", category: "Hormônios/Marcadores" },
  { match: "HORMONIO FOLICUL0-ESTIMULANTE (FSH)", abbr: "FSH", category: "Hormônios/Marcadores" },
  { match: "HORMONIO FOLICULO-ESTIMULANTE (FSH)", abbr: "FSH", category: "Hormônios/Marcadores" },
  { match: "PROLACTINA", abbr: "Prolactina", category: "Hormônios/Marcadores" },
  { match: "TESTOSTERONA LIVRE", abbr: "TestoLivre", category: "Hormônios/Marcadores" },
  { match: "TESTOSTERONA TOTAL", abbr: "TestoTotal", category: "Hormônios/Marcadores" },
  { match: "GLOBULINA LIGADORA DOS HORMONIOS SEXUAIS (SHBG)", abbr: "SHBG", category: "Hormônios/Marcadores" },
  { match: "ESTRADIOL", abbr: "Estradiol", category: "Hormônios/Marcadores" },
  { match: "HORMONIO LUTEINIZANTE (LH)", abbr: "LH", category: "Hormônios/Marcadores" },
  { match: "ALFAFETOPROTEINA", abbr: "AFP", category: "Hormônios/Marcadores" },
  
  // Pancreático
  { match: "AMILASE", abbr: "Amilase", category: "Pancreático" },
  { match: "LIPASE", abbr: "Lipase", category: "Pancreático" },

  // Coagulação
  { match: "TEMPO DE PROTROMBINA", abbr: "TP", category: "Coagulação" },
  { match: "INR =", abbr: "INR", category: "Coagulação" },
  { match: "TEMPO DE TROMBOPLASTINA PARCIAL ATIVADA", abbr: "TTPA", category: "Coagulação" },
  { match: "R =", abbr: "R", category: "Coagulação" },
  { match: "DOSAGEM DO DIMERO-D QUANTITATIVO", abbr: "DD", category: "Coagulação" },

  // Sorologias
  { match: "IMUNODIFUSAO HISTOPLASMA CAPSULATUM", abbr: "ID Histoplasma", category: "Sorologias" },
  { match: "IMUNODIFUSAO ASPERGILLUS FUMIGATUS", abbr: "ID Aspergillus", category: "Sorologias" },
  { match: "IMUNODIFUSAO PARACOCCIDIOIDES BRASILIENSIS", abbr: "ID P. brasiliensis", category: "Sorologias" },
  { match: "CONTRAIMUNO PARACOCCIDIOIDES BRASILIENSIS", abbr: "CI P. brasiliensis", category: "Sorologias" },
  { match: "CONTRAIMUNO HISTOPLASMA CAPSULATUM", abbr: "CI Histoplasma", category: "Sorologias" },
  { match: "CONTRAIMUNO ASPERGILLUS FUMIGATUS", abbr: "CI Aspergillus", category: "Sorologias" },
  { match: "ANTICORPOS CONTRA HIV1/2", abbr: "HIV", category: "Sorologias" },
  { match: "HEPATITE B - AGHBS", abbr: "HBsAg", category: "Sorologias" },
  { match: "HEPATITE B - ANTI-HBC TOTAL", abbr: "Anti-HBc Total", category: "Sorologias" },
  { match: "HEPATITE B - ANTI-HBC IGM", abbr: "Anti-HBc IgM", category: "Sorologias" },
  { match: "HEPATITE B - ANTI-HBS", abbr: "Anti-HBs", category: "Sorologias" },
  { match: "HEPATITE B - ANTI-HBE", abbr: "Anti-HBe", category: "Sorologias" },
  { match: "HEPATITE B - AGHBE", abbr: "HBeAg", category: "Sorologias" },
  { match: "HEPATITE C - SOROLOGIA", abbr: "Anti-HCV", category: "Sorologias" },
  { match: "HEPATITE A - ANTICORPOS IGM", abbr: "HAV IgM", category: "Sorologias" },
  { match: "HEPATITE A - ANTICORPOS IGG", abbr: "HAV IgG", category: "Sorologias" },
  { match: "SOROLOGIA PARA TREPONEMA PALLIDUM", abbr: "Sífilis", category: "Sorologias" },
  { match: "VDRL", abbr: "VDRL", category: "Sorologias" },
  { match: "CHAGAS", abbr: "Chagas", category: "Sorologias" },
  { match: "HTLV", abbr: "HTLV", category: "Sorologias" },
  { match: "ANTI - VCA - IGM", abbr: "EBV IgM", category: "Sorologias" },
  { match: "ANTI - VCA - IGG", abbr: "EBV IgG", category: "Sorologias" },
  { match: "CITOMEGALOVIRUS - IGM", abbr: "CMV IgM", category: "Sorologias" },
  { match: "CITOMEGALOVIRUS - IGG", abbr: "CMV IgG", category: "Sorologias" },
  { match: "TOXOPLASMOSE - IGM", abbr: "Toxo IgM", category: "Sorologias" },
  { match: "TOXOPLASMOSE - IGG", abbr: "Toxo IgG", category: "Sorologias" },

  // Virologia
  { match: "DETECÇÃO QUANTITATIVA DE DNA DE CITOMEGALOVIRUS (CMV) - PLASMA", abbr: "PCR-CMV", category: "Virologia" },
  { match: "DETECÇÃO QUANTITATIVA DE DNA DO VIRUS DA HEPATITE B", abbr: "HBV-DNA", category: "Virologia" },
  { match: "CARGA VIRAL HIV-1", abbr: "CV-HIV", category: "Virologia" },
  
  // Imunológico (CD4/CD8)
  { match: "CD45/CD3/CD4", abbr: "CD4", category: "Imunológico" },
  { match: "CD45/CD3/CD8", abbr: "CD8", category: "Imunológico" },
  { match: "CD4/CD8", abbr: "CD4/CD8", category: "Imunológico" },

  // Fármacos
  { match: "VANCOMICINA", abbr: "Vancomicina", category: "Fármacos" },
  { match: "TACROLIMUS", abbr: "FK", category: "Fármacos" },
  { match: "FLUCONAZOL", abbr: "Fluconazol", category: "Fármacos" },
  { match: "ITRACONAZOL", abbr: "Itraconazol", category: "Fármacos" },
  { match: "VORICONAZOL", abbr: "Voriconazol", category: "Fármacos" },
  { match: "EVEROLIMUS", abbr: "EVR", category: "Fármacos" },

  // Urina 1
  { match: "NITRITO", abbr: "U1_Nit", category: "Urina 1", onlyU1: true },
  { match: "LEUCOCITO ESTERASE", abbr: "U1_LE", category: "Urina 1", onlyU1: true },
  { match: "LEUCOCITOS", abbr: "U1_Leuco", category: "Urina 1", onlyU1: true },
  { match: "ERITROCITOS", abbr: "U1_Hem", category: "Urina 1", onlyU1: true },
  { match: "GLICOSE", abbr: "U1_Glic", category: "Urina 1", onlyU1: true },

  // Líquido Pleural
  { match: "TOTAL DE CELULAS NUCLEADAS", abbr: "Pleural_Cel", category: "Líquido Pleural", onlyPleural: true },
  { match: "TOTAL DE CÉLULAS NUCLEADAS", abbr: "Pleural_Cel", category: "Líquido Pleural", onlyPleural: true },
  { match: "HEMOGLOBINA", abbr: "Pleural_Hb", category: "Líquido Pleural", onlyPleural: true }, // Bug 1
  { match: "NEUTROFILOS", abbr: "Pleural_PMN", category: "Líquido Pleural", onlyPleural: true },
  { match: "LINFOCITOS", abbr: "Pleural_Linf", category: "Líquido Pleural", onlyPleural: true },
  { match: "MONOCITOS", abbr: "Pleural_Mono", category: "Líquido Pleural", onlyPleural: true },
  { match: "GLICOSE", abbr: "Pleural_Glic", category: "Líquido Pleural", onlyPleural: true },
  { match: "PROTEINAS TOTAIS", abbr: "Pleural_Pt", category: "Líquido Pleural", onlyPleural: true },
  { match: "PH", abbr: "Pleural_pH", category: "Líquido Pleural", onlyPleural: true },
  { match: "DESIDROGENASE LACTICA", abbr: "Pleural_LDH", category: "Líquido Pleural", onlyPleural: true },
  { match: "HEMATOCRITO", abbr: "Pleural_Ht", category: "Líquido Pleural", onlyPleural: true },
  { match: "LEUCOCITOS", abbr: "Pleural_Leuco", category: "Líquido Pleural", onlyPleural: true },

  // Líquido Ascítico (Bug 3)
  { match: "TOTAL DE CELULAS NUCLEADAS", abbr: "Asc_Cel",   category: "Líquido Ascítico",   onlyAscitic: true },
  { match: "TOTAL DE CÉLULAS NUCLEADAS", abbr: "Asc_Cel",   category: "Líquido Ascítico",   onlyAscitic: true },
  { match: "HEMOGLOBINA",               abbr: "Asc_Hb",    category: "Líquido Ascítico",   onlyAscitic: true },
  { match: "NEUTROFILOS",               abbr: "Asc_PMN",   category: "Líquido Ascítico",   onlyAscitic: true },
  { match: "LINFOCITOS",                abbr: "Asc_Linf",  category: "Líquido Ascítico",   onlyAscitic: true },
  { match: "MONOCITOS",                 abbr: "Asc_Mono",  category: "Líquido Ascítico",   onlyAscitic: true },
  { match: "GLICOSE",                   abbr: "Asc_Glic",  category: "Líquido Ascítico",   onlyAscitic: true },
  { match: "PROTEINAS TOTAIS",          abbr: "Asc_Pt",    category: "Líquido Ascítico",   onlyAscitic: true },
  { match: "ALBUMINA",                  abbr: "Asc_Alb",   category: "Líquido Ascítico",   onlyAscitic: true },
  { match: "DESIDROGENASE LACTICA",     abbr: "Asc_LDH",   category: "Líquido Ascítico",   onlyAscitic: true },
  { match: "LEUCOCITOS",                abbr: "Asc_Leuco", category: "Líquido Ascítico",   onlyAscitic: true },

  // Líquido Sinovial (Bug 3)
  { match: "TOTAL DE CELULAS NUCLEADAS", abbr: "Sin_Cel",   category: "Líquido Sinovial",   onlySynovial: true },
  { match: "TOTAL DE CÉLULAS NUCLEADAS", abbr: "Sin_Cel",   category: "Líquido Sinovial",   onlySynovial: true },
  { match: "NEUTROFILOS",               abbr: "Sin_PMN",   category: "Líquido Sinovial",   onlySynovial: true },
  { match: "LINFOCITOS",                abbr: "Sin_Linf",  category: "Líquido Sinovial",   onlySynovial: true },
  { match: "MONOCITOS",                 abbr: "Sin_Mono",  category: "Líquido Sinovial",   onlySynovial: true },
  { match: "GLICOSE",                   abbr: "Sin_Glic",  category: "Líquido Sinovial",   onlySynovial: true },
  { match: "PROTEINAS TOTAIS",          abbr: "Sin_Pt",    category: "Líquido Sinovial",   onlySynovial: true },
  { match: "DESIDROGENASE LACTICA",     abbr: "Sin_LDH",   category: "Líquido Sinovial",   onlySynovial: true },
  { match: "LEUCOCITOS",                abbr: "Sin_Leuco", category: "Líquido Sinovial",   onlySynovial: true },

  // Líquido Pericárdico (Bug 3)
  { match: "TOTAL DE CELULAS NUCLEADAS", abbr: "Per_Cel",   category: "Líquido Pericárdico", onlyPericardial: true },
  { match: "TOTAL DE CÉLULAS NUCLEADAS", abbr: "Per_Cel",   category: "Líquido Pericárdico", onlyPericardial: true },
  { match: "NEUTROFILOS",               abbr: "Per_PMN",   category: "Líquido Pericárdico", onlyPericardial: true },
  { match: "LINFOCITOS",                abbr: "Per_Linf",  category: "Líquido Pericárdico", onlyPericardial: true },
  { match: "MONOCITOS",                 abbr: "Per_Mono",  category: "Líquido Pericárdico", onlyPericardial: true },
  { match: "GLICOSE",                   abbr: "Per_Glic",  category: "Líquido Pericárdico", onlyPericardial: true },
  { match: "PROTEINAS TOTAIS",          abbr: "Per_Pt",    category: "Líquido Pericárdico", onlyPericardial: true },
  { match: "DESIDROGENASE LACTICA",     abbr: "Per_LDH",   category: "Líquido Pericárdico", onlyPericardial: true },
  { match: "LEUCOCITOS",                abbr: "Per_Leuco", category: "Líquido Pericárdico", onlyPericardial: true },
];

const examOrder = [
  "Hb", "Ht", "Leuco", "Plaq",
  "PCR", "VHS",
  "Cr", "Ur", "Na", "K", "CaT", "CaIon", "Mg", "P", "Cl", "AcUrico", "RelAlb/Cr",
  "ALT", "AST", "FA", "GGT", "BT", "BD", "BI",
  "TGL", "CT", "HDL", "LDL", "VLDL", "nHDL",
  "ProtTot", "Alb", "Glob", "CPK", "LDH",
  "Ret", "Hapto", "VitB12", "AF", "Ferro", "Ferritina", "CTLF", "SatTransf", "Transf",
  "VitD25", "PTH", "Tropo", "NTproBNP", "Glic", "Insulina", "HbA1c", "T3", "T4", "T4L", "TSH", "LH", "FSH", "Estradiol", "TestoLivre", "TestoTotal", "SHBG", "Prolactina", "AFP",
  "Amilase", "Lipase",
  "TP", "INR", "TTPA", "R", "DD",
  "ID Histoplasma", "ID Aspergillus", "ID P. brasiliensis",
  "CI Histoplasma", "CI Aspergillus", "CI P. brasiliensis",
  "HIV",
  "HBsAg", "Anti-HBc Total", "Anti-HBc IgM", "Anti-HBs", "Anti-HBe", "HBeAg",
  "Anti-HCV",
  "HAV IgM", "HAV IgG",
  "Sífilis", "VDRL",
  "Chagas", "HTLV",
  "EBV IgM", "EBV IgG", "CMV IgM", "CMV IgG", "Toxo IgM", "Toxo IgG",
  "PCR-CMV", "HBV-DNA", "CV-HIV",
  "CD4", "CD8", "CD4/CD8",
  "Vancomicina", "FK", "Fluconazol", "Itraconazol", "Voriconazol", "EVR",
  "U1_Nit", "U1_LE", "U1_Leuco", "U1_Hem", "U1_Glic",
  "Pleural_Cel", "Pleural_PMN", "Pleural_Linf", "Pleural_Mono", "Pleural_Glic", "Pleural_Pt", "Pleural_pH", "Pleural_LDH", "Pleural_Hb", "Pleural_Ht", "Pleural_Leuco",
  "Asc_Cel", "Asc_PMN", "Asc_Linf", "Asc_Mono", "Asc_Glic", "Asc_Pt", "Asc_Alb", "Asc_LDH", "Asc_Hb", "Asc_Leuco",
  "Sin_Cel", "Sin_PMN", "Sin_Linf", "Sin_Mono", "Sin_Glic", "Sin_Pt", "Sin_LDH", "Sin_Leuco",
  "Per_Cel", "Per_PMN", "Per_Linf", "Per_Mono", "Per_Glic", "Per_Pt", "Per_LDH", "Per_Leuco",
  "Cel", "LMN", "PMN", "Hem", "Pt", "Gli", "Lac", "ADA", "Gram", "cBAC", "pFUN", "CrAg", "cFUN", "pBAAR", "TRM-TB", "cMIC",
  "EV", "VZV", "EBV", "CMV", "HAdV", "HSV1", "HSV2", "HHV6", "HHV7", "PVB19", "VDRL-LCR"
];


const categoryOrder = [
  "Hemograma",
  "Marcadores inflamatórios",
  "Eletrólitos/Renal",
  "Gasometria",
  "Hepático",
  "Perfil lipídico",
  "Proteínas",
  "Anemia",
  "Hormônios/Marcadores",
  "Pancreático",
  "Coagulação",
  "Sorologias",
  "Virologia",
  "Imunológico",
  "Fármacos",
  "Urina 1",
  "Líquido Pleural",
  "Líquido Ascítico",
  "Líquido Sinovial",
  "Líquido Pericárdico",
  "Líquor"
];

// Sorologias fúngicas com tratamento especial
const sorologiaAbbrs = new Set([
  "ID Histoplasma", "CI Histoplasma",
  "ID Aspergillus", "CI Aspergillus",
  "ID P. brasiliensis", "CI P. brasiliensis"
]);

const sorologiaGroups = [
  { label: "Histoplasma", idAbbr: "ID Histoplasma", ciAbbr: "CI Histoplasma" },
  { label: "Aspergillus", idAbbr: "ID Aspergillus", ciAbbr: "CI Aspergillus" },
  { label: "Paracoco", idAbbr: "ID P. brasiliensis", ciAbbr: "CI P. brasiliensis" }
];

function getDisplayName(abbr) {
  const customNames = {
    EVR: "Everolimus",
    U1_Nit: "Nit (U1)",
    U1_LE: "LE (U1)",
    U1_Leuco: "Leuco (U1)",
    U1_Hem: "Hem (U1)",
    Pleural_Cel: "Cel (Pleural)",
    Pleural_PMN: "PMN (Pleural)",
    Pleural_LMN: "LMN (Pleural)",
    Pleural_Hb: "Hb (Pleural)",
    Pleural_Ht: "Ht (Pleural)",
    Pleural_Glic: "Glic (Pleural)",
    Pleural_Pt: "Pt (Pleural)",
    Pleural_pH: "pH (Pleural)",
    Pleural_LDH: "LDH (Pleural)",
    Asc_Cel: "Cel (Asc)", Asc_PMN: "PMN (Asc)", Asc_Glic: "Glic (Asc)",
    Asc_Pt: "Pt (Asc)", Asc_Alb: "Alb (Asc)", Asc_LDH: "LDH (Asc)",
    Asc_Hb: "Hb (Asc)", Asc_Leuco: "Leuco (Asc)",
    Sin_Cel: "Cel (Sin)", Sin_PMN: "PMN (Sin)", Sin_Glic: "Glic (Sin)",
    Sin_Pt: "Pt (Sin)", Sin_LDH: "LDH (Sin)", Sin_Leuco: "Leuco (Sin)",
    Per_Cel: "Cel (Per)", Per_PMN: "PMN (Per)", Per_Glic: "Glic (Per)",
    Per_Pt: "Pt (Per)", Per_LDH: "LDH (Per)", Per_Leuco: "Leuco (Per)",
    "RelAlb/Cr": "Rel Alb/Cr",
    TestoLivre: "Testo Livre",
    TestoTotal: "Testo Total"
  };
  return customNames[abbr] || abbr;
}

function formatSorologiaValue(rawValue) {
  const norm = normalize(rawValue);
  if (norm.includes("NAO REAGENTE")) return "NR";
  if (norm.includes("REAGENTE")) {
    const m = rawValue.match(/\(([^)]+)\)/);
    if (m) return `R (${m[1].trim()})`;
    return "R";
  }
  return rawValue.trim();
}

function formatU1Value(val) {
  if (!val) return "";
  const norm = normalize(val);
  if (norm.includes("NAO REAGENTE") || norm.includes("NEGATIVO")) return "-";
  if (norm.includes("REAGENTE") || norm.includes("POSITIVO")) return "+";
  return val;
}

function buildSorologiaParts(bucket, selectedAbbrs) {
  const parts = [];
  for (const group of sorologiaGroups) {
    const idEntry = bucket[group.idAbbr];
    const ciEntry = bucket[group.ciAbbr];

    const idSelected = selectedAbbrs.includes(group.idAbbr);
    const ciSelected = selectedAbbrs.includes(group.ciAbbr);

    if ((!idEntry || !idSelected) && (!ciEntry || !ciSelected)) continue;

    const segs = [];
    if (idEntry && idSelected) segs.push(`ID ${formatSorologiaValue(idEntry.value)}`);
    if (ciEntry && ciSelected) segs.push(`CI ${formatSorologiaValue(ciEntry.value)}`);
    if (segs.length) parts.push(`${group.label} ${segs.join(" / ")}`);
  }
  return parts;
}

function findExamDefinition(examName) {
  const name = typeof examName === "string" ? examName : examName?.name;
  const section = typeof examName === "string" ? "" : (examName?.section || "");
  const norm = normalize(name);
  const normSection = normalize(section);
  const isLiquor = norm.includes("LIQUOR") || normSection.includes("LIQUOR") || normSection.includes("LCR");
  const isU1 = norm.includes("URINA TIPO 1") || norm.includes("URINA T1") || normSection.includes("URINA TIPO 1") || normSection.includes("URINA T1");
  const isPleural     = norm.includes("PLEURAL")     || normSection.includes("PLEURAL");
  const isAscitic     = norm.includes("ASCITICO")    || normSection.includes("ASCITICO") ||
                        norm.includes("ASCITE")       || normSection.includes("ASCITE");
  const isSynovial    = norm.includes("SINOVIAL")    || normSection.includes("SINOVIAL");
  const isPericardial = norm.includes("PERICARDICO") || normSection.includes("PERICARDICO");
  const isUrine = norm.includes("URINA") || normSection.includes("URINA");
  let bestDef = null;

  for (const def of examDefinitions) {
    const matchNorm = def.match; // já está em MAIÚSCULO sem acento na definição

    let ok = false;
    if (def.exact) {
      ok = norm === matchNorm;
    } else {
      ok = norm.includes(matchNorm);
    }
    if (ok && def.onlyLiquor && !isLiquor) ok = false;
    if (ok && def.internal === true && !isLiquor) ok = false;
    if (ok && def.onlyU1 && !isU1) ok = false;
    if (ok && def.onlyPleural     && !isPleural)     ok = false;
    if (ok && def.onlyAscitic     && !isAscitic)     ok = false;
    if (ok && def.onlySynovial    && !isSynovial)    ok = false;
    if (ok && def.onlyPericardial && !isPericardial) ok = false;
    // Se o contexto for U1, só aceita definições marcadas como onlyU1
    if (ok && isU1 && !def.onlyU1) ok = false;
    // Se o contexto for um fluido corporal, só aceita definições do fluido correto
    if (ok && isPleural     && !def.onlyPleural)     ok = false;
    if (ok && isAscitic     && !def.onlyAscitic)     ok = false;
    if (ok && isSynovial    && !def.onlySynovial)    ok = false;
    if (ok && isPericardial && !def.onlyPericardial) ok = false;
    // Se for exame de urina, impede o casamento com definições séricas (não-Urina 1 e não-RelAlb/Cr)
    if (ok && isUrine && def.category !== "Urina 1" && def.abbr !== "RelAlb/Cr") ok = false;

    if (!ok) continue;

    // Se ainda não temos melhor, ou se este "match" é mais específico (string maior)
    if (!bestDef || matchNorm.length > bestDef.match.length) {
      bestDef = def;
    }
  }

  return bestDef;
}

function parseDateToSortable(str) {
  const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return new Date(+m[3], +m[2] - 1, +m[1]);
}

function makeCollectionKey(dateStr, timeStr) {
  const safeDate = dateStr || "-";
  const safeTime = timeStr || "";
  return `${safeDate}@@${safeTime}`;
}

function splitCollectionKey(key) {
  if (typeof key !== "string") return { date: "-", time: "" };
  const idx = key.indexOf("@@");
  if (idx === -1) return { date: key || "-", time: "" };
  return {
    date: key.slice(0, idx) || "-",
    time: key.slice(idx + 2) || ""
  };
}

function parseTimeToMinutes(timeStr) {
  const m = (timeStr || "").match(/^(\d{2}):(\d{2})$/);
  if (!m) return -1;
  return (+m[1] * 60) + (+m[2]);
}

// ---------- PARSER DOS EXAMES ----------

function parseExams(rawText) {
  const lines = rawText.split(/\r?\n/);
  const exams = [];

  let currentDate = "";
  let currentTime = "";
  let currentSection = "";
  let pendingTiterExam = null;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Linha de título (ex.: "Titulo: 1/32") -> anexa ao último contraimuno reagente
    if (/^TITULO\s*:/i.test(normalize(line))) {
      if (pendingTiterExam) {
        const mTit = line.match(/^[Tt][ií]tulo\s*:\s*(.+)$/i);
        if (mTit) {
          const titer = mTit[1].trim();
          if (titer) {
            pendingTiterExam.value = `${pendingTiterExam.value} (${titer})`;
          }
        }
        pendingTiterExam = null;
      }
      continue;
    }

    // Data + hora (Coletado em)
    const coletado = parseColetadoEmLine(line);
    if (coletado) {
      currentDate = coletado.date;
      currentTime = coletado.time || "";
      currentSection = ""; // Bug 7: resetar contexto de seção ao iniciar nova coleta
      continue;
    }

    // Cabeçalho de Urina 1, Líquido Pleural e outros fluidos corporais (Bug 5 + Bug 3)
    // Não requer " - " — qualquer linha que identifique o tipo de fluido é tratada como cabeçalho
    if (/(URINA TIPO 1|URINA T1|URINA T\.1|URINA AMOSTRA ISOLADA|PLEURAL|ASCITICO|ASCITE|SINOVIAL|PERICARDICO)/i.test(line)) {
      currentSection = line.trim();
      continue;
    }

    // Cabeçalho da seção (nome do exame/painel)
    if (/GASOMETRIA/i.test(line)) {
      currentSection = line.trim();
      continue;
    }

    if (
      /- SANGUE - ,/i.test(line) ||
      /HEMOGRAMA COMPLETO/i.test(line) ||
      /PLAQUETAS - SANGUE/i.test(line)
    ) {
      const section = line.split("- SANGUE")[0].trim();
      currentSection = section || line;
      continue;
    }

    // Cabeçalho de seções de outros materiais (ex.: líquor)
    if (/\s-\s[^-]+\s-\s*,/i.test(line)) {
      currentSection = line.trim();
      continue;
    }

    // Alguns laudos de líquor vêm com separadores inconsistentes (ex.: "- -")
    if (/(LIQUOR|LCR)/i.test(normalize(line)) && /\s-\s/i.test(line)) {
      currentSection = line.trim();
      continue;
    }

    // Linhas irrelevantes
    if (/Resultado dos 3 últimos exames/i.test(line)) continue;
    if (/Liberado e Validado/i.test(line)) continue;
    if (/DIVISÃO DE LABORATÓRIO CENTRAL/i.test(line)) continue;
    if (/LABORATORIO DE INVESTIGACAO MEDICA/i.test(normalize(line))) continue;
    if (/^Pedido\s*:/i.test(line)) continue;
    if (/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}$/.test(line)) continue;
    if (/Novos valores de referência/i.test(line)) continue;
    if (/Automatizado|Colorimétrico|Enzimático|Eletrodo íon seletivo|Cinético UV|IFCC|Citometria de fluxo|PCR em Tempo Real|HPLC/i.test(line)) continue;
    if (/Alteração nos valores de referência/i.test(line)) continue;
    if (/Titulos ate 1\/2/i.test(normalize(line))) continue;

    // Culturas positivas em microbiologia podem vir como "1 - Microrganismo"
    // ou em linha simples (ex.: "Cryptococcus neoformans").
    if (currentSection && /CULTURA/i.test(currentSection)) {
      const mIsolado = line.match(/^\d+\s*-\s*(.+)$/);
      if (mIsolado) {
        const isolado = (mIsolado[1] || "").trim();
        if (isolado) {
          exams.push({
            date: currentDate || "",
            time: currentTime || "",
            section: currentSection || "",
            name: currentSection,
            value: isolado,
            unit: "",
            normName: normalize(currentSection)
          });
        }
        continue;
      }

      const normLine = normalize(line);
      const normSection = normalize(currentSection);
      const isRepeatedSectionName = normLine === normSection || normSection.startsWith(normLine);
      const isCultureNote = /MATERIAL BIOLOGICO|CONSULTE MANUAL DE EXAMES|LIBERADO E VALIDADO|RESULTADO DOS 3 ULTIMOS EXAMES/i.test(normLine);
      const isLabelOnly = /:$/.test(line);

      if (!isRepeatedSectionName && !isCultureNote && !isLabelOnly) {
        exams.push({
          date: currentDate || "",
          time: currentTime || "",
          section: currentSection || "",
          name: currentSection,
          value: line,
          unit: "",
          normName: normalize(currentSection)
        });
        continue;
      }
    }

    if (currentSection && /GASOMETRIA/i.test(currentSection)) {
      continue;
    }

    let parts = [];
    const normLine = normalize(line);
    const normSection = normalize(currentSection);
    const isLiquor = normLine.includes("LIQUOR") || normSection.includes("LIQUOR") || normSection.includes("LCR");
    const isU1 = normLine.includes("URINA TIPO 1") || normLine.includes("URINA T1") || normSection.includes("URINA TIPO 1") || normSection.includes("URINA T1");
    const isPleural     = normLine.includes("PLEURAL")     || normSection.includes("PLEURAL");
    const isAscitic     = normLine.includes("ASCITICO")    || normSection.includes("ASCITICO") ||
                          normLine.includes("ASCITE")       || normSection.includes("ASCITE");
    const isSynovial    = normLine.includes("SINOVIAL")    || normSection.includes("SINOVIAL");
    const isPericardial = normLine.includes("PERICARDICO") || normSection.includes("PERICARDICO");
    const isUrine = normLine.includes("URINA") || normSection.includes("URINA");

    // 1. Tenta Smart Split primeiro
    let bestMatchDef = null;
    for (const def of examDefinitions) {
      if (def.onlyLiquor     && !isLiquor)     continue;
      if (def.internal === true && !isLiquor)  continue;
      if (def.onlyU1         && !isU1)         continue;
      if (def.onlyPleural    && !isPleural)    continue;
      if (def.onlyAscitic    && !isAscitic)    continue;
      if (def.onlySynovial   && !isSynovial)   continue;
      if (def.onlyPericardial && !isPericardial) continue;
      if (isU1         && !def.onlyU1)         continue;
      if (isPleural    && !def.onlyPleural)    continue;
      if (isAscitic    && !def.onlyAscitic)    continue;
      if (isSynovial   && !def.onlySynovial)   continue;
      if (isPericardial && !def.onlyPericardial) continue;
      if (isUrine && def.category !== "Urina 1" && def.abbr !== "RelAlb/Cr") continue;

      if (normLine.includes(def.match)) {
        if (!bestMatchDef || def.match.length > bestMatchDef.match.length) {
          bestMatchDef = def;
        }
      }
    }

    if (bestMatchDef) {
      const matchPos = normLine.indexOf(bestMatchDef.match);
      if (matchPos !== -1) {
        const prefix = line.slice(0, matchPos);
        const isValidPrefix = /^[^\w]*$/.test(prefix) || /^\d+[\s.)-]*$/.test(prefix.trim());
        if (isValidPrefix) {
          const splitIndex = matchPos + bestMatchDef.match.length;
          const namePart = line.slice(0, splitIndex).trim();
          const remainderRaw = line.slice(splitIndex).trim();
          
          let remainderClean = remainderRaw.replace(/^[::=\s]+/, "").trim();
          if (remainderClean) {
            const normRemainderClean = normalize(remainderClean);
            const startsWithVal = /^[<>*]?\s*\d/.test(remainderClean);
            const isQualitative = /^(REAGENTE|NAO\s+REAGENTE|NEGATIVO|POSITIVO|INDETERMINADO|NORMAL|DETECTADO|NAO\s+DETECTADO|NEG|POS|NR|AUSENCIA|AUSENTE|AUSENTES|NAO\s+FORAM|PARCIAL)\b/.test(normRemainderClean);
            
            if (startsWithVal || isQualitative) {
              let valuePart = remainderClean;
              const doubleSpaceIndex = remainderClean.search(/\s{2,}|\t+/);
              if (doubleSpaceIndex !== -1) {
                valuePart = remainderClean.slice(0, doubleSpaceIndex).trim();
              } else {
                const mQual1 = remainderClean.match(/^(NAO\s+REAGENTE|REAGENTE|NEGATIVO|POSITIVO|INDETERMINADO|NORMAL|DETECTADO|NAO\s+DETECTADO|NEG|POS|NR|AUSENCIA|AUSENTE|AUSENTES|PARCIAL)\b/i);
                if (mQual1) {
                  const firstQual = mQual1[0];
                  const rest = remainderClean.slice(mQual1.index + firstQual.length).trim();
                  const mQual2 = rest.match(/^(NAO\s+REAGENTE|REAGENTE|NEGATIVO|POSITIVO|INDETERMINADO|NORMAL|DETECTADO|NAO\s+DETECTADO|NEG|POS|NR|AUSENCIA|AUSENTE|AUSENTES|PARCIAL)\b/i);
                  if (mQual2) {
                    valuePart = firstQual;
                  } else {
                    const isRef = /^(ATE|NORMAL|ADULTOS|HOMENS|MULHERES|VALOR|VALORES|LIMITES|LIMITE|REFERENCIA|REF)\b/i.test(normalize(rest)) || /^[<>=\d]/.test(rest);
                    if (isRef) {
                      valuePart = firstQual;
                    }
                  }
                }
              }
              parts = [namePart, valuePart];
            }
          }
        }
      }
    }

    // 2. Se o Smart Split falhou em achar 2 partes, tenta o split bruto
    if (parts.length < 2) {
      parts = line.split(/\s{2,}|\t+/).filter(Boolean);
    }

    if (parts.length < 2) continue;

    let name = parts[0];
    let normName = normalize(name);
    const valueUnit = parts[1];

    // Linhas tipo "Resultado:" em sorologias → usar nome da seção
    if (normName.startsWith("RESULTADO") && currentSection) {
      name = currentSection;
      normName = normalize(name);
    }

    // CD4/CD8 absolutos
    if (normName.includes("CD45/CD3/CD4") || normName.includes("CD45/CD3/CD8")) {
      const absField = parts[2] || parts[1] || "";
      const mAbs = absField.match(/[\d.,]+/);
      if (mAbs) {
        exams.push({
          date: currentDate || "",
          time: currentTime || "",
          section: currentSection || "",
          name,
          value: mAbs[0],
          unit: "cel/mm³",
          normName
        });
      }
      continue;
    }

    // Quantitativos ou Qualitativos
    let parsedAsQuant = false;
    if (/\d/.test(valueUnit)) {
      const m = valueUnit.match(/^([<>*]?\s*[+-]?\s*[\d.,]+)\s*(.*)$/);
      if (m) {
        exams.push({
          date: currentDate || "",
          time: currentTime || "",
          section: currentSection || "",
          name: name,
          value: m[1].trim().replace(/([+-])\s+/g, "$1"),
          unit: m[2].trim(),
          normName: normName
        });
        parsedAsQuant = true;
      }
    }
    
    if (!parsedAsQuant) {
      // Qualitativos (R/NR etc.)
      const value = valueUnit.trim();
      if (value) {
        const examObj = {
          date: currentDate || "",
          time: currentTime || "",
          section: currentSection || "",
          name,
          value,
          unit: "",
          normName
        };
        exams.push(examObj);

        // Contraimuno reagente → pode ganhar título depois
        if (
          (normName.includes("CONTRAIMUNO") || normName.includes("VDRL")) &&
          normalize(value).includes("REAGENTE")
        ) {
          pendingTiterExam = examObj;
        } else if (normName.includes("CONTRAIMUNO") || normName.includes("VDRL")) {
          pendingTiterExam = null;
        }
      }
    }
  }

  return exams;
}

// ---------- GASOMETRIA (arterial/venosa) ----------

function parseGasometrias(rawText) {
  const lines = rawText.split(/\r?\n/);
  const gasos = [];

  let currentDate = "";
  let currentTime = "";
  let inGaso = false;
  let currentTipo = "";
  let currentValores = null;

  function finalizarBloco() {
    if (inGaso && currentValores && Object.keys(currentValores).length > 0) {
      gasos.push({
        date: currentDate || "-",
        time: currentTime || "-",
        tipo: currentTipo,
        valores: currentValores
      });
    }
    inGaso = false;
    currentTipo = "";
    currentValores = null;
  }

  for (let rawLine of lines) {
    const line = rawLine.trim();

    // ⚠️ NÃO vamos mais fechar bloco em linha em branco: gaso do HC tem blank logo após o cabeçalho
    if (!line) {
      continue;
    }

    // Data
    const coletado = parseColetadoEmLine(line);
    if (coletado) {
      finalizarBloco();
      currentDate = coletado.date;
      currentTime = coletado.time || "";
      continue;
    }

    // Início de bloco de gasometria
    if (/GASOMETRIA/i.test(line)) {
      finalizarBloco();
      inGaso = true;
      currentValores = {};
      const norm = normalize(line);
      if (norm.includes("ARTERIAL")) currentTipo = "arterial";
      else if (norm.includes("VENOSO") || norm.includes("VENOSA")) currentTipo = "venosa";
      else currentTipo = "desconhecido";

      // Fallback: se a própria linha de cabeçalho contiver a data/hora e currentDate ainda estiver vazio
      if (!currentDate) {
        const mDate = line.match(/(\d{2}\/\d{2}\/\d{4})(?:\s+(\d{2}):(\d{2}))?/);
        if (mDate) {
          currentDate = mDate[1];
          if (mDate[2] && mDate[3]) currentTime = `${mDate[2]}:${mDate[3]}`;
        }
      }
      continue;
    }

    // Se estiver lendo gasometria e encontrar cabeçalho de outro exame, finaliza o bloco da gasometria
    if (inGaso && currentValores && Object.keys(currentValores).length > 0) {
      if (
        /- SANGUE/i.test(line) ||
        /HEMOGRAMA/i.test(line) ||
        /PLAQUETAS/i.test(line) ||
        /(URINA TIPO 1|URINA T1|URINA T\.1|URINA AMOSTRA ISOLADA|PLEURAL|ASCITICO|ASCITE|SINOVIAL|PERICARDICO)/i.test(line) ||
        /(LIQUOR|LCR)/i.test(normalize(line)) ||
        /CULTURA/i.test(line)
      ) {
        finalizarBloco();
        continue;
      }
    }

    if (!inGaso) continue;

    const normLine = normalize(line);

    // Helper genérico: pega o primeiro número depois do rótulo
    function extractAfter(labelRegex, sourceLine) {
      const m = sourceLine.match(labelRegex);
      if (!m) return null;
      const rest = sourceLine.slice(m.index + m[0].length);
      const mNum = rest.match(/([<>*]?\s*[\d.,+-]+)/);
      return mNum ? mNum[1].trim() : null;
    }

    // Ordem importante: PCO2 antes de PO2
    if (/PCO2/i.test(line)) {
      const v = extractAfter(/PCO2/i, line);
      if (v) currentValores.pCO2 = v;
      continue;
    }

    if (/PO2/i.test(line)) {
      const v = extractAfter(/PO2/i, line);
      if (v) currentValores.pO2 = v;
      continue;
    }

    if (/PH\b/i.test(line)) {
      const v = extractAfter(/PH\b/i, line);
      if (v) currentValores.pH = v;
      continue;
    }

    if (/HCO3|CTHCO3/i.test(normLine)) {
      const v = extractAfter(/HCO3|CTHCO3/i, line);
      if (v) currentValores.HCO3 = v;
      continue;
    }

    if (/\bBE\b/i.test(line)) {
      const v = extractAfter(/\bBE\b/i, line);
      if (v) currentValores.BE = v;
      continue;
    }

    if (/SO2/i.test(line)) {
      const v = extractAfter(/SO2/i, line);
      if (v) currentValores.SO2 = v;
      continue;
    }

    if (/LACTATO/i.test(normLine)) {
      const v = extractAfter(/LACTATO/i, line);
      if (v) currentValores.Lactato = v;
      continue;
    }
  }

  finalizarBloco();
  return gasos;
}

function buildGasometriaMap(gasos) {
  const map = new Map();
  for (const g of gasos) {
    const collectionKey = makeCollectionKey(g.date || "-", g.time || "");
    if (!map.has(collectionKey)) map.set(collectionKey, []);
    map.get(collectionKey).push(g);
  }
  return map;
}

function buildGasometriaTextForDate(collectionKey, gasoMap, selectedAbbrs) {
  if (!gasoMap || !gasoMap.has(collectionKey)) return "";

  const lista = gasoMap.get(collectionKey);
  const arterialSelecionada = selectedAbbrs.includes("GasArterial");
  const venosaSelecionada = selectedAbbrs.includes("GasVenosa");
  if (!arterialSelecionada && !venosaSelecionada) return "";

  const ordemArt = ["pH", "pO2", "pCO2", "HCO3", "BE", "SO2", "Lactato"];
  const ordemVen = ["pH", "HCO3", "BE", "Lactato"];

  function formatPanel(label, vals, ordem) {
    const sub = [];
    for (const k of ordem) {
      if (vals && vals[k] != null) sub.push(`${k} ${vals[k]}`);
    }
    if (!sub.length) return "";
    return `${label}: ${sub.join(" | ")}`;
  }

  let lastArt = null;
  let lastVen = null;
  for (const g of lista) {
    if (g.tipo === "arterial") lastArt = g;
    if (g.tipo === "venosa") lastVen = g;
  }

  const parts = [];
  if (arterialSelecionada && lastArt) {
    const t = formatPanel("Gaso art", lastArt.valores, ordemArt);
    if (t) parts.push(t);
  }
  if (venosaSelecionada && lastVen) {
    const t = formatPanel("Gaso ven", lastVen.valores, ordemVen);
    if (t) parts.push(t);
  }

  return parts.join(" | ");
}

const liquorAbbrSet = new Set([
  "Cel", "LMN", "PMN", "Hem", "Pt", "Gli", "Lac", "ADA", "Gram", "cBAC", "pFUN", "CrAg", "cFUN", "pBAAR", "TRM-TB", "cMIC",
  "EV", "VZV", "EBV", "CMV", "HAdV", "HSV1", "HSV2", "HHV6", "HHV7", "PVB19", "VDRL-LCR"
]);

function formatLiquorMicroValue(value) {
  const raw = (value || "").trim();
  const n = normalize(raw);
  if (!raw) return "";
  if (n.includes("PARCIAL NEGAT")) return "PN";
  if (n.includes("NAO DETECT") || n.includes("NAO REAGENTE") || n.includes("NEGAT")) return "neg";
  if (n.includes("DETECT") || n.includes("REAGENTE") || n.includes("POSIT")) {
    const mTit = raw.match(/\(([^)]+)\)/);
    if (mTit) return `pos (${mTit[1].trim()})`;
    return "pos";
  }
  if (n.includes("NAO FORAM OBSERVADOS MICRORGANISMOS") || n.includes("AUSENCIA DE MICRORGANISMOS")) return "neg";
  return raw;
}

function buildLiquorText(bucket, selectedAbbrs) {
  const selectedLiquor = selectedAbbrs.filter(abbr => liquorAbbrSet.has(abbr));
  if (!selectedLiquor.length) return "";

  const parts = [];

  if (selectedAbbrs.includes("Cel") && bucket.Cel) {
    let cellText = `Cel ${bucket.Cel.value}`;
    if (selectedAbbrs.includes("LMN") || selectedAbbrs.includes("PMN")) {
      const linf = parseFloat(String(bucket.LinfLiquor?.value || "").replace(",", "."));
      const mono = parseFloat(String(bucket.MonoLiquor?.value || "").replace(",", "."));
      const pmn = bucket.PMN?.value;
      const cellSub = [];
      if (selectedAbbrs.includes("LMN") && Number.isFinite(linf) && Number.isFinite(mono)) {
        cellSub.push(`${(linf + mono).toString().replace(".", ",")}% LMN`);
      }
      if (selectedAbbrs.includes("PMN") && pmn != null) {
        cellSub.push(`${pmn}% PMN`);
      }
      if (cellSub.length) cellText += ` (${cellSub.join(" / ")})`;
    }
    parts.push(cellText);
  } else {
    if (selectedAbbrs.includes("LMN")) {
      const linf = parseFloat(String(bucket.LinfLiquor?.value || "").replace(",", "."));
      const mono = parseFloat(String(bucket.MonoLiquor?.value || "").replace(",", "."));
      if (Number.isFinite(linf) && Number.isFinite(mono)) parts.push(`LMN ${(linf + mono).toString().replace(".", ",")}%`);
    }
    if (selectedAbbrs.includes("PMN") && bucket.PMN) parts.push(`PMN ${bucket.PMN.value}%`);
  }

  if (selectedAbbrs.includes("Hem") && bucket.Hem) parts.push(`Hem ${bucket.Hem.value}`);
  if (selectedAbbrs.includes("Pt") && bucket.Pt) parts.push(`Pt ${bucket.Pt.value}`);
  if (selectedAbbrs.includes("Gli") && bucket.Gli) parts.push(`Gli ${bucket.Gli.value}`);
  if (selectedAbbrs.includes("Lac") && bucket.Lac) parts.push(`Lac ${bucket.Lac.value}`);
  if (selectedAbbrs.includes("ADA") && bucket.ADA) parts.push(`ADA ${bucket.ADA.value}`);
  if (selectedAbbrs.includes("Gram") && bucket.Gram) parts.push(`Gram ${formatLiquorMicroValue(bucket.Gram.value)}`);
  if (selectedAbbrs.includes("cBAC") && bucket.cBAC) parts.push(`cBAC ${formatLiquorMicroValue(bucket.cBAC.value)}`);
  if (selectedAbbrs.includes("pFUN") && bucket.pFUN) parts.push(`pFUN ${formatLiquorMicroValue(bucket.pFUN.value)}`);
  if (selectedAbbrs.includes("CrAg") && bucket.CrAg) parts.push(`CrAg ${formatLiquorMicroValue(bucket.CrAg.value)}`);
  if (selectedAbbrs.includes("cFUN") && bucket.cFUN) parts.push(`cFUN ${formatLiquorMicroValue(bucket.cFUN.value)}`);
  if (selectedAbbrs.includes("pBAAR") && bucket.pBAAR) parts.push(`pBAAR ${formatLiquorMicroValue(bucket.pBAAR.value)}`);
  if (selectedAbbrs.includes("TRM-TB") && bucket["TRM-TB"]) parts.push(`TRM-TB ${formatLiquorMicroValue(bucket["TRM-TB"].value)}`);
  if (selectedAbbrs.includes("cMIC") && bucket.cMIC) parts.push(`cMIC ${formatLiquorMicroValue(bucket.cMIC.value)}`);

  const viralAbbrs = ["EV", "VZV", "EBV", "CMV", "HAdV", "HSV1", "HSV2", "HHV6", "HHV7", "PVB19"];
  const viral = viralAbbrs
    .filter(abbr => selectedAbbrs.includes(abbr) && bucket[abbr])
    .map(abbr => `${abbr} ${formatLiquorMicroValue(bucket[abbr].value)}`);
  if (viral.length) parts.push(`Painel viral: ${viral.join(" | ")}`);

  if (selectedAbbrs.includes("VDRL-LCR") && bucket["VDRL-LCR"]) parts.push(`VDRL ${formatLiquorMicroValue(bucket["VDRL-LCR"].value)}`);

  if (!parts.length) return "";
  return `LCR: ${parts.join(" | ")}`;
}

const u1AbbrSet = new Set(["U1_Nit", "U1_LE", "U1_Leuco", "U1_Hem", "U1_Glic"]);
const pleuralAbbrSet = new Set([
  "Pleural_Cel", "Pleural_PMN", "Pleural_Linf", "Pleural_Mono",
  "Pleural_Glic", "Pleural_Pt", "Pleural_pH", "Pleural_LDH",
  "Pleural_Hb", "Pleural_Ht", "Pleural_Leuco" // Bug 1: Pleural_Hb adicionado
]);
const asciticAbbrSet = new Set([
  "Asc_Cel", "Asc_PMN", "Asc_LMN", "Asc_Linf", "Asc_Mono",
  "Asc_Glic", "Asc_Pt", "Asc_Alb", "Asc_LDH", "Asc_Hb", "Asc_Leuco"
]);
const synovialAbbrSet = new Set([
  "Sin_Cel", "Sin_PMN", "Sin_LMN", "Sin_Linf", "Sin_Mono",
  "Sin_Glic", "Sin_Pt", "Sin_LDH", "Sin_Leuco"
]);
const pericardialAbbrSet = new Set([
  "Per_Cel", "Per_PMN", "Per_LMN", "Per_Linf", "Per_Mono",
  "Per_Glic", "Per_Pt", "Per_LDH", "Per_Leuco"
]);

function formatPercent(val) {
  if (val == null) return "";
  const s = String(val).trim();
  if (s.endsWith("%")) return s;
  return s + "%";
}

function buildUrina1Text(bucket, selectedAbbrs) {
  const hasU1Data = Object.keys(bucket).some(key => u1AbbrSet.has(key));
  if (!hasU1Data) return "";

  const parts = [];
  if (selectedAbbrs.includes("U1_Nit") && bucket.U1_Nit) {
    parts.push(`Nit ${formatU1Value(bucket.U1_Nit.value)}`);
  }
  if (selectedAbbrs.includes("U1_LE") && bucket.U1_LE) {
    parts.push(`LE ${formatU1Value(bucket.U1_LE.value)}`);
  }
  if (selectedAbbrs.includes("U1_Leuco") && bucket.U1_Leuco) {
    parts.push(`Leuco ${bucket.U1_Leuco.value}`);
  }
  if (selectedAbbrs.includes("U1_Hem") && bucket.U1_Hem) {
    parts.push(`Hem ${bucket.U1_Hem.value}`);
  }

  if (!parts.length) return "";
  return `U1: ${parts.join(" | ")}`;
}

// Função genérica compartilhada para todos os fluidos corporais (Pleural, Ascítico, Sinovial, Pericárdico)
function buildGenericFluidText(bucket, selectedAbbrs, prefix, displayLabel) {
  const celKey   = `${prefix}_Cel`;
  const pmnKey   = `${prefix}_PMN`;
  const lmnKey   = `${prefix}_LMN`;
  const linfKey  = `${prefix}_Linf`;
  const monoKey  = `${prefix}_Mono`;
  const glicKey  = `${prefix}_Glic`;
  const ptKey    = `${prefix}_Pt`;
  const pHKey    = `${prefix}_pH`;
  const ldhKey   = `${prefix}_LDH`;
  const hbKey    = `${prefix}_Hb`;
  const htKey    = `${prefix}_Ht`;
  const albKey   = `${prefix}_Alb`;

  const hasData = [celKey, pmnKey, glicKey, ptKey, ldhKey, hbKey, htKey, albKey]
    .some(k => bucket[k]);
  if (!hasData) return "";

  const parts = [];

  if (selectedAbbrs.includes(celKey) && bucket[celKey]) {
    let celText = `Cel ${bucket[celKey].value}`;
    const sub = [];
    if (selectedAbbrs.includes(pmnKey) && bucket[pmnKey])
      sub.push(`PMN ${formatPercent(bucket[pmnKey].value)}`);
    if (selectedAbbrs.includes(lmnKey)) {
      const linf = bucket[linfKey] ? parseFloat(String(bucket[linfKey].value).replace(",", ".")) : null;
      const mono = bucket[monoKey] ? parseFloat(String(bucket[monoKey].value).replace(",", ".")) : null;
      if (linf != null && mono != null && !isNaN(linf) && !isNaN(mono))
        sub.push(`LMN ${formatPercent((linf + mono).toString().replace(".", ","))}`);
      else if (linf != null && !isNaN(linf))
        sub.push(`LMN ${formatPercent(linf.toString().replace(".", ","))}`);
    }
    if (sub.length) celText += ` (${sub.join(" | ")})`;
    parts.push(celText);
  } else {
    if (selectedAbbrs.includes(pmnKey) && bucket[pmnKey])
      parts.push(`PMN ${formatPercent(bucket[pmnKey].value)}`);
    if (selectedAbbrs.includes(lmnKey)) {
      const linf = bucket[linfKey] ? parseFloat(String(bucket[linfKey].value).replace(",", ".")) : null;
      const mono = bucket[monoKey] ? parseFloat(String(bucket[monoKey].value).replace(",", ".")) : null;
      if (linf != null && mono != null && !isNaN(linf) && !isNaN(mono))
        parts.push(`LMN ${formatPercent((linf + mono).toString().replace(".", ","))}`);
      else if (linf != null && !isNaN(linf))
        parts.push(`LMN ${formatPercent(linf.toString().replace(".", ","))}`);
    }
  }

  if (selectedAbbrs.includes(glicKey) && bucket[glicKey]) parts.push(`Glic ${bucket[glicKey].value}`);
  if (selectedAbbrs.includes(ptKey)   && bucket[ptKey])   parts.push(`Pt ${bucket[ptKey].value}`);
  if (selectedAbbrs.includes(albKey)  && bucket[albKey])  parts.push(`Alb ${bucket[albKey].value}`);
  if (selectedAbbrs.includes(pHKey)   && bucket[pHKey])   parts.push(`pH ${bucket[pHKey].value}`);
  if (selectedAbbrs.includes(ldhKey)  && bucket[ldhKey])  parts.push(`LDH ${bucket[ldhKey].value}`);
  if (selectedAbbrs.includes(hbKey)   && bucket[hbKey])   parts.push(`Hb ${bucket[hbKey].value}`);
  if (selectedAbbrs.includes(htKey)   && bucket[htKey])   parts.push(`Ht ${bucket[htKey].value}`);

  if (!parts.length) return "";
  return `${displayLabel}: ${parts.join(" | ")}`;
}

// Wrappers por tipo de fluido
function buildPleuralText(bucket, selectedAbbrs) {
  return buildGenericFluidText(bucket, selectedAbbrs, "Pleural", "Líq. Pleural");
}
function buildAsciticText(bucket, selectedAbbrs) {
  return buildGenericFluidText(bucket, selectedAbbrs, "Asc", "Líq. Ascítico");
}
function buildSynovialText(bucket, selectedAbbrs) {
  return buildGenericFluidText(bucket, selectedAbbrs, "Sin", "Líq. Sinovial");
}
function buildPericardialText(bucket, selectedAbbrs) {
  return buildGenericFluidText(bucket, selectedAbbrs, "Per", "Líq. Pericárdico");
}

// ---------- Construção por data ----------

function buildDateMap(exams, selectedAbbrs) {
  const dateMap = new Map();
  for (const ex of exams) {
    const def = findExamDefinition(ex);
    if (!def) continue;
    const isRequiredInternal = (def.internal && selectedAbbrs && selectedAbbrs.includes("LMN")) ||
      ((def.abbr === "Pleural_Linf" || def.abbr === "Pleural_Mono") && selectedAbbrs && selectedAbbrs.includes("Pleural_LMN"));
    if (selectedAbbrs && !selectedAbbrs.includes(def.abbr) && !isRequiredInternal) continue;

    const collectionKey = makeCollectionKey(ex.date || "-", ex.time || "");
    if (!dateMap.has(collectionKey)) {
      dateMap.set(collectionKey, {
        __date: ex.date || "-",
        __time: ex.time || ""
      });
    }
    const bucket = dateMap.get(collectionKey);

    if (!bucket[def.abbr]) {
      bucket[def.abbr] = { value: ex.value, category: def.category };
    }
  }
  return dateMap;
}

function sortDates(arr) {
  return arr.sort((a, b) => {
    const pa = splitCollectionKey(a);
    const pb = splitCollectionKey(b);

    const da = parseDateToSortable(pa.date);
    const db = parseDateToSortable(pb.date);
    if (!da || !db) return 0;

    if (+da !== +db) return da - db;
    return parseTimeToMinutes(pa.time) - parseTimeToMinutes(pb.time);
  });
}

function getAllSortedDates(dateMap, gasoMap) {
  const set = new Set([
    ...Array.from(dateMap.keys()),
    ...(gasoMap ? Array.from(gasoMap.keys()) : [])
  ]);
  return sortDates(Array.from(set));
}

// ---------- Geração de texto ----------

function generateLinesPerDate(exams, selectedAbbrs, gasoMap) {
  const dateMap = buildDateMap(exams, selectedAbbrs);
  const orderedDates = getAllSortedDates(dateMap, gasoMap);
  const lines = [];

  for (const collectionKey of orderedDates) {
    const bucket = dateMap.get(collectionKey) || {};
    const keyParts = splitCollectionKey(collectionKey);
    const date = bucket.__date || keyParts.date;
    const time = bucket.__time || keyParts.time;
    const parts = [];

    for (const abbr of examOrder) {
      if (sorologiaAbbrs.has(abbr)) continue;
      if (liquorAbbrSet.has(abbr)) continue;
      if (u1AbbrSet.has(abbr)) continue;
      if (pleuralAbbrSet.has(abbr)) continue;
      if (asciticAbbrSet.has(abbr)) continue;
      if (synovialAbbrSet.has(abbr)) continue;
      if (pericardialAbbrSet.has(abbr)) continue;
      if (!selectedAbbrs.includes(abbr)) continue;
      if (bucket[abbr]) {
        let val = bucket[abbr].value;
        if (bucket[abbr].category === "Sorologias") {
          val = formatSorologiaValue(val);
        }
        parts.push(`${getDisplayName(abbr)} ${val}`);
      }
    }

    const sorologiaParts = buildSorologiaParts(bucket, selectedAbbrs);
    parts.push(...sorologiaParts);

    const liquorText = buildLiquorText(bucket, selectedAbbrs);
    if (liquorText) parts.push(liquorText);

    const gasoText = buildGasometriaTextForDate(collectionKey, gasoMap, selectedAbbrs);
    if (gasoText) parts.push(gasoText);

    const label = formatDateTimeLabel(date, time);
    if (parts.length) {
      lines.push(`(${label}) ${parts.join(" | ")}`);
    }

    const u1Text = buildUrina1Text(bucket, selectedAbbrs);
    if (u1Text) { lines.push(`(${label}) ${u1Text}`); }

    const pleuralText = buildPleuralText(bucket, selectedAbbrs);
    if (pleuralText) { lines.push(`(${label}) ${pleuralText}`); }

    const asciticText = buildAsciticText(bucket, selectedAbbrs);
    if (asciticText) { lines.push(`(${label}) ${asciticText}`); }

    const synovialText = buildSynovialText(bucket, selectedAbbrs);
    if (synovialText) { lines.push(`(${label}) ${synovialText}`); }

    const pericardialText = buildPericardialText(bucket, selectedAbbrs);
    if (pericardialText) { lines.push(`(${label}) ${pericardialText}`); }
  }

  return lines;
}

function generateTextByCategories(exams, selectedAbbrs, gasoMap) {
  const dateMap = buildDateMap(exams, selectedAbbrs);
  const orderedDates = getAllSortedDates(dateMap, gasoMap);
  const blocks = [];

  for (const collectionKey of orderedDates) {
    const bucket = dateMap.get(collectionKey) || {};
    const keyParts = splitCollectionKey(collectionKey);
    const date = bucket.__date || keyParts.date;
    const time = bucket.__time || keyParts.time;
    const categoryLines = {};

    for (const abbr of examOrder) {
      if (sorologiaAbbrs.has(abbr)) continue;
      if (liquorAbbrSet.has(abbr)) continue;
      if (u1AbbrSet.has(abbr)) continue;
      if (pleuralAbbrSet.has(abbr)) continue;
      if (asciticAbbrSet.has(abbr)) continue;
      if (synovialAbbrSet.has(abbr)) continue;
      if (pericardialAbbrSet.has(abbr)) continue;
      if (!selectedAbbrs.includes(abbr)) continue;
      const entry = bucket[abbr];
      if (!entry) continue;
      const cat = entry.category;
      if (!categoryLines[cat]) categoryLines[cat] = [];
      let val = entry.value;
      if (cat === "Sorologias") {
        val = formatSorologiaValue(val);
      }
      categoryLines[cat].push(`${getDisplayName(abbr)} ${val}`);
    }

    const sorologiaParts = buildSorologiaParts(bucket, selectedAbbrs);
    if (sorologiaParts.length) {
      if (!categoryLines["Sorologias"]) categoryLines["Sorologias"] = [];
      categoryLines["Sorologias"].push(...sorologiaParts);
    }

    const liquorText = buildLiquorText(bucket, selectedAbbrs);
    if (liquorText) {
      if (!categoryLines["Líquor"]) categoryLines["Líquor"] = [];
      categoryLines["Líquor"].push(liquorText.replace(/^LCR:\s*/, ""));
    }

    const u1Text = buildUrina1Text(bucket, selectedAbbrs);
    if (u1Text) {
      if (!categoryLines["Urina 1"]) categoryLines["Urina 1"] = [];
      categoryLines["Urina 1"].push(u1Text.replace(/^U1:\s*/, ""));
    }

    const pleuralText = buildPleuralText(bucket, selectedAbbrs);
    if (pleuralText) {
      if (!categoryLines["Líquido Pleural"]) categoryLines["Líquido Pleural"] = [];
      categoryLines["Líquido Pleural"].push(pleuralText.replace(/^Líq\.\s*Pleural:\s*/i, ""));
    }

    const asciticText = buildAsciticText(bucket, selectedAbbrs);
    if (asciticText) {
      if (!categoryLines["Líquido Ascítico"]) categoryLines["Líquido Ascítico"] = [];
      categoryLines["Líquido Ascítico"].push(asciticText.replace(/^Líq\.\s*Ascítico:\s*/i, ""));
    }

    const synovialText = buildSynovialText(bucket, selectedAbbrs);
    if (synovialText) {
      if (!categoryLines["Líquido Sinovial"]) categoryLines["Líquido Sinovial"] = [];
      categoryLines["Líquido Sinovial"].push(synovialText.replace(/^Líq\.\s*Sinovial:\s*/i, ""));
    }

    const pericardialText = buildPericardialText(bucket, selectedAbbrs);
    if (pericardialText) {
      if (!categoryLines["Líquido Pericárdico"]) categoryLines["Líquido Pericárdico"] = [];
      categoryLines["Líquido Pericárdico"].push(pericardialText.replace(/^Líq\.\s*Pericárdico:\s*/i, ""));
    }

    const gasoText = buildGasometriaTextForDate(collectionKey, gasoMap, selectedAbbrs);
    if (gasoText) {
      if (!categoryLines["Gasometria"]) categoryLines["Gasometria"] = [];
      categoryLines["Gasometria"].push(gasoText);
    }

    const label = formatDateTimeLabel(date, time);
    const linesForDate = [`(${label})`];

    for (const cat of categoryOrder) {
      if (categoryLines[cat] && categoryLines[cat].length) {
        linesForDate.push(`- ${cat}: ${categoryLines[cat].join(" | ")}`);
      }
    }

    if (linesForDate.length > 1) {
      blocks.push(linesForDate.join("\n"));
    }
  }

  return blocks.join("\n\n");
}

// ---------- Integração com a interface ----------

const rawInput = document.getElementById("rawInput");
const btnModeLine = document.getElementById("btnModeLine");
const btnModeCategories = document.getElementById("btnModeCategories");
const btnCopyText = document.getElementById("btnCopyText");
const outputText = document.getElementById("outputText");
const statusEl = document.getElementById("status");
const examCheckboxes = document.querySelectorAll(".exam-toggle input[type=checkbox]");

const btnSelectAllExams = document.getElementById("btnSelectAllExams");
const btnClearAllExams = document.getElementById("btnClearAllExams");
const btnSelectRoutine = document.getElementById("btnSelectRoutine");

const btnClearInput = document.getElementById("btnClearInput");
const btnToggleFilters = document.getElementById("btnToggleFilters");
const examFilterDrawer = document.getElementById("examFilterDrawer");
const filterStatusLabel = document.getElementById("filterStatusLabel");
const toastContainer = document.getElementById("toastContainer");
const btnCloseDrawer = document.getElementById("btnCloseDrawer");
const drawerBackdrop = document.getElementById("drawerBackdrop");

// Mover o drawer de filtros para o body para mantê-lo fora do layout grid principal
if (examFilterDrawer && document.body) {
  document.body.appendChild(examFilterDrawer);
}

function getSelectedAbbrs() {
  return Array.from(examCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);
}

// ---------- Toasts e Contadores de Filtros ----------

function showToast(message) {
  if (!toastContainer) return;
  
  // Remove existing toasts first to prevent stacking clutter
  const existingToasts = toastContainer.querySelectorAll(".toast");
  existingToasts.forEach((t) => t.remove());

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>📋</span> <span>${message}</span>`;
  toastContainer.appendChild(toast);
  
  // Trigger transition
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);
  
  // Clean up
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2500);
}

function updateFilterCount() {
  if (!filterStatusLabel || !examCheckboxes) return;
  const total = examCheckboxes.length;
  const active = Array.from(examCheckboxes).filter((cb) => cb.checked).length;
  filterStatusLabel.textContent = `Filtros de Exames (${active} de ${total} ativos)`;
}

// ---------- Eventos ----------

if (btnModeLine) {
  btnModeLine.addEventListener("click", () => {
    prefs.viewMode = "line";
    if (btnModeCategories) btnModeCategories.classList.remove("active");
    btnModeLine.classList.add("active");
    autoGenerate();
  });
}

if (btnModeCategories) {
  btnModeCategories.addEventListener("click", () => {
    prefs.viewMode = "categories";
    if (btnModeLine) btnModeLine.classList.remove("active");
    btnModeCategories.classList.add("active");
    autoGenerate();
  });
}

if (btnClearInput) {
  btnClearInput.addEventListener("click", () => {
    if (rawInput) rawInput.value = "";
    if (outputText) outputText.value = "";
    if (statusEl) statusEl.textContent = "";
    showToast("Laudo bruto limpo");
    autoGenerate();
  });
}

if (btnToggleFilters && examFilterDrawer) {
  examFilterDrawer.style.display = "";
  
  const openDrawer = () => {
    examFilterDrawer.classList.add("open");
    if (drawerBackdrop) drawerBackdrop.classList.add("open");
    btnToggleFilters.classList.add("active");
  };

  const closeDrawer = () => {
    examFilterDrawer.classList.remove("open");
    if (drawerBackdrop) drawerBackdrop.classList.remove("open");
    btnToggleFilters.classList.remove("active");
  };

  btnToggleFilters.addEventListener("click", () => {
    if (examFilterDrawer.classList.contains("open")) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  if (btnCloseDrawer) {
    btnCloseDrawer.addEventListener("click", closeDrawer);
  }

  if (drawerBackdrop) {
    drawerBackdrop.addEventListener("click", closeDrawer);
  }
}

if (btnCopyText && outputText) {
  btnCopyText.addEventListener("click", () => {
    const text = outputText.value.trim();
    if (!text) {
      showToast("Nada para copiar ainda. Gere o texto primeiro.");
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast("Texto copiado!");
      })
      .catch(() => {
        showToast("Erro ao copiar automaticamente.");
      });
  });
}

if (btnSelectAllExams && examCheckboxes) {
  btnSelectAllExams.addEventListener("click", () => {
    examCheckboxes.forEach((cb) => { cb.checked = true; });
    if (statusEl) statusEl.textContent = "Todos os exames foram selecionados.";
    autoGenerate();
  });
}

if (btnClearAllExams && examCheckboxes) {
  btnClearAllExams.addEventListener("click", () => {
    examCheckboxes.forEach((cb) => { cb.checked = false; });
    if (statusEl) statusEl.textContent = "Todos os exames foram desmarcados.";
    autoGenerate();
  });
}

if (btnSelectRoutine && examCheckboxes) {
  btnSelectRoutine.addEventListener("click", () => {
    const routineCategories = new Set(["Hemograma", "Marcadores inflamatórios", "Eletrólitos/Renal", "Gasometria", "Hepático", "Coagulação"]);
    examCheckboxes.forEach((cb) => {
      const cat = cb.dataset.category;
      cb.checked = routineCategories.has(cat);
    });
    if (statusEl) statusEl.textContent =
      "Selecionados exames de rotina (Hemograma, Marcadores, Inflamatórios, Eletrólitos/Renal, Gasometria, Hepático e Coagulação).";
    autoGenerate();
  });
}

const categorySelectButtons = document.querySelectorAll(".category-select");
const categoryClearButtons = document.querySelectorAll(".category-clear");

categorySelectButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const cat = btn.dataset.category;
    examCheckboxes.forEach((cb) => {
      if (cb.dataset.category === cat) cb.checked = true;
    });
    if (statusEl) statusEl.textContent = `Selecionados todos os exames de ${cat}.`;
    autoGenerate();
  });
});

categoryClearButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const cat = btn.dataset.category;
    examCheckboxes.forEach((cb) => {
      if (cb.dataset.category === cat) cb.checked = false;
    });
    if (statusEl) statusEl.textContent = `Desmarcados todos os exames de ${cat}.`;
    autoGenerate();
  });
});

// Atualiza output automaticamente quando um checkbox é marcado/desmarcado
examCheckboxes.forEach(cb => {
  cb.addEventListener("change", () => {
    autoGenerate();
  });
});

if (rawInput) {
  rawInput.addEventListener("input", () => {
    autoGenerate();
  });
}

function autoGenerate() {
  updateFilterCount();
  if (!rawInput || !outputText || !statusEl) return;

  const raw = rawInput.value.trim();
  if (!raw) {
    outputText.value = "";
    statusEl.textContent = "";
    return;
  }

  const selectedAbbrs = getSelectedAbbrs();
  const exams = parseExams(raw);
  const gasos = parseGasometrias(raw);
  const gasoMap = buildGasometriaMap(gasos);

  if (!exams.length && !gasos.length) {
    outputText.value = "Nenhum exame reconhecido. Confira se o texto foi copiado completo do sistema.";
    statusEl.textContent = "";
    return;
  }

  let text = "";
  if (prefs.viewMode === "categories") {
    text = generateTextByCategories(exams, selectedAbbrs, gasoMap) ||
      "Nenhum exame correspondente aos filtros selecionados.";
  } else {
    const lines = generateLinesPerDate(exams, selectedAbbrs, gasoMap);
    text = lines.join("\n") || "Nenhum exame correspondente aos filtros selecionados.";
  }

  outputText.value = text;
  statusEl.textContent =
    `Exames reconhecidos: ${exams.length}. Gasometrias reconhecidas: ${gasos.length}.`;

  window.__EXAMES_APP__.last = {
    raw: raw,
    selectedAbbrs,
    exams,
    gasos,
    gasoMap,
    dateMap: buildDateMap(exams, selectedAbbrs),
    lines: prefs.viewMode === "line"
      ? generateLinesPerDate(exams, selectedAbbrs, gasoMap)
      : []
  };

  // Atualização reativa da tabela
  if (window.__EXAMES_APP__ && typeof window.__EXAMES_APP__.updateTable === "function") {
    const tableContainer = document.getElementById("tableContainer");
    if (tableContainer && tableContainer.style.display === "block") {
      window.__EXAMES_APP__.updateTable();
    }
  }

  // Atualização reativa do gráfico
  if (window.__EXAMES_APP__ && typeof window.__EXAMES_APP__.updateChart === "function") {
    window.__EXAMES_APP__.updateChart();
  }
}

function setupSegmented(containerId, onPick) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    [...el.querySelectorAll("button")].forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    onPick(btn.dataset);
    autoGenerate();
  });
}

setupSegmented("dateFormat", (ds) => {
  prefs.dateFormat = ds.format || "ddmmyy";
});

setupSegmented("showTime", (ds) => {
  prefs.showTime = (ds.showtime === "yes");
});

// ---- Expor helpers pro tableExport.js (SEM APAGAR .last) ----
window.__EXAMES_APP__ = window.__EXAMES_APP__ || {};

Object.assign(window.__EXAMES_APP__, {
  parseExams,
  parseGasometrias,
  buildGasometriaMap,
  buildDateMap,
  getAllSortedDates,
  buildGasometriaTextForDate,
  examOrder,
  sorologiaAbbrs,
  buildSorologiaParts,
  sorologiaGroups, // opcional
  getSelectedAbbrs,
  formatDateTimeLabel,
  prefs,
  liquorAbbrSet,
  formatLiquorMicroValue,
  showToast,
  getDisplayName,
  u1AbbrSet,
  pleuralAbbrSet,
  findExamDefinition,
  generateLinesPerDate,
  generateTextByCategories,
  formatSorologiaValue,
  formatU1Value
});

// ---------- Alternância de Tema (Light/Dark Mode) ----------
(function setupTheme() {
  const themeToggle = document.getElementById("themeToggle");
  let currentTheme = "light";
  
  try {
    currentTheme = localStorage.getItem("theme") || "light";
  } catch(e) {}

  if (currentTheme === "dark") {
    document.body.classList.add("dark-theme");
    if (themeToggle) {
      const icon = themeToggle.querySelector(".theme-icon");
      if (icon) icon.textContent = "☀️";
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-theme");
      const isDark = document.body.classList.contains("dark-theme");
      
      try {
        localStorage.setItem("theme", isDark ? "dark" : "light");
      } catch(e) {}
      
      const icon = themeToggle.querySelector(".theme-icon");
      if (icon) icon.textContent = isDark ? "☀️" : "🌙";

      // Atualizar o gráfico para refletir as novas cores do tema
      if (window.__EXAMES_APP__ && typeof window.__EXAMES_APP__.updateChart === "function") {
        window.__EXAMES_APP__.updateChart();
      }
    });
  }
})();

// Inicializar contagem de filtros
updateFilterCount();

// ---------- Alternância de Abas ----------
(function setupTabs() {
  const tabExams = document.getElementById("tabExams");
  const tabAntibiotics = document.getElementById("tabAntibiotics");
  const tabVitals = document.getElementById("tabVitals");
  const tabGlycemia = document.getElementById("tabGlycemia");
  const tabTemperature = document.getElementById("tabTemperature");
  const tabInfusions = document.getElementById("tabInfusions");

  const examsSection = document.getElementById("examsSection");
  const antibioticsSection = document.getElementById("antibioticsSection");
  const vitalsSection = document.getElementById("vitalsSection");
  const glycemiaSection = document.getElementById("glycemiaSection");
  const temperatureSection = document.getElementById("temperatureSection");
  const infusionsSection = document.getElementById("infusionsSection");

  const tabs = [
    { id: "exames", tab: tabExams, sec: examsSection, hash: "exames" },
    { id: "antibioticos", tab: tabAntibiotics, sec: antibioticsSection, hash: "antibioticos" },
    { id: "vitals", tab: tabVitals, sec: vitalsSection, hash: "controles" },
    { id: "glicemia", tab: tabGlycemia, sec: glycemiaSection, hash: "glicemia" },
    { id: "temperatura", tab: tabTemperature, sec: temperatureSection, hash: "temperatura" },
    { id: "infusoes", tab: tabInfusions, sec: infusionsSection, hash: "calculadora-infusoes", altHashes: ["infusoes", "calculadora-infusoes"] }
  ];

  function activateTab(targetItem, updateHash = true) {
    tabs.forEach(item => {
      if (item.tab && item.sec) {
        if (item === targetItem) {
          item.tab.classList.add("active");
          item.sec.classList.add("active");
          item.sec.style.display = "block";
          if (updateHash && window.history && window.history.replaceState) {
            window.history.replaceState(null, "", `#${item.hash}`);
          }
        } else {
          item.tab.classList.remove("active");
          item.sec.classList.remove("active");
          item.sec.style.display = "none";
        }
      }
    });
  }

  tabs.forEach(item => {
    if (item.tab && item.sec) {
      item.tab.addEventListener("click", () => {
        activateTab(item, true);
      });
    }
  });

  // Roteamento inicial por URL Hash ou Parâmetro ?ferramenta=
  function handleRoute() {
    const hash = (window.location && window.location.hash ? window.location.hash : "").replace("#", "").toLowerCase();
    const hasSearchParams = typeof URLSearchParams !== "undefined" && window.location && window.location.search;
    const urlParams = hasSearchParams ? new URLSearchParams(window.location.search) : null;
    const param = (urlParams && urlParams.get("ferramenta") || "").toLowerCase();

    const targetRoute = hash || param;
    if (!targetRoute) return;

    const matched = tabs.find(item => {
      if (item.hash === targetRoute) return true;
      if (item.altHashes && item.altHashes.includes(targetRoute)) return true;
      return false;
    });

    if (matched) {
      activateTab(matched, false);
    }
  }

  window.addEventListener("hashchange", handleRoute);
  handleRoute();
})();

