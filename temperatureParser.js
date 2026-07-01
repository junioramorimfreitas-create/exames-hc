(function () {
  const app = window.__EXAMES_APP__ = window.__EXAMES_APP__ || {};

  const temperatureInput = document.getElementById("temperatureInput");
  const temperatureOutput = document.getElementById("temperatureOutput");
  const btnGenerateTemperature = document.getElementById("btnGenerateTemperature");
  const btnClearTemperatureInput = document.getElementById("btnClearTemperatureInput");
  const btnCopyTemperature = document.getElementById("btnCopyTemperature");
  const temperatureStatus = document.getElementById("temperatureStatus");
  const antibioticNameInput = document.getElementById("antibioticNameInput");
  const antibioticStartDateTime = document.getElementById("antibioticStartDateTime");
  const btnAddAntibioticStartMarker = document.getElementById("btnAddAntibioticStartMarker");
  const btnClearAntibioticStartMarkers = document.getElementById("btnClearAntibioticStartMarkers");
  const antibioticStartMarkersList = document.getElementById("antibioticStartMarkersList");
  const temperaturePeriodSelect = document.getElementById("temperaturePeriodSelect");

  let temperatureChartInstance = null;
  app.antibioticStartMarkers = JSON.parse(localStorage.getItem("antibioticStartMarkers") || "[]");

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
  if (antibioticStartDateTime) {
    antibioticStartDateTime.value = formatLocalISO(Date.now());
  }

  function parseTemperature(inputText) {
    const lines = (inputText || "").split("\n");
    const readings = [];

    // Match "01/07/2026 13:57\tsinal_menos 35,0"
    // or "01/07/2026 13:57\t35,0"
    const lineRegex = /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})\s+(?:[a-zA-Z0-9_]+\s+)?([+-]?\d+(?:[\.,]\d+)?)/;

    for (const line of lines) {
      const match = line.match(lineRegex);
      if (match) {
        const day = match[1];
        const month = match[2];
        const year = parseInt(match[3]);
        const hour = parseInt(match[4]);
        const minute = parseInt(match[5]);
        const value = parseFloat(match[6].replace(",", "."));

        // Ignore values strictly less than 34
        if (value >= 34.0) {
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
    }

    // Sort chronologically
    readings.sort((a, b) => a.timestamp - b.timestamp);
    return readings;
  }

  function formatFeverOutput(readings) {
    const feverReadings = readings.filter(r => r.value >= 37.7);
    if (feverReadings.length === 0) return "Nenhuma febre registrada (T >= 37,7 °C).";

    // Group by YYYY-MM-DD to allow easy sorting of days
    const dailyGroups = {};
    feverReadings.forEach(r => {
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

    const lines = ["Febre:"];
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

  function drawTemperatureChart(readings) {
    if (temperatureChartInstance) {
      temperatureChartInstance.destroy();
      temperatureChartInstance = null;
    }

    const canvas = document.getElementById("temperatureChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const colors = getThemeColors();

    const period = temperaturePeriodSelect ? temperaturePeriodSelect.value : "all";
    let filteredReadings = readings;
    let activeMarkers = app.antibioticStartMarkers;

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
      activeMarkers = app.antibioticStartMarkers.filter(m => m.timestamp >= cutoff);
    }

    const temperaturePoints = filteredReadings.map(r => ({
      x: r.timestamp,
      y: r.value
    }));

    // Y Axis limits: Min: 34.0. Max: Max registered temperature
    const minY = 34.0;
    const maxVal = filteredReadings.length > 0 ? Math.max(...filteredReadings.map(r => r.value)) : 37.0;
    const maxY = Math.max(38.5, maxVal + 0.2); // Ensure it goes to at least 38.5 so guideline is clear

    const timeStart = filteredReadings.length > 0 ? filteredReadings[0].timestamp : Date.now() - 24 * 60 * 60 * 1000;
    const timeEnd = filteredReadings.length > 0 ? filteredReadings[filteredReadings.length - 1].timestamp : Date.now();

    const limit377Data = [
      { x: timeStart, y: 37.7 },
      { x: timeEnd, y: 37.7 }
    ];

    const datasets = [
      {
        label: "Temperatura Corporal (°C)",
        data: temperaturePoints,
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.15,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        showLine: true
      },
      {
        label: "Limite Febre (37,7 °C)",
        data: limit377Data,
        borderColor: "rgba(239, 68, 68, 0.4)",
        borderWidth: 1.5,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 0,
        showLine: true,
        fill: false
      }
    ];

    // Build vertical dashed lines for each active antibiotic start marker
    const antibioticDatasets = {};
    activeMarkers.forEach((m, idx) => {
      const label = `Início de ${m.name}`;
      if (!antibioticDatasets[label]) {
        // Unique color for each antibiotic dataset dynamically using preset colors
        const colorsPreset = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];
        const color = colorsPreset[Object.keys(antibioticDatasets).length % colorsPreset.length];
        
        antibioticDatasets[label] = {
          label: label,
          color: color,
          data: []
        };
      }
      
      const set = antibioticDatasets[label];
      set.data.push({ x: m.timestamp, y: minY });
      set.data.push({ x: m.timestamp, y: maxY });
      set.data.push({ x: NaN, y: NaN });
    });

    Object.keys(antibioticDatasets).forEach(key => {
      const d = antibioticDatasets[key];
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
    });

    temperatureChartInstance = new Chart(ctx, {
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

            const nameChoice = prompt("Digite o nome do antibiótico iniciado:");
            if (!nameChoice || !nameChoice.trim()) return;

            const timeChoice = prompt("Confirme ou edite a data/horário de início:", formattedTime);
            if (!timeChoice) return;

            const finalTimestamp = parseDateTimeStr(timeChoice);
            if (!finalTimestamp) {
              alert("Formato de data/hora inválido. Use DD/MM/AAAA HH:MM");
              return;
            }

            app.antibioticStartMarkers.push({ name: nameChoice.trim(), timestamp: finalTimestamp });
            localStorage.setItem("antibioticStartMarkers", JSON.stringify(app.antibioticStartMarkers));

            renderAntibioticStartMarkersList();
            drawTemperatureChart(readings);
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
              filter: function (item) {
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
                if (label.includes("Início de")) {
                  return `${label}`;
                }
                return `Temperatura: ${context.parsed.y} °C`;
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

  function renderAntibioticStartMarkersList() {
    if (!antibioticStartMarkersList) return;
    antibioticStartMarkersList.innerHTML = "";

    // Sort markers by time
    app.antibioticStartMarkers.sort((a, b) => a.timestamp - b.timestamp);

    app.antibioticStartMarkers.forEach((m, idx) => {
      const d = new Date(m.timestamp);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const hr = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');

      const tag = document.createElement("div");
      tag.className = "antibiotic-marker-tag";
      tag.innerHTML = `
        <span>Início de ${m.name} (${day}/${month} ${hr}:${min})</span>
        <button type="button" class="btn-remove-marker" data-index="${idx}" title="Remover">&times;</button>
      `;

      tag.querySelector(".btn-remove-marker").addEventListener("click", () => {
        app.antibioticStartMarkers.splice(idx, 1);
        localStorage.setItem("antibioticStartMarkers", JSON.stringify(app.antibioticStartMarkers));
        renderAntibioticStartMarkersList();
        if (app.lastTemperatureReadings) {
          drawTemperatureChart(app.lastTemperatureReadings);
        }
      });

      antibioticStartMarkersList.appendChild(tag);
    });
  }

  function handleGenerate() {
    const input = temperatureInput.value.trim();
    if (!input) {
      temperatureOutput.value = "";
      temperatureStatus.textContent = "";
      if (temperatureChartInstance) {
        temperatureChartInstance.destroy();
        temperatureChartInstance = null;
      }
      app.lastTemperatureReadings = null;
      return;
    }

    try {
      const readings = parseTemperature(input);
      if (readings.length === 0) {
        temperatureOutput.value = "Nenhuma temperatura válida identificada (T >= 34,0).";
        return;
      }

      const text = formatFeverOutput(readings);
      temperatureOutput.value = text;
      temperatureStatus.textContent = "Histórico gerado!";
      temperatureStatus.style.color = "var(--accent-color)";

      // Default datetime to latest reading timestamp
      if (readings.length > 0 && antibioticStartDateTime) {
        const latest = readings[readings.length - 1];
        antibioticStartDateTime.value = formatLocalISO(latest.timestamp);
      }

      drawTemperatureChart(readings);
      app.lastTemperatureReadings = readings;
    } catch (e) {
      console.error(e);
      temperatureOutput.value = "Erro ao processar os dados. Verifique a formatação.";
      temperatureStatus.textContent = "Erro!";
      temperatureStatus.style.color = "#ef4444";
    }
  }

  // Setup UI Listeners
  btnGenerateTemperature?.addEventListener("click", handleGenerate);

  btnClearTemperatureInput?.addEventListener("click", () => {
    temperatureInput.value = "";
    temperatureOutput.value = "";
    temperatureStatus.textContent = "";
    if (temperatureChartInstance) {
      temperatureChartInstance.destroy();
      temperatureChartInstance = null;
    }
    app.lastTemperatureReadings = null;
  });

  btnCopyTemperature?.addEventListener("click", () => {
    const text = temperatureOutput.value;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      temperatureStatus.textContent = "Copiado para o clipboard!";
      setTimeout(() => {
        temperatureStatus.textContent = "Histórico gerado!";
      }, 2000);
    });
  });

  btnAddAntibioticStartMarker?.addEventListener("click", () => {
    const name = antibioticNameInput.value.trim();
    const dateStr = antibioticStartDateTime.value;
    if (!name || !dateStr) return;

    const timestamp = new Date(dateStr).getTime();
    if (isNaN(timestamp)) return;

    app.antibioticStartMarkers.push({ name, timestamp });
    localStorage.setItem("antibioticStartMarkers", JSON.stringify(app.antibioticStartMarkers));

    renderAntibioticStartMarkersList();

    if (app.lastTemperatureReadings) {
      drawTemperatureChart(app.lastTemperatureReadings);
    }
    
    // Clear name input for convenient next entry
    antibioticNameInput.value = "";
  });

  btnClearAntibioticStartMarkers?.addEventListener("click", () => {
    app.antibioticStartMarkers = [];
    localStorage.setItem("antibioticStartMarkers", JSON.stringify([]));
    renderAntibioticStartMarkersList();
    if (app.lastTemperatureReadings) {
      drawTemperatureChart(app.lastTemperatureReadings);
    }
  });

  temperaturePeriodSelect?.addEventListener("change", () => {
    if (app.lastTemperatureReadings) {
      drawTemperatureChart(app.lastTemperatureReadings);
    }
  });

  // Initial load
  renderAntibioticStartMarkersList();

  // Expose API for testing
  app.parseTemperature = parseTemperature;
  app.formatFeverOutput = formatFeverOutput;

})();
