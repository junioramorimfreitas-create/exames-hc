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

    // Cabeçalho de seção (nome do exame grande)
    if (
      /- SANGUE - ,/i.test(line) ||
      /HEMOGRAMA COMPLETO/i.test(line) ||
      /PLAQUETAS - SANGUE/i.test(line)
    ) {
      // pega o texto antes de "- SANGUE" quando existir
      const section = line.split("- SANGUE")[0].trim();
      currentSection = section || line;
      continue;
    }

    // Linhas claramente não são resultados
    if (/Resultado dos 3 últimos exames/i.test(line)) continue;
    if (/Liberado e Validado/i.test(line)) continue;
    if (/DIVISÃO DE LABORATÓRIO CENTRAL/i.test(line)) continue;
    if (/^Pedido\s*:/i.test(line)) continue;
    if (/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}$/.test(line)) continue;
    if (/Novos valores de referência/i.test(line)) continue;
    if (/Automatizado|Colorimétrico|Enzimático|Eletrodo íon seletivo|Cinético UV|IFCC/i.test(line)) continue;
    if (/Alteração nos valores de referência/i.test(line)) continue;

    // Heurística para linha de resultado:
    // - tem pelo menos 2 "blocos" separados por múltiplos espaços ou TAB
    // - segundo bloco contém número
    const parts = line.split(/\s{2,}|\t+/).filter(Boolean);
    if (parts.length >= 2) {
      const name = parts[0];
      const valueUnit = parts[1];

      if (/\d/.test(valueUnit)) {
        const m = valueUnit.match(/^([<>*]?\s*[\d.,]+)\s*(.*)$/);
        if (m) {
          const value = m[1].trim();
          const unit = m[2].trim();

          exams.push({
            date: currentDate || "",
            section: currentSection || "",
            name: name,
            value: value,
            unit: unit
          });
        }
      }
    }
  }

  return exams;
}

function renderTable(exams) {
  if (!exams.length) {
    return '<p class="empty-message">Nenhum exame reconhecido. Confira se o texto foi copiado completo do sistema.</p>';
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th style="width: 90px;">Data</th>
          <th>Exame</th>
          <th style="width: 120px;">Resultado</th>
          <th style="width: 110px;">Unidade</th>
          <th>Seção / Painel</th>
        </tr>
      </thead>
      <tbody>
  `;

  for (const ex of exams) {
    html += `
      <tr data-name="${(ex.name + " " + ex.section).toLowerCase()}">
        <td>${ex.date || "-"}</td>
        <td>${ex.name}</td>
        <td>${ex.value}</td>
        <td>${ex.unit}</td>
        <td>${ex.section}</td>
      </tr>
    `;
  }

  html += "</tbody></table>";
  return html;
}

function copyTableAsText(exams) {
  if (!exams.length) return false;
  const lines = exams.map(
    ex =>
      `(${ex.date || "-"}) ${ex.name}: ${ex.value} ${ex.unit} [${ex.section}]`
  );
  const text = lines.join("\n");
  navigator.clipboard.writeText(text).catch(() => {});
  return true;
}

// --- Eventos da interface ---

const rawInput = document.getElementById("rawInput");
const btnParse = document.getElementById("btnParse");
const btnCopyTable = document.getElementById("btnCopyTable");
const output = document.getElementById("output");
const statusEl = document.getElementById("status");
const filterInput = document.getElementById("filterInput");

let currentExams = [];

btnParse.addEventListener("click", () => {
  const raw = rawInput.value.trim();
  statusEl.textContent = "";

  if (!raw) {
    output.innerHTML = '<p class="empty-message">Cole o laudo no campo acima antes de processar.</p>';
    return;
  }

  const exams = parseExams(raw);
  currentExams = exams;

  output.innerHTML = renderTable(exams);
  if (exams.length) {
    statusEl.textContent = `Foram identificados ${exams.length} resultados.`;
  } else {
    statusEl.textContent = "Nenhum resultado reconhecido.";
  }

  filterInput.value = "";
});

btnCopyTable.addEventListener("click", () => {
  if (!currentExams.length) {
    statusEl.textContent = "Nada para copiar ainda. Organize os exames primeiro.";
    return;
  }
  const ok = copyTableAsText(currentExams);
  if (ok) {
    statusEl.textContent = "Tabela copiada para a área de transferência.";
  } else {
    statusEl.textContent = "Não foi possível copiar automaticamente.";
  }
});

filterInput.addEventListener("input", () => {
  const term = filterInput.value.trim().toLowerCase();
  const rows = output.querySelectorAll("tbody tr");
  if (!rows.length) return;
  rows.forEach(row => {
    const key = row.getAttribute("data-name") || "";
    row.style.display = !term || key.includes(term) ? "" : "none";
  });
});
