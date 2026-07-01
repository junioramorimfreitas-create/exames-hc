(function () {
  const app = window.__EXAMES_APP__ = window.__EXAMES_APP__ || {};

  const glycemiaInput = document.getElementById("glycemiaInput");
  const glycemiaOutput = document.getElementById("glycemiaOutput");
  const btnGenerateGlycemia = document.getElementById("btnGenerateGlycemia");
  const btnClearGlycemiaInput = document.getElementById("btnClearGlycemiaInput");
  const btnCopyGlycemia = document.getElementById("btnCopyGlycemia");
  const glycemiaStatus = document.getElementById("glycemiaStatus");
  const insulinTypeSelect = document.getElementById("insulinTypeSelect");
  const insulinDateTime = document.getElementById("insulinDateTime");
  const btnAddInsulinMarker = document.getElementById("btnAddInsulinMarker");
  const btnClearInsulinMarkers = document.getElementById("btnClearInsulinMarkers");
  const insulinMarkersList = document.getElementById("insulinMarkersList");
  const glycemiaPeriodSelect = document.getElementById("glycemiaPeriodSelect");

  let glycemiaChartInstance = null;
  app.insulinMarkers = JSON.parse(localStorage.getItem("insulinMarkers") || "[]");

  // Format date/time helper for datetime-local default
  function formatLocalISO(timestamp) {
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    return new Date(timestamp - tzOffset).toISOString().slice(0, 16);
  }

  function parseDateTimeStr(str) {
    const m = (str || "").trim().match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
    if (!m) return null;
    const day = parseInt(m[1]);
    const month = parseInt(m[2]) - 1;
    const year = parseInt(m[3]);
    const hour = parseInt(m[4]);
    const minute = parseInt(m[5]);
    const date = new Date(year, month, day, hour, minute);
    return isNaN(date.getTime()) ? null : date.getTime();
  }

  // Set default datetime to now on load
  if (insulinDateTime) {
    insulinDateTime.value = formatLocalISO(Date.now());
  }

  function parseGlycemia(inputText) {
    const lines = (inputText || "").split("\n");
    const readings = [];

    // Match 26/06/2026 17:30   149,0
    const lineRegex = /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})\s+([+-]?\d+(?:[\.,]\d+)?)/;

    for (const line of lines) {
      const match = line.match(lineRegex);
      if (match) {
        const day = match[1];
        const month = match[2];
        const year = parseInt(match[3]);
        const hour = parseInt(match[4]);
        const minute = parseInt(match[5]);
        const value = parseFloat(match[6].replace(",", "."));

        const dateObj = new Date(year, parseInt(month) - 1, parseInt(day), hour, minute);
        readings.push({
          day,
          month,
          year,
          hour,
          minute,
          value,
          timestamp: dateObj.getTime(),
          dateKey: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        });
      }
    }

    // Sort chronologically
    readings.sort((a, b) => a.timestamp - b.timestamp);
    return readings;
  }

  function formatGlycemiaOutput(readings) {
    if (readings.length === 0) return "";

    // Group by YYYY-MM-DD to allow easy sorting of days
    const dailyGroups = {};
    readings.forEach(r => {
      if (!dailyGroups[r.dateKey]) {
        dailyGroups[r.dateKey] = {
          label: `(${r.day}/${r.month})`,
          values: []
        };
      }
      dailyGroups[r.dateKey].values.push(r.value);
    });

    // Sort days in descending order (newest first)
    const sortedKeys = Object.keys(dailyGroups).sort((a, b) => b.localeCompare(a));

    const lines = ["Glicemia capilar:"];
    sortedKeys.forEach(key => {
      const group = dailyGroups[key];
      const valuesStr = group.values.map(v => String(v).replace(".", ",")).join(" - ");
      lines.push(`${group.label} ${valuesStr}`);
    });

    return lines.join("\n");
  }

  function getThemeColors() {
    const isDark = document.body.classList.contains("dark-theme");
    return {
      text: isDark ? "#b0b3b8" : "#4f5660",
      grid: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
      tooltipBg: isDark ? "#242526" : "#ffffff",
      tooltipText: isDark ? "#e4e6eb" : "#1c1e21",
      tooltipBorder: isDark ? "#3e4042" : "#e4e6eb"
    };
  }

  function updateGlycemiaStats(filteredReadings) {
    const statAbove180 = document.getElementById("statAbove180");
    const statInTarget = document.getElementById("statInTarget");
    const statBelow70 = document.getElementById("statBelow70");

    if (!statAbove180 || !statInTarget || !statBelow70) return;

    if (filteredReadings.length === 0) {
      statAbove180.textContent = "--";
      statInTarget.textContent = "--";
      statBelow70.textContent = "--";
      return;
    }

    const total = filteredReadings.length;
    const countAbove = filteredReadings.filter(r => r.value > 180).length;
    const countBelow = filteredReadings.filter(r => r.value < 70).length;
    const countTarget = filteredReadings.filter(r => r.value >= 70 && r.value <= 180).length;

    const pctAbove = ((countAbove / total) * 100).toFixed(1).replace(".", ",") + "%";
    const pctBelow = ((countBelow / total) * 100).toFixed(1).replace(".", ",") + "%";
    const pctTarget = ((countTarget / total) * 100).toFixed(1).replace(".", ",") + "%";

    statAbove180.textContent = pctAbove;
    statInTarget.textContent = pctTarget;
    statBelow70.textContent = pctBelow;
  }

  function drawGlycemiaChart(readings) {
    if (glycemiaChartInstance) {
      glycemiaChartInstance.destroy();
      glycemiaChartInstance = null;
    }

    const canvas = document.getElementById("glycemiaChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const colors = getThemeColors();

    const period = glycemiaPeriodSelect ? glycemiaPeriodSelect.value : "all";
    let filteredReadings = readings;
    let activeMarkers = app.insulinMarkers;

    if (readings.length > 0 && period !== "all") {
      const latestTime = readings[readings.length - 1].timestamp;
      let duration = 0;
      if (period === "24h") duration = 24 * 60 * 60 * 1000;
      else if (period === "3d") duration = 3 * 24 * 60 * 60 * 1000;
      else if (period === "7d") duration = 7 * 24 * 60 * 60 * 1000;
      else if (period === "14d") duration = 14 * 24 * 60 * 60 * 1000;
      else if (period === "30d") duration = 30 * 24 * 60 * 60 * 1000;

      const cutoff = latestTime - duration;
      filteredReadings = readings.filter(r => r.timestamp >= cutoff);
      activeMarkers = app.insulinMarkers.filter(m => m.timestamp >= cutoff);
    }

    updateGlycemiaStats(filteredReadings);

    const minVal = filteredReadings.length > 0 ? Math.min(...filteredReadings.map(r => r.value)) : 60;
    const minY = Math.min(60, minVal);

    const maxVal = filteredReadings.length > 0 ? Math.max(...filteredReadings.map(r => r.value)) : 350;
    const maxY = Math.max(180, maxVal + 10);

    const timeStart = filteredReadings.length > 0 ? filteredReadings[0].timestamp : Date.now() - 24 * 60 * 60 * 1000;
    const timeEnd = filteredReadings.length > 0 ? filteredReadings[filteredReadings.length - 1].timestamp : Date.now();

    const glycemiaPoints = filteredReadings.map(r => ({
      x: r.timestamp,
      y: r.value
    }));

    const limit70Data = [
      { x: timeStart, y: 70 },
      { x: timeEnd, y: 70 }
    ];

    const limit180Data = [
      { x: timeStart, y: 180 },
      { x: timeEnd, y: 180 }
    ];

    // Build datasets for insulin markers
    const insulinDatasets = {
      Ultralonga: { label: "Insulina Ultralonga", color: "#10b981", data: [] },
      NPH: { label: "Insulina NPH", color: "#6366f1", data: [] },
      Regular: { label: "Insulina Regular", color: "#f59e0b", data: [] },
      Ultrarrápida: { label: "Insulina Ultrarrápida", color: "#ef4444", data: [] }
    };

    // Populate insulin marker lines
    activeMarkers.forEach(m => {
      const set = insulinDatasets[m.type];
      if (set) {
        // Add vertical line points separated by NaN to draw discrete segments
        set.data.push({ x: m.timestamp, y: 0 });
        set.data.push({ x: m.timestamp, y: maxY });
        set.data.push({ x: NaN, y: NaN });
      }
    });

    const datasets = [
      {
        label: "Glicemia Capilar (mg/dL)",
        data: glycemiaPoints,
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        tension: 0.15,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        showLine: true
      },
      {
        label: "Limite Hipoglicemia (70 mg/dL)",
        data: limit70Data,
        borderColor: "rgba(239, 68, 68, 0.35)",
        borderWidth: 1.5,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 0,
        showLine: true,
        fill: false
      },
      {
        label: "Limite Alvo (180 mg/dL)",
        data: limit180Data,
        borderColor: "rgba(245, 158, 11, 0.35)",
        borderWidth: 1.5,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 0,
        showLine: true,
        fill: false
      }
    ];

    // Add active insulin datasets to the chart
    Object.keys(insulinDatasets).forEach(key => {
      const d = insulinDatasets[key];
      if (d.data.length > 0) {
        datasets.push({
          label: d.label,
          data: d.data,
          borderColor: d.color,
          borderWidth: 2,
          borderDash: [6, 6],
          pointRadius: 0,
          pointHoverRadius: 0,
          showLine: true,
          fill: false
        });
      }
    });

    glycemiaChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, activeElements, chart) => {
          const canvasPosition = Chart.helpers.getRelativePosition(event, chart);
          const timestamp = chart.scales.x.getValueForPixel(canvasPosition.x);

          if (timestamp && !isNaN(timestamp)) {
            const date = new Date(timestamp);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hr = String(date.getHours()).padStart(2, '0');
            const min = String(date.getMinutes()).padStart(2, '0');
            const formattedTime = `${day}/${month}/${year} ${hr}:${min}`;

            const typeChoice = prompt(
              "Escolha o tipo de insulina administrada:\n" +
              "1 - Ultralonga\n" +
              "2 - NPH\n" +
              "3 - Regular\n" +
              "4 - Ultrarrápida\n\n" +
              "Digite o número correspondente (1-4):"
            );

            if (!typeChoice) return;

            let type = "";
            const norm = typeChoice.trim().toLowerCase();
            if (norm === "1" || norm.includes("longa")) type = "Ultralonga";
            else if (norm === "2" || norm.includes("nph")) type = "NPH";
            else if (norm === "3" || norm.includes("reg")) type = "Regular";
            else if (norm === "4" || norm.includes("rap")) type = "Ultrarrápida";

            if (!type) {
              alert("Opção inválida. Marcador não adicionado.");
              return;
            }

            const timeChoice = prompt("Confirme ou edite a data/horário de aplicação:", formattedTime);
            if (!timeChoice) return;

            const finalTimestamp = parseDateTimeStr(timeChoice);
            if (!finalTimestamp) {
              alert("Formato de data/hora inválido. Use DD/MM/AAAA HH:MM");
              return;
            }

            app.insulinMarkers.push({ type, timestamp: finalTimestamp });
            localStorage.setItem("insulinMarkers", JSON.stringify(app.insulinMarkers));

            renderInsulinMarkersList();
            drawGlycemiaChart(readings);
          }
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              color: colors.text,
              font: {
                family: "Outfit",
                size: 12,
                weight: "bold"
              },
              filter: function(item) {
                return !item.text.includes("Limite");
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
                const val = context[0].parsed.x;
                const d = new Date(val);
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                const hr = String(d.getHours()).padStart(2, '0');
                const min = String(d.getMinutes()).padStart(2, '0');
                return `${day}/${month}/${year} ${hr}:${min}`;
              },
              label: function (context) {
                const label = context.dataset.label;
                if (label.includes("Insulina")) {
                  return `${label} aplicada`;
                }
                return `Glicemia: ${context.parsed.y} mg/dL`;
              }
            }
          }
        },
        scales: {
          x: {
            type: "linear",
            grid: {
              color: colors.grid,
              drawBorder: false
            },
            ticks: {
              color: colors.text,
              font: {
                family: "Outfit",
                size: 11
              },
              callback: function (val) {
                const d = new Date(val);
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const hr = String(d.getHours()).padStart(2, '0');
                const min = String(d.getMinutes()).padStart(2, '0');
                return `${day}/${month} ${hr}:${min}`;
              }
            }
          },
          y: {
            min: minY,
            max: maxY,
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
    });
  }

  function renderInsulinMarkersList() {
    if (!insulinMarkersList) return;
    insulinMarkersList.innerHTML = "";

    // Sort markers by time
    app.insulinMarkers.sort((a, b) => a.timestamp - b.timestamp);

    app.insulinMarkers.forEach((m, idx) => {
      const d = new Date(m.timestamp);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const hr = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');

      const tag = document.createElement("div");
      tag.className = "insulin-marker-tag";
      tag.innerHTML = `
        <span>${m.type} (${day}/${month} ${hr}:${min})</span>
        <button type="button" class="btn-remove-marker" data-index="${idx}" title="Remover">&times;</button>
      `;

      tag.querySelector(".btn-remove-marker").addEventListener("click", () => {
        app.insulinMarkers.splice(idx, 1);
        localStorage.setItem("insulinMarkers", JSON.stringify(app.insulinMarkers));
        renderInsulinMarkersList();
        if (app.lastGlycemiaReadings) {
          drawGlycemiaChart(app.lastGlycemiaReadings);
        }
      });

      insulinMarkersList.appendChild(tag);
    });
  }

  function handleGenerate() {
    const input = glycemiaInput.value.trim();
    if (!input) {
      glycemiaOutput.value = "";
      glycemiaStatus.textContent = "";
      if (glycemiaChartInstance) {
        glycemiaChartInstance.destroy();
        glycemiaChartInstance = null;
      }
      updateGlycemiaStats([]);
      return;
    }

    try {
      const readings = parseGlycemia(input);
      if (readings.length === 0) {
        glycemiaOutput.value = "Nenhuma glicemia válida identificada.";
        return;
      }

      const text = formatGlycemiaOutput(readings);
      glycemiaOutput.value = text;
      glycemiaStatus.textContent = "Histórico gerado!";
      glycemiaStatus.style.color = "var(--accent-color)";

      // Default datetime to latest reading timestamp
      if (readings.length > 0 && insulinDateTime) {
        const latest = readings[readings.length - 1];
        insulinDateTime.value = formatLocalISO(latest.timestamp);
      }

      drawGlycemiaChart(readings);
      app.lastGlycemiaReadings = readings;
    } catch (e) {
      console.error(e);
      glycemiaOutput.value = "Erro ao processar os dados. Verifique a formatação.";
      glycemiaStatus.textContent = "Erro!";
      glycemiaStatus.style.color = "#ef4444";
    }
  }

  // Setup UI Listeners
  btnGenerateGlycemia?.addEventListener("click", handleGenerate);

  btnClearGlycemiaInput?.addEventListener("click", () => {
    glycemiaInput.value = "";
    glycemiaOutput.value = "";
    glycemiaStatus.textContent = "";
    if (glycemiaChartInstance) {
      glycemiaChartInstance.destroy();
      glycemiaChartInstance = null;
    }
    updateGlycemiaStats([]);
    app.lastGlycemiaReadings = null;
  });

  btnCopyGlycemia?.addEventListener("click", () => {
    const text = glycemiaOutput.value;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      glycemiaStatus.textContent = "Copiado para o clipboard!";
      setTimeout(() => {
        glycemiaStatus.textContent = "Histórico gerado!";
      }, 2000);
    });
  });

  btnAddInsulinMarker?.addEventListener("click", () => {
    const type = insulinTypeSelect.value;
    const dateStr = insulinDateTime.value;
    if (!dateStr) return;

    const timestamp = new Date(dateStr).getTime();
    if (isNaN(timestamp)) return;

    app.insulinMarkers.push({ type, timestamp });
    localStorage.setItem("insulinMarkers", JSON.stringify(app.insulinMarkers));

    renderInsulinMarkersList();

    if (app.lastGlycemiaReadings) {
      drawGlycemiaChart(app.lastGlycemiaReadings);
    }
  });

  btnClearInsulinMarkers?.addEventListener("click", () => {
    app.insulinMarkers = [];
    localStorage.setItem("insulinMarkers", JSON.stringify([]));
    renderInsulinMarkersList();
    if (app.lastGlycemiaReadings) {
      drawGlycemiaChart(app.lastGlycemiaReadings);
    }
  });

  glycemiaPeriodSelect?.addEventListener("change", () => {
    if (app.lastGlycemiaReadings) {
      drawGlycemiaChart(app.lastGlycemiaReadings);
    }
  });

  // Initial load
  renderInsulinMarkersList();

  // Expose API for testing
  app.parseGlycemia = parseGlycemia;
  app.formatGlycemiaOutput = formatGlycemiaOutput;

})();
