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

  // Sorologias (Micologia)
  { match: "IMUNODIFUSAO HISTOPLASMA CAPSULATUM", abbr: "ID Histo", category: "Sorologias" },
  { match: "IMUNODIFUSAO ASPERGILLUS FUMIGATUS", abbr: "ID Asp", category: "Sorologias" },
  { match: "IMUNODIFUSAO PARACOCCIDIOIDES BRASILIENSIS", abbr: "ID Pcb", category: "Sorologias" },
  { match: "CONTRAIMUNO PARACOCCIDIOIDES BRASILIENSIS", abbr: "CI Pcb", category: "Sorologias" },
  { match: "CONTRAIMUNO HISTOPLASMA CAPSULATUM", abbr: "CI Histo", category: "Sorologias" },
  { match: "CONTRAIMUNO ASPERGILLUS FUMIGATUS", abbr: "CI Asp", category: "Sorologias" },

  // Imunológico (CD4/CD8) – ABSOLUTOS
  { match: "CD45/CD3/CD4", abbr: "CD4", category: "Imunológico" },
  { match: "CD45/CD3/CD8", abbr: "CD8", category: "Imunológico" },
  { match: "CD4/CD8", abbr: "CD4/CD8", category: "Imunológico" },

  
  // Imunológico (CD4/CD8) – ABSOLUTOS
  { match: "CD45/CD3/CD4", abbr: "CD4", category: "Imunológico" },
  { match: "CD45/CD3/CD8", abbr: "CD8", category: "Imunológico" },
  { match: "CD4/CD8", abbr: "CD4/CD8", category: "Imunológico" },

  // Virologia
  { match: "CARGA VIRAL HIV-1", abbr: "CVHIV", category: "Virologia" }
];

const examOrder = [
  "Hb","Ht","Leuco","Plaq",
  "Na","K","Cl","Cr","Ur","CaT","CaIon","Mg","P",
  "ALT","AST","FA","GGT","BT","BD","BI",
  "TGL","CT","HDL","LDL","VLDL","nHDL",
  "CD4","CD8","CD4/CD8",
  "ID Histo","ID Asp","ID Pcb","CI Histo","CI Asp","CI Pcb",
  "CVHIV"
];


const categoryOrder = [
  "Hemograma",
  "Eletrólitos/Renal",
  "Hepático",
  "Perfil lipídico",
  "Imunológico",
  "Sorologias",
  "Virologia"
];

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

// ---------- PARSER DO LAUDO (CD4/CD8 absolutos) ----------

function parseExams(rawText) {
  const lines = rawText.split(/\r?\n/);
  const exams = [];

  let currentDate = "";
  let currentSection = "";

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

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
        exams.push({
          date: currentDate || "",
          section: currentSection || "",
          name,
          value,
          unit: "",
          normName
        });
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

// ---------- Geração de texto ----------

function generateLinesPerDate(exams, selectedAbbrs) {
  const dateMap = buildDateMap(exams, selectedAbbrs);
  const orderedDates = sortDates(dateMap);
  const lines = [];

  for (const date of orderedDates) {
    const bucket = dateMap.get(date);
    const parts = [];

    for (const abbr of examOrder) {
      if (!selectedAbbrs.includes(abbr)) continue;
      if (bucket[abbr]) parts.push(`${abbr} ${bucket[abbr].value}`);
    }

    if (parts.length) lines.push(`(${date}) ${parts.join(" | ")}`);
  }

  return lines;
}

function generateTextByCategories(exams, selectedAbbrs) {
  const dateMap = buildDateMap(exams, selectedAbbrs);
  const orderedDates = sortDates(dateMap);
  const blocks = [];

  for (const date of orderedDates) {
    const bucket = dateMap.get(date);
    const categoryLines = {};

    for (const abbr of examOrder) {
      if (!selectedAbbrs.includes(abbr)) continue;
      const entry = bucket[abbr];
      if (!entry) continue;
      const cat = entry.category;
      if (!categoryLines[cat]) categoryLines[cat] = [];
      categoryLines[cat].push(`${abbr} ${entry.value}`);
    }

    const linesForDate = [];
    linesForDate.push(`(${date})`);
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

  if (!exams.length) {
    outputText.value = "Nenhum exame reconhecido. Confira se o texto foi copiado completo do sistema.";
    statusEl.textContent = "";
    return;
  }

  let text = "";

  if (mode === "line") {
    const lines = generateLinesPerDate(exams, selectedAbbrs);
    text = lines.join("\n") || "Nenhum exame correspondente aos filtros selecionados.";
  } else {
    text = generateTextByCategories(exams, selectedAbbrs) || "Nenhum exame correspondente aos filtros selecionados.";
  }

  outputText.value = text;
  statusEl.textContent = `Exames reconhecidos no laudo: ${exams.length}. Filtros ativos: ${selectedAbbrs.length}.`;
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
