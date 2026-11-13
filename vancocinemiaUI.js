/**
 * vancocinemiaUI.js
 * Controlador de interface da Calculadora de Vancocinemia por Duas Coletas
 * (Método Sawchuk–Zaske).
 *
 * Gerencia leitura do formulário em tempo real, invalidação imediata ao editar,
 * mensagens de validação por campo, gráfico Chart.js com área sombreada e janelas
 * de infusão, simulador de dose, casos de referência e suíte visual de testes.
 */

(function () {
  let chartInstance = null;
  let lastValidResult = null;
  let nextDoseManuallyEdited = false;
  let els = {};

  function getEngine() {
    return window.__VANCOCINEMIA_ENGINE__;
  }

  function getConfig() {
    return window.__VANCOCINEMIA_CONFIG__;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cacheElements() {
    els = {
      section: document.getElementById("vancomycinSection"),
      // Sub-abas
      btnSubtabCalc: document.getElementById("btnVancoSubtabCalc"),
      btnSubtabInfo: document.getElementById("btnVancoSubtabInfo"),
      subtabCalc: document.getElementById("vancoSubtabCalc"),
      subtabInfo: document.getElementById("vancoSubtabInfo"),

      // Grupo 1: Esquema atual
      doseMg: document.getElementById("vancoDoseMg"),
      tauHours: document.getElementById("vancoTauHours"),
      doseNumber: document.getElementById("vancoDoseNumber"),
      infusionStart: document.getElementById("vancoInfusionStart"),
      infusionEnd: document.getElementById("vancoInfusionEnd"),
      nextDosePlanned: document.getElementById("vancoNextDosePlanned"),
      btnAutoNextDose: document.getElementById("btnVancoAutoNextDose"),

      // Grupo 2: Coletas
      c1Value: document.getElementById("vancoC1Value"),
      c1Time: document.getElementById("vancoC1Time"),
      c2Value: document.getElementById("vancoC2Value"),
      c2Time: document.getElementById("vancoC2Time"),

      // Grupo 3: MIC e Regras Locais
      micMgL: document.getElementById("vancoMicMgL"),
      localRulesEnabled: document.getElementById("vancoLocalRulesEnabled"),
      doseStepMg: document.getElementById("vancoDoseStepMg"),
      minDoseAdminMg: document.getElementById("vancoMinDoseAdminMg"),
      maxDoseAdminMg: document.getElementById("vancoMaxDoseAdminMg"),
      maxDailyDoseMg: document.getElementById("vancoMaxDailyDoseMg"),

      // Botões superiores / Referências / Testes
      referenceCasesBar: document.getElementById("vancoReferenceCasesBar"),
      btnClearForm: document.getElementById("btnClearVancoForm"),
      btnRunTests: document.getElementById("btnRunVancoTests"),
      testsOutput: document.getElementById("vancoTestsOutput"),

      // Validação e avisos
      validationBanner: document.getElementById("vancoValidationBanner"),
      warningsBanner: document.getElementById("vancoWarningsBanner"),

      // Entrega 1: Exposição Atual
      currentCard: document.getElementById("vancoCurrentCard"),
      currentStatusBadge: document.getElementById("vancoCurrentStatusBadge"),
      currentAuc24Val: document.getElementById("vancoCurrentAuc24Val"),
      currentAucMicVal: document.getElementById("vancoCurrentAucMicVal"),
      currentPeakEstVal: document.getElementById("vancoCurrentPeakEstVal"),
      currentTroughEstVal: document.getElementById("vancoCurrentTroughEstVal"),

      // Entrega 2: Sugestão e Exposição Prevista
      suggestionCard: document.getElementById("vancoSuggestionCard"),
      suggestionExplanation: document.getElementById("vancoSuggestionExplanation"),
      theoreticalDoseBox: document.getElementById("vancoTheoreticalDoseBox"),
      suggestedDoseBox: document.getElementById("vancoSuggestedDoseBox"),
      predictedBlock: document.getElementById("vancoPredictedBlock"),
      predictedAuc24Val: document.getElementById("vancoPredictedAuc24Val"),
      predictedAucMicVal: document.getElementById("vancoPredictedAucMicVal"),
      predictedPeakTroughVal: document.getElementById("vancoPredictedPeakTroughVal"),
      limitationsBox: document.getElementById("vancoLimitationsBox"),
      altIntervalsBox: document.getElementById("vancoAltIntervalsBox"),

      // Simulador manual
      simDoseInput: document.getElementById("vancoSimDoseInput"),
      simTauInput: document.getElementById("vancoSimTauInput"),
      simResultBox: document.getElementById("vancoSimResultBox"),

      // Ver cálculo
      verCalculoBody: document.getElementById("vancoVerCalculoBody"),

      // Entrega 3: Gráfico
      chartCard: document.getElementById("vancoChartCard"),
      chartAreaSummary: document.getElementById("vancoChartAreaSummary"),
      chartCanvas: document.getElementById("vancoConcentrationChart"),

      // Copiar resumo
      btnCopySummary: document.getElementById("btnCopyVancoSummary")
    };
  }

  function toDateTimeLocalString(ms) {
    if (!Number.isFinite(ms)) return "";
    const d = new Date(ms);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }

  function clearFieldErrors() {
    if (!els.section) return;
    els.section.querySelectorAll(".vanco-field-error").forEach((el) => {
      el.textContent = "";
      el.style.display = "none";
    });
    els.section.querySelectorAll(".vanco-input-invalid").forEach((el) => {
      el.classList.remove("vanco-input-invalid");
    });
  }

  function showFieldErrors(fieldErrors) {
    if (!fieldErrors) return;
    const fieldToInputId = {
      doseMg: "vancoDoseMg",
      tauHours: "vancoTauHours",
      doseNumber: "vancoDoseNumber",
      infusionStart: "vancoInfusionStart",
      infusionEnd: "vancoInfusionEnd",
      nextDosePlanned: "vancoNextDosePlanned",
      c1Value: "vancoC1Value",
      c1Time: "vancoC1Time",
      c2Value: "vancoC2Value",
      c2Time: "vancoC2Time",
      micMgL: "vancoMicMgL"
    };

    Object.keys(fieldErrors).forEach((field) => {
      const msg = fieldErrors[field];
      const errEl = document.getElementById(`err_${field}`);
      if (errEl) {
        errEl.textContent = msg;
        errEl.style.display = "block";
      }
      const inputId = fieldToInputId[field];
      const inputEl = inputId ? document.getElementById(inputId) : null;
      if (inputEl) {
        inputEl.classList.add("vanco-input-invalid");
      }
    });
  }

  function readFormState() {
    return {
      input: {
        doseMg: els.doseMg?.value || "",
        tauHours: els.tauHours?.value || "",
        doseNumber: els.doseNumber?.value || "",
        steadyStateConfirmed: true,
        infusionStart: els.infusionStart?.value || "",
        infusionEnd: els.infusionEnd?.value || "",
        nextDosePlanned: els.nextDosePlanned?.value || "",
        nextDoseActual: "",
        renalStable: true,
        onRRT: false,
        recentRegimenChange: false,
        missedDose: false,
        relevantDelay: false,
        interveningInfusion: false,
        c1Value: els.c1Value?.value || "",
        c1Unit: "mg/L",
        c1Time: els.c1Time?.value || "",
        c2Value: els.c2Value?.value || "",
        c2Unit: "mg/L",
        c2Time: els.c2Time?.value || "",
        confirmSampleBeforeNextDose: true,
        micMgL: els.micMgL?.value || "",
        micMethod: "bmd",
        indicationScenario: "mrsa_serious",
        simulatedDoseMg: els.simDoseInput?.value || "",
        simulatedTauHours: els.simTauInput?.value || ""
      },
      configOverrides: {
        localDoseLimits: {
          enabled: Boolean(els.localRulesEnabled?.checked),
          doseStepMg: els.doseStepMg?.value || 250,
          minDosePerAdminMg: els.minDoseAdminMg?.value || 250,
          maxDosePerAdminMg: els.maxDoseAdminMg?.value || 2000,
          maxDailyDoseMg: els.maxDailyDoseMg?.value || 4500
        }
      }
    };
  }

  function invalidateResultsUI(errors = []) {
    lastValidResult = null;
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }

    if (els.validationBanner) {
      if (errors.length > 0) {
        const itemsHtml = errors
          .map((e) => `<li>${escapeHtml(e.message)}</li>`)
          .join("");
        els.validationBanner.innerHTML = `
          <strong>Não foi possível calcular — revise os dados informados:</strong>
          <ul style="margin: 6px 0 0 18px;">${itemsHtml}</ul>
        `;
        els.validationBanner.style.display = "block";
      } else {
        els.validationBanner.style.display = "none";
        els.validationBanner.innerHTML = "";
      }
    }

    if (els.warningsBanner) {
      els.warningsBanner.style.display = "none";
      els.warningsBanner.innerHTML = "";
    }

    if (els.currentStatusBadge) {
      els.currentStatusBadge.className = "status-badge badge-warning";
      els.currentStatusBadge.textContent = "Aguardando dados válidos";
    }
    if (els.currentAuc24Val) els.currentAuc24Val.textContent = "-- mg·h/L";
    if (els.currentAucMicVal) els.currentAucMicVal.textContent = "--";
    if (els.currentPeakEstVal) els.currentPeakEstVal.textContent = "-- mg/L";
    if (els.currentTroughEstVal) els.currentTroughEstVal.textContent = "-- mg/L";

    if (els.suggestionExplanation) {
      els.suggestionExplanation.textContent = "";
      els.suggestionExplanation.style.display = "none";
    }
    if (els.theoreticalDoseBox) els.theoreticalDoseBox.textContent = "--";
    if (els.suggestedDoseBox) els.suggestedDoseBox.textContent = "--";
    if (els.predictedBlock) els.predictedBlock.style.display = "none";
    if (els.predictedAuc24Val) els.predictedAuc24Val.textContent = "-- mg·h/L";
    if (els.predictedAucMicVal) els.predictedAucMicVal.textContent = "--";
    if (els.predictedPeakTroughVal) els.predictedPeakTroughVal.textContent = "--";
    if (els.limitationsBox) {
      els.limitationsBox.style.display = "none";
      els.limitationsBox.innerHTML = "";
    }
    if (els.altIntervalsBox) {
      els.altIntervalsBox.style.display = "none";
      els.altIntervalsBox.innerHTML = "";
    }
    if (els.simResultBox) {
      els.simResultBox.style.display = "none";
      els.simResultBox.innerHTML = "";
    }
    if (els.verCalculoBody) {
      els.verCalculoBody.innerHTML =
        "<p style='color: var(--text-secondary); margin: 0;'>Preencha todos os campos obrigatórios com valores válidos para visualizar os parâmetros farmacocinéticos e as etapas do cálculo.</p>";
    }
    if (els.chartAreaSummary) {
      els.chartAreaSummary.style.display = "none";
      els.chartAreaSummary.innerHTML = "";
    }
    if (els.btnCopySummary) {
      els.btnCopySummary.disabled = true;
    }
  }

  function renderValidResult(res) {
    const engine = getEngine();
    lastValidResult = res;
    const { pk, suggestion, curve, warnings } = res;

    if (els.validationBanner) {
      els.validationBanner.style.display = "none";
      els.validationBanner.innerHTML = "";
    }

    if (els.warningsBanner) {
      if (warnings && warnings.length > 0) {
        els.warningsBanner.innerHTML = `
          <strong>Observações da coleta / intervalo:</strong>
          <ul style="margin: 4px 0 0 18px;">${warnings
            .map((w) => `<li>${escapeHtml(w)}</li>`)
            .join("")}</ul>
        `;
        els.warningsBanner.style.display = "block";
      } else {
        els.warningsBanner.style.display = "none";
        els.warningsBanner.innerHTML = "";
      }
    }

    // 1. Card de Exposição Atual
    if (els.currentAuc24Val) {
      els.currentAuc24Val.textContent = `${engine.formatPtBr(pk.auc24, 0)} mg·h/L`;
    }
    if (els.currentAucMicVal) {
      els.currentAucMicVal.textContent = `${engine.formatPtBr(pk.aucMic, 0)}`;
    }
    if (els.currentPeakEstVal) {
      els.currentPeakEstVal.textContent = `${engine.formatPtBr(pk.cPeakEstimated, 1)} mg/L`;
    }
    if (els.currentTroughEstVal) {
      els.currentTroughEstVal.textContent = `${engine.formatPtBr(pk.cTroughEstimated, 1)} mg/L`;
    }

    if (els.currentStatusBadge) {
      if (pk.micMgL > 1) {
        els.currentStatusBadge.className = "status-badge badge-critical";
        els.currentStatusBadge.textContent = "MIC > 1 mg/L — Avaliar";
      } else if (suggestion.inTargetRange) {
        els.currentStatusBadge.className = "status-badge badge-info";
        els.currentStatusBadge.textContent = "Na faixa (400–600)";
      } else if (pk.auc24 < 400) {
        els.currentStatusBadge.className = "status-badge badge-warning";
        els.currentStatusBadge.textContent = "Abaixo da faixa (< 400)";
      } else {
        els.currentStatusBadge.className = "status-badge badge-critical";
        els.currentStatusBadge.textContent = "Acima da faixa (> 600)";
      }
    }

    // 2. Card de Sugestão e Exposição Prevista
    if (els.theoreticalDoseBox) {
      els.theoreticalDoseBox.innerHTML =
        `<strong>${engine.formatPtBr(
          suggestion.theoreticalDosePerAdminMg,
          0
        )} mg</strong> q${engine.formatPtBr(pk.tauHours, 0)}h ` +
        `<span style="color: var(--text-secondary);">(${engine.formatPtBr(
          suggestion.theoreticalDailyDoseMg,
          0
        )} mg/dia)</span>`;
    }

    if (suggestion.suggestedRegimen && suggestion.predictedExposure) {
      const reg = suggestion.suggestedRegimen;
      const pred = suggestion.predictedExposure;
      const isKeep = reg.type === "keep_current";
      if (els.suggestedDoseBox) {
        if (isKeep) {
          els.suggestedDoseBox.innerHTML =
            `Manter <strong>${engine.formatPtBr(
              reg.doseMg,
              0
            )} mg</strong> a cada ${engine.formatPtBr(reg.tauHours, 0)} h`;
        } else {
          els.suggestedDoseBox.innerHTML =
            `Ajustar para <strong>${engine.formatPtBr(
              reg.doseMg,
              0
            )} mg</strong> a cada ${engine.formatPtBr(reg.tauHours, 0)} h ` +
            `<span style="color: var(--text-secondary);">(${engine.formatPtBr(
              reg.dailyDoseMg,
              0
            )} mg/dia)</span>`;
        }
      }
      if (els.predictedBlock) {
        els.predictedBlock.style.display = isKeep ? "none" : "block";
      }
      if (els.predictedAuc24Val) {
        els.predictedAuc24Val.textContent = `${engine.formatPtBr(pred.auc24, 0)} mg·h/L`;
      }
      if (els.predictedAucMicVal) {
        els.predictedAucMicVal.textContent = `${engine.formatPtBr(pred.aucMic, 0)}`;
      }
      if (els.predictedPeakTroughVal) {
        els.predictedPeakTroughVal.textContent =
          `Pico est.: ${engine.formatPtBr(pred.cPeakEstimated, 1)} mg/L · ` +
          `Vale est.: ${engine.formatPtBr(pred.cTroughEstimated, 1)} mg/L`;
      }
      if (els.suggestionExplanation) {
        els.suggestionExplanation.textContent = "";
        els.suggestionExplanation.style.display = "none";
      }
    } else {
      if (els.suggestedDoseBox) {
        els.suggestedDoseBox.innerHTML =
          "<span style='color: var(--danger); font-weight: 600;'>Sem sugestão automática — revisão clínica necessária</span>";
      }
      if (els.predictedBlock) {
        els.predictedBlock.style.display = "none";
      }
      if (els.predictedAuc24Val) els.predictedAuc24Val.textContent = "-- mg·h/L";
      if (els.predictedAucMicVal) els.predictedAucMicVal.textContent = "--";
      if (els.predictedPeakTroughVal) els.predictedPeakTroughVal.textContent = "--";
      if (els.suggestionExplanation) {
        els.suggestionExplanation.textContent = suggestion.explanation;
        els.suggestionExplanation.style.display = suggestion.explanation ? "block" : "none";
      }
    }

    if (els.limitationsBox) {
      if (suggestion.limitations && suggestion.limitations.length > 0) {
        els.limitationsBox.innerHTML = `
          <strong>Limitações da meta / observações clínicas:</strong>
          <ul style="margin: 4px 0 0 18px;">${suggestion.limitations
            .map((l) => `<li>${escapeHtml(l)}</li>`)
            .join("")}</ul>
        `;
        els.limitationsBox.style.display = "block";
      } else {
        els.limitationsBox.style.display = "none";
        els.limitationsBox.innerHTML = "";
      }
    }

    if (els.altIntervalsBox) {
      if (suggestion.alternativeIntervalsNote) {
        els.altIntervalsBox.textContent = suggestion.alternativeIntervalsNote;
        els.altIntervalsBox.style.display = "block";
      } else {
        els.altIntervalsBox.style.display = "none";
        els.altIntervalsBox.textContent = "";
      }
    }

    // Simulação manual
    if (els.simResultBox) {
      if (suggestion.simulation) {
        const sim = suggestion.simulation;
        const badgeCls = sim.withinAuc24Range ? "badge-info" : "badge-warning";
        const badgeTxt = sim.withinAuc24Range
          ? "Dentro de 400–600 mg·h/L"
          : sim.auc24 < 400
          ? "Abaixo de 400 mg·h/L"
          : "Acima de 600 mg·h/L";
        els.simResultBox.style.display = "block";
        els.simResultBox.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:4px;">
            <strong>Simula&ccedil;&atilde;o (${engine.formatPtBr(sim.doseMg, 0)} mg q${engine.formatPtBr(
          sim.tauHours,
          0
        )}h):</strong>
            <span class="status-badge ${badgeCls}">${badgeTxt}</span>
          </div>
          <div class="vanco-sim-metrics">
            <span>AUC24 prev.: <strong>${engine.formatPtBr(sim.auc24, 0)} mg&middot;h/L</strong></span>
            <span>AUC/MIC prev.: <strong>${engine.formatPtBr(sim.aucMic, 0)}</strong></span>
            <span>C_pico est.: <strong>${engine.formatPtBr(
              sim.cPeakEstimated,
              1
            )} mg/L</strong></span>
            <span>C_vale est.: <strong>${engine.formatPtBr(
              sim.cTroughEstimated,
              1
            )} mg/L</strong></span>
          </div>
        `;
      } else {
        els.simResultBox.style.display = "none";
        els.simResultBox.innerHTML = "";
      }
    }

    // 3. Seção "Ver cálculo"
    if (els.verCalculoBody) {
      els.verCalculoBody.innerHTML = `
        <div class="vanco-pk-grid">
          <div class="vanco-pk-item">
            <span class="vanco-pk-label">1ª coleta medida (C1)</span>
            <strong>${engine.formatPtBr(pk.C1, 2)} mg/L</strong>
            <small>${escapeHtml(engine.formatDateTimePtBr(pk.t1))}</small>
          </div>
          <div class="vanco-pk-item">
            <span class="vanco-pk-label">2ª coleta medida (C2)</span>
            <strong>${engine.formatPtBr(pk.C2, 2)} mg/L</strong>
            <small>${escapeHtml(engine.formatDateTimePtBr(pk.t2))}</small>
          </div>
          <div class="vanco-pk-item">
            <span class="vanco-pk-label">C_pico extrapolada (estimativa)</span>
            <strong>${engine.formatPtBr(pk.cPeakEstimated, 2)} mg/L</strong>
            <small>Fim da infusão (${escapeHtml(engine.formatDateTimePtBr(pk.tEnd))})</small>
          </div>
          <div class="vanco-pk-item">
            <span class="vanco-pk-label">C_vale extrapolada (estimativa)</span>
            <strong>${engine.formatPtBr(pk.cTroughEstimated, 2)} mg/L</strong>
            <small>Imediatamente antes da próxima dose</small>
          </div>
          <div class="vanco-pk-item">
            <span class="vanco-pk-label">Constante de eliminação (k)</span>
            <strong>${engine.formatPtBr(pk.k, 5)} h⁻¹</strong>
            <small>ln(C1 / C2) / Δt</small>
          </div>
          <div class="vanco-pk-item">
            <span class="vanco-pk-label">Meia-vida (t1/2)</span>
            <strong>${engine.formatPtBr(pk.halfLifeHours, 2)} h</strong>
            <small>ln(2) / k</small>
          </div>
          <div class="vanco-pk-item">
            <span class="vanco-pk-label">Volume de distribuição (Vd)</span>
            <strong>${engine.formatPtBr(pk.Vd, 2)} L</strong>
            <small>Modelo 1 compartimento</small>
          </div>
          <div class="vanco-pk-item">
            <span class="vanco-pk-label">Depuração (CL)</span>
            <strong>${engine.formatPtBr(pk.CL, 3)} L/h</strong>
            <small>k × Vd</small>
          </div>
          <div class="vanco-pk-item">
            <span class="vanco-pk-label">AUC do intervalo (AUCτ)</span>
            <strong>${engine.formatPtBr(pk.aucTau, 1)} mg·h/L</strong>
            <small>D / CL (τ = ${engine.formatPtBr(pk.tauHours, 2)} h)</small>
          </div>
          <div class="vanco-pk-item">
            <span class="vanco-pk-label">AUC24 estimada</span>
            <strong>${engine.formatPtBr(pk.auc24, 1)} mg·h/L</strong>
            <small>AUCτ × 24 / τ</small>
          </div>
        </div>
        <div class="vanco-intervals-line">
          <span><strong>Intervalos usados:</strong></span>
          <span>T (infusão) = <strong>${engine.formatPtBr(pk.T, 3)} h</strong></span>
          <span>a (fim inf. → C1) = <strong>${engine.formatPtBr(pk.a, 3)} h</strong></span>
          <span>Δt (C1 → C2) = <strong>${engine.formatPtBr(pk.deltaT, 3)} h</strong></span>
          <span>b (C2 → próx. dose) = <strong>${engine.formatPtBr(pk.b, 3)} h</strong></span>
          <span>τ (prescrito) = <strong>${engine.formatPtBr(pk.tauHours, 2)} h</strong></span>
        </div>
      `;
    }

    // 4. Legenda da área do gráfico e renderização Chart.js
    if (els.chartAreaSummary) {
      if (curve.divides24h) {
        els.chartAreaSummary.style.display = "none";
        els.chartAreaSummary.innerHTML = "";
      } else {
        els.chartAreaSummary.style.display = "flex";
        els.chartAreaSummary.innerHTML = `
          <span class="vanco-area-pill">
            <strong>${escapeHtml(curve.areaLabel)}:</strong>
            ${engine.formatPtBr(curve.displayedAreaValue, 1)} mg·h/L (1 intervalo de ${engine.formatPtBr(
          pk.tauHours,
          0
        )} h)
          </span>
          <span class="vanco-area-pill vanco-area-pill-secondary">
            <strong>${escapeHtml(curve.normalized24hLabel)}:</strong>
            ${engine.formatPtBr(curve.normalized24hValue, 0)} mg·h/L
          </span>
        `;
      }
    }

    drawConcentrationChart(res);

    if (els.btnCopySummary) {
      els.btnCopySummary.disabled = false;
    }
  }

  function getThemeColors() {
    const isDark = document.body.classList.contains("dark-theme");
    return {
      isDark,
      text: isDark ? "#e2e8f0" : "#1e293b",
      textSecondary: isDark ? "#94a3b8" : "#64748b",
      grid: isDark ? "rgba(148, 163, 184, 0.14)" : "rgba(15, 23, 42, 0.08)",
      curveBorder: isDark ? "#38bdf8" : "#1066cc",
      curveFill: isDark ? "rgba(56, 189, 248, 0.20)" : "rgba(16, 102, 204, 0.16)",
      infusionBg: isDark ? "rgba(251, 191, 36, 0.14)" : "rgba(245, 158, 11, 0.13)",
      infusionBorder: isDark ? "rgba(251, 191, 36, 0.45)" : "rgba(217, 119, 6, 0.4)",
      measuredFill: isDark ? "#f43f5e" : "#dc2626",
      measuredStroke: isDark ? "#0b111e" : "#ffffff",
      tooltipBg: isDark ? "#0f172a" : "#ffffff",
      tooltipText: isDark ? "#f1f5f9" : "#1e293b",
      tooltipBorder: isDark ? "#334155" : "#cbd5e1"
    };
  }

  function drawConcentrationChart(res) {
    if (!els.chartCanvas || typeof Chart === "undefined") return;
    const engine = getEngine();
    const { pk, curve } = res;
    const colors = getThemeColors();

    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }

    const curveData = curve.points.map((pt) => ({
      x: pt.tHours,
      y: pt.concentration,
      timestamp: pt.timestamp
    }));

    const measuredData = curve.measuredPoints.map((m) => ({
      x: m.tHours,
      y: m.concentration,
      timestamp: m.timestamp,
      shortLabel: m.shortLabel,
      fullLabel: m.label
    }));

    const maxConc = Math.max(
      ...curveData.map((p) => p.y),
      ...measuredData.map((p) => p.y),
      10
    );
    const yMax = Math.ceil((maxConc * 1.18) / 5) * 5;

    // Plugin para sombrear janelas de infusão e rotular C1/C2 diretamente no gráfico
    const infusionAndLabelsPlugin = {
      id: "vancoInfusionAndLabels",
      beforeDatasetsDraw(chart) {
        const { ctx, chartArea, scales } = chart;
        if (!chartArea || !scales.x) return;
        ctx.save();
        curve.infusionWindows.forEach((win, idx) => {
          const xStart = scales.x.getPixelForValue(win.startHours);
          const xEnd = scales.x.getPixelForValue(win.endHours);
          if (xEnd <= xStart) return;
          ctx.fillStyle = colors.infusionBg;
          ctx.fillRect(
            xStart,
            chartArea.top,
            xEnd - xStart,
            chartArea.bottom - chartArea.top
          );
          ctx.strokeStyle = colors.infusionBorder;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(xEnd, chartArea.top);
          ctx.lineTo(xEnd, chartArea.bottom);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = colors.isDark ? "#fde68a" : "#92400e";
          ctx.font = "600 10px Outfit, sans-serif";
          ctx.textAlign = "center";
          const labelX = (xStart + xEnd) / 2;
          if (xEnd - xStart > 18) {
            ctx.fillText(`Infusão ${idx + 1}`, labelX, chartArea.top + 13);
          }
        });
        ctx.restore();
      },
      afterDatasetsDraw(chart) {
        const { ctx, scales } = chart;
        if (!scales.x || !scales.y) return;
        ctx.save();
        measuredData.forEach((pt, idx) => {
          const px = scales.x.getPixelForValue(pt.x);
          const py = scales.y.getPixelForValue(pt.y);
          const timeStr = engine.formatDateTimePtBr(pt.timestamp, false);
          const text = `${pt.shortLabel}: ${engine.formatPtBr(pt.y, 1)} mg/L (${timeStr})`;
          ctx.font = "700 11px Outfit, sans-serif";
          const paddingX = 6;
          const boxWidth = ctx.measureText(text).width + paddingX * 2;
          const boxHeight = 20;

          let drawX = px + 8;
          if (idx === 1 || drawX + boxWidth > chart.chartArea.right - 4) {
            drawX = px - boxWidth - 8;
          }
          let drawY = py - boxHeight - 6;
          if (drawY < chart.chartArea.top + 4) {
            drawY = py + 8;
          }

          ctx.fillStyle = colors.tooltipBg;
          ctx.strokeStyle = colors.measuredFill;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          if (typeof ctx.roundRect === "function") {
            ctx.roundRect(drawX, drawY, boxWidth, boxHeight, 5);
          } else {
            ctx.rect(drawX, drawY, boxWidth, boxHeight);
          }
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = colors.text;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(text, drawX + paddingX, drawY + boxHeight / 2);
        });
        ctx.restore();
      }
    };

    const areaLegendTitle = curve.divides24h
      ? `${curve.areaLabel} (${engine.formatPtBr(curve.displayedAreaValue, 0)} mg·h/L)`
      : `${curve.areaLabel} (${engine.formatPtBr(curve.displayedAreaValue, 1)} mg·h/L)`;

    const ctx = els.chartCanvas.getContext("2d");
    chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        datasets: [
          {
            label: `Curva estimada em equilíbrio — ${areaLegendTitle}`,
            data: curveData,
            borderColor: colors.curveBorder,
            backgroundColor: colors.curveFill,
            borderWidth: 2.5,
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: "origin",
            tension: 0,
            order: 2
          },
          {
            label: "Concentrações medidas (C1 e C2)",
            data: measuredData,
            showLine: false,
            borderColor: colors.measuredStroke,
            backgroundColor: colors.measuredFill,
            borderWidth: 2.5,
            pointRadius: 7,
            pointHoverRadius: 9,
            pointStyle: "circle",
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "nearest",
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              color: colors.text,
              font: { family: "Outfit", size: 12, weight: "600" },
              usePointStyle: true
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
              title(items) {
                if (!items.length) return "";
                const raw = items[0].raw;
                const h = engine.formatPtBr(raw.x, 2);
                const dt = engine.formatDateTimePtBr(raw.timestamp, true);
                return `t = ${h} h (${dt})`;
              },
              label(context) {
                const raw = context.raw;
                if (context.datasetIndex === 1) {
                  return `${raw.fullLabel}: ${engine.formatPtBr(raw.y, 2)} mg/L (medida real)`;
                }
                return `Concentração estimada: ${engine.formatPtBr(raw.y, 2)} mg/L`;
              }
            }
          }
        },
        scales: {
          x: {
            type: "linear",
            min: 0,
            max: curve.horizonHours,
            title: {
              display: true,
              text: `Tempo desde o início da infusão monitorada (horas) — Início em ${engine.formatDateTimePtBr(
                pk.tStart,
                true
              )}`,
              color: colors.textSecondary,
              font: { family: "Outfit", size: 12, weight: "600" }
            },
            grid: { color: colors.grid },
            ticks: {
              color: colors.text,
              stepSize: curve.horizonHours <= 24 ? 2 : 4,
              font: { family: "Outfit", size: 11 },
              callback(val) {
                const ms = pk.tStart + Number(val) * 3600000;
                return `${val}h (${engine.formatDateTimePtBr(ms, false)})`;
              }
            }
          },
          y: {
            min: 0,
            max: yMax,
            title: {
              display: true,
              text: "Concentração (mg/L)",
              color: colors.textSecondary,
              font: { family: "Outfit", size: 12, weight: "600" }
            },
            grid: { color: colors.grid },
            ticks: {
              color: colors.text,
              font: { family: "Outfit", size: 11 }
            }
          }
        }
      },
      plugins: [infusionAndLabelsPlugin]
    });
  }

  function recalculate() {
    const engine = getEngine();
    if (!engine) return;
    clearFieldErrors();

    const { input, configOverrides } = readFormState();
    const res = engine.calculateSawchukZaske(input, configOverrides);

    if (!res.valid) {
      showFieldErrors(res.fieldErrors);
      invalidateResultsUI(res.errors);
      return;
    }

    renderValidResult(res);
  }

  function switchSubtab(tabName) {
    const showInfo = tabName === "info";
    if (els.subtabCalc) els.subtabCalc.style.display = showInfo ? "none" : "block";
    if (els.subtabInfo) els.subtabInfo.style.display = showInfo ? "block" : "none";
    if (els.btnSubtabCalc) {
      els.btnSubtabCalc.classList.toggle("active", !showInfo);
      els.btnSubtabCalc.setAttribute("aria-selected", String(!showInfo));
    }
    if (els.btnSubtabInfo) {
      els.btnSubtabInfo.classList.toggle("active", showInfo);
      els.btnSubtabInfo.setAttribute("aria-selected", String(showInfo));
    }
    if (!showInfo && chartInstance) {
      chartInstance.resize();
    }
  }

  function autoUpdateNextDoseIfAllowed() {
    if (nextDoseManuallyEdited) return;
    const engine = getEngine();
    if (!engine || !els.nextDosePlanned) return;
    const tStart = engine.parseDateTime(els.infusionStart?.value);
    const tau = engine.parseNumber(els.tauHours?.value);
    if (Number.isFinite(tStart) && Number.isFinite(tau) && tau > 0) {
      els.nextDosePlanned.value = toDateTimeLocalString(tStart + tau * 3600000);
    }
  }

  function loadInputPreset(presetInput) {
    if (!presetInput) return;
    nextDoseManuallyEdited = false;
    if (els.doseMg) els.doseMg.value = presetInput.doseMg ?? "";
    if (els.tauHours) els.tauHours.value = presetInput.tauHours ?? "";
    if (els.doseNumber) els.doseNumber.value = presetInput.doseNumber ?? "";
    if (els.infusionStart) els.infusionStart.value = presetInput.infusionStart || "";
    if (els.infusionEnd) els.infusionEnd.value = presetInput.infusionEnd || "";
    if (els.nextDosePlanned) els.nextDosePlanned.value = presetInput.nextDosePlanned || "";
    if (els.c1Value) els.c1Value.value = presetInput.c1Value ?? "";
    if (els.c1Time) els.c1Time.value = presetInput.c1Time || "";
    if (els.c2Value) els.c2Value.value = presetInput.c2Value ?? "";
    if (els.c2Time) els.c2Time.value = presetInput.c2Time || "";
    if (els.micMgL) els.micMgL.value = presetInput.micMgL ?? "1";
    if (els.simDoseInput) els.simDoseInput.value = "";
    if (els.simTauInput) els.simTauInput.value = presetInput.tauHours ?? "";

    recalculate();
  }

  function clearForm() {
    nextDoseManuallyEdited = false;
    if (els.doseMg) els.doseMg.value = "";
    if (els.tauHours) els.tauHours.value = "";
    if (els.doseNumber) els.doseNumber.value = "3";
    if (els.infusionStart) els.infusionStart.value = "";
    if (els.infusionEnd) els.infusionEnd.value = "";
    if (els.nextDosePlanned) els.nextDosePlanned.value = "";
    if (els.c1Value) els.c1Value.value = "";
    if (els.c1Time) els.c1Time.value = "";
    if (els.c2Value) els.c2Value.value = "";
    if (els.c2Time) els.c2Time.value = "";
    if (els.micMgL) els.micMgL.value = "1";
    if (els.simDoseInput) els.simDoseInput.value = "";
    if (els.simTauInput) els.simTauInput.value = "";
    clearFieldErrors();
    invalidateResultsUI([]);
  }

  function populateReferenceCases() {
    const config = getConfig();
    if (!els.referenceCasesBar || !config || !Array.isArray(config.referenceCases)) return;

    els.referenceCasesBar.innerHTML = "";
    config.referenceCases.forEach((rc) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "preset-pill";
      btn.textContent = rc.label;
      btn.title = rc.description;
      btn.addEventListener("click", () => {
        els.referenceCasesBar
          .querySelectorAll(".preset-pill")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        loadInputPreset(rc.input);
        switchSubtab("calc");
      });
      els.referenceCasesBar.appendChild(btn);
    });
  }

  function buildEvolutionSummaryText() {
    if (!lastValidResult || !lastValidResult.valid) return "";
    const engine = getEngine();
    const { pk, suggestion } = lastValidResult;

    const lines = [
      `Vancocinemia (Método Sawchuk–Zaske, ${engine.formatPtBr(
        pk.doseNumber,
        0
      )}ª dose, equilíbrio):`,
      `- Esquema analisado: Vancomicina ${engine.formatPtBr(
        pk.doseMg,
        0
      )} mg IV q${engine.formatPtBr(pk.tauHours, 0)}h (infusão em ${engine.formatPtBr(
        pk.T,
        2
      )} h).`,
      `- Coletas: C1 = ${engine.formatPtBr(pk.C1, 1)} mg/L (${engine.formatDateTimePtBr(
        pk.t1
      )}) | C2 = ${engine.formatPtBr(pk.C2, 1)} mg/L (${engine.formatDateTimePtBr(pk.t2)}).`,
      `- Parâmetros estimados: k = ${engine.formatPtBr(pk.k, 4)} h⁻¹ | t1/2 = ${engine.formatPtBr(
        pk.halfLifeHours,
        1
      )} h | Vd = ${engine.formatPtBr(pk.Vd, 1)} L | CL = ${engine.formatPtBr(
        pk.CL,
        2
      )} L/h | C_pico est. = ${engine.formatPtBr(
        pk.cPeakEstimated,
        1
      )} mg/L | C_vale est. = ${engine.formatPtBr(pk.cTroughEstimated, 1)} mg/L.`,
      `- Exposição atual: AUC24 = ${engine.formatPtBr(
        pk.auc24,
        0
      )} mg·h/L | AUC24/MIC = ${engine.formatPtBr(pk.aucMic, 0)} (MIC = ${engine.formatPtBr(
        pk.micMgL,
        2
      )} mg/L).`
    ];

    if (suggestion.suggestedRegimen && suggestion.predictedExposure) {
      const reg = suggestion.suggestedRegimen;
      const pred = suggestion.predictedExposure;
      lines.push(
        `- Conduta sugerida para revisão: ${
          reg.type === "keep_current" ? "Manter" : "Ajustar para"
        } ${engine.formatPtBr(reg.doseMg, 0)} mg IV q${engine.formatPtBr(
          reg.tauHours,
          0
        )}h (AUC24 prevista = ${engine.formatPtBr(
          pred.auc24,
          0
        )} mg·h/L; AUC24/MIC prevista = ${engine.formatPtBr(pred.aucMic, 0)}).`
      );
    } else {
      lines.push(`- Conduta: ${suggestion.headline}.`);
    }
    return lines.join("\n");
  }

  function bindEvents() {
    if (!els.section) return;

    const watchedInputs = [
      els.doseMg,
      els.tauHours,
      els.doseNumber,
      els.infusionStart,
      els.infusionEnd,
      els.nextDosePlanned,
      els.c1Value,
      els.c1Time,
      els.c2Value,
      els.c2Time,
      els.micMgL,
      els.localRulesEnabled,
      els.doseStepMg,
      els.minDoseAdminMg,
      els.maxDoseAdminMg,
      els.maxDailyDoseMg,
      els.simDoseInput,
      els.simTauInput
    ];

    if (els.btnSubtabCalc) {
      els.btnSubtabCalc.addEventListener("click", () => switchSubtab("calc"));
    }
    if (els.btnSubtabInfo) {
      els.btnSubtabInfo.addEventListener("click", () => switchSubtab("info"));
    }

    if (els.nextDosePlanned) {
      els.nextDosePlanned.addEventListener("input", () => {
        nextDoseManuallyEdited = String(els.nextDosePlanned.value || "").trim() !== "";
      });
    }

    [els.infusionStart, els.tauHours].forEach((el) => {
      if (!el) return;
      el.addEventListener("input", autoUpdateNextDoseIfAllowed);
      el.addEventListener("change", autoUpdateNextDoseIfAllowed);
    });

    watchedInputs.forEach((el) => {
      if (!el) return;
      const evt = el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(evt, recalculate);
      if (evt !== "change") {
        el.addEventListener("change", recalculate);
      }
    });

    if (els.btnAutoNextDose) {
      els.btnAutoNextDose.addEventListener("click", () => {
        const engine = getEngine();
        if (!engine) return;
        const tStart = engine.parseDateTime(els.infusionStart?.value);
        const tau = engine.parseNumber(els.tauHours?.value);
        if (Number.isFinite(tStart) && Number.isFinite(tau) && tau > 0) {
          nextDoseManuallyEdited = false;
          els.nextDosePlanned.value = toDateTimeLocalString(tStart + tau * 3600000);
          recalculate();
        }
      });
    }

    if (els.btnClearForm) {
      els.btnClearForm.addEventListener("click", () => {
        els.referenceCasesBar
          ?.querySelectorAll(".preset-pill")
          .forEach((b) => b.classList.remove("active"));
        clearForm();
      });
    }

    if (els.btnCopySummary) {
      els.btnCopySummary.addEventListener("click", () => {
        const txt = buildEvolutionSummaryText();
        if (!txt || !navigator.clipboard) return;
        navigator.clipboard.writeText(txt).then(() => {
          if (window.__EXAMES_APP__ && typeof window.__EXAMES_APP__.showToast === "function") {
            window.__EXAMES_APP__.showToast("Resumo de vancocinemia copiado!");
          }
        });
      });
    }

    if (els.btnRunTests) {
      els.btnRunTests.addEventListener("click", () => {
        if (!window.__VANCOCINEMIA_TESTS__ || !els.testsOutput) return;
        const summary = window.__VANCOCINEMIA_TESTS__.runAll();
        els.testsOutput.style.display = "block";
        els.testsOutput.innerHTML = `
          <div style="font-weight: 700; margin-bottom: 6px; color: ${
            summary.failed === 0 ? "var(--success)" : "var(--danger)"
          };">
            Validação Automatizada: ${summary.passed}/${summary.total} testes aprovados (${
          summary.failed
        } falhas)
          </div>
          <pre style="margin: 0; white-space: pre-wrap; font-family: var(--font-mono); font-size: 0.78rem; line-height: 1.45;">${escapeHtml(
            summary.logs.join("\n")
          )}</pre>
        `;
      });
    }
  }

  function init() {
    cacheElements();
    if (!els.section) return;

    const config = getConfig();
    if (config && config.localDoseLimits) {
      const lim = config.localDoseLimits;
      if (els.localRulesEnabled) els.localRulesEnabled.checked = lim.enabled !== false;
      if (els.doseStepMg) els.doseStepMg.value = lim.doseStepMg;
      if (els.minDoseAdminMg) els.minDoseAdminMg.value = lim.minDosePerAdminMg;
      if (els.maxDoseAdminMg) els.maxDoseAdminMg.value = lim.maxDosePerAdminMg;
      if (els.maxDailyDoseMg) els.maxDailyDoseMg.value = lim.maxDailyDoseMg;
    }

    populateReferenceCases();
    bindEvents();

    // Carrega o Caso 1 de referência por padrão para conferência imediata
    if (config && config.referenceCases && config.referenceCases.length > 0) {
      const firstBtn = els.referenceCasesBar?.querySelector(".preset-pill");
      if (firstBtn) firstBtn.classList.add("active");
      loadInputPreset(config.referenceCases[0].input);
    } else {
      invalidateResultsUI([]);
    }

    // Integra atualização de tema (claro/escuro) com o gráfico de vancocinemia
    const app = (window.__EXAMES_APP__ = window.__EXAMES_APP__ || {});
    app.updateVancomycinChartTheme = () => {
      if (lastValidResult && lastValidResult.valid) {
        drawConcentrationChart(lastValidResult);
      }
    };
    app.clearVancomycinForm = clearForm;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
