(function () {
  const app = window.__EXAMES_APP__;
  if (!app) return;

  const btnToggleChart = document.getElementById("btnToggleChart");
  const chartSelectorContainer = document.getElementById("chartSelectorContainer");
  const chartExamSelector = document.getElementById("chartExamSelector");
  const chartContainer = document.getElementById("chartContainer");
  const ctx = document.getElementById("evolutionChart");

  let chartVisible = false;
  let chartInstance = null;

  // Helper para extrair valores numéricos (normalizando vírgula para ponto)
  function extractNumericValue(valStr) {
    if (!valStr) return null;
    const clean = valStr.replace(",", ".").trim();
    // Encontrar primeiro número inteiro ou float na string
    const m = clean.match(/^([+-]?\d+(?:\.\d+)?)/);
    if (m) {
      const num = parseFloat(m[1]);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  function getThemeColors() {
    const isDark = document.body.classList.contains("dark-theme");
    return {
      line: isDark ? "#38bdf8" : "#1066cc",
      fill: isDark ? "rgba(56, 189, 248, 0.08)" : "rgba(16, 102, 204, 0.04)",
      grid: isDark ? "#222f46" : "#e2e8f0",
      text: isDark ? "#94a3b8" : "#64748b",
      tooltipBg: isDark ? "#1e293b" : "#ffffff",
      tooltipText: isDark ? "#f1f5f9" : "#0f172a",
      tooltipBorder: isDark ? "#334155" : "#cbd5e1"
    };
  }

  function getAvailableNumericExams(exams, dateMap, selectedAbbrs, gasoMap) {
    // Apenas exames que possuam pelo menos um valor numérico válido
    const numericAbbrs = new Set();
    
    // Varre todos os exames selecionados
    for (const abbr of selectedAbbrs) {
      // Ignora sorologias agrupadas e gasometrias que não têm mapeamento simples em dateMap
      if (app.sorologiaAbbrs.has(abbr)) continue;
      if (abbr === "GasArterial" || abbr === "GasVenosa") continue;

      let hasNumeric = false;
      for (const bucket of dateMap.values()) {
        if (bucket[abbr]) {
          const num = extractNumericValue(bucket[abbr].value);
          if (num !== null) {
            hasNumeric = true;
            break;
          }
        }
      }
      if (hasNumeric) {
        numericAbbrs.add(abbr);
      }
    }

    // Adiciona exames de gasometria se estiverem selecionados e existirem dados
    if (selectedAbbrs.includes("GasArterial") && gasoMap && gasoMap.size > 0) {
      const subkeys = ["pH", "pO2", "pCO2", "HCO3", "BE", "SO2", "Lactato"];
      for (const k of subkeys) {
        let hasVal = false;
        for (const lista of gasoMap.values()) {
          const art = lista.find(g => g.tipo === "arterial");
          if (art && art.valores && art.valores[k] != null) {
            if (extractNumericValue(art.valores[k]) !== null) {
              hasVal = true;
              break;
            }
          }
        }
        if (hasVal) {
          numericAbbrs.add(`${k} (art)`);
        }
      }
    }

    if (selectedAbbrs.includes("GasVenosa") && gasoMap && gasoMap.size > 0) {
      const subkeys = ["pH", "HCO3", "BE", "Lactato"];
      for (const k of subkeys) {
        let hasVal = false;
        for (const lista of gasoMap.values()) {
          const ven = lista.find(g => g.tipo === "venosa");
          if (ven && ven.valores && ven.valores[k] != null) {
            if (extractNumericValue(ven.valores[k]) !== null) {
              hasVal = true;
              break;
            }
          }
        }
        if (hasVal) {
          numericAbbrs.add(`${k} (ven)`);
        }
      }
    }

    return Array.from(numericAbbrs);
  }

  function updateChart() {
    const raw = (document.getElementById("rawInput")?.value || "").trim();
    if (!raw || !app.last) {
      if (chartSelectorContainer) chartSelectorContainer.style.display = "none";
      if (chartContainer) chartContainer.style.display = "none";
      if (btnToggleChart) btnToggleChart.textContent = "Mostrar gráfico";
      chartVisible = false;
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      return;
    }

    if (!chartVisible) return;

    const { dateMap, gasoMap, selectedAbbrs, exams } = app.last;
    const sortedDates = app.getAllSortedDates(dateMap, gasoMap);
    const availableExams = getAvailableNumericExams(exams, dateMap, selectedAbbrs, gasoMap);

    if (availableExams.length === 0) {
      if (chartSelectorContainer) chartSelectorContainer.style.display = "none";
      if (chartContainer) {
        chartContainer.innerHTML = `<p style="text-align: center; color: var(--text-secondary); margin: 20px 0;">Nenhum exame numérico selecionado ou encontrado para plotagem.</p>`;
      }
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      return;
    }

    // Se o canvas original foi removido por mensagem de erro, restaura ele
    if (!document.getElementById("evolutionChart")) {
      if (chartContainer) {
        chartContainer.innerHTML = `<canvas id="evolutionChart" style="max-height: 350px; width: 100%;"></canvas>`;
      }
    }
    const currentCanvas = document.getElementById("evolutionChart");
    if (!currentCanvas) return;

    // Atualiza o select dropdown
    const currentSelected = chartExamSelector.value;
    chartExamSelector.innerHTML = "";
    availableExams.forEach(abbr => {
      const opt = document.createElement("option");
      opt.value = abbr;
      opt.textContent = abbr;
      chartExamSelector.appendChild(opt);
    });

    // Mantém a seleção anterior se ainda disponível
    if (availableExams.includes(currentSelected)) {
      chartExamSelector.value = currentSelected;
    }

    const selectedExam = chartExamSelector.value;
    if (!selectedExam) return;

    // Compila os pontos do gráfico (data e valor)
    const labels = [];
    const dataPoints = [];

    const isGasoVirtual = selectedExam.endsWith(" (art)") || selectedExam.endsWith(" (ven)");

    for (const collectionKey of sortedDates) {
      const bucket = dateMap.get(collectionKey);

      if (isGasoVirtual) {
        const kind = selectedExam.endsWith(" (art)") ? "arterial" : "venosa";
        const subkey = selectedExam.replace(" (art)", "").replace(" (ven)", "");

        if (gasoMap && gasoMap.has(collectionKey)) {
          const lista = gasoMap.get(collectionKey);
          const last = lista.find(g => g.tipo === kind);
          if (last && last.valores && last.valores[subkey] != null) {
            const num = extractNumericValue(last.valores[subkey]);
            if (num !== null) {
              const [datePart = "", timePart = ""] = collectionKey.split("@@");
              const date = (bucket && bucket.__date) || last.date || datePart;
              const time = (bucket && bucket.__time) || last.time || timePart;
              const formattedLabel = app.formatDateTimeLabel(date, time);
              labels.push(formattedLabel);
              dataPoints.push(num);
            }
          }
        }
      } else {
        if (bucket && bucket[selectedExam]) {
          const num = extractNumericValue(bucket[selectedExam].value);
          if (num !== null) {
            const [datePart = "", timePart = ""] = collectionKey.split("@@");
            const date = bucket.__date || datePart;
            const time = bucket.__time || timePart;
            const formattedLabel = app.formatDateTimeLabel(date, time);
            labels.push(formattedLabel);
            dataPoints.push(num);
          }
        }
      }
    }

    if (dataPoints.length === 0) {
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      return;
    }

    const colors = getThemeColors();

    const chartData = {
      labels: labels,
      datasets: [
        {
          label: selectedExam,
          data: dataPoints,
          borderColor: colors.line,
          backgroundColor: colors.fill,
          borderWidth: 3,
          pointBackgroundColor: colors.line,
          pointBorderColor: colors.line,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.2,
          fill: true
        }
      ]
    };

    const config = {
      type: "line",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: colors.tooltipText,
            bodyColor: colors.tooltipText,
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            padding: 10,
            displayColors: false,
            callbacks: {
              label: function (context) {
                return `${context.dataset.label}: ${context.raw}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: colors.grid,
              drawBorder: false
            },
            ticks: {
              color: colors.text,
              font: {
                family: "Outfit",
                size: 11
              }
            }
          },
          y: {
            grid: {
              color: colors.grid,
              drawBorder: false
            },
            ticks: {
              color: colors.text,
              font: {
                family: "Outfit",
                size: 11
              }
            }
          }
        }
      }
    };

    if (chartInstance) {
      // Atualiza gráfico existente
      chartInstance.data.labels = labels;
      chartInstance.data.datasets[0].label = selectedExam;
      chartInstance.data.datasets[0].data = dataPoints;
      chartInstance.data.datasets[0].borderColor = colors.line;
      chartInstance.data.datasets[0].backgroundColor = colors.fill;
      chartInstance.data.datasets[0].pointBackgroundColor = colors.line;
      chartInstance.data.datasets[0].pointBorderColor = colors.line;
      
      chartInstance.options.scales.x.grid.color = colors.grid;
      chartInstance.options.scales.y.grid.color = colors.grid;
      chartInstance.options.scales.x.ticks.color = colors.text;
      chartInstance.options.scales.y.ticks.color = colors.text;
      chartInstance.options.plugins.tooltip.backgroundColor = colors.tooltipBg;
      chartInstance.options.plugins.tooltip.titleColor = colors.tooltipText;
      chartInstance.options.plugins.tooltip.bodyColor = colors.tooltipText;
      chartInstance.options.plugins.tooltip.borderColor = colors.tooltipBorder;

      chartInstance.update();
    } else {
      // Cria nova instância
      if (window.Chart) {
        chartInstance = new Chart(currentCanvas, config);
      }
    }
  }

  // Expor a função reativa
  app.updateChart = updateChart;
  app.getAvailableNumericExams = getAvailableNumericExams;

  // Listeners
  btnToggleChart?.addEventListener("click", () => {
    chartVisible = !chartVisible;

    if (chartVisible) {
      if (chartContainer) chartContainer.style.display = "block";
      if (chartSelectorContainer) chartSelectorContainer.style.display = "flex";
      if (btnToggleChart) btnToggleChart.textContent = "Ocultar gráfico";
      updateChart();
    } else {
      if (chartContainer) chartContainer.style.display = "none";
      if (chartSelectorContainer) chartSelectorContainer.style.display = "none";
      if (btnToggleChart) btnToggleChart.textContent = "Mostrar gráfico";
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
    }
  });

  chartExamSelector?.addEventListener("change", () => {
    updateChart();
  });

})();
