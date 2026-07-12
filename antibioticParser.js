(function () {
  const app = window.__EXAMES_APP__ = window.__EXAMES_APP__ || {};

  const antInput = document.getElementById("antInput");
  const antOutput = document.getElementById("antOutput");
  const btnGenerateAntTimeline = document.getElementById("btnGenerateAntTimeline");
  const btnClearAntInput = document.getElementById("btnClearAntInput");
  const btnCopyAntTimeline = document.getElementById("btnCopyAntTimeline");
  const antStatus = document.getElementById("antStatus");
  const antDateFormat = document.getElementById("antDateFormat");

  function cleanText(str) {
    return (str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function normalizeAntibioticName(rawLine) {
    const line = cleanText(rawLine);

    // ---- Tuberculostáticos (combinações primeiro, mais específico → menos específico) ----

    // RIPE = Rifampicina + Isoniazida + Pirazinamida + Etambutol (4 drogas)
    if (line.includes("rifampicina") && line.includes("isoniazida") &&
        line.includes("pirazinamida") && line.includes("etambutol")) {
      return "RIPE";
    }

    // RI = Rifampicina + Isoniazida (2 drogas, sem Pirazinamida/Etambutol)
    if (line.includes("rifampicina") && line.includes("isoniazida")) {
      return "RI";
    }

    // Isolados — só casa se NÃO for combinação já tratada acima
    if (line.includes("rifampicina") && !line.includes("isoniazida") &&
        !line.includes("pirazinamida") && !line.includes("etambutol")) {
      return "Rifampicina";
    }
    if (line.includes("isoniazida") && !line.includes("rifampicina")) {
      return "Isoniazida";
    }
    if (line.includes("pirazinamida") && !line.includes("rifampicina")) {
      return "Pirazinamida";
    }
    if (line.includes("etambutol") && !line.includes("rifampicina")) {
      return "Etambutol";
    }

    // ---- Demais antimicrobianos ----

    if (line.includes("piperacilina") || line.includes("tazobactam")) {
      return "Piperacilina Tazobactam";
    }
    if (line.includes("sulbactam")) {
      return "Ampicilina Sulbactam";
    }
    if (line.includes("clavulanato") || line.includes("amoxicilina")) {
      return "Amoxicilina Clavulanato";
    }
    if (line.includes("sulfametoxazol") || line.includes("trimetoprim") || line.includes("cotrimoxazol")) {
      return "Sulfametoxazol Trimetoprim";
    }
    if (line.includes("anfotericina")) {
      return "Anfotericina B";
    }
    if (line.includes("polimixina")) {
      return "Polimixina B";
    }
    if (line.includes("ceftriaxona")) {
      return "Ceftriaxona";
    }
    if (line.includes("cefepima")) {
      return "Cefepima";
    }
    if (line.includes("ceftazidima")) {
      return "Ceftazidima";
    }
    if (line.includes("azitromicina")) {
      return "Azitromicina";
    }
    if (line.includes("meropenem")) {
      return "Meropenem";
    }
    if (line.includes("ertapenem")) {
      return "Ertapenem";
    }
    if (line.includes("vancomicina")) {
      return "Vancomicina";
    }
    if (line.includes("teicoplanina")) {
      return "Teicoplanina";
    }
    if (line.includes("daptomicina")) {
      return "Daptomicina";
    }
    if (line.includes("linezolida")) {
      return "Linezolida";
    }
    if (line.includes("oxacilina")) {
      return "Oxacilina";
    }
    if (line.includes("ampicilina")) {
      return "Ampicilina";
    }
    if (line.includes("ciprofloxaci")) {
      return "Ciprofloxacino";
    }
    if (line.includes("levofloxaci")) {
      return "Levofloxacino";
    }
    if (line.includes("metronidazol")) {
      return "Metronidazol";
    }
    if (line.includes("clindamicina")) {
      return "Clindamicina";
    }
    if (line.includes("gentamicina")) {
      return "Gentamicina";
    }
    if (line.includes("amicacina")) {
      return "Amicacina";
    }
    if (line.includes("tigeciclina")) {
      return "Tigeciclina";
    }
    if (line.includes("fluconazol")) {
      return "Fluconazol";
    }
    if (line.includes("micafungina")) {
      return "Micafungina";
    }
    if (line.includes("anidulafungina")) {
      return "Anidulafungina";
    }
    if (line.includes("voriconazol")) {
      return "Voriconazol";
    }
    if (line.includes("cefalexina")) {
      return "Cefalexina";
    }
    if (line.includes("cefazolina")) {
      return "Cefazolina";
    }
    if (line.includes("ivermectina")) {
      return "Ivermectina";
    }
    return null;
  }

  function parsePrescriptionLines(inputText) {
    const lines = (inputText || "").split("\n");
    const prescriptions = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Match DD/MM/YY or DD/MM/YYYY at the start
      const dateMatch = line.match(/^\s*(\d{2})\/(\d{2})\/(\d{2,4})/);
      if (dateMatch) {
        const day = dateMatch[1];
        const month = dateMatch[2];
        let year = dateMatch[3];
        if (year.length === 2) {
          year = "20" + year;
        }
        const dateStr = `${day}/${month}/${year}`;
        const name = normalizeAntibioticName(line);
        if (name) {
          prescriptions.push({ dateStr, name });
        }
      }
    }
    return prescriptions;
  }

  function groupAntibioticsByDate(prescriptions) {
    const grouped = {};
    for (const p of prescriptions) {
      if (!grouped[p.name]) {
        grouped[p.name] = new Set();
      }
      grouped[p.name].add(p.dateStr);
    }
    return grouped;
  }

  function createContinuousIntervals(grouped) {
    const intervals = [];

    for (const name in grouped) {
      const dateStrings = Array.from(grouped[name]);
      const dateObjects = dateStrings.map(dStr => {
        const [d, m, y] = dStr.split("/").map(Number);
        return {
          str: dStr,
          dateObj: new Date(y, m - 1, d, 12, 0, 0, 0)
        };
      });

      // Sort chronologically
      dateObjects.sort((a, b) => a.dateObj - b.dateObj);

      if (dateObjects.length === 0) continue;

      let startObj = dateObjects[0];
      let prevObj = dateObjects[0];

      for (let i = 1; i < dateObjects.length; i++) {
        const currentObj = dateObjects[i];
        const diffMs = currentObj.dateObj - prevObj.dateObj;
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) {
          prevObj = currentObj;
        } else {
          intervals.push({
            name,
            start: startObj.str,
            end: prevObj.str,
            startDateObj: startObj.dateObj,
            endDateObj: prevObj.dateObj
          });
          startObj = currentObj;
          prevObj = currentObj;
        }
      }

      intervals.push({
        name,
        start: startObj.str,
        end: prevObj.str,
        startDateObj: startObj.dateObj,
        endDateObj: prevObj.dateObj
      });
    }

    return intervals;
  }

  function combineIntervalsWithSameDates(intervals) {
    const combinedMap = new Map();

    for (const inv of intervals) {
      const key = `${inv.start}@@${inv.end}`;
      if (!combinedMap.has(key)) {
        combinedMap.set(key, {
          names: [],
          start: inv.start,
          end: inv.end,
          startDateObj: inv.startDateObj,
          endDateObj: inv.endDateObj
        });
      }
      combinedMap.get(key).names.push(inv.name);
    }

    const combined = [];
    for (const val of combinedMap.values()) {
      combined.push({
        name: val.names.join(" + "),
        start: val.start,
        end: val.end,
        startDateObj: val.startDateObj,
        endDateObj: val.endDateObj
      });
    }

    return combined;
  }

  function formatTimelineOutput(combined, dateFormat = "dd/mm") {
    function formatDate(dateStr) {
      const parts = dateStr.split("/"); // [DD, MM, YYYY]
      const dd = parts[0];
      const mm = parts[1];
      const yyyy = parts[2];
      const aa = yyyy.slice(-2);

      if (dateFormat === "dd/mm/aaaa") {
        return `${dd}/${mm}/${yyyy}`;
      } else if (dateFormat === "dd/mm/aa") {
        return `${dd}/${mm}/${aa}`;
      } else {
        // default "dd/mm"
        return `${dd}/${mm}`;
      }
    }

    return combined.map(item => {
      const startStr = formatDate(item.start);
      const endStr = formatDate(item.end);

      if (item.start === item.end) {
        return `${item.name} (${startStr})`;
      } else {
        return `${item.name} (${startStr} - ${endStr})`;
      }
    }).join("\n");
  }

  function parseAntibioticTimeline(inputText, dateFormat = "dd/mm") {
    const prescriptions = parsePrescriptionLines(inputText);
    if (prescriptions.length === 0) return "";

    const grouped = groupAntibioticsByDate(prescriptions);
    const intervals = createContinuousIntervals(grouped);
    const combined = combineIntervalsWithSameDates(intervals);

    // Sort chronologically by start date
    combined.sort((a, b) => {
      if (a.startDateObj - b.startDateObj !== 0) {
        return a.startDateObj - b.startDateObj;
      }
      return a.endDateObj - b.endDateObj;
    });

    return formatTimelineOutput(combined, dateFormat);
  }

  // Expose main functions for testability
  app.parseAntibioticTimeline = parseAntibioticTimeline;
  app.parsePrescriptionLines = parsePrescriptionLines;
  app.normalizeAntibioticName = normalizeAntibioticName;
  app.groupAntibioticsByDate = groupAntibioticsByDate;
  app.createContinuousIntervals = createContinuousIntervals;
  app.combineIntervalsWithSameDates = combineIntervalsWithSameDates;
  app.formatTimelineOutput = formatTimelineOutput;

  function generateTimeline() {
    if (!antInput || !antOutput) return;
    const raw = antInput.value;
    const format = (antDateFormat && antDateFormat.value) ? antDateFormat.value : "dd/mm";
    const result = parseAntibioticTimeline(raw, format);
    
    if (!result.trim() && raw.trim()) {
      antOutput.value = "Nenhum antimicrobiano reconhecido. Verifique se o formato está correto (DD/MM/AA no início de cada linha).";
      if (antStatus) antStatus.textContent = "";
    } else {
      antOutput.value = result;
      const count = parsePrescriptionLines(raw).length;
      if (antStatus) antStatus.textContent = `${count} prescrições processadas.`;
    }
  }

  // DOM Event Bindings
  if (btnGenerateAntTimeline) {
    btnGenerateAntTimeline.addEventListener("click", generateTimeline);
  }

  if (antDateFormat) {
    antDateFormat.addEventListener("change", () => {
      if (antInput && antInput.value.trim()) {
        generateTimeline();
      }
    });
  }

  if (btnClearAntInput) {
    btnClearAntInput.addEventListener("click", () => {
      if (antInput) antInput.value = "";
      if (antOutput) antOutput.value = "";
      if (antStatus) antStatus.textContent = "";
      if (typeof app.showToast === "function") {
        app.showToast("Entrada limpa");
      }
    });
  }

  if (btnCopyAntTimeline && antOutput) {
    btnCopyAntTimeline.addEventListener("click", () => {
      const text = antOutput.value.trim();
      if (!text) {
        if (typeof app.showToast === "function") {
          app.showToast("Nada para copiar ainda.");
        }
        return;
      }
      navigator.clipboard
        .writeText(text)
        .then(() => {
          if (typeof app.showToast === "function") {
            app.showToast("Copiado!");
          }
        })
        .catch(() => {
          if (typeof app.showToast === "function") {
            app.showToast("Erro ao copiar.");
          }
        });
    });
  }

})();
