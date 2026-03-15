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
  showTime: false
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
  { match: "CELULAS", abbr: "Cel", category: "Líquor" },
  { match: "HEMACIAS", abbr: "Hem", category: "Líquor" },
  { match: "PROTEINAS TOTAIS", abbr: "Pt", category: "Líquor", onlyLiquor: true },
  { match: "GLICOSE", abbr: "Gli", category: "Líquor", onlyLiquor: true },
  { match: "LACTATO", abbr: "Lac", category: "Líquor", onlyLiquor: true },
  { match: "ADENOSINA DEAMINASE", abbr: "ADA", category: "Líquor" },
  { match: "EXAME BACTERIOSCOPICO", abbr: "Gram", category: "Líquor" },
  { match: "CULTURA AEROBIA", abbr: "cBAC", category: "Líquor" },
  { match: "PESQUISA DE FUNGOS", abbr: "pFUN", category: "Líquor" },
  { match: "PESQUISA DE ANTIGENO DE CRIPTOCOCCUS", abbr: "CrAg", category: "Líquor" },
  { match: "CULTURA PARA FUNGOS", abbr: "cFUN", category: "Líquor" },
  { match: "PESQUISA DE BACILO ALCOOL-ACIDO RESISTENTE", abbr: "pBAAR", category: "Líquor" },
  { match: "TESTE RAPIDO MOLECULAR PARA TUBERCULOSE", abbr: "TRM-TB", category: "Líquor" },
  { match: "CULTURA PARA MICOBACTERIAS", abbr: "cMIC", category: "Líquor" },
  { match: "ENTEROVIRUS (EV)", abbr: "EV", category: "Líquor" },
  { match: "VARICELA ZOSTER (VZV)", abbr: "VZV", category: "Líquor" },
  { match: "EPSTEIN-BARR (EBV)", abbr: "EBV", category: "Líquor" },
  { match: "CITOMEGALOVIRUS (CMV)", abbr: "CMV", category: "Líquor" },
  { match: "ADENOVIRUS (HADV)", abbr: "HAdV", category: "Líquor" },
  { match: "HERPES SIMPLEX I", abbr: "HSV1", category: "Líquor" },
  { match: "HERPES SIMPLEX II", abbr: "HSV2", category: "Líquor" },
  { match: "HERPESVIRUS HUMANO 6", abbr: "HHV6", category: "Líquor" },
  { match: "HERPESVIRUS HUMANO 7", abbr: "HHV7", category: "Líquor" },
  { match: "ERITROVIRUS B19", abbr: "PVB19", category: "Líquor" },
  { match: "VDRL", abbr: "VDRL-LCR", category: "Líquor", onlyLiquor: true },
  { match: "LINFOCITOS", abbr: "LinfLiquor", category: "Líquor", internal: true },
  { match: "MONOCITOS", abbr: "MonoLiquor", category: "Líquor", internal: true },
  { match: "NEUTROFILOS", abbr: "PMN", category: "Líquor" },

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
  { match: "HEMOGLOBINA GLICADA", abbr: "HbA1c", category: "Hormônios/Marcadores" },
  { match: "TRIIODOTIRONINA (T3)", abbr: "T3", category: "Hormônios/Marcadores" },
  { match: "TIROXINA (T4)", abbr: "T4", category: "Hormônios/Marcadores" },
  { match: "TIROXINA LIVRE (T4L)", abbr: "T4L", category: "Hormônios/Marcadores" },
  { match: "HORMONIO TIREO-ESTIMULANTE (TSH)", abbr: "TSH", category: "Hormônios/Marcadores" },
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
   
];

const examOrder = [
  "Cel", "LMN", "PMN", "Hem", "Pt", "Gli", "Lac", "ADA", "Gram", "cBAC", "pFUN", "CrAg", "cFUN", "pBAAR", "TRM-TB", "cMIC",
  "EV", "VZV", "EBV", "CMV", "HAdV", "HSV1", "HSV2", "HHV6", "HHV7", "PVB19", "VDRL-LCR",
  "Hb", "Ht", "Leuco", "Plaq",
  "PCR", "VHS",
  "Na", "K", "Cl", "Cr", "Ur", "CaT", "CaIon", "Mg", "P", "AcUrico",
  "ALT", "AST", "FA", "GGT", "BT", "BD", "BI",
  "TGL", "CT", "HDL", "LDL", "VLDL", "nHDL",
  "ProtTot", "Alb", "Glob", "CPK", "LDH",
  "Ret", "Hapto", "VitB12", "AF", "Ferro", "Ferritina", "CTLF", "SatTransf", "Transf",
  "VitD25", "PTH", "Tropo", "NTproBNP", "Glic", "Insulina", "HbA1c", "T3", "T4", "T4L", "TSH", "AFP",
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
  "Vancomicina", "FK", "Fluconazol", "Itraconazol", "Voriconazol",
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
  "Líquor",
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
  return abbr;
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

    const parts = line.split(/\s{2,}|\t+/).filter(Boolean);
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

    // Quantitativos
    if (/\d/.test(valueUnit)) {
      const m = valueUnit.match(/^([<>*]?\s*[\d.,+-]+)\s*(.*)$/);
      if (m) {
        exams.push({
          date: currentDate || "",
          time: currentTime || "",
          section: currentSection || "",
          name,
          value: m[1].trim(),
          unit: m[2].trim(),
          normName
        });
      }
    } else {
      // Qualitativos (R/NR etc.)
      const value = valueUnit.trim();
      if (!value) continue;

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
      continue;
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

// ---------- Construção por data ----------

function buildDateMap(exams, selectedAbbrs) {
  const dateMap = new Map();
  for (const ex of exams) {
    const def = findExamDefinition(ex);
    if (!def) continue;
    const isRequiredInternal = def.internal && selectedAbbrs && selectedAbbrs.includes("LMN");
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
      if (!selectedAbbrs.includes(abbr)) continue;
      if (bucket[abbr]) {
        parts.push(`${getDisplayName(abbr)} ${bucket[abbr].value}`);
      }
    }

    const sorologiaParts = buildSorologiaParts(bucket, selectedAbbrs);
    parts.push(...sorologiaParts);

    const liquorText = buildLiquorText(bucket, selectedAbbrs);
    if (liquorText) parts.push(liquorText);

    const gasoText = buildGasometriaTextForDate(collectionKey, gasoMap, selectedAbbrs);
    if (gasoText) parts.push(gasoText);

    if (parts.length) {
      const label = formatDateTimeLabel(date, time);
      lines.push(`(${label}) ${parts.join(" | ")}`);
    }
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
      if (!selectedAbbrs.includes(abbr)) continue;
      const entry = bucket[abbr];
      if (!entry) continue;
      const cat = entry.category;
      if (!categoryLines[cat]) categoryLines[cat] = [];
      categoryLines[cat].push(`${getDisplayName(abbr)} ${entry.value}`);
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
const btnGenerateLine = document.getElementById("btnGenerateLine");
const btnGenerateCategories = document.getElementById("btnGenerateCategories");
const btnCopyText = document.getElementById("btnCopyText");
const outputText = document.getElementById("outputText");
const statusEl = document.getElementById("status");
const examCheckboxes = document.querySelectorAll(".exam-toggle input[type=checkbox]");

const btnSelectAllExams = document.getElementById("btnSelectAllExams");
const btnClearAllExams = document.getElementById("btnClearAllExams");
const btnSelectRoutine = document.getElementById("btnSelectRoutine");

function getSelectedAbbrs() {
  return Array.from(examCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);
}

function generate(mode) {
  if (!rawInput || !outputText || !statusEl) return;

  const raw = rawInput.value.trim();
  statusEl.textContent = "";

  if (!raw) {
    outputText.value = "Cole o laudo bruto no campo acima antes de gerar o texto.";
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
  if (mode === "line") {
    const lines = generateLinesPerDate(exams, selectedAbbrs, gasoMap);
    text = lines.join("\n") || "Nenhum exame correspondente aos filtros selecionados.";
  } else {
    text = generateTextByCategories(exams, selectedAbbrs, gasoMap) ||
      "Nenhum exame correspondente aos filtros selecionados.";
  }

  outputText.value = text;
  statusEl.textContent =
    `Exames reconhecidos: ${exams.length}. Gasometrias reconhecidas: ${gasos.length}. Filtros ativos: ${selectedAbbrs.length}.`;

window.__EXAMES_APP__.last = {
  raw,
  selectedAbbrs,
  exams,
  gasos,
  gasoMap,
  dateMap: buildDateMap(exams, selectedAbbrs),
  lines: mode === "line"
    ? generateLinesPerDate(exams, selectedAbbrs, gasoMap)
    : []
};


}

// ---------- Eventos ----------

if (btnGenerateLine) {
  btnGenerateLine.addEventListener("click", () => generate("line"));
}

if (btnGenerateCategories) {
  btnGenerateCategories.addEventListener("click", () => generate("categories"));
}

if (btnCopyText && outputText && statusEl) {
  btnCopyText.addEventListener("click", () => {
    const text = outputText.value.trim();
    if (!text) {
      statusEl.textContent = "Nada para copiar ainda. Gere o texto primeiro.";
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => {
        statusEl.textContent = "Texto copiado para a área de transferência.";
      })
      .catch(() => {
        statusEl.textContent = "Não foi possível copiar automaticamente.";
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

  const lines = generateLinesPerDate(exams, selectedAbbrs, gasoMap);

  outputText.value = lines.join("\n");
  statusEl.textContent =
    `Exames reconhecidos: ${exams.length}. Gasometrias reconhecidas: ${gasos.length}.`;

  window.__EXAMES_APP__.last = {
    raw: raw,
    selectedAbbrs,
    exams,
    gasos,
    gasoMap,
    dateMap: buildDateMap(exams, selectedAbbrs),
    lines: generateLinesPerDate(exams, selectedAbbrs, gasoMap)
  };

  
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
  prefs
});
