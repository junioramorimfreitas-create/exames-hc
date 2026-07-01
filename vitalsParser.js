(function () {
  const app = window.__EXAMES_APP__ = window.__EXAMES_APP__ || {};

  const vitalsInput = document.getElementById("vitalsInput");
  const vitalsOutput = document.getElementById("vitalsOutput");
  const btnGenerateVitals = document.getElementById("btnGenerateVitals");
  const btnClearVitalsInput = document.getElementById("btnClearVitalsInput");
  const btnCopyVitals = document.getElementById("btnCopyVitals");
  const vitalsStatus = document.getElementById("vitalsStatus");
  const btnToggleVitalsChart = document.getElementById("btnToggleVitalsChart");
  const vitalsChartContainer = document.getElementById("vitalsChartContainer");
  const vitalsChartControls = document.getElementById("vitalsChartControls");

  let vitalsChartInstance = null;
  let vitalsChartVisible = false;

  const keywordMap = {
    T: [/temperatura corporea/i, /temp\.\s*corp/i],
    FC: [/frequencia cardiaca/i, /frequencia de pulso/i, /frequência de pulso/i],
    FR: [/frequencia respiratoria/i, /frequência respiratória/i],
    SpO2: [/saturacao de oxigenio/i, /saturação de oxigênio/i],
    Dx: [/glicemia capilar/i],
    PAS: [/pressao arterial sistolica/i, /pressão arterial sistólica/i, /pa sistolica/i, /pa sistólica/i],
    PAD: [/pad\s*[\/\\]\s*pas/i, /pa diastolica/i, /pa diastólica/i],
    PAM: [/pressao arterial media/i, /pressão arterial média/i]
  };

  function parseFluidValue(valStr) {
    if (!valStr) return 0;
    let clean = valStr.trim();
    if (clean === "" || clean === "-") return 0;
    const parts = clean.split(",");
    if (parts.length > 2) {
      const decimal = parts.pop();
      const integer = parts.join("");
      return parseFloat(`${integer}.${decimal}`) || 0;
    } else if (parts.length === 2) {
      const integer = parts[0];
      const fraction = parts[1];
      if (fraction.length === 3) {
        return parseFloat(`${integer}${fraction}`) || 0;
      } else {
        return parseFloat(`${integer}.${fraction}`) || 0;
      }
    }
    clean = clean.replace(/\./g, "");
    return parseFloat(clean) || 0;
  }

  function getMinMax(valuesArray) {
    if (!valuesArray || valuesArray.length === 0) return "-";
    const min = Math.min(...valuesArray);
    const max = Math.max(...valuesArray);
    
    const formatNum = (n) => String(n).replace(".", ",");
    
    if (min === max) return formatNum(min);
    return `${formatNum(min)}-${formatNum(max)}`;
  }

  function distributeValues(values, targetLength = 24) {
    if (!values || values.length === 0) return new Array(targetLength).fill(null);
    const result = new Array(targetLength).fill(null);
    if (values.length === 1) {
      result[0] = values[0];
      return result;
    }
    const spacing = (targetLength - 1) / (values.length - 1);
    for (let i = 0; i < values.length; i++) {
      const targetIdx = Math.round(i * spacing);
      result[targetIdx] = values[i];
    }
    return result;
  }

  function preprocessWrappedLines(inputText) {
    const rawLines = (inputText || "").split("\n");
    const cleanLines = [];
    
    for (let i = 0; i < rawLines.length; i++) {
      let current = rawLines[i].trim();
      if (!current) continue;
      
      if (i < rawLines.length - 1) {
        const next = rawLines[i + 1].trim();
        const isCurrentWrapped = current.endsWith("-") || 
                                 /^(pressao arterial sistolica|frequencia respiratoria|pressao arterial media|temperatura corporea|saturacao de oxigenio)$/i.test(current);
        const isNextStartWithUnit = /^(mmHg|RPM|BPM|%|mg\/dL|ºC|º C|DOR|GRAUS)\b/i.test(next);
        
        if (isCurrentWrapped && isNextStartWithUnit) {
          current = current + " " + next;
          i++; // Skip next line
        }
      }
      cleanLines.push(current);
    }
    return cleanLines.join("\n");
  }

  function parseVitalsAndFluids(inputText) {
    const processedText = preprocessWrappedLines(inputText);
    const lines = processedText.split("\n");
    
    // 1. Find date
    let dateStr = "";
    const dateMatch = inputText.match(/Data de Realização do Balanço:\s*(\d{2})\/(\d{2})\/(\d{2,4})/i);
    if (dateMatch) {
      const day = dateMatch[1];
      const month = dateMatch[2];
      const year = dateMatch[3].slice(-2);
      dateStr = `(${day}/${month}/${year})`;
    } else {
      const genericDate = inputText.match(/(\d{2})\/(\d{2})\/(\d{2,4})/);
      if (genericDate) {
        dateStr = `(${genericDate[1]}/${genericDate[2]}/${genericDate[3].slice(-2)})`;
      } else {
        const d = new Date();
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = String(d.getFullYear()).slice(-2);
        dateStr = `(${day}/${month}/${year})`;
      }
    }

    // 2. Fixed hour header from 07:00 to 06:00
    const hours = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00"];

    // 3. Setup data collections for vital signs (raw sequential lists of values)
    const rawVitals = {
      T: [],
      FC: [],
      FR: [],
      SpO2: [],
      Dx: [],
      PAS: [],
      PAD: [],
      PAM: []
    };

    let gainsTotal = 0;
    let duTotal = 0;
    let ufTotal = 0;
    let otherPerdasTotal = 0;

    for (const line of lines) {
      const cleanL = line.trim();
      if (!cleanL) continue;

      let matchedParam = null;
      const isVitalsDialisePA = /di[aá]lise/i.test(cleanL) && /(pr[eé]|p[oó]s)/i.test(cleanL);

      for (const [param, regexes] of Object.entries(keywordMap)) {
        if (isVitalsDialisePA && (param === "PAS" || param === "PAD" || param === "PAM")) {
          continue;
        }
        if (regexes.some(r => r.test(cleanL))) {
          matchedParam = param;
          break;
        }
      }

      if (matchedParam) {
        const suffixRegex = /-\s*(?:ºC|BPM|RPM|%|mg\/dL|mmHg|DOR|GRAUS)\b/i;
        let valuePart = "";
        const sMatch = cleanL.match(suffixRegex);
        if (sMatch) {
          const idx = cleanL.indexOf(sMatch[0]);
          valuePart = cleanL.slice(idx + sMatch[0].length).trim();
        } else {
          let bestIdx = -1;
          const keywords = keywordMap[matchedParam];
          for (const kw of keywords) {
            const m = cleanL.match(kw);
            if (m) {
              bestIdx = cleanL.indexOf(m[0]) + m[0].length;
              break;
            }
          }
          if (bestIdx !== -1) {
            valuePart = cleanL.slice(bestIdx).trim();
          } else {
            valuePart = cleanL;
          }
        }

        // Match all numeric values in row sequentially
        const nums = valuePart.match(/([+-]?\d+(?:[\.,]\d+)?)/g) || [];
        nums.forEach(n => {
          const val = parseFloat(n.replace(",", "."));
          if (!isNaN(val)) {
            if (matchedParam === "T" && val < 34.0) {
              return;
            }
            rawVitals[matchedParam].push(val);
          }
        });
      }

      const lowerL = cleanL.toLowerCase();
      
      if (lowerL.includes("total de ganhos")) {
        const tokens = cleanL.split(/\s+/);
        const totalToken = tokens[tokens.length - 1];
        gainsTotal = parseFluidValue(totalToken);
      }

      const isDiureseRow = (lowerL.includes("diurese") || lowerL.includes("sonda vesical") || lowerL.includes("svd")) && 
                            !lowerL.includes("total") && !lowerL.includes("evolucao") && !lowerL.includes("evolução");
      if (isDiureseRow) {
        const tokens = cleanL.split(/\s+/);
        const totalToken = tokens[tokens.length - 1];
        duTotal += parseFluidValue(totalToken);
      }

      const isUFRow = (lowerL.includes("uf") || lowerL.includes("ultrafiltrado") || lowerL.includes("ultrafiltracao")) &&
                       !lowerL.includes("total") && !lowerL.includes("evolucao") && !lowerL.includes("evolução");
      if (isUFRow) {
        const tokens = cleanL.split(/\s+/);
        const totalToken = tokens[tokens.length - 1];
        ufTotal += parseFluidValue(totalToken);
      }

      const isPerdaRow = (lowerL.includes("evacuacao") || lowerL.includes("evacuação") || lowerL.includes("dreno") || lowerL.includes("vomito") || lowerL.includes("vômito") || lowerL.includes("perdas")) &&
                         !lowerL.includes("total") && !lowerL.includes("evolucao") && !lowerL.includes("evolução") && !isDiureseRow && !isUFRow;
      if (isPerdaRow) {
        const tokens = cleanL.split(/\s+/);
        const totalToken = tokens[tokens.length - 1];
        otherPerdasTotal += parseFluidValue(totalToken);
      }
    }

    // Distribute parsed raw values evenly across 24 fixed hours
    const vitalsData = {};
    for (const [key, list] of Object.entries(rawVitals)) {
      vitalsData[key] = distributeValues(list, hours.length);
    }

    return { dateStr, hours, rawVitals, vitalsData, gainsTotal, duTotal, ufTotal, otherPerdasTotal };
  }

  function formatOutput(parsed) {
    const { dateStr, rawVitals, duTotal, ufTotal, otherPerdasTotal, gainsTotal } = parsed;
    const formatFluid = (v) => String(v.toFixed(1)).replace(".0", "").replace(".", ",");

    const params = [
      `FC ${getMinMax(rawVitals.FC)}`,
      `PAS ${getMinMax(rawVitals.PAS)}`,
      `PAD ${getMinMax(rawVitals.PAD)}`,
      `PAM ${getMinMax(rawVitals.PAM)}`,
      `FR ${getMinMax(rawVitals.FR)}`,
      `SpO2 ${getMinMax(rawVitals.SpO2)}`,
      `T ${getMinMax(rawVitals.T)}`,
      `Dx ${getMinMax(rawVitals.Dx)}`,
      `DU ${formatFluid(duTotal)}ml`
    ];

    if (ufTotal > 0) {
      params.push(`UF ${formatFluid(ufTotal)}ml`);
    }

    params.push(`Outras perdas ${formatFluid(otherPerdasTotal)}ml`);
    params.push(`Perdas ${formatFluid(duTotal + ufTotal + otherPerdasTotal)}ml`);
    params.push(`BH ${formatFluid(gainsTotal - (duTotal + ufTotal + otherPerdasTotal))}ml`);

    return `${dateStr} ${params.join(" | ")}`;
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

  function getButtonState(idx) {
    const buttons = document.querySelectorAll("#vitalsChartControls .btn-toggle-dataset");
    if (buttons && buttons[idx]) {
      return !buttons[idx].classList.contains("active");
    }
    return idx >= 4; // default hide FR, SpO2, Temp, Dx
  }

  function drawChart(hours, vitalsData) {
    if (vitalsChartInstance) {
      vitalsChartInstance.destroy();
      vitalsChartInstance = null;
    }

    const canvas = document.getElementById("vitalsChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const colors = getThemeColors();

    const datasets = [
      {
        label: "FC (BPM)",
        data: vitalsData.FC,
        borderColor: "#ff4d4d",
        backgroundColor: "rgba(255, 77, 77, 0.1)",
        tension: 0.15,
        spanGaps: true,
        hidden: getButtonState(0)
      },
      {
        label: "PAS (mmHg)",
        data: vitalsData.PAS,
        borderColor: "#ff9f40",
        backgroundColor: "rgba(255, 159, 64, 0.1)",
        tension: 0.15,
        spanGaps: true,
        hidden: getButtonState(1)
      },
      {
        label: "PAD (mmHg)",
        data: vitalsData.PAD,
        borderColor: "#ffcd56",
        backgroundColor: "rgba(255, 205, 86, 0.1)",
        tension: 0.15,
        spanGaps: true,
        hidden: getButtonState(2)
      },
      {
        label: "PAM (mmHg)",
        data: vitalsData.PAM,
        borderColor: "#4bc0c0",
        backgroundColor: "rgba(75, 192, 192, 0.1)",
        tension: 0.15,
        spanGaps: true,
        hidden: getButtonState(3)
      },
      {
        label: "FR (RPM)",
        data: vitalsData.FR,
        borderColor: "#36a2eb",
        backgroundColor: "rgba(54, 162, 235, 0.1)",
        tension: 0.15,
        spanGaps: true,
        hidden: getButtonState(4)
      },
      {
        label: "SpO2 (%)",
        data: vitalsData.SpO2,
        borderColor: "#9966ff",
        backgroundColor: "rgba(153, 102, 255, 0.1)",
        tension: 0.15,
        spanGaps: true,
        hidden: getButtonState(5)
      },
      {
        label: "Temp (ºC)",
        data: vitalsData.T,
        borderColor: "#ff6384",
        backgroundColor: "rgba(255, 99, 132, 0.1)",
        tension: 0.15,
        spanGaps: true,
        hidden: getButtonState(6)
      },
      {
        label: "Dx (mg/dL)",
        data: vitalsData.Dx,
        borderColor: "#94a3b8",
        backgroundColor: "rgba(148, 163, 184, 0.1)",
        tension: 0.15,
        spanGaps: true,
        hidden: getButtonState(7)
      }
    ];

    vitalsChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: hours,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // hide default legend
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: colors.tooltipText,
            bodyColor: colors.tooltipText,
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            padding: 10,
            callbacks: {
              title: () => ""
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
    });
  }

  function setupDatasetToggleListeners() {
    const buttons = document.querySelectorAll("#vitalsChartControls .btn-toggle-dataset");
    buttons.forEach(button => {
      // Avoid duplicate event listener
      const newBtn = button.cloneNode(true);
      button.parentNode.replaceChild(newBtn, button);

      newBtn.addEventListener("click", () => {
        const idx = parseInt(newBtn.getAttribute("data-dataset-idx"));
        newBtn.classList.toggle("active");
        
        if (vitalsChartInstance) {
          const isHidden = !newBtn.classList.contains("active");
          vitalsChartInstance.setDatasetVisibility(idx, !isHidden);
          vitalsChartInstance.update();
        }
      });
    });
  }

  function handleGenerate() {
    const input = vitalsInput.value.trim();
    if (!input) {
      vitalsOutput.value = "";
      vitalsStatus.textContent = "";
      if (vitalsChartInstance) {
        vitalsChartInstance.destroy();
        vitalsChartInstance = null;
      }
      return;
    }

    try {
      const parsed = parseVitalsAndFluids(input);
      const text = formatOutput(parsed);
      vitalsOutput.value = text;
      vitalsStatus.textContent = "Controles gerados!";
      vitalsStatus.style.color = "var(--accent-color)";

      if (vitalsChartVisible) {
        drawChart(parsed.hours, parsed.vitalsData);
      }

      app.lastVitals = parsed;
    } catch (e) {
      console.error(e);
      vitalsOutput.value = "Erro ao processar os dados. Verifique a formatação.";
      vitalsStatus.textContent = "Erro!";
      vitalsStatus.style.color = "#ef4444";
    }
  }

  // Setup UI Listeners
  btnGenerateVitals?.addEventListener("click", handleGenerate);

  btnClearVitalsInput?.addEventListener("click", () => {
    vitalsInput.value = "";
    vitalsOutput.value = "";
    vitalsStatus.textContent = "";
    if (vitalsChartInstance) {
      vitalsChartInstance.destroy();
      vitalsChartInstance = null;
    }
    app.lastVitals = null;
  });

  btnCopyVitals?.addEventListener("click", () => {
    const text = vitalsOutput.value;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      vitalsStatus.textContent = "Copiado para o clipboard!";
      setTimeout(() => {
        vitalsStatus.textContent = "Controles gerados!";
      }, 2000);
    });
  });

  btnToggleVitalsChart?.addEventListener("click", () => {
    vitalsChartVisible = !vitalsChartVisible;
    if (vitalsChartVisible) {
      vitalsChartContainer.style.display = "block";
      if (vitalsChartControls) vitalsChartControls.style.display = "flex";
      btnToggleVitalsChart.textContent = "Ocultar gráfico de sinais vitais";
      setupDatasetToggleListeners();

      if (app.lastVitals) {
        drawChart(app.lastVitals.hours, app.lastVitals.vitalsData);
      } else {
        handleGenerate();
      }
    } else {
      vitalsChartContainer.style.display = "none";
      if (vitalsChartControls) vitalsChartControls.style.display = "none";
      btnToggleVitalsChart.textContent = "Mostrar gráfico de sinais vitais";
      if (vitalsChartInstance) {
        vitalsChartInstance.destroy();
        vitalsChartInstance = null;
      }
    }
  });

  // Expose API for testing
  app.parseVitalsAndFluids = parseVitalsAndFluids;
  app.formatVitalsOutput = formatOutput;

})();
