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
    // para cada data, tenta usar a hora do bucket (__time) se tiver
    return orderedDates.map(date => {
      const bucket = dateMap.get(date) || {};
      const time = bucket.__time || "";
      return { date, time, key: getDateTimeKey(date, time) };
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

    // Sorologias fúngicas (agrupadas do seu jeito)
    // (coloca uma linha por grupo: Histoplasma / Aspergillus / Paracoco)
    const anySorologiaSelected = selectedAbbrs.some(a => app.sorologiaAbbrs.has(a));
    if (anySorologiaSelected) {
      rows.push({ label: "Histoplasma (ID/CI)", type: "soro", group: "Histoplasma" });
      rows.push({ label: "Aspergillus (ID/CI)", type: "soro", group: "Aspergillus" });
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

  function gasoCellText(date, gasoMap, selectedAbbrs, kind) {
    if (!gasoMap || !gasoMap.has(date)) return "";
    const lista = gasoMap.get(date);

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
        const bucket = dateMap.get(c.date) || {};
        let cell = "";

        if (r.type === "abbr") {
          cell = bucket[r.abbr]?.value ?? "";
        } else if (r.type === "soro") {
          cell = sorologiaCellText(bucket, selectedAbbrs, r.group);
        } else if (r.type === "gaso") {
          cell = gasoCellText(c.date, gasoMap, selectedAbbrs, r.kind);
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

  btnGenerateTable?.addEventListener("click", () => {
    const raw = (rawInput?.value || "").trim();
    if (!raw) {
      tableContainer.innerHTML = "";
      btnExportExcel.disabled = true;
      lastAOA = null;
      return;
    }

    const { aoa } = buildAOA(raw);
    lastAOA = aoa;
    renderTable(aoa);
    tableVisible = true;
    tableContainer.style.display = "block";
    btnToggleTable.textContent = "Ocultar tabela";
    btnExportExcel.disabled = false;
  });

  btnExportExcel?.addEventListener("click", () => {
    if (!lastAOA) return;
    exportExcel(lastAOA);
  });

btnToggleTable?.addEventListener("click", () => {
  tableVisible = !tableVisible;

  if (tableVisible) {
    tableContainer.style.display = "block";
    btnToggleTable.textContent = "Ocultar tabela";
  } else {
    tableContainer.style.display = "none";
    btnToggleTable.textContent = "Mostrar tabela";
  }
});


})();
