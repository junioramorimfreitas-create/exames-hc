// ---------- Utilidades ----------

function normalize(str) {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

// Mapa de exames -> abreviação e categoria
const examDefinitions = [
  // Hemograma
  { match: "HEMOGLOBINA", abbr: "Hb", category: "Hemograma" },
  { match: "HEMATOCRITO", abbr: "Ht", category: "Hemograma" },
  { match: "LEUCOCITOS", abbr: "Leuco", category: "Hemograma" },
  { match: "PLAQUETAS", abbr: "Plaq", category: "Hemograma" },

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

  // Metabólico / vitamínico / ferro
  { match: "25-HIDROXIVITAMINA D", abbr: "VitD25", category: "Metabólico/Vitamínico" },
  { match: "VITAMINA B 12", abbr: "VitB12", category: "Metabólico/Vitamínico" },
  { match: "FERRO", abbr: "Ferro", category: "Metabólico/Vitamínico" },
  { match: "FERRITINA", abbr: "Ferritina", category: "Metabólico/Vitamínico" },

  // Hormônios / marcadores
  { match: "PARATORMONIO (PTH)", abbr: "PTH", category: "Hormônios/Marcadores" },
  { match: "NT-PROBNP", abbr: "NTproBNP", category: "Hormônios/Marcadores" },
  { match: "INSULINA", abbr: "Insulina", category: "Hormônios/Marcadores" },
  { match: "HEMOGLOBINA GLICADA", abbr: "HbA1c", category: "Hormônios/Marcadores" },
  { match: "TRIIODOTIRONINA (T3)", abbr: "T3", category: "Hormônios/Marcadores" },
  { match: "TIROXINA (T4)", abbr: "T4", category: "Hormônios/Marcadores" },
  { match: "TIROXINA LIVRE (T4L)", abbr: "T4L", category: "Hormônios/Marcadores" },
  { match: "HORMONIO TIREO-ESTIMULANTE (TSH)", abbr: "TSH", category: "Hormônios/Marcadores" },
  { match: "ALFAFETOPROTEINA", abbr: "AFP", category: "Hormônios/Marcadores" },
  { match: "CREATINO FOSFOQUINASE", abbr: "CPK", category: "Hormônios/Marcadores" },

  // Pancreático
  { match: "AMILASE", abbr: "Amilase", category: "Pancreático" },
  { match: "LIPASE", abbr: "Lipase", category: "Pancreático" },

  // Coagulação
  { match: "TEMPO DE PROTROMBINA", abbr: "TP", category: "Coagulação" },
  { match: "INR =", abbr: "INR", category: "Coagulação" },
  { match: "TEMPO DE TROMBOPLASTINA PARCIAL ATIVADA", abbr: "TTPA", category: "Coagulação" },

  // Sorologias (Micologia)
  { match: "IMUNODIFUSAO HISTOPLASMA CAPSULATUM", abbr: "ID Histoplasma", category: "Sorologias" },
  { match: "IMUNODIFUSAO ASPERGILLUS FUMIGATUS", abbr: "ID Aspergillus", category: "Sorologias" },
  { match: "IMUNODIFUSAO PARACOCCIDIOIDES BRASILIENSIS", abbr: "ID P. brasiliensis", category: "Sorologias" },
  { match: "CONTRAIMUNO PARACOCCIDIOIDES BRASILIENSIS", abbr: "CI P. brasiliensis", category: "Sorologias" },
  { match: "CONTRAIMUNO HISTOPLASMA CAPSULATUM", abbr: "CI Histoplasma", category: "Sorologias" },
  { match: "CONTRAIMUNO ASPERGILLUS FUMIGATUS", abbr: "CI Aspergillus", category: "Sorologias" },

  // --- Sorologias Hepatite B ---
  { match: "HEPATITE B - AGHBS", abbr: "HBsAg", category: "Sorologias" },
  { match: "HEPATITE B - ANTI-HBC TOTAL", abbr: "Anti-HBc Total", category: "Sorologias" },
  { match: "HEPATITE B - ANTI-HBC IGM", abbr: "Anti-HBc IgM", category: "Sorologias" },
  { match: "HEPATITE B - ANTI-HBS", abbr: "Anti-HBs", category: "Sorologias" },
  { match: "HEPATITE B - ANTI-HBE", abbr: "Anti-HBe", category: "Sorologias" },
  { match: "HEPATITE B - AGHBE", abbr: "HBeAg", category: "Sorologias" },
  { match: "DETECÇÃO QUANTITATIVA DE DNA DO VIRUS DA HEPATITE B", abbr: "HBV-DNA", category: "Virologia" },
  
  // --- Sífilis ---
  { match: "TREPONEMA PALLIDUM", abbr: "Sífilis", category: "Sorologias" },
  
  // --- HIV ---
  { match: "ANTICORPOS CONTRA HIV1/2", abbr: "HIV", category: "Sorologias" },
  { match: "CARGA VIRAL HIV-1", abbr: "CV-HIV", category: "Virologia" },

  // --- HCV ---
  { match: "HEPATITE C - SOROLOGIA", abbr: "Anti-HCV", category: "Sorologias" },

  // Imunológico (CD4/CD8)
  { match: "CD45/CD3/CD4", abbr: "CD4", category: "Imunológico" },
  { match: "CD45/CD3/CD8", abbr: "CD8", category: "Imunológico" },
  { match: "CD4/CD8", abbr: "CD4/CD8", category: "Imunológico" },


];

const examOrder = [
  "Hb", "Ht", "Leuco", "Plaq",
  "Na", "K", "Cl", "Cr", "Ur", "CaT", "CaIon", "Mg", "P", "AcUrico",
  "ALT", "AST", "FA", "GGT", "BT", "BD", "BI",
  "TGL", "CT", "HDL", "LDL", "VLDL", "nHDL",
  "ProtTot", "Alb", "Glob",
  "VitD25", "VitB12", "Ferro", "Ferritina",
  "PTH", "NTproBNP",
  "Insulina", "HbA1c",
  "TSH", "T3", "T4", "T4L",
  "AFP", "CPK",
  "Amilase", "Lipase",
  "TP", "INR", "TTPA",
  "CD4", "CD8", "CD4/CD8",
  "ID Histoplasma", "ID Aspergillus", "ID P. brasiliensis",
  "CI Histoplasma", "CI Aspergillus", "CI P. brasiliensis",
  "HIV",
  "HBsAg", "Anti-HBc Total", "Anti-HBc IgM", "Anti-HBs", "Anti-HBe", "HBeAg",
  "Anti-HCV", "Sífilis",
  "CV-HIV", "HBV-DNA"
];

const categoryOrder = [
  "Hemograma",
  "Eletrólitos/Renal",
  "Hepático",
  "Perfil lipídico",
  "Proteínas",
  "Metabólico/Vitamínico",
  "Hormônios/Marcadores",
  "Pancreático",
  "Coagulação",
  "Imunológico",
  "Sorologias",
  "Virologia",
  "Gasometria"
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
  const norm = normalize(examName);
  for (const def of examDefinitions) {
    if (def.exact) {
      if (norm === def.match) return def;
    } else {
      if (norm.includes(def.match)) return def;
    }
  }
  return null;
}

function parseDateToSortable(str) {
  const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return new Date(+m[3], +m[2] - 1, +m[1]);
}

// ---------- PARSER DOS EXAMES ----------

function parseExams(rawText) {
  const lines = rawText.split(/\r?\n/);
  const exams = [];

  let currentDate = "";
  let currentSection = "";
  let pendingTiterExam = null;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Linha de título (ex.: "Titulo: 1/32") -> anexa ao último contraimuno reagente
    if (/^Titulo\s*:/i.test(line)) {
      if (pendingTiterExam) {
        const mTit = line.match(/^Titulo\s*:\s*(.+)$/i);
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

    // Data
    const dateMatch = line.match(/Coletado em:\s*(\d{2}\/\d{2}\/\d{4})/);
    if (dateMatch) {
      currentDate = dateMatch[1];
      continue;
    }

    // Cabeçalho da seção (nome do exame/painel)
    if (
      /- SANGUE - ,/i.test(line) ||
      /HEMOGRAMA COMPLETO/i.test(line) ||
      /PLAQUETAS - SANGUE/i.test(line)
    ) {
      const section = line.split("- SANGUE")[0].trim();
      currentSection = section || line;
      continue; // <<<<< AQUI era o bug: tinha um "return exams"
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
      const m = valueUnit.match(/^([<>*]?\s*[\d.,]+)\s*(.*)$/);
      if (m) {
        exams.push({
          date: currentDate || "",
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
        section: currentSection || "",
        name,
        value,
        unit: "",
        normName
      };
      exams.push(examObj);

      // Contraimuno reagente → pode ganhar título depois
      if (
        normName.includes("CONTRAIMUNO") &&
        normalize(value).includes("REAGENTE")
      ) {
        pendingTiterExam = examObj;
      } else if (normName.includes("CONTRAIMUNO")) {
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
  let inGaso = false;
  let currentTipo = "";
  let currentValores = null;

  function finalizarBloco() {
    if (inGaso && currentValores) {
      gasos.push({
        date: currentDate || "-",
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
    if (!line) {
      finalizarBloco();
      continue;
    }

    const dateMatch = line.match(/Coletado em:\s*(\d{2}\/\d{2}\/\d{4})/);
    if (dateMatch) {
      currentDate = dateMatch[1];
      continue;
    }

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

    const parts = line.split(/\s{2,}|\t+/).filter(Boolean);
    if (parts.length < 2) continue;

    const name = parts[0];
    const valueRaw = parts[1].trim();
    const normName = normalize(name);

    if (/^PH\b/i.test(name)) {
      currentValores.pH = valueRaw;
    } else if (/^PO2\b/i.test(name)) {
      currentValores.pO2 = valueRaw;
    } else if (/^PCO2\b/i.test(name)) {
      currentValores.pCO2 = valueRaw;
    } else if (/CTHCO3|HCO3/i.test(normName)) {
      currentValores.HCO3 = valueRaw;
    } else if (/^BE\b/i.test(name)) {
      currentValores.BE = valueRaw;
    } else if (/^SO2\b/i.test(name)) {
      currentValores.SO2 = valueRaw;
    } else if (/LACTATO/i.test(normName)) {
      currentValores.Lactato = valueRaw;
    }
  }

  finalizarBloco();
  return gasos;
}

function buildGasometriaMap(gasos) {
  const map = new Map();
  for (const g of gasos) {
    const dateKey = g.date || "-";
    if (!map.has(dateKey)) map.set(dateKey, []);
    map.get(dateKey).push(g);
  }
  return map;
}

function buildGasometriaTextForDate(date, gasoMap, selectedAbbrs) {
  if (!gasoMap || !gasoMap.has(date)) return "";

  const lista = gasoMap.get(date);
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

// ---------- Construção por data ----------

function buildDateMap(exams, selectedAbbrs) {
  const dateMap = new Map();
  for (const ex of exams) {
    const def = findExamDefinition(ex.name);
    if (!def) continue;
    if (selectedAbbrs && !selectedAbbrs.includes(def.abbr)) continue;

    const dateKey = ex.date || "-";
    if (!dateMap.has(dateKey)) dateMap.set(dateKey, {});
    const bucket = dateMap.get(dateKey);

    if (!bucket[def.abbr]) {
      bucket[def.abbr] = { value: ex.value, category: def.category };
    }
  }
  return dateMap;
}

function sortDates(arr) {
  return arr.sort((a, b) => {
    const da = parseDateToSortable(a);
    const db = parseDateToSortable(b);
    if (!da || !db) return 0;
    return da - db;
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

  for (const date of orderedDates) {
    const bucket = dateMap.get(date) || {};
    const parts = [];

    for (const abbr of examOrder) {
      if (sorologiaAbbrs.has(abbr)) continue;
      if (!selectedAbbrs.includes(abbr)) continue;
      if (bucket[abbr]) {
        parts.push(`${getDisplayName(abbr)} ${bucket[abbr].value}`);
      }
    }

    const sorologiaParts = buildSorologiaParts(bucket, selectedAbbrs);
    parts.push(...sorologiaParts);

    const gasoText = buildGasometriaTextForDate(date, gasoMap, selectedAbbrs);
    if (gasoText) parts.push(gasoText);

    if (parts.length) {
      lines.push(`(${date}) ${parts.join(" | ")}`);
    }
  }

  return lines;
}

function generateTextByCategories(exams, selectedAbbrs, gasoMap) {
  const dateMap = buildDateMap(exams, selectedAbbrs);
  const orderedDates = getAllSortedDates(dateMap, gasoMap);
  const blocks = [];

  for (const date of orderedDates) {
    const bucket = dateMap.get(date) || {};
    const categoryLines = {};

    for (const abbr of examOrder) {
      if (sorologiaAbbrs.has(abbr)) continue;
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

    const gasoText = buildGasometriaTextForDate(date, gasoMap, selectedAbbrs);
    if (gasoText) {
      if (!categoryLines["Gasometria"]) categoryLines["Gasometria"] = [];
      categoryLines["Gasometria"].push(gasoText);
    }

    const linesForDate = [`(${date})`];
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
}

// ---------- Eventos (protegidos com if) ----------

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
  });
}

if (btnClearAllExams && examCheckboxes) {
  btnClearAllExams.addEventListener("click", () => {
    examCheckboxes.forEach((cb) => { cb.checked = false; });
    if (statusEl) statusEl.textContent = "Todos os exames foram desmarcados.";
  });
}

if (btnSelectRoutine && examCheckboxes) {
  btnSelectRoutine.addEventListener("click", () => {
    const routineCategories = new Set(["Hemograma", "Eletrólitos/Renal", "Hepático"]);
    examCheckboxes.forEach((cb) => {
      const cat = cb.dataset.category;
      cb.checked = routineCategories.has(cat);
    });
    if (statusEl) statusEl.textContent =
      "Selecionados exames de rotina (Hemograma, Eletrólitos/Renal, Hepático).";
  });
}
