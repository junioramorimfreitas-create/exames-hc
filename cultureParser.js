// ==========================================================================
// Parser de Culturas Microbiológicas & Antibiograma (HCMed / DLC-HCFMUSP)
// Suporta entrada combinada ou individual: Página Web HCMed + PDF (BrCAST)
// ==========================================================================

(function () {
  const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
  const app = isBrowser ? (window.__EXAMES_APP__ = window.__EXAMES_APP__ || {}) : {};

  // ---------- Utilitários ----------

  function normalizeAsc(str) {
    return String(str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function parseSortableDate(dateStr, timeStr) {
    const m = String(dateStr || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return 0;
    const [, dd, mm, yyyy] = m;
    let hh = 0, min = 0;
    const mt = String(timeStr || "").match(/^(\d{2}):(\d{2})/);
    if (mt) {
      hh = parseInt(mt[1], 10);
      min = parseInt(mt[2], 10);
    }
    return new Date(+yyyy, +mm - 1, +dd, hh, min).getTime();
  }

  function formatCultureDate(dateStr, timeStr, dateFormat = "dd/mm/aa", showTime = false) {
    const m = String(dateStr || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return dateStr || "-";
    const [, dd, mm, yyyy] = m;
    let formatted = `${dd}/${mm}/${yyyy.slice(-2)}`;
    if (dateFormat === "dd/mm") formatted = `${dd}/${mm}`;
    else if (dateFormat === "dd/mm/aaaa") formatted = `${dd}/${mm}/${yyyy}`;

    if (showTime && timeStr) {
      return `${formatted} ${timeStr}`;
    }
    return formatted;
  }

  // ---------- Normalização de Antibióticos, Patógenos e Materiais ----------

  const ANTIBIOTIC_DISPLAY_MAP = {
    "AMICACINA": "Amicacina",
    "AMPICILINA": "Ampicilina",
    "AMPICILINA/SULBACTAM": "Ampicilina/Sulbactam",
    "AMOXICILINA/CLAVULANATO": "Amoxicilina/Clavulanato",
    "AZTREONAM": "Aztreonam",
    "CEFEPIME": "Cefepime",
    "CEFEPIMA": "Cefepime",
    "CEFOTAXIME": "Cefotaxima",
    "CEFOTAXIMA": "Cefotaxima",
    "CEFOXITINA": "Cefoxitina",
    "CEFTAZIDIMA": "Ceftazidima",
    "CEFTAZIDIMA/AVIBACTAM": "Ceftazidima/Avibactam",
    "CEFTOLOZANE/TAZOBACTAM": "Ceftolozane/Tazobactam",
    "CEFTOLOZANO/TAZOBACTAM": "Ceftolozane/Tazobactam",
    "CEFTRIAXONE": "Ceftriaxona",
    "CEFTRIAXONA": "Ceftriaxona",
    "CEFUROXIMA ORAL": "Cefuroxima VO",
    "CEFUROXIMA PARENTERAL": "Cefuroxima EV",
    "CEFUROXIMA": "Cefuroxima",
    "CIPROFLOXACINA": "Ciprofloxacino",
    "CIPROFLOXACINO": "Ciprofloxacino",
    "CLINDAMICINA": "Clindamicina",
    "COLISTINA": "Colistina",
    "DAPTOMICINA": "Daptomicina",
    "ERITROMICINA": "Eritromicina",
    "ERTAPENEM": "Ertapenem",
    "FOSFOMICINA": "Fosfomicina",
    "GENTAMICINA": "Gentamicina",
    "IMIPENEM": "Imipenem",
    "LEVOFLOXACINA": "Levofloxacino",
    "LEVOFLOXACINO": "Levofloxacino",
    "LINEZOLIDA": "Linezolida",
    "MEROPENEM": "Meropenem",
    "METRONIDAZOL": "Metronidazol",
    "NITROFURANTOINA": "Nitrofurantoína",
    "NORFLOXACINA": "Norfloxacino",
    "OXACILINA": "Oxacilina",
    "PENICILINA": "Penicilina",
    "PENICILINA G": "Penicilina G",
    "PIPERACILINA/TAZOBACTAM": "Pip/Tazo",
    "POLIMIXINA B": "Polimixina B",
    "RIFAMPICINA": "Rifampicina",
    "SULFA + TRIMETHOPRIM": "SMX/TMP",
    "SULFAMETOXAZOL/TRIMETOPRIM": "SMX/TMP",
    "SULFA/TRIMETHOPRIM": "SMX/TMP",
    "TEICOPLANINA": "Teicoplanina",
    "TETRACICLINA": "Tetraciclina",
    "TIGECICLINA": "Tigeciclina",
    "VANCOMICINA": "Vancomicina",
    "FLUCONAZOL": "Fluconazol",
    "VORICONAZOL": "Voriconazol",
    "ANFOTERICINA B": "Anfotericina B",
    "MICAFUNGINA": "Micafungina",
    "ANIDULAFUNGINA": "Anidulafungina",
    "CASPOFUNGINA": "Caspofungina"
  };

  function formatAntibioticName(rawName) {
    const clean = String(rawName || "").trim();
    const norm = normalizeAsc(clean);
    if (ANTIBIOTIC_DISPLAY_MAP[norm]) return ANTIBIOTIC_DISPLAY_MAP[norm];
    return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  }

  function cleanOrganismName(rawOrg) {
    let s = String(rawOrg || "").trim();
    // Remover sufixos técnicos de bancada caso escapem na mesma linha
    s = s.replace(/\s+(?:CLSI\s*\/\s*EUCAST|BrCAST|EUCAST|CLSI).*$/i, "").trim();
    return s;
  }

  function normalizeOrganismKey(rawOrg) {
    let s = normalizeAsc(cleanOrganismName(rawOrg));
    // Padronizar para comparação entre página web e PDF
    s = s.replace(/\bCOMPLEX\b/g, "").replace(/\bGROUP\b/g, "").replace(/\s+/g, " ").trim();
    if (s.includes("CANDIDA GLABRATA") || s.includes("NAKASEOMYCES GLABRATA")) {
      return "CANDIDA GLABRATA";
    }
    return s;
  }

  function formatOrganismDisplay(rawOrg, abbreviate = true) {
    const clean = cleanOrganismName(rawOrg);
    if (!clean) return "";
    if (/^FLORA\s+NORMAL$/i.test(normalizeAsc(clean))) return "Flora normal";

    if (/NAKASEOMYCES\s+GLABRATA/i.test(clean)) {
      return abbreviate ? "C. glabrata" : "Nakaseomyces glabrata (C. glabrata)";
    }

    // Remover "complex" ou "group" na versão abreviada para concisão clínica
    let base = clean;
    if (abbreviate) {
      base = base.replace(/\s+(?:complex|group)\b/gi, "").trim();
      const m = base.match(/^([A-Z][a-z]+)\s+([a-z]{2,})(.*)$/);
      if (m) {
        const genus = m[1];
        const species = m[2];
        const rest = m[3] || "";
        return `${genus.charAt(0)}. ${species}${rest}`;
      }
    }
    return base;
  }

  function normalizeSiteLabel(rawSite, materialNorm) {
    let s = String(rawSite || "")
      .replace(/[\[\]]/g, "")
      .replace(/^[-,\s]+|[-,\s]+$/g, "")
      .trim();
    if (!s) return "";

    const norm = normalizeAsc(s);
    if (norm === materialNorm || norm === "") return "";

    // Amostras numeradas: 1AMO, 1 AMO, 2AMO, 2 AMO
    const mAmo = norm.match(/^(\d+)\s*A?MO$/);
    if (mAmo) return `${mAmo[1]}ª am`;

    // Vias de Permcath / Cateter
    if (/PERMC?ATH|PERM\s+HTD|CVC-?PERMCAT/i.test(norm)) {
      const isHtd = /HTD/.test(norm);
      const prefix = isHtd ? "Permcath HTD" : "Permcath";
      if (/AZUL/.test(norm)) return `${prefix} Via Azul`;
      if (/VERM/.test(norm)) return `${prefix} Via Vermelha`;
      return prefix;
    }
    if (/^PERM\s+(.+)$/i.test(norm)) {
      const m = norm.match(/^PERM\s+(.+)$/i);
      return `Permcath ${m[1]}`;
    }
    if (/^VIA\s+AZUL$/i.test(norm)) return "Via Azul";
    if (/^VIA\s+VERM/i.test(norm)) return "Via Vermelha";

    // Artéria / Acesso periférico
    if (norm === "ART FEM DIR") return "Art. Femoral Dir";
    if (norm === "ART FEM ESQ") return "Art. Femoral Esq";
    if (norm === "DIREITO") return "Direito";
    if (norm === "ESQUERDO") return "Esquerdo";

    return s;
  }

  function classifyMaterialAndSite(rawMaterial, rawSite, examKind, abbreviateMaterials = true) {
    const matNorm = normalizeAsc(rawMaterial);
    let siteClean = normalizeSiteLabel(rawSite, matNorm);

    // Remover sufixos "para FC; BQ; TX" ou "(CASO NOVO) 1ª AMOSTRA"
    const matBase = matNorm
      .replace(/\s*PARA\s+FC\s*;\s*BQ\s*;\s*TX.*$/i, "")
      .replace(/\s*\(CASO\s+NOVO\).*$/i, "")
      .trim();

    if (examKind === "vigilancia" || matBase.includes("SWAB RETAL")) {
      return {
        categoryKey: "SWAB_RETAL",
        materialLabel: abbreviateMaterials ? "Swab Retal (ERC)" : "Swab Retal (Pesquisa ERC)",
        siteLabel: siteClean,
        isBloodCulture: false
      };
    }

    if (matBase.includes("SANGUE PERIFERICO")) {
      return {
        categoryKey: "HMC_PERIFERICA",
        materialLabel: abbreviateMaterials ? "HMC Periférica" : "Hemocultura Periférica",
        siteLabel: siteClean,
        isBloodCulture: true
      };
    }

    if (matBase.includes("SANGUE (CATETER)") || matBase.includes("SANGUE CATETER")) {
      return {
        categoryKey: "HMC_CATETER",
        materialLabel: abbreviateMaterials ? "HMC Cateter" : "Hemocultura de Cateter",
        siteLabel: siteClean,
        isBloodCulture: true
      };
    }

    if (matBase === "CATETER" || matBase.includes("PONTA DE CATETER")) {
      return {
        categoryKey: "PONTA_CATETER",
        materialLabel: "Ponta de Cateter",
        siteLabel: siteClean,
        isBloodCulture: false
      };
    }

    if (matBase.includes("URINA DE SONDA VESICAL DE DEMORA")) {
      return {
        categoryKey: "URC_SVD",
        materialLabel: abbreviateMaterials ? "URC (SVD)" : "Urocultura (SVD)",
        siteLabel: siteClean,
        isBloodCulture: false
      };
    }

    if (matBase.includes("URINA DE SONDA VESICAL DE ALIVIO")) {
      return {
        categoryKey: "URC_SVA",
        materialLabel: abbreviateMaterials ? "URC (SVA)" : "Urocultura (Sonda de Alívio)",
        siteLabel: siteClean,
        isBloodCulture: false
      };
    }

    if (matBase.includes("URINA DE JATO MEDIO") || matBase === "URINA") {
      return {
        categoryKey: "URC_JM",
        materialLabel: abbreviateMaterials ? "URC" : "Urocultura (Jato Médio)",
        siteLabel: siteClean,
        isBloodCulture: false
      };
    }

    if (matBase.includes("SECRECAO TRAQUEAL")) {
      return {
        categoryKey: "SEC_TRAQUEAL",
        materialLabel: abbreviateMaterials ? "Sec. Traqueal" : "Secreção Traqueal",
        siteLabel: siteClean,
        isBloodCulture: false
      };
    }

    if (matBase.includes("LAVADO BRONCOALVEOLAR") || matBase === "LBA") {
      return {
        categoryKey: "LBA",
        materialLabel: "LBA",
        siteLabel: siteClean,
        isBloodCulture: false
      };
    }

    if (matBase.includes("ESCARRO")) {
      return {
        categoryKey: "ESCARRO",
        materialLabel: "Escarro",
        siteLabel: siteClean,
        isBloodCulture: false
      };
    }

    if (matBase.includes("LIQUIDO PLEURAL") || (matBase.includes("OUTRO RESPIRATORIO") && normalizeAsc(rawSite).includes("PLEURAL"))) {
      if (normalizeAsc(rawSite).includes("LIQ PLEURAL DIR")) siteClean = "Direito";
      return {
        categoryKey: `LIQ_PLEURAL_${normalizeAsc(siteClean)}`,
        materialLabel: abbreviateMaterials ? "Líq. Pleural" : "Líquido Pleural",
        siteLabel: siteClean,
        isBloodCulture: false
      };
    }

    if (matBase.includes("LIQUIDO ASCITICO")) {
      return {
        categoryKey: "LIQ_ASCITICO",
        materialLabel: abbreviateMaterials ? "Líq. Ascítico" : "Líquido Ascítico",
        siteLabel: siteClean,
        isBloodCulture: false
      };
    }

    if (matBase.includes("LIQUIDO PERITONEAL")) {
      return {
        categoryKey: "LIQ_PERITONEAL",
        materialLabel: abbreviateMaterials ? "Líq. Peritoneal" : "Líquido Peritoneal",
        siteLabel: siteClean,
        isBloodCulture: false
      };
    }

    if (matBase.includes("LIQUIDO PERICARDICO")) {
      return {
        categoryKey: "LIQ_PERICARDICO",
        materialLabel: abbreviateMaterials ? "Líq. Pericárdico" : "Líquido Pericárdico",
        siteLabel: siteClean,
        isBloodCulture: false
      };
    }

    if (matBase.includes("LIQUOR") || matBase === "LCR") {
      return {
        categoryKey: "LCR",
        materialLabel: abbreviateMaterials ? "LCR" : "Líquor",
        siteLabel: siteClean,
        isBloodCulture: false
      };
    }

    if (matBase.includes("MEDULA OSSEA")) {
      return {
        categoryKey: "MEDULA_OSSEA",
        materialLabel: "Medula Óssea",
        siteLabel: siteClean,
        isBloodCulture: false
      };
    }

    if (matBase.includes("ABSCESSO")) {
      const label = siteClean
        ? `Abscesso ${siteClean.charAt(0).toUpperCase() + siteClean.slice(1).toLowerCase()}`
        : "Abscesso";
      return {
        categoryKey: `ABSCESSO_${normalizeAsc(siteClean)}`,
        materialLabel: label,
        siteLabel: "",
        isBloodCulture: false
      };
    }

    if (matBase.includes("FRAGMENTO")) {
      return {
        categoryKey: `FRAGMENTO_${normalizeAsc(siteClean)}`,
        materialLabel: abbreviateMaterials ? "Frag." : "Fragmento",
        siteLabel: siteClean,
        isBloodCulture: false
      };
    }

    const fallback = rawMaterial ? rawMaterial.trim() : "Amostra";
    return {
      categoryKey: `${matBase}_${normalizeAsc(siteClean)}`,
      materialLabel: fallback,
      siteLabel: siteClean,
      isBloodCulture: false
    };
  }

  function getMaterialThemeClass(categoryKey, materialLabel) {
    const key = normalizeAsc(categoryKey || "");
    const lbl = normalizeAsc(materialLabel || "");

    if (key === "LCR" || lbl.includes("LIQUOR") || lbl === "LCR") {
      return "mat-liquor"; // Roxo
    }
    if (
      key.startsWith("HMC_") ||
      key === "PONTA_CATETER" ||
      key === "MEDULA_OSSEA" ||
      lbl.includes("HMC") ||
      lbl.includes("HEMOCULTURA") ||
      lbl.includes("SANGUE") ||
      lbl.includes("CATETER")
    ) {
      return "mat-blood"; // Vermelho
    }
    if (key.startsWith("URC_") || lbl.includes("URC") || lbl.includes("URINA") || lbl.includes("UROCULTURA")) {
      return "mat-urine"; // Amarelo
    }
    if (
      key.startsWith("LIQ_ASCITICO") ||
      key.startsWith("LIQ_PERITONEAL") ||
      lbl.includes("ASCITIC") ||
      lbl.includes("PERITONEAL")
    ) {
      return "mat-ascitic"; // Laranja
    }
    if (key.startsWith("ABSCESSO") || lbl.includes("ABSCESSO") || lbl.includes("COLECAO")) {
      return "mat-abscess"; // Verde
    }
    if (key.startsWith("LIQ_PLEURAL") || lbl.includes("PLEURAL")) {
      return "mat-pleural"; // Azul
    }
    if (key.startsWith("LIQ_PERICARDICO") || lbl.includes("PERICARDIC")) {
      return "mat-pericardial"; // Vermelho escuro
    }
    return "mat-other"; // Cinza
  }

  // ---------- 1. Parser de Blocos de PDF (BrCAST / HISTÓRICO DE EXAMES) ----------

  function isPdfNoiseLine(line) {
    const n = normalizeAsc(line);
    if (!n) return true;
    if (/^NOME:\s*REGISTRO:/i.test(n)) return true;
    if (/^SEXO:\s*IDADE:/i.test(n)) return true;
    if (/^[MF]\s+\d{2,3}A$/i.test(n)) return true;
    if (/EMISSAO:$/i.test(n)) return true;
    if (/^FOLHA:\s*\d+/i.test(n)) return true;
    if (/^DATA\s+NASC\.?:/i.test(n)) return true;
    if (/^\d{7,10}-[A-Z0-9]$/i.test(n)) return true;
    if (/^HISTORICO\s+DE\s+EXAMES$/i.test(n)) return true;
    if (/^VALORES\s+DE\s+REFERENCIA\s+METODO\s+RESULTADO$/i.test(n)) return true;
    if (/^LIBERADO\s+EM:/i.test(n)) return true;
    if (/^\d{2}:\d{2}:\d{2}$/.test(n)) return true;
    if (/^NEGATIVA\s+SEMEADURA\s+EM\s+MEIOS/i.test(n)) return true;
    if (/^ESPECIFICOS\s+E\s+IDENTIFICACAO/i.test(n)) return true;
    if (/^MANUAL\/VITEK\/MALDI\s+TOF/i.test(n)) return true;
    if (/^MEDICOS\s+RESPONSAVEIS:/i.test(n)) return true;
    if (/^MASSAKAZU\s+SUMITA/i.test(n)) return true;
    if (/^FORTINI\s+-\s+CRM/i.test(n)) return true;
    if (/^OS\s+RESULTADOS\s+DOS\s+EXAMES\s+LABORATORIAIS\s+NAO\s+SAO\s+INDICADORES/i.test(n)) return true;
    if (/^CLINICOS\s+E\s+DEMAIS\s+EXAMES\s+E\s+DEVE\s+SER\s+FEITA/i.test(n)) return true;
    if (/^ESPACO\s+ENTRE\s+OS\s+MEMOS/i.test(n)) return true;
    if (/^DRA\.?\s*EVANGELINA/i.test(n)) return true;
    if (/^CRM\s+\d+/i.test(n)) return true;
    if (/^MATERIAL\s+BIOLOGICO\s+ENTREGUE\s+AO\s+LABORATORIO/i.test(n)) return true;
    if (/^CONSULTE\s+MANUAL\s+DE\s+EXAMES\s+DA\s+MICROBIOLOGIA/i.test(n)) return true;
    return false;
  }

  function splitGluedOrganisms(orgLine) {
    // Ex: "Staphylococcus aureus- Staphylococcus lugdunensis"
    const cleaned = String(orgLine || "").trim();
    if (!cleaned) return [];
    const parts = cleaned.split(/-\s+(?=[A-Z][a-z]+\s+[a-z]+)/);
    return parts.map(p => cleanOrganismName(p)).filter(Boolean);
  }

  function parsePdfBlocks(rawText) {
    const lines = String(rawText || "").split(/\r?\n/);
    const pdfMap = new Map(); // key: `${pedido}-${itemId}`

    let pendingDate = "";
    let pendingTime = "";
    let currentPdf = null;
    let mode = ""; // "microrganismos" | "antibiogramas" | "observacoes"
    let currentAntibiogramOrg = null;
    let avulsoCounter = 0;

    function ensureCurrentPdf() {
      if (!currentPdf) {
        avulsoCounter++;
        const key = `AVULSO_PDF_${avulsoCounter}`;
        pdfMap.set(key, {
          key,
          pedido: "",
          itemId: String(avulsoCounter),
          date: pendingDate || "",
          time: pendingTime || "",
          organisms: [],
          antibiograms: {},
          notes: []
        });
        currentPdf = pdfMap.get(key);
      }
      return currentPdf;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Se cairmos num cabeçalho da página web ("Sistemas HC", "Resultados dos Exames", "DIVISÃO DE LABORATÓRIO...", "Pedido :" ou título de exame web), saímos do contexto de PDF
      if (
        /^Sistemas\s+HC\b/i.test(line) ||
        /^Resultados\s+dos\s+Exames/i.test(line) ||
        /^Nome\s+Paciente:/i.test(line) ||
        /^DIVIS[AÃ]O\s+DE\s+LABORAT[OÓ]RIO\s+CENTRAL\s+HCFMUSP$/i.test(line) ||
        /^Pedido\s*:/i.test(line) ||
        parseHeaderLine(line) !== null
      ) {
        currentPdf = null;
        mode = "";
        currentAntibiogramOrg = null;
        pendingDate = "";
        pendingTime = "";
        continue;
      }

      const mColeta = line.match(/^Coletado\s+em:\s*(\d{2}\/\d{2}\/\d{4})(?:\s+(\d{2}:\d{2}))?/i);
      if (mColeta) {
        pendingDate = mColeta[1];
        pendingTime = mColeta[2] || "";
        continue;
      }

      // Linha de identificação do PDF: "20260100483176 - 272887773 - Clínica: E04AA"
      const mReq = line.match(/^(\d{10,16})\s*-\s*(\d+)\s*-\s*Cl[ií]nica:\s*(.+)$/i);
      if (mReq) {
        const pedido = mReq[1];
        const itemId = mReq[2];
        const key = `${pedido}-${itemId}`;
        if (!pdfMap.has(key)) {
          pdfMap.set(key, {
            key,
            pedido,
            itemId,
            date: pendingDate || "",
            time: pendingTime || "",
            organisms: [],
            antibiograms: {}, // normOrgKey -> { orgName, drugs: [{ name, rawName, category, mic }] }
            notes: []
          });
        }
        currentPdf = pdfMap.get(key);
        if (pendingDate && !currentPdf.date) {
          currentPdf.date = pendingDate;
          currentPdf.time = pendingTime;
        }
        continue;
      }

      if (isPdfNoiseLine(line)) continue;

      // Seção "Microrganismos" ou "Microrganismos- Veillonella parvula" (mesmo se colado sem o cabeçalho superior do PDF)
      const mMicroInline = line.match(/^Microrganismos\s*-\s*(.+)$/i);
      if (mMicroInline) {
        ensureCurrentPdf();
        mode = "microrganismos";
        const orgs = splitGluedOrganisms(mMicroInline[1]);
        for (const o of orgs) {
          if (!currentPdf.organisms.includes(o)) currentPdf.organisms.push(o);
        }
        continue;
      }

      if (/^Microrganismos$/i.test(line)) {
        ensureCurrentPdf();
        mode = "microrganismos";
        currentAntibiogramOrg = null;
        continue;
      }

      if (/^Antibiogramas$/i.test(line)) {
        ensureCurrentPdf();
        mode = "antibiogramas";
        currentAntibiogramOrg = null;
        continue;
      }

      if (!currentPdf) continue;

      if (/^Observa[cç][oõ]es:?$/i.test(line)) {
        mode = "observacoes";
        currentAntibiogramOrg = null;
        continue;
      }

      if (mode === "microrganismos") {
        const mNum = line.match(/^(\d+)\s*-\s*(.+)$/);
        if (mNum) {
          const orgs = splitGluedOrganisms(mNum[2]);
          for (const o of orgs) {
            if (!currentPdf.organisms.includes(o)) currentPdf.organisms.push(o);
          }
        }
        continue;
      }

      if (mode === "antibiogramas") {
        if (/^Antimicrobiano\s+Classifica[cç][aã]o\/Categoria/i.test(line)) {
          continue;
        }

        const mOrgHeader = line.match(/^(\d+)\s*-\s*(.+)$/);
        if (mOrgHeader) {
          const orgName = cleanOrganismName(mOrgHeader[2]);
          const orgKey = normalizeOrganismKey(orgName);
          currentAntibiogramOrg = orgKey;
          if (!currentPdf.antibiograms[orgKey]) {
            currentPdf.antibiograms[orgKey] = {
              orgName,
              drugs: []
            };
          }
          if (!currentPdf.organisms.some(o => normalizeOrganismKey(o) === orgKey)) {
            currentPdf.organisms.push(orgName);
          }
          continue;
        }

        if (currentAntibiogramOrg) {
          const mDrug = line.match(
            /^(.+?)\s+(Sens[ií]vel\s+Dose\s+Padr[aã]o|Sens[ií]vel\s+Aumentando\s+a\s+exposi[cç][aã]o|Sens[ií]vel\s+com\s+aumento\s+de\s+exposi[cç][aã]o|Sens[ií]vel|Intermedi[aá]rio|Resistente|Consultar\s+observa[cç][aã]o)(?:\s+([<>=\s\d.,/]+))?$/i
          );
          if (mDrug) {
            const rawDrug = mDrug[1].trim();
            const rawClass = normalizeAsc(mDrug[2]);
            const mic = (mDrug[3] || "").trim().replace(/\s+/g, "");

            let category = "S";
            if (rawClass.includes("AUMENTANDO") || rawClass.includes("AUMENTO") || rawClass.includes("INTERMEDIARIO")) {
              category = "SAE";
            } else if (rawClass.includes("RESISTENTE")) {
              category = "R";
            } else if (rawClass.includes("CONSULTAR")) {
              category = "OBS";
            }

            currentPdf.antibiograms[currentAntibiogramOrg].drugs.push({
              rawName: rawDrug,
              name: formatAntibioticName(rawDrug),
              category,
              mic
            });
          }
        }
        continue;
      }

      if (mode === "observacoes") {
        if (/^Valor\s+de\s+refer[eê]ncia|^\d+[\.:]\s*Valor\s+de\s+refer[eê]ncia/i.test(line)) {
          currentPdf.notes.push(line);
        }
      }
    }

    return Array.from(pdfMap.values());
  }

  // ---------- 2. Parser de Blocos da Página Web do HCMed ----------

  const MICROBIOLOGY_HEADER_PREFIXES = [
    { prefix: "CULTURA AEROBIA", kind: "cAerobia" },
    { prefix: "CULTURA PARA ANAEROBIOS", kind: "cAnaerobia" },
    { prefix: "CULTURA PARA FUNGOS", kind: "cFungos" },
    { prefix: "CULTURA DE FUNGOS", kind: "cFungos" },
    { prefix: "CULTURA PARA MICOBACTERIAS", kind: "cMicobacterias" },
    { prefix: "CONCENTRACAO INIBITORIA MINIMA", kind: "cim" },
    { prefix: "BACTERIOSCOPICO DE HEMOCULTURA AEROBIA", kind: "gramHmcAerobia" },
    { prefix: "BACTERIOSCOPICO DE HEMOCULTURA ANAEROBIA", kind: "gramHmcAnaerobia" },
    { prefix: "EXAME BACTERIOSCOPICO", kind: "gram" },
    { prefix: "PESQUISA DE BACILO ALCOOL-ACIDO RESISTENTE", kind: "baar" },
    { prefix: "TESTE RAPIDO MOLECULAR PARA TUBERCULOSE", kind: "trmTb" },
    { prefix: "PESQUISA DE FUNGOS", kind: "pFungos" },
    { prefix: "PESQUISA DE ENTEROBACTERIAS CARBAPENEM RESISTENTES", kind: "vigilancia" },
    { prefix: "PESQUISA DE ANTIGENO DE CRIPTOCOCCUS", kind: "crag" }
  ];

  function parseHeaderLine(line) {
    const norm = normalizeAsc(line);
    let matchedPrefix = null;
    for (const item of MICROBIOLOGY_HEADER_PREFIXES) {
      if (norm.startsWith(item.prefix + " -")) {
        matchedPrefix = item;
        break;
      }
    }
    if (!matchedPrefix) return null;

    // Formato 1 (com vírgula): "CULTURA AERÓBIA - SANGUE PERIFÉRICO - MSD,SANGUE PERIFÉRICOMSD"
    // Formato 2 (sem vírgula): "CULTURA AERÓBIA - SANGUE (CATETER) - CVC JE - SANGUE (CATETER) CVC JE"
    let cleanHeader = line;
    const commaIdx = line.indexOf(",");
    if (commaIdx !== -1) {
      cleanHeader = line.slice(0, commaIdx).trim();
    }

    const parts = cleanHeader.split(/\s+-\s+/);
    // Se veio com "- -", ex: "CULTURA AERÓBIA - SECREÇÃO TRAQUEAL - - SECREÇÃO TRAQUEAL"
    const materialRaw = (parts[1] || "").trim();
    let siteRaw = "";

    if (commaIdx !== -1) {
      // Tudo a partir de parts[2] faz parte do complemento/sítio
      siteRaw = parts.slice(2).join(" - ").replace(/^-\s*/, "").trim();
    } else {
      // Sem vírgula: parts = [Exame, Material, Sítio (ou "- Material"), Repetição]
      if (parts.length >= 4) {
        siteRaw = parts.slice(2, parts.length - 1).join(" - ").replace(/^-\s*/, "").trim();
      } else if (parts.length === 3) {
        const p2Norm = normalizeAsc(parts[2]).replace(/^-\s*/, "").trim();
        const matNorm = normalizeAsc(materialRaw);
        if (p2Norm !== matNorm) {
          siteRaw = parts[2].replace(/^-\s*/, "").trim();
        }
      }
    }

    return {
      kind: matchedPrefix.kind,
      examTitle: parts[0].trim(),
      materialRaw,
      siteRaw
    };
  }

  function lineOrBlMatchesIsolate(str) {
    const m = String(str || "").match(/^(\d{1,2})\s+-\s+([A-Za-z]{3,}.*)$/);
    return m ? m[2].trim() : null;
  }

  function organismsMatch(keyA, keyB) {
    if (!keyA || !keyB || keyA.length < 4 || keyB.length < 4) return false;
    return keyA === keyB || keyA.includes(keyB) || keyB.includes(keyA);
  }

  function parseWebBlocks(rawText) {
    const lines = String(rawText || "").split(/\r?\n/);
    const rawChunks = [];
    let currentChunk = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const mPedido = line.match(/^Pedido\s*:\s*(\d+)/i);
      if (mPedido) {
        if (currentChunk) rawChunks.push(currentChunk);
        currentChunk = {
          pedido: mPedido[1],
          lines: []
        };
        continue;
      }

      // Se uma linha de cabeçalho microbiológico aparecer no texto sem "Pedido:" antes (colagem parcial)
      if (!currentChunk && parseHeaderLine(line)) {
        currentChunk = {
          pedido: "AVULSO",
          lines: [line]
        };
        continue;
      }

      // Se encontrarmos o início de um bloco de PDF, fechamos o chunk web atual
      if (
        /^Nome:\s*Registro:/i.test(line) ||
        /^Sexo:\s*Idade:/i.test(line) ||
        /^HIST[OÓ]RICO\s+DE\s+EXAMES$/i.test(line) ||
        /^Valores\s+de\s+Refer[eê]ncia\s+M[eé]todo\s+Resultado$/i.test(line) ||
        /^Liberado\s+em:/i.test(line) ||
        /^(\d{10,16})\s*-\s*(\d+)\s*-\s*Cl[ií]nica:/i.test(line) ||
        /^Microrganismos\b/i.test(line) ||
        /^Antibiogramas$/i.test(line)
      ) {
        if (currentChunk) {
          rawChunks.push(currentChunk);
          currentChunk = null;
        }
        continue;
      }

      if (currentChunk) {
        currentChunk.lines.push(line);
      }
    }
    if (currentChunk) rawChunks.push(currentChunk);

    const parsedBlocks = [];
    const unparsedBlocks = [];
    const cancelledBlocks = [];

    for (const chunk of rawChunks) {
      const blockText = chunk.lines.join("\n");
      const normBlock = normalizeAsc(blockText);

      let date = "";
      let time = "";
      let isPartialHeader = false;
      let headerInfo = null;
      let headerLineIdx = -1;
      let rawHeaderCandidate = "";

      for (let i = 0; i < chunk.lines.length; i++) {
        const l = chunk.lines[i];
        const mCol = l.match(/^Coletado\s+em:\s*(\d{2}\/\d{2}\/\d{4})(?:\s+(\d{2}:\d{2}))?/i);
        if (mCol) {
          date = mCol[1];
          time = mCol[2] || "";
          continue;
        }
        if (/^Resultado\s+Parcial$/i.test(l)) {
          isPartialHeader = true;
          continue;
        }
        if (!headerInfo) {
          const h = parseHeaderLine(l);
          if (h) {
            headerInfo = h;
            headerLineIdx = i;
          } else if (
            !rawHeaderCandidate &&
            /\s-\s/.test(l) &&
            !/^DIVIS[AÃ]O|^Consulte\s+Manual|^Morfotipos/i.test(l)
          ) {
            rawHeaderCandidate = l.split(",")[0].trim();
          }
        }
      }

      // 1. Registrar e ignorar exames cancelados ou não colhidos
      if (
        normBlock.includes("EXAME CANCELADO") ||
        normBlock.includes("EXAME NAO REALIZADO") ||
        normBlock.includes("MATERIAL NAO COLHIDO")
      ) {
        if (headerInfo || /\b(CULTURA|BACTERIOSCOPIC|MICOBACTERIA|BAAR|FUNGOS|TUBERCULOSE|SWAB)\b/.test(normBlock)) {
          const reason = normBlock.includes("MATERIAL NAO COLHIDO")
            ? "Exame não realizado (material não colhido)"
            : "Exame cancelado no sistema";
          const title = headerInfo
            ? `${headerInfo.examTitle} - ${headerInfo.materialRaw}${headerInfo.siteRaw ? " (" + headerInfo.siteRaw + ")" : ""}`
            : rawHeaderCandidate || "Exame microbiológico";
          cancelledBlocks.push({
            pedido: chunk.pedido,
            date,
            time,
            rawTitle: title,
            reason
          });
        }
        continue;
      }

      // Se não foi reconhecido pelo parseHeaderLine, verificar se parece ser um exame microbiológico não mapeado
      if (!headerInfo) {
        const hasMicroKeyword = chunk.lines.some(l => {
          const nl = normalizeAsc(l);
          if (/^(CONSULTE MANUAL|FLORA NORMAL|SEMEADURA|MATERIAL BIOLOGICO|OBSERVAC)/.test(nl)) return false;
          return /\b(CULTURA|BACTERIOSCOPIC|ANTIBIOGRAMA|MICOBACTERIA|BAAR)\b/.test(nl) && /\s-\s/.test(l);
        });
        if (hasMicroKeyword) {
          unparsedBlocks.push({
            pedido: chunk.pedido,
            date,
            time,
            rawTitle: rawHeaderCandidate || chunk.lines[0] || "Bloco desconhecido",
            reason: "Cabeçalho de exame microbiológico com formato não reconhecido"
          });
        }
        continue;
      }

      const bodyLines = chunk.lines.slice(headerLineIdx + 1);
      const hasPdfNotice = normBlock.includes("PERFIL DE SENSIBILIDADE ESTA DISPONIBILIZADO EM LAUDO COMPLEMENTAR NO FORMATO PDF");
      const entry = {
        pedido: chunk.pedido,
        date,
        time,
        kind: headerInfo.kind,
        examTitle: headerInfo.examTitle,
        materialRaw: headerInfo.materialRaw,
        siteRaw: headerInfo.siteRaw,
        isPartial: isPartialHeader,
        hasPdfNotice,
        matchedByPdf: false,
        status: "desconhecido", // positiva | negativa | parcial_negativa | inadequada | flora_normal
        isolates: [], // [{ name, ufc, drugs: [], notes: [] }]
        colonyCount: "",
        sameAsSibling: false,
        detectionTime: "",
        directResult: "",
        cimData: null
      };

      const fullEntryLabel = `${entry.examTitle} - ${entry.materialRaw}${entry.siteRaw ? " (" + entry.siteRaw + ")" : ""}`;

      // Caso 1: Bloco de Concentração Inibitória Mínima (CIM) direto na página web
      if (entry.kind === "cim") {
        let org = "";
        let drug = "";
        let mic = "";
        const notes = [];

        for (const bl of bodyLines) {
          const mOrg = bl.match(/^Microrganismo\s+testado:\s*(.+)$/i);
          if (mOrg) {
            org = cleanOrganismName(mOrg[1].split(/\t+/)[0]);
            continue;
          }
          const mDrug = bl.match(/^Antibi[oó]tico\s+testado:\s*(.+)$/i);
          if (mDrug) {
            drug = mDrug[1].trim();
            continue;
          }
          const mMic = bl.match(/^M\.I\.C\.?:\s*(.+)$/i);
          if (mMic) {
            mic = mMic[1].trim();
            continue;
          }
          if (/^\*\s*|^Valor\s+de\s+refer[eê]ncia/i.test(bl)) {
            notes.push(bl.trim());
          }
        }

        if (org && drug) {
          entry.cimData = { org, drug, mic, notes };
          parsedBlocks.push(entry);
        } else {
          unparsedBlocks.push({
            pedido: chunk.pedido,
            date,
            time,
            rawTitle: fullEntryLabel,
            reason: "Bloco de CIM sem identificação clara do microrganismo ou antibiótico"
          });
        }
        continue;
      }

      // Caso 2: Bacterioscópico de Hemocultura (Aeróbia ou Anaeróbia)
      if (entry.kind === "gramHmcAerobia" || entry.kind === "gramHmcAnaerobia") {
        for (const bl of bodyLines) {
          if (/^BACTERIOSC[OÓ]PICO\s+DE\s+HEMOCULTURA/i.test(bl)) {
            const cols = bl.split(/\t+/).map(s => s.trim()).filter(Boolean);
            if (cols.length >= 2) {
              entry.directResult = cols[1];
            }
          }
        }
        if (entry.directResult) {
          parsedBlocks.push(entry);
        } else {
          unparsedBlocks.push({
            pedido: chunk.pedido,
            date,
            time,
            rawTitle: fullEntryLabel,
            reason: "Bacterioscópico de hemocultura sem resultado extraído"
          });
        }
        continue;
      }

      // Caso 3: Exame Bacterioscópico Geral (Gram de secreção, líquidos, líquor, escarro)
      if (entry.kind === "gram") {
        const findings = [];
        let isInadequate = false;
        for (const bl of bodyLines) {
          if (/^EXAME\s+BACTERIOSC[OÓ]PICO/i.test(bl)) {
            const cols = bl.split(/\t+/).map(s => s.trim()).filter(Boolean);
            if (cols.length >= 2) {
              const val = cols[1];
              if (/AMOSTRA\s+COM\s+C[EÉ]LULAS\s+EPITELIAIS\s*>=\s*10/i.test(val)) {
                isInadequate = true;
              } else {
                findings.push(val);
              }
            }
          }
        }
        if (isInadequate) {
          entry.status = "inadequada";
          entry.directResult = "Amostra inadequada (>=10 cél. epiteliais/campo)";
        } else if (findings.length > 0) {
          const morphs = findings.filter(
            f => !/N[aã]o\s+foram\s+observados\s+microrganismos|C[eé]lulas\s+Epiteliais|Leuc[oó]citos/i.test(f)
          );
          const hasNoMicro = findings.some(f => /N[aã]o\s+foram\s+observados\s+microrganismos/i.test(f));
          if (morphs.length > 0) {
            entry.directResult = morphs.join(", ");
          } else if (hasNoMicro) {
            entry.directResult = "neg";
          } else {
            entry.directResult = findings.join(", ");
          }
        }
        if (entry.directResult) {
          parsedBlocks.push(entry);
        } else {
          unparsedBlocks.push({
            pedido: chunk.pedido,
            date,
            time,
            rawTitle: fullEntryLabel,
            reason: "Exame bacterioscópico (Gram) sem resultado extraído"
          });
        }
        continue;
      }

      // Caso 4: Pesquisa de BAAR, Pesquisa de Fungos, TRM-TB, CrAg
      if (entry.kind === "baar" || entry.kind === "pFungos" || entry.kind === "trmTb" || entry.kind === "crag") {
        for (const bl of bodyLines) {
          if (/^(PESQUISA\s+DE|TESTE\s+R[AÁ]PIDO\s+MOLECULAR)/i.test(bl)) {
            const cols = bl.split(/\t+/).map(s => s.trim()).filter(Boolean);
            if (cols.length >= 2) {
              const val = cols[1];
              const nVal = normalizeAsc(val);
              if (nVal.includes("NAO DETECTADO") || nVal.includes("NEGATIV") || nVal.includes("NAO REAGENTE")) {
                entry.directResult = "neg";
              } else {
                entry.directResult = val;
              }
            }
          }
        }
        if (entry.directResult) {
          parsedBlocks.push(entry);
        } else {
          unparsedBlocks.push({
            pedido: chunk.pedido,
            date,
            time,
            rawTitle: fullEntryLabel,
            reason: "Pesquisa direta / teste molecular sem resultado extraído"
          });
        }
        continue;
      }

      // Caso 5: Culturas (Aeróbia, Anaeróbia, Fungos, Micobactérias, Vigilância)
      let waitingForFungusLine = false;
      for (const bl of bodyLines) {
        if (/^Coletado\s+em:/i.test(bl)) continue;

        // Nota de hemocultura idêntica ao outro frasco da mesma coleta
        if (/Identifica[cç][aã]o\s+e\s+perfil\s+de\s+sensibilidade\s+id[eê]nticos/i.test(bl)) {
          entry.sameAsSibling = true;
          entry.status = "positiva";
          continue;
        }

        // Tempo de detecção
        const mDet = bl.match(/^T\.\s*Detec[cç][aã]o:\s*(.+)$/i);
        if (mDet) {
          entry.detectionTime = mDet[1].trim();
          continue;
        }

        // Isolados numerados: "1 - Stenotrophomonas maltophilia"
        const mIso = lineOrBlMatchesIsolate(bl);
        if (mIso) {
          const isoName = cleanOrganismName(mIso);
          if (isoName) {
            entry.isolates.push({
              name: isoName,
              ufc: "",
              drugs: [],
              notes: []
            });
          }
          continue;
        }

        // Linha tabular da cultura: "CULTURA AERÓBIA   Negativa   Negativa" ou "CULTURA PARA FUNGOS" seguido do fungo na próxima linha
        if (/^(CULTURA\s+|PESQUISA\s+DE\s+ENTEROBACT[EÉ]RIAS)/i.test(bl)) {
          const cols = bl.split(/\t+/).map(s => s.trim()).filter(Boolean);
          if (cols.length >= 2) {
            const val = cols[1];
            const nVal = normalizeAsc(val);
            if (nVal.includes("CELULAS EPITELIAIS >= 10")) {
              entry.status = "inadequada";
            } else if (nVal.includes("PARCIAL NEGATIV")) {
              entry.status = "parcial_negativa";
              entry.isPartial = true;
            } else if (nVal.includes("NEGATIV")) {
              entry.status = entry.isPartial ? "parcial_negativa" : "negativa";
            } else if (nVal.includes("POSITIV")) {
              entry.status = "positiva";
            }
            waitingForFungusLine = false;
          } else if (entry.kind === "cFungos") {
            waitingForFungusLine = true;
          }
          continue;
        }

        if (waitingForFungusLine) {
          waitingForFungusLine = false;
          const nBl = normalizeAsc(bl);
          const isBoilerplate =
            /^(SEMEADURA|MATERIAL\s+BIOLOGICO|QUANTITATIVO|EM\s+PACIENTES|CONSULTE\s+MANUAL|ATENCAO:|ABRIR\s+PDF)/i.test(nBl);
          if (!isBoilerplate && bl.length > 2) {
            entry.isolates.push({
              name: cleanOrganismName(bl),
              ufc: "",
              drugs: [],
              notes: []
            });
            entry.status = "positiva";
            continue;
          }
        }

        // Contagem de colônias explícita no resultado (não na linha de nota "Quantitativo: limite de detecção...")
        if (!/^Quantitativo|^Resultados\s+iguais\s+ou\s+superiores/i.test(bl)) {
          const mUfc = bl.match(/(?:>|>=|<|<=)?\s*[\d.]+\s*UFC\/mL/i);
          if (mUfc) {
            entry.colonyCount = mUfc[0].trim();
          }
        }
      }

      if (entry.isolates.length > 0) {
        const allFlora = entry.isolates.every(iso => /^FLORA\s+NORMAL$/i.test(normalizeAsc(iso.name)));
        if (allFlora) {
          entry.status = "flora_normal";
        } else {
          // Filtrar "Flora normal" se houver patógeno verdadeiro na mesma cultura
          entry.isolates = entry.isolates.filter(iso => !/^FLORA\s+NORMAL$/i.test(normalizeAsc(iso.name)));
          entry.status = "positiva";
        }
      }

      if (entry.status !== "desconhecido") {
        parsedBlocks.push(entry);
      } else {
        unparsedBlocks.push({
          pedido: chunk.pedido,
          date,
          time,
          rawTitle: fullEntryLabel,
          reason: "Cultura sem resultado identificável (Positiva/Negativa/Parcial) ou formato inesperado"
        });
      }
    }

    parsedBlocks.unparsedBlocks = unparsedBlocks;
    parsedBlocks.cancelledBlocks = cancelledBlocks;
    return parsedBlocks;
  }

  // ---------- 3. Reconciliação e Fusão (Web + CIM + PDF) ----------

  function mergeAndConsolidateCultures(rawText, options = {}) {
    const abbreviateMaterials = options.abbreviateMaterials !== undefined ? options.abbreviateMaterials : true;

    const webBlocks = parseWebBlocks(rawText);
    const pdfBlocks = parsePdfBlocks(rawText);

    // 3.1. Resolver frascos irmãos com "Identificação e perfil de sensibilidade idênticos"
    for (const wb of webBlocks) {
      if (wb.sameAsSibling && wb.isolates.length === 0) {
        const sibling = webBlocks.find(
          other =>
            other !== wb &&
            other.pedido === wb.pedido &&
            normalizeAsc(other.materialRaw) === normalizeAsc(wb.materialRaw) &&
            normalizeAsc(other.siteRaw) === normalizeAsc(wb.siteRaw) &&
            other.isolates.length > 0
        );
        if (sibling) {
          wb.isolates = sibling.isolates.map(iso => ({
            name: iso.name,
            ufc: iso.ufc,
            drugs: [...iso.drugs],
            notes: [...iso.notes]
          }));
        }
      }
    }

    // 3.2. Anexar Gram de Hemocultura aos frascos correspondentes (Mesmo Pedido + Sítio)
    const hmcGramBlocks = webBlocks.filter(b => b.kind === "gramHmcAerobia" || b.kind === "gramHmcAnaerobia");
    for (const gb of hmcGramBlocks) {
      const targetKind = gb.kind === "gramHmcAerobia" ? "cAerobia" : "cAnaerobia";
      const bottle = webBlocks.find(
        b =>
          b.pedido === gb.pedido &&
          b.kind === targetKind &&
          normalizeAsc(b.siteRaw) === normalizeAsc(gb.siteRaw)
      );
      if (bottle && gb.directResult) {
        bottle.directResult = gb.directResult;
      }
    }

    // 3.3. Anexar blocos de CIM da página web às culturas do mesmo Pedido (ou mesma Data/Material)
    const cimBlocks = webBlocks.filter(b => b.kind === "cim" && b.cimData);
    for (const cb of cimBlocks) {
      const targetOrgKey = normalizeOrganismKey(cb.cimData.org);
      const matchingCultures = webBlocks.filter(
        b =>
          (b.pedido === cb.pedido || (b.date === cb.date && normalizeAsc(b.materialRaw) === normalizeAsc(cb.materialRaw))) &&
          b.isolates.some(iso => normalizeOrganismKey(iso.name).includes(targetOrgKey) || targetOrgKey.includes(normalizeOrganismKey(iso.name)))
      );

      for (const mc of matchingCultures) {
        for (const iso of mc.isolates) {
          const isoKey = normalizeOrganismKey(iso.name);
          if (isoKey.includes(targetOrgKey) || targetOrgKey.includes(isoKey)) {
            const drugName = formatAntibioticName(cb.cimData.drug);
            const micClean = cb.cimData.mic.replace(/\s*mg\/L/i, "").trim();
            // Determinar se a nota da CIM indica Sensível (ex.: Levofloxacina <=0,5 ou Penicilina S <= 0,25)
            let cat = "S";
            const existing = iso.drugs.find(d => normalizeAsc(d.name) === normalizeAsc(drugName));
            if (existing) {
              existing.mic = micClean;
              if (existing.category === "OBS") existing.category = cat;
            } else {
              iso.drugs.push({
                rawName: cb.cimData.drug,
                name: drugName,
                category: cat,
                mic: micClean
              });
            }
            if (cb.cimData.notes.length) {
              iso.notes.push(...cb.cimData.notes);
            }
          }
        }
      }
    }

    // 3.4. Fundir PDFs nas Culturas da Página Web (por Pedido + Microrganismo, ou Data + Microrganismo)
    const matchedPdfKeys = new Set();

    for (const pdf of pdfBlocks) {
      let matchedAnyWeb = false;
      // 1º: Tenta casar pelo número do Pedido ou pela Data/Hora de coleta
      let candidateWebs = webBlocks.filter(
        wb =>
          wb.isolates.length > 0 &&
          ((pdf.pedido && wb.pedido === pdf.pedido) || (pdf.date && wb.date === pdf.date && wb.time === pdf.time))
      );

      // 2º (Fallback): Se o PDF foi colado sem cabeçalho de Pedido/Data (ou se só há uma cultura com aquele germe), busca por microrganismo em todas as culturas positivas
      if (candidateWebs.length === 0) {
        candidateWebs = webBlocks.filter(wb => wb.isolates.length > 0);
      }

      for (const wb of candidateWebs) {
        for (const iso of wb.isolates) {
          const isoKey = normalizeOrganismKey(iso.name);
          // Verifica se o PDF contém esse microrganismo
          const pdfHasOrg = pdf.organisms.some(po => {
            const poKey = normalizeOrganismKey(po);
            return organismsMatch(poKey, isoKey);
          });

          if (pdfHasOrg) {
            matchedAnyWeb = true;
            wb.matchedByPdf = true;
            // Procura antibiograma correspondente no PDF
            for (const [antOrgKey, antData] of Object.entries(pdf.antibiograms)) {
              if (organismsMatch(antOrgKey, isoKey)) {
                for (const pdfDrug of antData.drugs) {
                  // Se a droga for "OBS" (ex: Penicilina Consultar observação 0,06) e o PDF tiver nota S <= 0,25, classificar como S
                  let finalCat = pdfDrug.category;
                  if (finalCat === "OBS" && pdfDrug.mic) {
                    const micVal = parseFloat(pdfDrug.mic.replace(",", "."));
                    const hasPenRef = pdf.notes.some(n => /S\s*<=\s*0,25/i.test(n));
                    if (!isNaN(micVal) && hasPenRef && micVal <= 0.25) {
                      finalCat = "S";
                    }
                  }

                  const existingIdx = iso.drugs.findIndex(
                    d => normalizeAsc(d.name) === normalizeAsc(pdfDrug.name)
                  );
                  if (existingIdx !== -1) {
                    iso.drugs[existingIdx] = {
                      ...pdfDrug,
                      category: finalCat
                    };
                  } else {
                    iso.drugs.push({
                      ...pdfDrug,
                      category: finalCat
                    });
                  }
                }
              }
            }
          }
        }
      }

      if (matchedAnyWeb) {
        matchedPdfKeys.add(pdf.key);
      }
    }

    // Se algum PDF foi colado isoladamente (sem a página web correspondente), criar bloco sintético a partir do PDF
    for (const pdf of pdfBlocks) {
      if (matchedPdfKeys.has(pdf.key)) continue;
      const isolates = pdf.organisms.map(orgName => {
        const orgKey = normalizeOrganismKey(orgName);
        const ant = pdf.antibiograms[orgKey];
        const drugs = ant
          ? ant.drugs.map(d => {
              let finalCat = d.category;
              if (finalCat === "OBS" && d.mic) {
                const micVal = parseFloat(d.mic.replace(",", "."));
                const hasPenRef = pdf.notes.some(n => /S\s*<=\s*0,25/i.test(n));
                if (!isNaN(micVal) && hasPenRef && micVal <= 0.25) {
                  finalCat = "S";
                }
              }
              return { ...d, category: finalCat };
            })
          : [];
        return {
          name: orgName,
          ufc: "",
          drugs,
          notes: [...pdf.notes]
        };
      });

      if (isolates.length > 0) {
        webBlocks.push({
          pedido: pdf.pedido,
          date: pdf.date,
          time: pdf.time,
          kind: "cAerobia",
          examTitle: "CULTURA E ANTIBIOGRAMA (PDF)",
          materialRaw: "Cultura (PDF)",
          siteRaw: "",
          isPartial: false,
          status: "positiva",
          isolates,
          colonyCount: "",
          sameAsSibling: false,
          detectionTime: "",
          directResult: "",
          cimData: null
        });
      }
    }

    // ---------- 4. Consolidação por Coleta e Topografia ----------
    // Agrupamos todos os exames da mesma coleta (Data + Hora + Categoria de Material)
    const sampleGroupsMap = new Map();

    for (const b of webBlocks) {
      if (b.kind === "cim" || b.kind === "gramHmcAerobia" || b.kind === "gramHmcAnaerobia") {
        continue; // Já mesclados
      }

      const matInfo = classifyMaterialAndSite(b.materialRaw, b.siteRaw, b.kind, abbreviateMaterials);
      // Para hemoculturas, agrupamos por Data + Hora + Tipo (HMC_PERIFERICA vs HMC_CATETER)
      // Para demais materiais, agrupamos por Data + Hora + Pedido + Categoria de Material
      const groupKey = matInfo.isBloodCulture
        ? `${b.date}@@${b.time}@@${matInfo.categoryKey}`
        : `${b.date}@@${b.time}@@${b.pedido}@@${matInfo.categoryKey}`;

      if (!sampleGroupsMap.has(groupKey)) {
        sampleGroupsMap.set(groupKey, {
          id: groupKey,
          pedido: b.pedido,
          date: b.date,
          time: b.time,
          sortTime: parseSortableDate(b.date, b.time),
          categoryKey: matInfo.categoryKey,
          materialLabel: matInfo.materialLabel,
          siteLabel: matInfo.siteLabel,
          isBloodCulture: matInfo.isBloodCulture,
          items: []
        });
      }

      sampleGroupsMap.get(groupKey).items.push({
        ...b,
        matInfo
      });
    }

    // Transformar cada grupo em um registro clínico consolidado (Card / Linha)
    const consolidatedRecords = [];

    for (const group of sampleGroupsMap.values()) {
      if (group.isBloodCulture) {
        // Agrupar frascos de hemocultura por sítio/amostra
        const bottles = group.items.filter(
          it => it.kind === "cAerobia" || it.kind === "cAnaerobia" || it.kind === "cFungos" || it.kind === "cMicobacterias"
        );
        if (!bottles.length) continue;

        // Separar por sítio (ex.: MSD, MSE, Permcath Azul, Permcath Vermelha)
        const siteMap = new Map();
        for (const bt of bottles) {
          const sKey = normalizeAsc(bt.matInfo.siteLabel || "PADRAO");
          if (!siteMap.has(sKey)) {
            siteMap.set(sKey, {
              siteLabel: bt.matInfo.siteLabel || "",
              bottles: []
            });
          }
          siteMap.get(sKey).bottles.push(bt);
        }

        // Calcular número total de amostras (pares) naquela coleta
        const aerCount = bottles.filter(b => b.kind === "cAerobia").length;
        const anaerCount = bottles.filter(b => b.kind === "cAnaerobia").length;
        const totalSamplesCount = Math.max(siteMap.size, aerCount, anaerCount, 1);

        const siteEntries = Array.from(siteMap.values());
        const hasAnyPositive = bottles.some(b => b.status === "positiva");

        if (!hasAnyPositive) {
          // Todas as amostras desta coleta são Negativas ou Parciais Negativas
          const allPartial = bottles.every(b => b.status === "parcial_negativa");
          const anyPartial = bottles.some(b => b.status === "parcial_negativa");
          const overallStatus = allPartial || anyPartial ? "parcial_negativa" : "negativa";
          const siteLabels = siteEntries.map(s => s.siteLabel).filter(Boolean);

          consolidatedRecords.push({
            id: group.id,
            pedido: group.pedido,
            date: group.date,
            time: group.time,
            sortTime: group.sortTime,
            categoryKey: group.categoryKey,
            isBloodCulture: true,
            materialLabel: group.materialLabel,
            sites: siteLabels,
            sampleCount: totalSamplesCount,
            overallStatus,
            isolates: [],
            preliminaryGram: "",
            subCultures: [],
            directExams: []
          });
        } else {
          // Há pelo menos um frasco positivo: emitir registro por sítio para clareza total
          for (const sEntry of siteEntries) {
            const posBottles = sEntry.bottles.filter(b => b.status === "positiva");
            if (posBottles.length > 0) {
              // Unificar isolados dos frascos positivos do mesmo sítio (Aeróbio + Anaeróbio)
              const mergedIsolates = [];
              let prelimGram = "";

              for (const pb of posBottles) {
                if (pb.directResult && !prelimGram) prelimGram = pb.directResult;
                for (const iso of pb.isolates) {
                  const existing = mergedIsolates.find(
                    m => normalizeOrganismKey(m.name) === normalizeOrganismKey(iso.name)
                  );
                  if (!existing) {
                    mergedIsolates.push({
                      name: iso.name,
                      ufc: iso.ufc,
                      drugs: [...iso.drugs],
                      notes: [...iso.notes]
                    });
                  } else if (iso.drugs.length > existing.drugs.length) {
                    existing.drugs = [...iso.drugs];
                  }
                }
              }

              consolidatedRecords.push({
                id: `${group.id}@@${normalizeAsc(sEntry.siteLabel)}`,
                pedido: group.pedido,
                date: group.date,
                time: group.time,
                sortTime: group.sortTime,
                categoryKey: group.categoryKey,
                isBloodCulture: true,
                materialLabel: group.materialLabel,
                sites: sEntry.siteLabel ? [sEntry.siteLabel] : [],
                sampleCount: 1,
                overallStatus: "positiva",
                isolates: mergedIsolates,
                preliminaryGram: prelimGram,
                subCultures: [],
                directExams: []
              });
            } else {
              // Sítio negativo dentro da mesma coleta
              const anyPartial = sEntry.bottles.some(b => b.status === "parcial_negativa");
              consolidatedRecords.push({
                id: `${group.id}@@${normalizeAsc(sEntry.siteLabel)}`,
                pedido: group.pedido,
                date: group.date,
                time: group.time,
                sortTime: group.sortTime,
                categoryKey: group.categoryKey,
                isBloodCulture: true,
                materialLabel: group.materialLabel,
                sites: sEntry.siteLabel ? [sEntry.siteLabel] : [],
                sampleCount: 1,
                overallStatus: anyPartial ? "parcial_negativa" : "negativa",
                isolates: [],
                preliminaryGram: "",
                subCultures: [],
                directExams: []
              });
            }
          }
        }
        continue;
      }

      // Materiais Não-Hemocultura (Urina, Secreção Traqueal, Escarro, Líquidos, Líquor, Abscesso, Fragmento, Cateter, Swab)
      const mergedIsolates = [];
      const subCultures = []; // [{ kind, label, status, isolates }]
      const directExams = []; // [{ kind, label, value }]
      let hasInadequate = false;
      let hasPositive = false;
      let hasFloraNormal = false;
      let hasPartial = false;
      let hasNegative = false;

      for (const item of group.items) {
        if (item.status === "inadequada") {
          hasInadequate = true;
          continue;
        }

        if (item.kind === "gram" || item.kind === "baar" || item.kind === "pFungos" || item.kind === "trmTb" || item.kind === "crag") {
          const directLabelMap = {
            gram: "Gram",
            baar: "BAAR",
            pFungos: "pFungos",
            trmTb: "TRM-TB",
            crag: "CrAg"
          };
          directExams.push({
            kind: item.kind,
            label: directLabelMap[item.kind] || item.kind,
            value: item.directResult
          });
          continue;
        }

        // É uma cultura (Aeróbia, Anaeróbia, Fungos, Micobactérias, Vigilância)
        const kindLabelMap = {
          cAerobia: "cAeróbia",
          cAnaerobia: "Anaeróbios",
          cFungos: "Fungos",
          cMicobacterias: "Micobactérias",
          vigilancia: "Pesquisa ERC"
        };

        // Deduplicar cepas idênticas na mesma cultura (ex.: 1 - E. cloacae, 2 - E. cloacae)
        const itemIsolates = [];
        for (const iso of item.isolates) {
          const existing = itemIsolates.find(
            x =>
              normalizeOrganismKey(x.name) === normalizeOrganismKey(iso.name) &&
              x.drugs.length === iso.drugs.length
          );
          if (existing) {
            existing.strainCount = (existing.strainCount || 1) + 1;
          } else {
            itemIsolates.push({ ...iso, strainCount: 1 });
          }
        }

        if (item.status === "positiva") {
          hasPositive = true;
          for (const iso of itemIsolates) {
            mergedIsolates.push({
              ...iso,
              cultureKind: item.kind,
              cultureLabel: kindLabelMap[item.kind] || "Cultura"
            });
          }
        } else if (item.status === "flora_normal") {
          hasFloraNormal = true;
        } else if (item.status === "parcial_negativa") {
          hasPartial = true;
        } else if (item.status === "negativa") {
          hasNegative = true;
        }

        subCultures.push({
          kind: item.kind,
          label: kindLabelMap[item.kind] || "Cultura",
          status: item.status,
          isolates: itemIsolates
        });
      }

      let overallStatus = "negativa";
      if (hasPositive) overallStatus = "positiva";
      else if (hasInadequate && !hasNegative && !hasPartial) overallStatus = "inadequada";
      else if (hasFloraNormal && !hasPositive) overallStatus = "flora_normal";
      else if (hasPartial) overallStatus = "parcial_negativa";

      consolidatedRecords.push({
        id: group.id,
        pedido: group.pedido,
        date: group.date,
        time: group.time,
        sortTime: group.sortTime,
        categoryKey: group.categoryKey,
        isBloodCulture: false,
        materialLabel: group.materialLabel,
        sites: group.siteLabel ? [group.siteLabel] : [],
        sampleCount: 1,
        overallStatus,
        isolates: mergedIsolates,
        preliminaryGram: "",
        subCultures,
        directExams
      });
    }

    // Ordenar da coleta mais recente para a mais antiga (ou conforme preferência)
    consolidatedRecords.sort((a, b) => b.sortTime - a.sortTime);

    // Compilar diagnósticos de leitura para exibição ao usuário
    const missingPdfWarnings = [];
    for (const wb of webBlocks) {
      if (
        (wb.hasPdfNotice || wb.kind === "cAerobia" || wb.kind === "cAnaerobia") &&
        !wb.matchedByPdf &&
        !wb.sameAsSibling &&
        wb.status === "positiva"
      ) {
        // Verifica se ainda há isolados sem antibiograma (nem CIM web nem PDF)
        const pendingIsolates = wb.isolates.filter(iso => !iso.drugs || iso.drugs.length === 0);
        if (pendingIsolates.length > 0) {
          const matInfo = classifyMaterialAndSite(wb.materialRaw, wb.siteRaw, wb.kind, true);
          missingPdfWarnings.push({
            pedido: wb.pedido,
            date: wb.date,
            time: wb.time,
            material: `${matInfo.materialLabel}${matInfo.siteLabel ? " (" + matInfo.siteLabel + ")" : ""}`,
            organisms: pendingIsolates.map(i => i.name).join(", ")
          });
        }
      }
    }

    const unmatchedPdfWarnings = [];
    for (const pdf of pdfBlocks) {
      if (!matchedPdfKeys.has(pdf.key)) {
        unmatchedPdfWarnings.push({
          pedido: pdf.pedido,
          date: pdf.date,
          time: pdf.time,
          organisms: pdf.organisms.join(", ") || "Sem microrganismo listado"
        });
      }
    }

    consolidatedRecords.diagnostics = {
      unparsedBlocks: webBlocks.unparsedBlocks || [],
      missingPdfWarnings,
      unmatchedPdfWarnings,
      cancelledBlocks: webBlocks.cancelledBlocks || []
    };

    return consolidatedRecords;
  }

  // ---------- 5. Formatação do Texto para Evolução / Prontuário ----------

  function formatAntibiogramBracket(drugs, options = {}) {
    if (!drugs || !drugs.length) return "";
    const mode = options.antibiogramMode || "s_sae_r"; // s_sae_r | only_s | only_r | none
    if (mode === "none") return "";

    const showMic = Boolean(options.showMic);

    const formatDrugList = list =>
      list
        .map(d => {
          if (showMic && d.mic) {
            return `${d.name} (${d.mic})`;
          }
          return d.name;
        })
        .join(", ");

    const sList = drugs.filter(d => d.category === "S" || d.category === "OBS");
    const saeList = drugs.filter(d => d.category === "SAE");
    const rList = drugs.filter(d => d.category === "R");

    const segments = [];
    if (mode === "only_s") {
      if (sList.length) segments.push(`S: ${formatDrugList(sList)}`);
      if (saeList.length) segments.push(`SAE: ${formatDrugList(saeList)}`);
    } else if (mode === "only_r") {
      if (rList.length) segments.push(`R: ${formatDrugList(rList)}`);
    } else {
      // s_sae_r (padrão)
      if (sList.length) segments.push(`S: ${formatDrugList(sList)}`);
      if (saeList.length) segments.push(`SAE: ${formatDrugList(saeList)}`);
      if (rList.length) segments.push(`R: ${formatDrugList(rList)}`);
    }

    if (!segments.length) return "";
    return ` [${segments.join(" | ")}]`;
  }

  function formatRecordLine(record, options = {}) {
    const dateFormat = options.dateFormat || "dd/mm/aa";
    const showTime = Boolean(options.showTime);
    const abbreviatePathogens = options.abbreviatePathogens !== undefined ? options.abbreviatePathogens : true;
    const includeDirectExams = options.includeDirectExams !== undefined ? options.includeDirectExams : true;
    const groupNegatives = options.groupNegatives !== undefined ? options.groupNegatives : true;

    const dateLabel = formatCultureDate(record.date, record.time, dateFormat, showTime);

    // Rótulo do material + sítio/amostras
    let matHeader = record.materialLabel;
    if (record.isBloodCulture) {
      if (record.overallStatus === "positiva") {
        if (record.sites.length) {
          matHeader += ` (${record.sites.join(", ")})`;
        }
      } else {
        if (groupNegatives && record.sampleCount > 1) {
          if (record.sites.length > 0) {
            matHeader += ` (${record.sampleCount} amostras: ${record.sites.join(", ")})`;
          } else {
            matHeader += ` (${record.sampleCount} amostras)`;
          }
        } else if (record.sites.length > 0) {
          matHeader += ` (${record.sites.join(", ")})`;
        }
      }
    } else if (record.sites.length > 0) {
      matHeader += ` (${record.sites.join(", ")})`;
    }

    // 1. Hemoculturas
    if (record.isBloodCulture) {
      if (record.overallStatus === "positiva") {
        if (record.isolates.length > 0) {
          const isoTexts = record.isolates.map(iso => {
            const orgName = formatOrganismDisplay(iso.name, abbreviatePathogens);
            const tsa = formatAntibiogramBracket(iso.drugs, options);
            return `${orgName}${tsa}`;
          });
          return `(${dateLabel}) ${matHeader}: ${isoTexts.join(" + ")}`;
        }
        // Positiva preliminar sem espécie identificada ainda
        const gramInfo = record.preliminaryGram ? ` [Gram: ${record.preliminaryGram}]` : "";
        return `(${dateLabel}) ${matHeader}: Positiva em andamento${gramInfo}`;
      }

      const plural = record.sampleCount > 1;
      const statusText =
        record.overallStatus === "parcial_negativa"
          ? plural ? "Parciais negativas" : "Parcial negativa"
          : plural ? "Negativas" : "Negativa";
      return `(${dateLabel}) ${matHeader}: ${statusText}`;
    }

    // 2. Amostra inadequada
    if (record.overallStatus === "inadequada") {
      return `(${dateLabel}) ${matHeader}: Amostra inadequada (>10 cél. epiteliais/campo)`;
    }

    // 3. Demais materiais (Urina, Secreção Traqueal, Líquidos, Abscesso, Líquor, etc.)
    const parts = [];

    if (record.overallStatus === "positiva") {
      // Separar isolados por tipo de cultura quando houver múltiplos meios (ex: Aeróbio + Anaeróbio + Fungos)
      const aerIsolates = record.isolates.filter(i => i.cultureKind === "cAerobia" || !i.cultureKind);
      const anaerIsolates = record.isolates.filter(i => i.cultureKind === "cAnaerobia");
      const fungIsolates = record.isolates.filter(i => i.cultureKind === "cFungos");
      const micoIsolates = record.isolates.filter(i => i.cultureKind === "cMicobacterias");

      const formatIsoGroup = list =>
        list
          .map(iso => {
            const name = formatOrganismDisplay(iso.name, abbreviatePathogens);
            const strainSuffix = iso.strainCount > 1 ? ` (${iso.strainCount} cepas)` : "";
            const ufcSuffix = iso.ufc ? ` (${iso.ufc})` : "";
            const tsa = formatAntibiogramBracket(iso.drugs, options);
            return `${name}${strainSuffix}${ufcSuffix}${tsa}`;
          })
          .join(" + ");

      // Se a cultura para fungos isolou o mesmo germe já listado na aeróbia (ex.: Candida albicans na Sec. Traqueal), evitar duplicação
      const uniqueFungIsolates = fungIsolates.filter(
        fi => !aerIsolates.some(ai => normalizeOrganismKey(ai.name) === normalizeOrganismKey(fi.name))
      );

      if (aerIsolates.length) parts.push(formatIsoGroup(aerIsolates));
      if (anaerIsolates.length) parts.push(`Anaeróbios: ${formatIsoGroup(anaerIsolates)}`);
      if (uniqueFungIsolates.length) {
        const prefix = aerIsolates.length || anaerIsolates.length ? "Fungos: " : "";
        parts.push(`${prefix}${formatIsoGroup(uniqueFungIsolates)}`);
      }
      if (micoIsolates.length) parts.push(`Micobactérias: ${formatIsoGroup(micoIsolates)}`);

      // Adicionar subculturas negativas/parciais do mesmo pacote (ex: Micobactérias parcial neg)
      const negSubs = record.subCultures.filter(
        sc =>
          sc.status !== "positiva" &&
          sc.status !== "flora_normal" &&
          !(sc.kind === "cFungos" && fungIsolates.length > 0)
      );
      for (const ns of negSubs) {
        const st = ns.status === "parcial_negativa" ? "parcial neg" : "neg";
        parts.push(`${ns.label}: ${st}`);
      }
    } else if (record.overallStatus === "flora_normal") {
      parts.push("Flora normal");
      const negSubs = record.subCultures.filter(sc => sc.status !== "flora_normal");
      for (const ns of negSubs) {
        const st = ns.status === "parcial_negativa" ? "parcial neg" : "neg";
        parts.push(`${ns.label}: ${st}`);
      }
    } else {
      // Todas as culturas da amostra são negativas ou parciais negativas
      if (record.subCultures.length === 1) {
        const sc = record.subCultures[0];
        const st = sc.status === "parcial_negativa" ? "Parcial negativa" : "Negativa";
        if (sc.kind === "cAerobia" || sc.kind === "vigilancia") {
          parts.push(st);
        } else {
          parts.push(`${sc.label}: ${st}`);
        }
      } else if (record.subCultures.length > 1) {
        const negList = record.subCultures.filter(s => s.status === "negativa").map(s => s.label);
        const partList = record.subCultures.filter(s => s.status === "parcial_negativa").map(s => s.label);
        if (negList.length) parts.push(`${negList.join(", ")}: Neg`);
        if (partList.length) parts.push(`${partList.join(", ")}: Parcial neg`);
      }
    }

    // Exames diretos (Gram, BAAR, pFungos, TRM-TB)
    if (includeDirectExams && record.directExams.length > 0) {
      for (const de of record.directExams) {
        parts.push(`${de.label} ${de.value}`);
      }
    }

    if (!parts.length) return "";
    return `(${dateLabel}) ${matHeader}: ${parts.join(" | ")}`;
  }

  function generateCulturesText(records, options = {}) {
    if (!Array.isArray(records) || !records.length) return "";
    const hideNegatives = Boolean(options.hideNegatives);
    const sortOrder = options.sortOrder || "chronological_desc"; // chronological_desc | chronological_asc | positives_first

    let filtered = records.filter(r => r.enabled !== false);
    if (hideNegatives) {
      filtered = filtered.filter(r => r.overallStatus === "positiva");
    }

    const sorted = [...filtered];
    if (sortOrder === "chronological_asc") {
      sorted.sort((a, b) => a.sortTime - b.sortTime);
    } else if (sortOrder === "positives_first") {
      sorted.sort((a, b) => {
        const aPos = a.overallStatus === "positiva" ? 1 : 0;
        const bPos = b.overallStatus === "positiva" ? 1 : 0;
        if (aPos !== bPos) return bPos - aPos;
        return b.sortTime - a.sortTime;
      });
    } else {
      sorted.sort((a, b) => b.sortTime - a.sortTime);
    }

    const lines = sorted.map(r => formatRecordLine(r, options)).filter(Boolean);
    return lines.join("\n");
  }

  // ---------- 6. Interface do Usuário (DOM) ----------

  let currentRecords = [];

  function initCulturesUI() {
    if (!isBrowser) return;

    const culturesInput = document.getElementById("culturesInput");
    const culturesOutput = document.getElementById("culturesOutput");
    const culturesStatus = document.getElementById("culturesStatus");
    const culturesCardsContainer = document.getElementById("culturesCardsContainer");
    const culturesDiagnosticsContainer = document.getElementById("culturesDiagnosticsContainer");
    const btnParseCultures = document.getElementById("btnParseCultures");
    const btnAppendPdfCulture = document.getElementById("btnAppendPdfCulture");
    const btnClearCultures = document.getElementById("btnClearCultures");
    const btnCopyCultures = document.getElementById("btnCopyCultures");

    const cultAntibiogramMode = document.getElementById("cultAntibiogramMode");
    const cultDateFormat = document.getElementById("cultDateFormat");
    const cultSortOrder = document.getElementById("cultSortOrder");
    const cultShowMic = document.getElementById("cultShowMic");
    const cultShowTime = document.getElementById("cultShowTime");
    const cultGroupNegatives = document.getElementById("cultGroupNegatives");
    const cultAbbreviatePathogens = document.getElementById("cultAbbreviatePathogens");
    const cultIncludeDirect = document.getElementById("cultIncludeDirect");
    const cultHideNegatives = document.getElementById("cultHideNegatives");

    if (!culturesInput || !culturesOutput) return;

    function getUIOptions() {
      return {
        antibiogramMode: cultAntibiogramMode ? cultAntibiogramMode.value : "s_sae_r",
        dateFormat: cultDateFormat ? cultDateFormat.value : "dd/mm/aa",
        sortOrder: cultSortOrder ? cultSortOrder.value : "chronological_desc",
        showMic: cultShowMic ? cultShowMic.checked : false,
        showTime: cultShowTime ? cultShowTime.checked : false,
        groupNegatives: cultGroupNegatives ? cultGroupNegatives.checked : true,
        abbreviatePathogens: cultAbbreviatePathogens ? cultAbbreviatePathogens.checked : true,
        includeDirectExams: cultIncludeDirect ? cultIncludeDirect.checked : true,
        hideNegatives: cultHideNegatives ? cultHideNegatives.checked : false,
        abbreviateMaterials: true
      };
    }

    function renderDiagnostics(diagnostics, opts) {
      if (!culturesDiagnosticsContainer) return;
      if (!diagnostics) {
        culturesDiagnosticsContainer.innerHTML = "";
        return;
      }

      const {
        unparsedBlocks = [],
        missingPdfWarnings = [],
        unmatchedPdfWarnings = [],
        cancelledBlocks = []
      } = diagnostics;

      const sectionsHtml = [];

      // 1. Amostras não identificadas / não lidas (Alerta Vermelho/Âmbar)
      if (unparsedBlocks.length > 0) {
        const items = unparsedBlocks
          .map(b => {
            const dt = b.date ? formatCultureDate(b.date, b.time, opts.dateFormat, false) : "Sem data";
            const ped = b.pedido ? `Pedido ${escapeHtml(b.pedido)} • ` : "";
            return `<li><strong>${escapeHtml(b.rawTitle)}</strong> <span class="cult-diag-meta">(${ped}${escapeHtml(dt)})</span> — ${escapeHtml(b.reason)}</li>`;
          })
          .join("");
        sectionsHtml.push(`
          <div class="cult-diag-box cult-diag-alert">
            <div class="cult-diag-header">
              <span class="cult-diag-badge badge-alert">Atenção</span>
              <strong>${unparsedBlocks.length} amostra(s) ou bloco(s) não identificado(s) / leitura incompleta</strong>
            </div>
            <ul class="cult-diag-list">${items}</ul>
          </div>
        `);
      }

      // 2. Culturas positivas aguardando PDF de antibiograma (Aviso Âmbar)
      if (missingPdfWarnings.length > 0) {
        const items = missingPdfWarnings
          .map(w => {
            const dt = w.date ? formatCultureDate(w.date, w.time, opts.dateFormat, false) : "";
            const ped = w.pedido ? `Pedido ${escapeHtml(w.pedido)} • ` : "";
            return `<li><strong>${escapeHtml(w.material)} (${escapeHtml(dt)})</strong> — <em>${escapeHtml(w.organisms)}</em> <span class="cult-diag-meta">(${ped}Laudo aponta antibiograma em PDF; cole o texto do PDF na caixa de entrada se desejar incluir o TSA)</span></li>`;
          })
          .join("");
        sectionsHtml.push(`
          <div class="cult-diag-box cult-diag-warn">
            <div class="cult-diag-header">
              <span class="cult-diag-badge badge-warn">PDF Pendente</span>
              <strong>${missingPdfWarnings.length} cultura(s) positiva(s) sem o PDF de antibiograma anexado</strong>
            </div>
            <ul class="cult-diag-list">${items}</ul>
          </div>
        `);
      }

      // 3. PDFs colados sem a página web correspondente (Aviso Azul)
      if (unmatchedPdfWarnings.length > 0) {
        const items = unmatchedPdfWarnings
          .map(u => {
            const dt = u.date ? formatCultureDate(u.date, u.time, opts.dateFormat, false) : "Sem data";
            const ped = u.pedido ? `Pedido ${escapeHtml(u.pedido)} • ` : "";
            return `<li><strong>Cultura (PDF) (${escapeHtml(dt)})</strong> — <em>${escapeHtml(u.organisms)}</em> <span class="cult-diag-meta">(${ped}PDF lido sem o bloco da página web correspondente; exibido com topografia genérica "Cultura (PDF)")</span></li>`;
          })
          .join("");
        sectionsHtml.push(`
          <div class="cult-diag-box cult-diag-info">
            <div class="cult-diag-header">
              <span class="cult-diag-badge badge-info">Apenas PDF</span>
              <strong>${unmatchedPdfWarnings.length} laudo(s) PDF sem o material biológico da página web</strong>
            </div>
            <ul class="cult-diag-list">${items}</ul>
          </div>
        `);
      }

      // 4. Exames cancelados ou material não colhido (Recolhido em <details> discreto)
      if (cancelledBlocks.length > 0) {
        const items = cancelledBlocks
          .map(c => {
            const dt = c.date ? formatCultureDate(c.date, c.time, opts.dateFormat, false) : "Sem data";
            const ped = c.pedido ? `Pedido ${escapeHtml(c.pedido)} • ` : "";
            return `<li><strong>${escapeHtml(c.rawTitle)}</strong> <span class="cult-diag-meta">(${ped}${escapeHtml(dt)})</span> — ${escapeHtml(c.reason)}</li>`;
          })
          .join("");
        sectionsHtml.push(`
          <details class="cult-diag-details">
            <summary>${cancelledBlocks.length} exame(s) cancelado(s) ou com material não colhido ignorado(s) automaticamente</summary>
            <ul class="cult-diag-list">${items}</ul>
          </details>
        `);
      }

      culturesDiagnosticsContainer.innerHTML = sectionsHtml.join("");
    }

    function renderCards(records, opts) {
      if (!culturesCardsContainer) return;
      if (!records.length) {
        culturesCardsContainer.innerHTML =
          `<div class="culture-empty-state">Nenhuma cultura processada ainda. Cole a página de exames do HCMed e/ou o texto copiado dos PDFs de antibiograma.</div>`;
        return;
      }

      const visibleRecords = opts.hideNegatives
        ? records.filter(r => r.overallStatus === "positiva")
        : records;

      culturesCardsContainer.innerHTML = visibleRecords
        .map((rec, idx) => {
          const dateLabel = formatCultureDate(rec.date, rec.time, opts.dateFormat, true);
          const siteText = rec.sites.length ? ` (${rec.sites.join(", ")})` : "";
          const sampleBadge =
            rec.isBloodCulture && rec.sampleCount > 1 ? `<span class="cult-sample-count">${rec.sampleCount} amostras</span>` : "";

          let statusBadgeClass = "status-neg";
          let statusLabel = "Negativa";
          if (rec.overallStatus === "positiva") {
            statusBadgeClass = "status-pos";
            statusLabel = "Positiva";
          } else if (rec.overallStatus === "parcial_negativa") {
            statusBadgeClass = "status-partial";
            statusLabel = "Parcial Negativa";
          } else if (rec.overallStatus === "inadequada") {
            statusBadgeClass = "status-warn";
            statusLabel = "Amostra Inadequada";
          } else if (rec.overallStatus === "flora_normal") {
            statusBadgeClass = "status-neutral";
            statusLabel = "Flora Normal";
          }

          let bodyHtml = "";
          if (rec.isolates.length > 0) {
            bodyHtml = rec.isolates
              .map(iso => {
                const orgDisplay = escapeHtml(iso.name);
                const subTag = iso.cultureLabel ? `<span class="cult-iso-kind">${escapeHtml(iso.cultureLabel)}</span>` : "";
                let drugsHtml = "";
                if (iso.drugs && iso.drugs.length > 0) {
                  const pills = iso.drugs
                    .map(d => {
                      const catClass =
                        d.category === "R" ? "tsa-r" : d.category === "SAE" ? "tsa-sae" : "tsa-s";
                      const micStr = opts.showMic && d.mic ? ` <small>(${escapeHtml(d.mic)})</small>` : "";
                      return `<span class="tsa-pill ${catClass}"><strong>${d.category}:</strong> ${escapeHtml(d.name)}${micStr}</span>`;
                    })
                    .join("");
                  drugsHtml = `<div class="cult-tsa-grid">${pills}</div>`;
                }
                return `
                  <div class="cult-isolate-block">
                    <div class="cult-isolate-name"><em>${orgDisplay}</em> ${subTag}</div>
                    ${drugsHtml}
                  </div>
                `;
              })
              .join("");
          } else if (rec.overallStatus === "positiva" && rec.preliminaryGram) {
            bodyHtml = `<div class="cult-prelim-gram">Positiva em andamento — Bacterioscopia: <strong>${escapeHtml(rec.preliminaryGram)}</strong></div>`;
          }

          let directHtml = "";
          if (rec.directExams && rec.directExams.length > 0) {
            const items = rec.directExams
              .map(de => `<span><strong>${escapeHtml(de.label)}:</strong> ${escapeHtml(de.value)}</span>`)
              .join(" &bull; ");
            directHtml = `<div class="cult-direct-bar">${items}</div>`;
          }

          const matThemeClass = getMaterialThemeClass(rec.categoryKey, rec.materialLabel);

          return `
            <div class="culture-card ${matThemeClass} ${rec.overallStatus === "positiva" ? "is-positive" : ""}">
              <div class="culture-card-header">
                <label class="culture-card-check">
                  <input type="checkbox" class="cult-record-cb" data-rec-id="${escapeHtml(rec.id)}" ${rec.enabled !== false ? "checked" : ""} />
                  <span class="cult-mat-title">${escapeHtml(rec.materialLabel)}${escapeHtml(siteText)}</span>
                </label>
                <div class="culture-card-meta">
                  ${sampleBadge}
                  <span class="cult-date-badge">${escapeHtml(dateLabel)}</span>
                  <span class="cult-status-badge ${statusBadgeClass}">${statusLabel}</span>
                </div>
              </div>
              ${bodyHtml}
              ${directHtml}
            </div>
          `;
        })
        .join("");

      culturesCardsContainer.querySelectorAll(".cult-record-cb").forEach(cb => {
        cb.addEventListener("change", () => {
          const recId = cb.getAttribute("data-rec-id");
          const target = currentRecords.find(r => r.id === recId);
          if (target) {
            target.enabled = cb.checked;
            refreshOutputOnly();
          }
        });
      });
    }

    function refreshOutputOnly() {
      const opts = getUIOptions();
      const text = generateCulturesText(currentRecords, opts);
      culturesOutput.value = text;
      if (app && typeof app.notifyComposerUpdate === "function") {
        app.notifyComposerUpdate();
      }
    }

    function runCultureParse() {
      const raw = culturesInput.value.trim();
      if (!raw) {
        currentRecords = [];
        culturesOutput.value = "";
        if (culturesStatus) culturesStatus.textContent = "";
        renderDiagnostics(null, getUIOptions());
        renderCards([], getUIOptions());
        if (app && typeof app.notifyComposerUpdate === "function") {
          app.notifyComposerUpdate();
        }
        return;
      }

      const opts = getUIOptions();
      const prevDisabledIds = new Set(currentRecords.filter(r => r.enabled === false).map(r => r.id));
      currentRecords = mergeAndConsolidateCultures(raw, opts);
      for (const r of currentRecords) {
        r.enabled = !prevDisabledIds.has(r.id);
      }

      const text = generateCulturesText(currentRecords, opts);
      culturesOutput.value = text || "Nenhuma cultura correspondente aos filtros selecionados.";

      const posCount = currentRecords.filter(r => r.overallStatus === "positiva").length;
      const totalCount = currentRecords.length;
      const diag = currentRecords.diagnostics;
      const alertCount = diag ? diag.unparsedBlocks.length + diag.missingPdfWarnings.length : 0;
      if (culturesStatus) {
        const alertSuffix = alertCount > 0 ? ` • ${alertCount} pendência(s)` : "";
        culturesStatus.textContent = `${totalCount} amostra(s) consolidada(s) (${posCount} positiva(s))${alertSuffix}`;
      }

      renderDiagnostics(currentRecords.diagnostics, opts);
      renderCards(currentRecords, opts);

      if (app && typeof app.notifyComposerUpdate === "function") {
        app.notifyComposerUpdate();
      }
    }

    culturesInput.addEventListener("input", runCultureParse);
    if (btnParseCultures) btnParseCultures.addEventListener("click", runCultureParse);

    if (btnAppendPdfCulture) {
      btnAppendPdfCulture.addEventListener("click", async () => {
        try {
          const clipText = await navigator.clipboard.readText();
          if (clipText && clipText.trim()) {
            const currentVal = culturesInput.value.trim();
            culturesInput.value = currentVal
              ? `${currentVal}\n\n${clipText.trim()}`
              : clipText.trim();
            runCultureParse();
            if (app.showToast) app.showToast("Texto do PDF anexado e mesclado às culturas!");
          } else {
            if (app.showToast) app.showToast("Área de transferência vazia. Copie o PDF primeiro.");
          }
        } catch (err) {
          culturesInput.focus();
          if (app.showToast) app.showToast("Cole o texto do PDF ao final da caixa de entrada.");
        }
      });
    }

    if (btnClearCultures) {
      btnClearCultures.addEventListener("click", () => {
        culturesInput.value = "";
        runCultureParse();
        if (app.showToast) app.showToast("Entrada de culturas limpa.");
      });
    }

    if (btnCopyCultures) {
      btnCopyCultures.addEventListener("click", () => {
        const val = culturesOutput.value.trim();
        if (!val || val.startsWith("Nenhuma cultura")) {
          if (app.showToast) app.showToast("Nada para copiar ainda.");
          return;
        }
        navigator.clipboard.writeText(val).then(() => {
          if (app.showToast) app.showToast("Culturas copiadas para a área de transferência!");
        });
      });
    }

    [
      cultAntibiogramMode,
      cultDateFormat,
      cultSortOrder,
      cultShowMic,
      cultShowTime,
      cultGroupNegatives,
      cultAbbreviatePathogens,
      cultIncludeDirect,
      cultHideNegatives
    ].forEach(el => {
      if (el) {
        el.addEventListener("change", () => {
          const opts = getUIOptions();
          renderCards(currentRecords, opts);
          refreshOutputOnly();
        });
      }
    });

    renderCards([], getUIOptions());
  }

  if (isBrowser) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initCulturesUI);
    } else {
      initCulturesUI();
    }
  }

  const exported = {
    parsePdfBlocks,
    parseWebBlocks,
    mergeAndConsolidateCultures,
    generateCulturesText,
    formatRecordLine
  };

  if (isBrowser) {
    Object.assign(app, exported);
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = exported;
  }
})();
