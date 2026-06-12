(function () {
  const app = window.__EXAMES_APP__;
  if (!app) return;

  const rawInput = document.getElementById("rawInput");
  const tableContainer = document.getElementById("tableContainer");
  const btnGenerateTable = document.getElementById("btnGenerateTable");
  const btnExportExcel = document.getElementById("btnExportExcel");
  const btnToggleTable = document.getElementById("btnToggleTable");

  let tableVisible = false;
  let lastAOA = null; // matriz (array of arrays) usada no export

  function getDateTimeKey(date, time) {
    // coluna é “data/hora” conforme preferências
    if (typeof app.formatDateTimeLabel === "function") {
      return app.formatDateTimeLabel(date, time || "");
    }
    // fallback
    return time ? `${date} ${time}` : date;
  }

  function buildColumns(dateMap, gasoMap) {
    const orderedDates = app.getAllSortedDates(dateMap, gasoMap);
    // para cada coleta (data+hora), usa os metadados do bucket quando disponíveis
    return orderedDates.map(collectionKey => {
      const bucket = dateMap.get(collectionKey) || {};
      const [datePart = "-", timePart = ""] = String(collectionKey).split("@@");
      const date = bucket.__date || datePart;
      const time = bucket.__time || timePart;
      return { collectionKey, date, time, key: getDateTimeKey(date, time) };
    });
  }

  function buildRows(selectedAbbrs) {
    // linhas = exames selecionados (ordem do examOrder), com tratamento especial para sorologias fúngicas + gasometria
    const rows = [];

    // Exames “normais”
    for (const abbr of app.examOrder) {
      if (app.sorologiaAbbrs.has(abbr)) continue;
      if (!selectedAbbrs.includes(abbr)) continue;
      rows.push({ label: abbr, type: "abbr", abbr });
    }

    // Sorologias fúngicas (agrupadas do seu jeito, apenas se selecionadas)
    if (selectedAbbrs.includes("ID Histoplasma") || selectedAbbrs.includes("CI Histoplasma")) {
      rows.push({ label: "Histoplasma (ID/CI)", type: "soro", group: "Histoplasma" });
    }
    if (selectedAbbrs.includes("ID Aspergillus") || selectedAbbrs.includes("CI Aspergillus")) {
      rows.push({ label: "Aspergillus (ID/CI)", type: "soro", group: "Aspergillus" });
    }
    if (selectedAbbrs.includes("ID P. brasiliensis") || selectedAbbrs.includes("CI P. brasiliensis")) {
      rows.push({ label: "Paracoco (ID/CI)", type: "soro", group: "Paracoco" });
    }

    // Gasometria (duas linhas)
    if (selectedAbbrs.includes("GasArterial")) rows.push({ label: "Gaso art", type: "gaso", kind: "arterial" });
    if (selectedAbbrs.includes("GasVenosa")) rows.push({ label: "Gaso ven", type: "gaso", kind: "venosa" });

    return rows;
  }

  function sorologiaCellText(bucket, selectedAbbrs, groupLabel) {
    // reaproveita buildSorologiaParts e filtra pelo label
    const parts = app.buildSorologiaParts(bucket, selectedAbbrs);
    // parts vem tipo "Histoplasma ID NR / CI R (...)" etc.
    const found = parts.find(p => p.startsWith(groupLabel + " "));
    return found ? found.replace(groupLabel + " ", "") : "";
  }

  function gasoCellText(collectionKey, gasoMap, selectedAbbrs, kind) {
    if (!gasoMap || !gasoMap.has(collectionKey)) return "";
    const lista = gasoMap.get(collectionKey);

    let last = null;
    for (const g of lista) {
      if (g.tipo === kind) last = g;
    }
    if (!last) return "";

    // monta no mesmo padrão do seu buildGasometriaTextForDate, mas só um tipo por célula
    const ordemArt = ["pH", "pO2", "pCO2", "HCO3", "BE", "SO2", "Lactato"];
    const ordemVen = ["pH", "HCO3", "BE", "Lactato"];
    const ordem = (kind === "arterial") ? ordemArt : ordemVen;

    const sub = [];
    for (const k of ordem) if (last.valores && last.valores[k] != null) sub.push(`${k} ${last.valores[k]}`);
    return sub.join(" | ");
  }

  function buildAOA(raw) {
    const selectedAbbrs = app.getSelectedAbbrs();
    const exams = app.parseExams(raw);
    const gasos = app.parseGasometrias(raw);
    const gasoMap = app.buildGasometriaMap(gasos);
    const dateMap = app.buildDateMap(exams, selectedAbbrs);

    // columns
    const cols = buildColumns(dateMap, gasoMap);
    const header = ["Exame", ...cols.map(c => c.key)];

    // rows
    const rows = buildRows(selectedAbbrs);

    const aoa = [header];

    for (const r of rows) {
      const line = [r.label];

      for (const c of cols) {
        const bucket = dateMap.get(c.collectionKey) || {};
        let cell = "";

        if (r.type === "abbr") {
          if (r.abbr === "LMN") {
            const linf = parseFloat(String(bucket.LinfLiquor?.value || "").replace(",", "."));
            const mono = parseFloat(String(bucket.MonoLiquor?.value || "").replace(",", "."));
            if (Number.isFinite(linf) && Number.isFinite(mono)) {
              cell = `${(linf + mono).toString().replace(".", ",")}%`;
            } else {
              cell = "";
            }
          } else {
            let val = bucket[r.abbr]?.value ?? "";
            const isLiquorQualitative = app.liquorAbbrSet?.has(r.abbr) && !["Cel", "Hem", "Pt", "Gli", "Lac", "ADA"].includes(r.abbr);
            if (isLiquorQualitative && typeof app.formatLiquorMicroValue === "function") {
              val = app.formatLiquorMicroValue(val);
            }
            cell = val;
          }
        } else if (r.type === "soro") {
          cell = sorologiaCellText(bucket, selectedAbbrs, r.group);
        } else if (r.type === "gaso") {
          cell = gasoCellText(c.collectionKey, gasoMap, selectedAbbrs, r.kind);
        }

        line.push(cell);
      }

      aoa.push(line);
    }

    return { aoa, examsCount: exams.length, gasosCount: gasos.length };
  }

  function renderTable(aoa) {
    if (!tableContainer) return;

    const [header, ...body] = aoa;
    let html = `<table class="table"><thead><tr>`;
    for (const h of header) html += `<th>${escapeHtml(String(h))}</th>`;
    html += `</tr></thead><tbody>`;

    for (const row of body) {
      html += `<tr>`;
      for (const cell of row) html += `<td>${escapeHtml(String(cell ?? ""))}</td>`;
      html += `</tr>`;
    }

    html += `</tbody></table>`;
    tableContainer.innerHTML = html;
  }

  function exportExcel(aoa) {
    if (!window.XLSX) {
      alert("Biblioteca XLSX não carregou. Confira o script do CDN no index.html.");
      return;
    }
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Exames");

    const filename = `exames_${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  function escapeHtml(s) {
    return s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function updateTable() {
    const raw = (rawInput?.value || "").trim();
    if (!raw) {
      if (tableContainer) tableContainer.innerHTML = "";
      if (btnExportExcel) btnExportExcel.disabled = true;
      lastAOA = null;
      return;
    }

    const { aoa } = buildAOA(raw);
    lastAOA = aoa;
    renderTable(aoa);
    if (btnExportExcel) btnExportExcel.disabled = false;
  }

  // Expor updateTable para permitir sincronização reativa pelo script.js
  app.updateTable = updateTable;

  btnGenerateTable?.addEventListener("click", () => {
    updateTable();
    tableVisible = true;
    if (tableContainer) tableContainer.style.display = "block";
    if (btnToggleTable) btnToggleTable.textContent = "Ocultar tabela";
  });

  btnExportExcel?.addEventListener("click", () => {
    if (!lastAOA) return;
    exportExcel(lastAOA);
  });

  btnToggleTable?.addEventListener("click", () => {
    tableVisible = !tableVisible;

    if (tableVisible) {
      if (tableContainer) tableContainer.style.display = "block";
      if (btnToggleTable) btnToggleTable.textContent = "Ocultar tabela";
      // Se tornou visível e a tabela não foi gerada ainda, gera
      if (!lastAOA) {
        updateTable();
      }
    } else {
      if (tableContainer) tableContainer.style.display = "none";
      if (btnToggleTable) btnToggleTable.textContent = "Mostrar tabela";
    }
  });


})();
