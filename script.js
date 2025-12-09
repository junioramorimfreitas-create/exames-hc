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

  // Hormônios / marcadores
  { match: "PARATORMONIO (PTH)", abbr: "PTH", category: "Hormônios/Marcadores" },
  { match: "NT-PROBNP", abbr: "NTproBNP", category: "Hormônios/Marcadores" },

  // Sorologias (Micologia)
  {
    match: "IMUNODIFUSAO HISTOPLASMA CAPSULATUM",
    abbr: "ID Histoplasma",
    category: "Sorologias"
  },
  {
    match: "IMUNODIFUSAO ASPERGILLUS FUMIGATUS",
    abbr: "ID Aspergillus",
    category: "Sorologias"
  },
  {
    match: "IMUNODIFUSAO PARACOCCIDIOIDES BRASILIENSIS",
    abbr: "ID P. brasiliensis",
    category: "Sorologias"
  },
  {
    match: "CONTRAIMUNO PARACOCCIDIOIDES BRASILIENSIS",
    abbr: "CI P. brasiliensis",
    category: "Sorologias"
  },
  {
    match: "CONTRAIMUNO HISTOPLASMA CAPSULATUM",
    abbr: "CI Histoplasma",
    category: "Sorologias"
  },
  {
    match: "CONTRAIMUNO ASPERGILLUS FUMIGATUS",
    abbr: "CI Aspergillus",
    category: "Sorologias"
  },

  // Imunológico (CD4/CD8) – ABSOLUTOS
  { match: "CD45/CD3/CD4", abbr: "CD4", category: "Imunológico" },
  { match: "CD45/CD3/CD8", abbr: "CD8", category: "Imunológico" },
  { match: "CD4/CD8", abbr: "CD4/CD8", category: "Imunológico" },

  // Virologia
  { match: "CARGA VIRAL HIV-1", abbr: "CVHIV", category: "Virologia" }
];

const examOrder = [
  "Hb", "Ht", "Leuco", "Plaq",
  "Na", "K", "Cl", "Cr", "Ur", "CaT", "CaIon", "Mg", "P",
  "ALT", "AST", "FA", "GGT", "BT", "BD", "BI",
  "TGL", "CT", "HDL", "LDL", "VLDL", "nHDL",
  "ProtTot", "Alb", "Glob",
  "PTH", "NTproBNP",
  "CD4", "CD8", "CD4/CD8",
  "ID Histoplasma", "ID Aspergillus", "ID P. brasiliensis", "CI Histoplasma", "CI Aspergillus", "CI P. brasiliensis",
  "CVHIV"
];

const categoryOrder = [
  "Hemograma",
  "Eletrólitos/Renal",
  "Hepático",
  "Perfil lipídico",
  "Proteínas",
  "Hormônios/Marcadores",
  "Imunológico",
  "Sorologias",
  "Virologia",
  "Gasometria"
];

// Abreviações que são sorologias (para tratamento especial)
const sorologiaAbbrs = new Set([
  "ID Histoplasma", "CI Histoplasma",
  "ID Aspergillus", "CI Aspergillus",
  "ID P. brasiliensis", "CI P. brasiliensis"
]);

// Grupos por organismo para montar "Histoplasma ID NR / CI NR"
const sorologiaGroups = [
  {
    label: "Histoplasma",
    idAbbr: "ID Histoplasma",
    ciAbbr: "CI Histoplasma"
  },
  {
    label: "Aspergillus",
    idAbbr: "ID Aspergillus",
    ciAbbr: "CI Aspergillus"
  },
  {
    label: "Paracoco",
    idAbbr: "ID P. brasiliensis",
    ciAbbr: "CI P. brasiliensis"
  }
];

// Rótulos amigáveis (se a gente quiser mexer em outros no futuro)
function getDisplayName(abbr) {
  // Para agora, só mudamos sorologias no formato especial se quisermos.
  // No restante, deixamos Hb, Na, etc. como estão.
  return abbr;
}

// Converte "Reagente", "Não Reagente", "Reagente (1/32)" em "R", "NR", "R (1/32)"
function formatSorologiaValue(rawValue) {
  const norm = normalize(rawValue);
  // Não Reagente
  if (norm.includes("NAO REAGENTE")) {
    return "NR";
  }
  // Reagente (pode ter título junto)
  if (norm.includes("REAGENTE")) {
    // tenta extrair o título entre parênteses, se houver
    const m = rawValue.match(/\(([^)]+)\)/);
    if (m) {
      const titer = m[1].trim();
      return `R (${titer})`;
    }
    return "R";
  }
  // fallback
  return rawValue.trim();
}

// Monta ["Histoplasma ID NR / CI NR", "Aspergillus ID R / CI R (1/32)", ...]
function buildSorologiaParts(bucket, selectedAbbrs) {
  const parts = [];

  for (const group of sorologiaGroups) {
    const idEntry = bucket[group.idAbbr];
    const ciEntry = bucket[group.ciAbbr];

    const idSelected = selectedAbbrs.includes(group.idAbbr);
    const ciSelected = selectedAbbrs.includes(group.ciAbbr);

    // Se nenhum está selecionado ou nenhum existe, pula
    if ((!idEntry || !idSelected) && (!ciEntry || !ciSelected)) continue;

    const segments = [];

    if (idEntry && idSelected) {
      segments.push(`ID ${formatSorologiaValue(idEntry.value)}`);
    }
    if (ciEntry && ciSelected) {
      segments.push(`CI ${formatSorologiaValue(ciEntry.value)}`);
    }

    if (segments.length) {
      parts.push(`${group.label} ${segments.join(" / ")}`);
    }
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

// ---------- PARSER DO LAUDO (CD4/CD8 + sorologias com título) ----------

function parseExams(rawText) {
  const lines = rawText.split(/\r?\n/);
  const exams = [];

  let currentDate = "";
  let currentSection = "";
  let pendingTiterExam = null; // último contraimuno reagente aguardando Título

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

    // Data de coleta
    const dateMatch = line.match(/Coletado em:\s*(\d{2}\/\d{2}\/\d{4})/);
    if (dateMatch) {
      currentDate = dateMatch[1];
      continue;
    }

    // Cabeçalho de seção
    if (
      /- SANGUE - ,/i.test(line) ||
      /HEMOGRAMA COMPLETO/i.test(line) ||
      /PLAQUETAS - SANGUE/i.test(line)
    ) {
      const section = line.split("- SANGUE")[0].trim();
      currentSection = section || line;
      continue;
    }

    // Linhas que não são resultados
    if (/Resultado dos 3 últimos exames/i.test(line)) continue;
    if (/Liberado e Validado/i.test(line)) continue;
    if (/DIVISÃO DE LABORATÓRIO CENTRAL/i.test(line)) continue;
    if (/LABORATORIO DE INVESTIGACAO MEDICA/i.test(normalize(line))) continue;
    if (/^Pedido\s*:/i.test(line)) continue;
    if (/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}$/.test(line)) continue;
    if (/Novos valores de referência/i.test(line)) continue;
    if (/Automatizado|Colorimétrico|Enzimático|Eletrodo íon seletivo|Cinético UV|IFCC|Citometria de fluxo|PCR em Tempo Real/i.test(line)) continue;
    if (/Alteração nos valores de referência/i.test(line)) continue;
    if (/Titulos ate 1\/2/i.test(normalize(line))) continue;

    // Split em colunas (TAB ou >=2 espaços)
    const parts = line.split(/\s{2,}|\t+/).filter(Boolean);
    if (parts.length < 2) continue;

    const name = parts[0];
    const normName = normalize(name);
    const valueUnit = parts[1];

    // CASO ESPECIAL: CD4/CD8 absolutos (CD45/CD3/CD4 e CD45/CD3/CD8)
    if (normName.includes("CD45/CD3/CD4") || normName.includes("CD45/CD3/CD8")) {
      const absField = parts[2] || parts[1] || "";
      const mAbs = absField.match(/[\d.,]+/);
      if (mAbs) {
        const absVal = mAbs[0];
        exams.push({
          date: currentDate || "",
          section: currentSection || "",
          name,
          value: absVal,
          unit: "cel/mm³",
          normName
        });
      }
      continue;
    }

    // Relação CD4/CD8 e demais exames (quantitativos e qualitativos)
    if (/\d/.test(valueUnit)) {
      // Quantitativos (têm número, ex: "0,72 mg/dL")
      const m = valueUnit.match(/^([<>*]?\s*[\d.,]+)\s*(.*)$/);
      if (m) {
        const value = m[1].trim();
        const unit = m[2].trim();
        exams.push({
          date: currentDate || "",
          section: currentSection || "",
          name,
          value,
          unit,
          normName
        });
      }
    } else {
      // Qualitativos (Reagente / Não Reagente, etc.)
      const value = valueUnit.trim();
      if (value) {
        const examObj = {
          date: currentDate || "",
          section: currentSection || "",
          name,
          value,
          unit: "",
          normName
        };
        exams.push(examObj);

        // Se for contraimuno REAGENTE, marca para receber título
        if (
          normName.includes("CONTRAIMUNO") &&
          normalize(value).includes("REAGENTE")
        ) {
          pendingTiterExam = examObj;
        } else if (normName.includes("CONTRAIMUNO")) {
          // Se for contraimuno NÃO reagente, não espera título
          pendingTiterExam = null;
        }
      }
    }
  }

  return exams;
}

// ---------- Construção das estruturas por data ----------

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

function sortDates(dateMap) {
  const dates = Array.from(dateMap.keys());
  return dates.sort((a, b) => {
    const da = parseDateToSortable(a);
    const db = parseDateToSortable(b);
    if (!da || !db) return 0;
    return da - db;
  });
}

function getAllSortedDates(dateMap, gasoMap) {
  const set = new Set([...dateMap.keys(), ...(gasoMap ? gasoMap.keys() : [])]);
  const dates = Array.from(set);
  return dates.sort((a, b) => {
    const da = parseDateToSortable(a);
    const db = parseDateToSortable(b);
    if (!da || !db) return 0;
    return da - db;
  });
}

// ---------- Gasometria arterial x venosa ----------

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
      // linha em branco geralmente marca fim do bloco da gasometria
      finalizarBloco();
      continue;
    }

    const dateMatch = line.match(/Coletado em:\s*(\d{2}\/\d{2}\/\d{4})/);
    if (dateMatch) {
      currentDate = dateMatch[1];
      continue;
    }

    // Início de um bloco de gasometria
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

    // Linhas de resultados dentro do bloco de gasometria
    const parts = line.split(/\s{2,}|\t+/).filter(Boolean);
    if (parts.length < 2) continue;

    const name = parts[0];
    const valueRaw = parts[1].trim(); // ex: "7,400"
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
    // Anion Gap, Na, K, Cl etc. são ignorados aqui (se quiser, tratamos depois)
  }

  // garante o último bloco
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
  const lista = gasoMap.get(date);
  if (!lista || !lista.length) return "";

  const arterialSelecionada = selectedAbbrs.includes("GasArterial");
  const venosaSelecionada = selectedAbbrs.includes("GasVenosa");

  if (!arterialSelecionada && !venosaSelecionada) return "";

  const ordemArt = ["pH", "pO2", "pCO2", "HCO3", "BE", "SO2", "Lactato"];
  const ordemVen = ["pH", "HCO3", "BE", "Lactato"];

  function formatPanel(label, vals, ordem) {
    const sub = [];
    for (const k of ordem) {
      if (vals && vals[k] != null) {
        sub.push(`${k} ${vals[k]}`);
      }
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

// ---------- Geração de texto ----------

function generateLinesPerDate(exams, selectedAbbrs, gasoMap) {
  const dateMap = buildDateMap(exams, selectedAbbrs);
  const orderedDates = getAllSortedDates(dateMap, gasoMap);
  const lines = [];

  for (const date of orderedDates) {
    const bucket = dateMap.get(date) || {};
    const parts = [];

    // Exames "normais" (exceto sorologias)
    for (const abbr of examOrder) {
      if (sorologiaAbbrs.has(abbr)) continue; // sorologias tratadas à parte
      if (!selectedAbbrs.includes(abbr)) continue;
      if (bucket[abbr]) {
        const label = getDisplayName(abbr);
        parts.push(`${label} ${bucket[abbr].value}`);
      }
    }

    // Sorologias condensadas por organismo
    const sorologiaParts = buildSorologiaParts(bucket, selectedAbbrs);
    parts.push(...sorologiaParts);

    // Gasometria arterial/venosa (se houver e se estiver selecionada)
    const gasoText = buildGasometriaTextForDate(date, gasoMap, selectedAbbrs);
    if (gasoText) {
      parts.push(gasoText);
    }

    if (parts.length) lines.push(`(${date}) ${parts.join(" | ")}`);
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

    // Exames não-sorológicos
    for (const abbr of examOrder) {
      if (sorologiaAbbrs.has(abbr)) continue;
      if (!selectedAbbrs.includes(abbr)) continue;
      const entry = bucket[abbr];
      if (!entry) continue;
      const cat = entry.category;
      const label = getDisplayName(abbr);
      if (!categoryLines[cat]) categoryLines[cat] = [];
      categoryLines[cat].push(`${label} ${entry.value}`);
    }

    // Sorologias condensadas
    const sorologiaParts = buildSorologiaParts(bucket, selectedAbbrs);
    if (sorologiaParts.length) {
      if (!categoryLines["Sorologias"]) categoryLines["Sorologias"] = [];
      categoryLines["Sorologias"].push(...sorologiaParts);
    }

    // Gasometria em categoria própria
    const gasoText = buildGasometriaTextForDate(date, gasoMap, selectedAbbrs);
    if (gasoText) {
      if (!categoryLines["Gasometria"]) categoryLines["Gasometria"] = [];
      categoryLines["Gasometria"].push(gasoText);
    }

    const linesForDate = [];
    linesForDate.push(`(${date})`);

    for (const cat of categoryOrder) {
      if (categoryLines[cat] && categoryLines[cat].length) {
        linesForDate.push(`- ${cat}: ${categoryLines[cat].join(" | ")}`);
      }
    }

    // garante que Gasometria apareça mesmo se não estiver no categoryOrder
    if (!categoryOrder.includes("Gasometria") && categoryLines["Gasometria"]) {
      linesForDate.push(`- Gasometria: ${categoryLines["Gasometria"].join(" | ")}`);
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

// novos botões
const btnSelectAllExams = document.getElementById("btnSelectAllExams");
const btnClearAllExams = document.getElementById("btnClearAllExams");
const btnSelectRoutine = document.getElementById("btnSelectRoutine");

function getSelectedAbbrs() {
  return Array.from(examCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);
}

function generate(mode) {
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
    text = generateTextByCategories(exams, selectedAbbrs, gasoMap) || "Nenhum exame correspondente aos filtros selecionados.";
  }

  outputText.value = text;
  statusEl.textContent = `Exames reconhecidos no laudo: ${exams.length}. Gasometrias reconhecidas: ${gasos.length}. Filtros ativos: ${selectedAbbrs.length}.`;
}

// ---------- Handlers dos botões principais ----------

btnGenerateLine.addEventListener("click", () => generate("line"));
btnGenerateCategories.addEventListener("click", () => generate("categories"));

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

// ---------- Handlers dos botões de seleção em massa ----------

btnSelectAllExams.addEventListener("click", () => {
  examCheckboxes.forEach((cb) => {
    cb.checked = true;
  });
  statusEl.textContent = "Todos os exames foram selecionados.";
});

btnClearAllExams.addEventListener("click", () => {
  examCheckboxes.forEach((cb) => {
    cb.checked = false;
  });
  statusEl.textContent = "Todos os exames foram desmarcados.";
});

btnSelectRoutine.addEventListener("click", () => {
  const routineCategories = new Set([
    "Hemograma",
    "Eletrólitos/Renal",
    "Hepático"
  ]);

  examCheckboxes.forEach((cb) => {
    const cat = cb.dataset.category;
    cb.checked = routineCategories.has(cat);
  });

  statusEl.textContent = "Selecionados exames de rotina (Hemograma, Eletrólitos/Renal, Hepático).";
});
