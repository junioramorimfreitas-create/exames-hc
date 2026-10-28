(function () {
  const app = window.__EXAMES_APP__;
  if (!app) return;

  const btnToggleChart = document.getElementById("btnToggleChart");
  const chartSelectorContainer = document.getElementById("chartSelectorContainer");
  const chartExamSelector = document.getElementById("chartExamSelector");
  const chartExamSelector2 = document.getElementById("chartExamSelector2");
  const chartPeriodSelect = document.getElementById("chartPeriodSelect");
  const chartScaleMode = document.getElementById("chartScaleMode");
  const chartQuickPairsBar = document.getElementById("chartQuickPairsBar");
  const chartContainer = document.getElementById("chartContainer");

  let chartVisible = true;
  let chartInstance = null;
  let scaleMode = "category"; // "category" | "time"

  // Helper para extrair valores numéricos tratando separadores de milhar (ex: 12.400 -> 12400) e decimais (1,45 -> 1.45)
  function extractNumericValue(valStr) {
    if (valStr == null) return null;
    let clean = String(valStr)
      .replace(/^[<>*\s]+/, "")
      .trim();
    if (!clean) return null;

    // Captura o primeiro token numérico com possíveis pontos de milhar e vírgula/ponto decimal
    const tokenMatch = clean.match(/^([+-]?\d[\d.,]*)/);
    if (!tokenMatch) return null;

    let token = tokenMatch[1];

    // Caso 1: Formato brasileiro com ponto de milhar e vírgula decimal (ex: "12.400,5" ou "1.250.000")
    if (/^[+-]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(token)) {
      token = token.replace(/\./g, "").replace(",", ".");
    } else if (token.includes(",") && token.includes(".")) {
      // Se ambos aparecem, remove pontos de milhar e troca vírgula por ponto
      token = token.replace(/\./g, "").replace(",", ".");
    } else if (token.includes(",")) {
      // Apenas vírgula decimal (ex: "1,45")
      token = token.replace(",", ".");
    }

    const num = parseFloat(token);
    return Number.isFinite(num) ? num : null;
  }

  function formatPtBrNumber(num) {
    if (num == null || !Number.isFinite(num)) return "";
    if (Math.abs(num) >= 1000 && Number.isInteger(num)) {
      return num.toLocaleString("pt-BR");
    }
    return String(Number(num.toFixed(2))).replace(".", ",");
  }

  // Converte data "dd/mm/yyyy" e hora "hh:mm" em timestamp (ms)
  function parseCollectionTimestamp(dateStr, timeStr) {
    const mDate = String(dateStr || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!mDate) return null;
    const day = parseInt(mDate[1], 10);
    const month = parseInt(mDate[2], 10) - 1;
    const year = parseInt(mDate[3], 10);

    let hours = 8;
    let minutes = 0;
    const mTime = String(timeStr || "").match(/^(\d{2}):(\d{2})$/);
    if (mTime) {
      hours = parseInt(mTime[1], 10);
      minutes = parseInt(mTime[2], 10);
    }

    const dt = new Date(year, month, day, hours, minutes, 0, 0);
    const ts = dt.getTime();
    return Number.isFinite(ts) ? ts : null;
  }

  function formatTimestampLabel(ts, includeTime) {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    if (!includeTime) return `${dd}/${mm}/${yy}`;
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm} ${hh}:${min}`;
  }

  function getThemeColors() {
    const isDark = document.body.classList.contains("dark-theme");
    return {
      line1: isDark ? "#38bdf8" : "#1066cc",
      fill1: isDark ? "rgba(56, 189, 248, 0.10)" : "rgba(16, 102, 204, 0.06)",
      line2: isDark ? "#fbbf24" : "#d97706",
      fill2: isDark ? "rgba(251, 191, 36, 0.08)" : "rgba(217, 119, 6, 0.05)",
      grid: isDark ? "#222f46" : "#e2e8f0",
      text: isDark ? "#94a3b8" : "#64748b",
      tooltipBg: isDark ? "#1e293b" : "#ffffff",
      tooltipText: isDark ? "#f1f5f9" : "#0f172a",
      tooltipBorder: isDark ? "#334155" : "#cbd5e1"
    };
  }

  function getAvailableNumericExams(exams, dateMap, selectedAbbrs, gasoMap) {
    const numericAbbrs = new Set();

    for (const abbr of selectedAbbrs) {
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

    if (selectedAbbrs.includes("GasArterial") && gasoMap && gasoMap.size > 0) {
      const subkeys = ["pH", "pO2", "pCO2", "HCO3", "BE", "SO2", "Lactato"];
      for (const k of subkeys) {
        let hasVal = false;
        for (const lista of gasoMap.values()) {
          const art = lista.find((g) => g.tipo === "arterial");
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
          const ven = lista.find((g) => g.tipo === "venosa");
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

  // Extrai o valor numérico e metadados de data/hora para um exame específico em uma collectionKey
  function getExamPointForKey(examKey, collectionKey, dateMap, gasoMap) {
    if (!examKey) return null;
    const bucket = dateMap.get(collectionKey);
    const isGasoVirtual = examKey.endsWith(" (art)") || examKey.endsWith(" (ven)");

    if (isGasoVirtual) {
      const kind = examKey.endsWith(" (art)") ? "arterial" : "venosa";
      const subkey = examKey.replace(" (art)", "").replace(" (ven)", "");
      if (gasoMap && gasoMap.has(collectionKey)) {
        const lista = gasoMap.get(collectionKey);
        const last = lista.find((g) => g.tipo === kind);
        if (last && last.valores && last.valores[subkey] != null) {
          const num = extractNumericValue(last.valores[subkey]);
          if (num !== null) {
            const [datePart = "", timePart = ""] = collectionKey.split("@@");
            const date = (bucket && bucket.__date) || last.date || datePart;
            const time = (bucket && bucket.__time) || last.time || timePart;
            return {
              num,
              rawStr: String(last.valores[subkey]),
              date,
              time,
              label: app.formatDateTimeLabel(date, time),
              timestamp: parseCollectionTimestamp(date, time)
            };
          }
        }
      }
      return null;
    }

    if (bucket && bucket[examKey]) {
      const num = extractNumericValue(bucket[examKey].value);
      if (num !== null) {
        const [datePart = "", timePart = ""] = collectionKey.split("@@");
        const date = bucket.__date || datePart;
        const time = bucket.__time || timePart;
        return {
          num,
          rawStr: String(bucket[examKey].value),
          date,
          time,
          label: app.formatDateTimeLabel(date, time),
          timestamp: parseCollectionTimestamp(date, time)
        };
      }
    }
    return null;
  }

  function syncQuickPairButtons(exam1, exam2) {
    if (!chartQuickPairsBar) return;
    chartQuickPairsBar.querySelectorAll(".chart-pair-btn").forEach((btn) => {
      const [p1, p2] = (btn.dataset.pair || "").split(",");
      const isMatch = (exam1 === p1 && exam2 === p2) || (exam1 === p2 && exam2 === p1);
      btn.classList.toggle("active", isMatch);
    });
  }

  function updateChart() {
    const raw = (document.getElementById("rawInput")?.value || "").trim();
    if (!raw || !app.last) {
      if (chartSelectorContainer) chartSelectorContainer.style.display = "none";
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      if (chartContainer) {
        chartContainer.style.display = "block";
        chartContainer.innerHTML = `<div class="culture-empty-state">Cole o laudo de exames acima para visualizar o gráfico de evolução temporal automaticamente.</div>`;
      }
      return;
    }

    if (!chartVisible) return;

    const { dateMap, gasoMap, selectedAbbrs, exams } = app.last;
    const allSortedDates = app.getAllSortedDates(dateMap, gasoMap);
    const availableExams = getAvailableNumericExams(exams, dateMap, selectedAbbrs, gasoMap);

    if (availableExams.length === 0) {
      if (chartSelectorContainer) chartSelectorContainer.style.display = "none";
      if (chartContainer) {
        chartContainer.style.display = "block";
        chartContainer.innerHTML = `<div class="culture-empty-state">Nenhum exame numérico selecionado ou encontrado para plotagem.</div>`;
      }
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      return;
    }

    if (chartSelectorContainer) chartSelectorContainer.style.display = "flex";
    if (chartContainer) chartContainer.style.display = "block";

    if (!document.getElementById("evolutionChart")) {
      if (chartContainer) {
        chartContainer.innerHTML = `<canvas id="evolutionChart" style="max-height: 380px; width: 100%;"></canvas>`;
      }
    }
    const currentCanvas = document.getElementById("evolutionChart");
    if (!currentCanvas) return;

    // Atualiza dropdown 1 (Exame Principal)
    const prevSelected1 = chartExamSelector.value;
    chartExamSelector.innerHTML = "";
    availableExams.forEach((abbr) => {
      const opt = document.createElement("option");
      opt.value = abbr;
      opt.textContent = typeof app.getDisplayName === "function" ? app.getDisplayName(abbr) : abbr;
      chartExamSelector.appendChild(opt);
    });
    if (availableExams.includes(prevSelected1)) {
      chartExamSelector.value = prevSelected1;
    }

    // Atualiza dropdown 2 (Exame de Comparação)
    const prevSelected2 = chartExamSelector2 ? chartExamSelector2.value : "";
    if (chartExamSelector2) {
      chartExamSelector2.innerHTML = `<option value="">Nenhum (1 exame)</option>`;
      availableExams.forEach((abbr) => {
        const opt = document.createElement("option");
        opt.value = abbr;
        opt.textContent = typeof app.getDisplayName === "function" ? app.getDisplayName(abbr) : abbr;
        chartExamSelector2.appendChild(opt);
      });
      if (prevSelected2 && availableExams.includes(prevSelected2)) {
        chartExamSelector2.value = prevSelected2;
      }
    }

    const selectedExam1 = chartExamSelector.value;
    const selectedExam2 = chartExamSelector2 ? chartExamSelector2.value : "";
    if (!selectedExam1) return;

    syncQuickPairButtons(selectedExam1, selectedExam2);

    // Filtragem por Período (ancorada na data mais recente presente no laudo)
    const periodVal = chartPeriodSelect ? chartPeriodSelect.value : "all";
    let filteredDates = allSortedDates;

    if (periodVal !== "all") {
      const daysMap = { "3d": 3, "7d": 7, "14d": 14, "30d": 30 };
      const days = daysMap[periodVal];
      if (days) {
        let maxTs = null;
        for (const ck of allSortedDates) {
          const [dPart = "", tPart = ""] = ck.split("@@");
          const bucket = dateMap.get(ck);
          const ts = parseCollectionTimestamp((bucket && bucket.__date) || dPart, (bucket && bucket.__time) || tPart);
          if (ts !== null && (maxTs === null || ts > maxTs)) {
            maxTs = ts;
          }
        }
        if (maxTs !== null) {
          const cutoff = maxTs - days * 24 * 60 * 60 * 1000;
          filteredDates = allSortedDates.filter((ck) => {
            const [dPart = "", tPart = ""] = ck.split("@@");
            const bucket = dateMap.get(ck);
            const ts = parseCollectionTimestamp((bucket && bucket.__date) || dPart, (bucket && bucket.__time) || tPart);
            return ts !== null && ts >= cutoff;
          });
        }
      }
    }

    const display1 = typeof app.getDisplayName === "function" ? app.getDisplayName(selectedExam1) : selectedExam1;
    const display2 = selectedExam2
      ? (typeof app.getDisplayName === "function" ? app.getDisplayName(selectedExam2) : selectedExam2)
      : "";

    const colors = getThemeColors();
    const isTimeScale = scaleMode === "time";

    // Construir pontos para o modo Proporcional ao Tempo vs. Espaçamento Igual
    const series1 = [];
    const series2 = [];
    const categoryLabels = [];
    const catData1 = [];
    const catData2 = [];

    for (const ck of filteredDates) {
      const pt1 = getExamPointForKey(selectedExam1, ck, dateMap, gasoMap);
      const pt2 = selectedExam2 ? getExamPointForKey(selectedExam2, ck, dateMap, gasoMap) : null;

      if (!pt1 && !pt2) continue;

      const refPt = pt1 || pt2;
      categoryLabels.push(refPt.label);
      catData1.push(pt1 ? pt1.num : null);
      if (selectedExam2) {
        catData2.push(pt2 ? pt2.num : null);
      }

      if (pt1 && pt1.timestamp !== null) {
        series1.push({ x: pt1.timestamp, y: pt1.num, label: pt1.label });
      }
      if (pt2 && pt2.timestamp !== null) {
        series2.push({ x: pt2.timestamp, y: pt2.num, label: pt2.label });
      }
    }

    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }

    if (categoryLabels.length === 0) {
      return;
    }

    const datasets = [
      {
        label: display1,
        data: isTimeScale ? series1 : catData1,
        yAxisID: "y",
        borderColor: colors.line1,
        backgroundColor: colors.fill1,
        borderWidth: 3,
        pointBackgroundColor: colors.line1,
        pointBorderColor: colors.line1,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.2,
        spanGaps: true,
        fill: !selectedExam2
      }
    ];

    if (selectedExam2 && (isTimeScale ? series2.length > 0 : catData2.some((v) => v !== null))) {
      datasets.push({
        label: display2,
        data: isTimeScale ? series2 : catData2,
        yAxisID: "y1",
        borderColor: colors.line2,
        backgroundColor: colors.fill2,
        borderWidth: 3,
        borderDash: [6, 4],
        pointBackgroundColor: colors.line2,
        pointBorderColor: colors.line2,
        pointStyle: "rectRot",
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.2,
        spanGaps: true,
        fill: false
      });
    }

    const hasSecondAxis = datasets.length > 1;
    const allTs = [...series1.map((p) => p.x), ...series2.map((p) => p.x)];
    const spanHours = allTs.length >= 2 ? (Math.max(...allTs) - Math.min(...allTs)) / (1000 * 60 * 60) : 0;
    const showTimeOnTicks = (app.prefs && app.prefs.showTime) || (spanHours > 0 && spanHours <= 72);

    const config = {
      type: "line",
      data: isTimeScale ? { datasets } : { labels: categoryLabels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "nearest",
          intersect: false
        },
        plugins: {
          legend: {
            display: hasSecondAxis,
            position: "top",
            labels: {
              color: colors.text,
              font: {
                family: "Outfit",
                size: 12,
                weight: "600"
              }
            }
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: colors.tooltipText,
            bodyColor: colors.tooltipText,
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            padding: 10,
            callbacks: {
              title: function (context) {
                if (!context || !context.length) return "";
                const rawItem = context[0].raw;
                if (rawItem && typeof rawItem === "object" && rawItem.label) {
                  return rawItem.label;
                }
                return context[0].label || "";
              },
              label: function (context) {
                const val = context.parsed.y;
                return `${context.dataset.label}: ${formatPtBrNumber(val)}`;
              }
            }
          }
        },
        scales: {
          x: isTimeScale
            ? {
                type: "linear",
                grid: {
                  color: colors.grid,
                  drawBorder: false
                },
                ticks: {
                  color: colors.text,
                  maxTicksLimit: 10,
                  font: {
                    family: "Outfit",
                    size: 11
                  },
                  callback: function (val) {
                    return formatTimestampLabel(val, showTimeOnTicks);
                  }
                }
              }
            : {
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
            type: "linear",
            display: true,
            position: "left",
            title: {
              display: hasSecondAxis,
              text: display1,
              color: colors.line1,
              font: {
                family: "Outfit",
                size: 11,
                weight: "700"
              }
            },
            grid: {
              color: colors.grid,
              drawBorder: false
            },
            ticks: {
              color: hasSecondAxis ? colors.line1 : colors.text,
              font: {
                family: "Outfit",
                size: 11
              },
              callback: function (val) {
                return formatPtBrNumber(val);
              }
            }
          },
          ...(hasSecondAxis
            ? {
                y1: {
                  type: "linear",
                  display: true,
                  position: "right",
                  title: {
                    display: true,
                    text: display2,
                    color: colors.line2,
                    font: {
                      family: "Outfit",
                      size: 11,
                      weight: "700"
                    }
                  },
                  grid: {
                    drawOnChartArea: false
                  },
                  ticks: {
                    color: colors.line2,
                    font: {
                      family: "Outfit",
                      size: 11
                    },
                    callback: function (val) {
                      return formatPtBrNumber(val);
                    }
                  }
                }
              }
            : {})
        }
      }
    };

    if (window.Chart) {
      chartInstance = new Chart(currentCanvas, config);
    }
  }

  // Expor a função reativa
  app.updateChart = updateChart;
  app.getAvailableNumericExams = getAvailableNumericExams;
  app.extractNumericValue = extractNumericValue;

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

  chartExamSelector?.addEventListener("change", updateChart);
  chartExamSelector2?.addEventListener("change", updateChart);
  chartPeriodSelect?.addEventListener("change", updateChart);

  if (chartScaleMode) {
    chartScaleMode.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      chartScaleMode.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      scaleMode = btn.dataset.scalemode || "time";
      updateChart();
    });
  }

  if (chartQuickPairsBar) {
    chartQuickPairsBar.addEventListener("click", (e) => {
      const btn = e.target.closest(".chart-pair-btn");
      if (!btn || !app.last) return;

      const [p1, p2] = (btn.dataset.pair || "").split(",");
      const { dateMap, gasoMap, selectedAbbrs, exams } = app.last;
      const available = getAvailableNumericExams(exams, dateMap, selectedAbbrs, gasoMap);

      const has1 = available.includes(p1);
      const has2 = available.includes(p2);

      if (!has1 && !has2) {
        if (typeof app.showToast === "function") {
          app.showToast(`Nenhum dado de ${p1} ou ${p2} encontrado nos exames filtrados.`);
        }
        return;
      }

      if (has1 && has2) {
        if (chartExamSelector) chartExamSelector.value = p1;
        if (chartExamSelector2) chartExamSelector2.value = p2;
      } else if (has1) {
        if (chartExamSelector) chartExamSelector.value = p1;
        if (chartExamSelector2) chartExamSelector2.value = "";
        if (typeof app.showToast === "function") {
          app.showToast(`Exibindo apenas ${p1} (${p2} não encontrado no laudo).`);
        }
      } else {
        if (chartExamSelector) chartExamSelector.value = p2;
        if (chartExamSelector2) chartExamSelector2.value = "";
        if (typeof app.showToast === "function") {
          app.showToast(`Exibindo apenas ${p2} (${p1} não encontrado no laudo).`);
        }
      }

      updateChart();
    });
  }
})();
