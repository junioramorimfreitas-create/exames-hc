/**
 * vancocinemiaEngine.js
 * Motor farmacocinético puro e independente da interface para cálculo de
 * vancocinemia por duas coletas (método de Sawchuk–Zaske, modelo de 1 compartimento,
 * infusão IV intermitente e eliminação de primeira ordem).
 *
 * Unidades internas padronizadas:
 * - Tempo: horas (h)
 * - Dose: miligramas (mg)
 * - Volume de distribuição (Vd): litros (L)
 * - Concentração: mg/L (numericamente equivalente a µg/mL)
 * - Depuração (CL): L/h
 * - AUC: mg·h/L
 *
 * Mantém precisão completa em ponto flutuante internamente; o arredondamento
 * ocorre apenas na camada de apresentação.
 */

(function (globalScope) {
  function getDefaultConfig() {
    if (globalScope && globalScope.__VANCOCINEMIA_CONFIG__) {
      return globalScope.__VANCOCINEMIA_CONFIG__;
    }
    if (typeof require === "function") {
      try {
        return require("./vancocinemiaConfig.js");
      } catch (e) {
        // fallback abaixo
      }
    }
    return {
      targets: { auc24Min: 400, auc24Max: 600, auc24Target: 500, referenceMic: 1.0 },
      localDoseLimits: {
        enabled: true,
        doseStepMg: 250,
        minDosePerAdminMg: 250,
        maxDosePerAdminMg: 2000,
        maxDailyDoseMg: 4500,
        allowedIntervalsHours: [8, 12, 24, 36, 48],
        intervalDiscrepancyToleranceHours: 0.5
      }
    };
  }

  /**
   * Converte entrada numérica aceitando ponto ou vírgula decimal.
   */
  function parseNumber(val) {
    if (val === null || val === undefined || typeof val === "boolean") return NaN;
    if (typeof val === "number") return Number.isFinite(val) ? val : NaN;
    const raw = String(val).trim();
    if (!raw) return NaN;
    // Remove espaços internos e separador de milhar apenas se houver vírgula decimal explícita
    let normalized = raw.replace(/\s+/g, "");
    if (normalized.includes(",") && normalized.includes(".")) {
      // Ex: "1.000,5" -> "1000.5"
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = normalized.replace(",", ".");
    }
    if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(normalized)) return NaN;
    const num = Number(normalized);
    return Number.isFinite(num) ? num : NaN;
  }

  /**
   * Converte string/Date/número em timestamp em milissegundos (horário local).
   * Aceita:
   * - Timestamp numérico (ms)
   * - Objeto Date
   * - ISO / datetime-local: "YYYY-MM-DDTHH:mm" ou "YYYY-MM-DD HH:mm(:ss)"
   * - Padrão BR: "DD/MM/YYYY HH:mm(:ss)"
   */
  function parseDateTime(val) {
    if (val === null || val === undefined || val === "") return NaN;
    if (typeof val === "number") return Number.isFinite(val) ? val : NaN;
    if (val instanceof Date) {
      const ms = val.getTime();
      return Number.isFinite(ms) ? ms : NaN;
    }

    const str = String(val).trim();
    if (!str) return NaN;

    // Formato ISO local sem fuso: YYYY-MM-DDTHH:mm[:ss] ou YYYY-MM-DD HH:mm[:ss]
    const isoMatch = str.match(
      /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?$/
    );
    if (isoMatch) {
      const year = Number(isoMatch[1]);
      const month = Number(isoMatch[2]) - 1;
      const day = Number(isoMatch[3]);
      const hour = Number(isoMatch[4]);
      const min = Number(isoMatch[5]);
      const sec = Number(isoMatch[6] || 0);
      const dt = new Date(year, month, day, hour, min, sec, 0);
      if (
        dt.getFullYear() === year &&
        dt.getMonth() === month &&
        dt.getDate() === day &&
        dt.getHours() === hour &&
        dt.getMinutes() === min
      ) {
        return dt.getTime();
      }
      return NaN;
    }

    // Formato BR: DD/MM/YYYY HH:mm[:ss]
    const brMatch = str.match(
      /^(\d{2})\/(\d{2})\/(\d{4})[T\s](\d{2}):(\d{2})(?::(\d{2}))?$/
    );
    if (brMatch) {
      const day = Number(brMatch[1]);
      const month = Number(brMatch[2]) - 1;
      const year = Number(brMatch[3]);
      const hour = Number(brMatch[4]);
      const min = Number(brMatch[5]);
      const sec = Number(brMatch[6] || 0);
      const dt = new Date(year, month, day, hour, min, sec, 0);
      if (
        dt.getFullYear() === year &&
        dt.getMonth() === month &&
        dt.getDate() === day &&
        dt.getHours() === hour &&
        dt.getMinutes() === min
      ) {
        return dt.getTime();
      }
      return NaN;
    }

    // Fallback nativo para ISO com Z / offset explícito
    const parsed = Date.parse(str);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  /**
   * Formata número no padrão pt-BR com precisão visual configurável.
   */
  function formatPtBr(num, decimals = 2) {
    if (num === null || num === undefined || !Number.isFinite(num)) return "--";
    return num.toLocaleString("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  /**
   * Formata timestamp (ms) para "DD/MM HH:mm" ou "HH:mm".
   */
  function formatDateTimePtBr(ms, includeDate = true) {
    if (!Number.isFinite(ms)) return "--";
    const d = new Date(ms);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return includeDate ? `${dd}/${mm} ${hh}:${mi}` : `${hh}:${mi}`;
  }

  /**
   * Normaliza concentração para mg/L.
   * mg/L e µg/mL são numericamente equivalentes (1 mg/L = 1 µg/mL).
   */
  function normalizeConcentration(value, unit = "mg/L") {
    const num = parseNumber(value);
    const cleanUnit = String(unit || "mg/L").trim().toLowerCase();
    const supported = ["mg/l", "µg/ml", "ug/ml", "mcg/ml"];
    if (!supported.includes(cleanUnit)) {
      return { valid: false, error: `Unidade de concentração não suportada: ${unit}` };
    }
    if (!Number.isFinite(num) || num <= 0) {
      return { valid: false, error: "A concentração deve ser um número finito e maior que zero." };
    }
    return { valid: true, valueMgL: num, canonicalUnit: "mg/L" };
  }

  function mergeLimits(configOverrides) {
    const base = getDefaultConfig();
    const baseLimits = base.localDoseLimits || {};
    const overrideLimits =
      (configOverrides && configOverrides.localDoseLimits) || configOverrides || {};
    return {
      enabled:
        overrideLimits.enabled !== undefined
          ? Boolean(overrideLimits.enabled)
          : baseLimits.enabled !== false,
      doseStepMg:
        parseNumber(overrideLimits.doseStepMg) > 0
          ? parseNumber(overrideLimits.doseStepMg)
          : baseLimits.doseStepMg || 250,
      minDosePerAdminMg:
        parseNumber(overrideLimits.minDosePerAdminMg) > 0
          ? parseNumber(overrideLimits.minDosePerAdminMg)
          : baseLimits.minDosePerAdminMg || 250,
      maxDosePerAdminMg:
        parseNumber(overrideLimits.maxDosePerAdminMg) > 0
          ? parseNumber(overrideLimits.maxDosePerAdminMg)
          : baseLimits.maxDosePerAdminMg || 2000,
      maxDailyDoseMg:
        parseNumber(overrideLimits.maxDailyDoseMg) > 0
          ? parseNumber(overrideLimits.maxDailyDoseMg)
          : baseLimits.maxDailyDoseMg || 4500,
      allowedIntervalsHours: Array.isArray(overrideLimits.allowedIntervalsHours)
        ? overrideLimits.allowedIntervalsHours
        : baseLimits.allowedIntervalsHours || [8, 12, 24, 36, 48],
      intervalDiscrepancyToleranceHours:
        parseNumber(overrideLimits.intervalDiscrepancyToleranceHours) > 0
          ? parseNumber(overrideLimits.intervalDiscrepancyToleranceHours)
          : baseLimits.intervalDiscrepancyToleranceHours || 0.5
    };
  }

  /**
   * Calcula pico e vale previstos em equilíbrio para uma dose e intervalo candidatos,
   * mantendo CL, k e Vd constantes sob hipótese de depuração estável.
   */
  function predictSteadyStateForRegimen(doseMg, tauHours, T, k, CL) {
    const expKT = Math.exp(-k * T);
    const expKTau = Math.exp(-k * tauHours);
    const denom = CL * (1 - expKTau);
    const cPeakSteady =
      denom > 0 && Number.isFinite(denom)
        ? ((doseMg / T) * (1 - expKT)) / denom
        : NaN;
    const cTroughSteady = Number.isFinite(cPeakSteady)
      ? cPeakSteady * Math.exp(-k * (tauHours - T))
      : NaN;
    const aucTau = doseMg / CL;
    const auc24 = aucTau * (24 / tauHours);
    return {
      doseMg,
      tauHours,
      dailyDoseMg: doseMg * (24 / tauHours),
      aucTau,
      auc24,
      cPeakEstimated: cPeakSteady,
      cTroughEstimated: cTroughSteady
    };
  }

  /**
   * Sugere dose de manutenção e calcula exposições previstas.
   */
  function calculateMaintenanceSuggestion(pk, options = {}) {
    const config = getDefaultConfig();
    const targets = config.targets || {
      auc24Min: 400,
      auc24Max: 600,
      auc24Target: 500
    };
    const limits = mergeLimits(options.localDoseLimits || options);

    const mic = pk.micMgL;
    const micMethod = pk.micMethod || "bmd";
    const indicationScenario = pk.indicationScenario || "mrsa_serious";
    const CL = pk.CL;
    const k = pk.k;
    const T = pk.T;
    const tau = pk.tauHours;
    const currentDose = pk.doseMg;
    const auc24 = pk.auc24;
    const aucMic = pk.aucMic;

    // Dose teórica para alvo de 500 mg·h/L mantendo o intervalo atual
    const theoreticalDailyDoseMg = targets.auc24Target * CL;
    const theoreticalDosePerAdminMg = theoreticalDailyDoseMg * (tau / 24);

    const limitations = [];
    if (indicationScenario !== "mrsa_serious") {
      limitations.push(
        "Indicação fora do cenário de referência (infecção grave por MRSA): a faixa-alvo de AUC24/MIC 400–600 foi validada principalmente para infecções invasivas por MRSA."
      );
    }
    if (micMethod === "other") {
      limitations.push(
        "Método de determinação da MIC distinto da microdiluição em caldo (BMD): métodos automatizados ou fitas de gradiente podem divergir da BMD; interprete a razão AUC24/MIC com cautela."
      );
    }

    const result = {
      targetRange: { min: targets.auc24Min, max: targets.auc24Max, point: targets.auc24Target },
      localLimits: limits,
      inTargetRange: auc24 >= targets.auc24Min && auc24 <= targets.auc24Max,
      statusCode: "within_target",
      headline: "",
      explanation: "",
      limitations,
      theoreticalDailyDoseMg,
      theoreticalDosePerAdminMg,
      suggestedRegimen: null,
      predictedExposure: null,
      alternativeIntervalsNote: null,
      simulation: null
    };

    // Caso especial: MIC > 1 mg/L
    if (mic > 1) {
      result.statusCode = "mic_gt_1_clinical_review";
      result.headline = "Encaminhar para avaliação clínica (MIC > 1 mg/L)";
      result.explanation =
        `MIC informada de ${formatPtBr(mic, 2)} mg/L (> 1 mg/L). A razão AUC24/MIC estimada do esquema atual é ${formatPtBr(aucMic, 0)}. ` +
        "Não é gerada sugestão automática de escalonamento visando AUC24/MIC 400–600 (o que exigiria AUC24 de 800–1.200 mg·h/L para MIC 2 mg/L), " +
        "pois aumentar a dose apenas para alcançar a razão eleva de forma importante o risco de nefrotoxicidade. Avalie alternativas terapêuticas ou discussão com Infectologia/Farmácia Clínica.";
    } else if (mic < 1) {
      // Caso especial: MIC < 1 mg/L — evitar redução proporcional baseada apenas na razão
      if (result.inTargetRange) {
        result.statusCode = "within_target_mic_lt_1";
        result.headline = "Esquema atual dentro da faixa-alvo (AUC24 400–600 mg·h/L)";
        result.explanation =
          `Para MIC < 1 mg/L (${formatPtBr(mic, 2)} mg/L), a razão AUC24/MIC está em ${formatPtBr(aucMic, 0)}. ` +
          "Evita-se sugerir redução proporcional da dose baseada apenas na razão AUC24/MIC quando MIC < 1 mg/L; recomenda-se manter a exposição sistêmica (AUC24) na faixa de 400–600 mg·h/L.";
        const pred = predictSteadyStateForRegimen(currentDose, tau, T, k, CL);
        result.suggestedRegimen = {
          type: "keep_current",
          doseMg: currentDose,
          tauHours: tau,
          dailyDoseMg: pred.dailyDoseMg
        };
        result.predictedExposure = {
          auc24: pred.auc24,
          aucMic: pred.auc24 / mic,
          aucTau: pred.aucTau,
          cPeakEstimated: pred.cPeakEstimated,
          cTroughEstimated: pred.cTroughEstimated
        };
      } else {
        result.limitations.push(
          `MIC de ${formatPtBr(mic, 2)} mg/L (< 1 mg/L): o ajuste abaixo utiliza como referência a faixa de exposição sistêmica AUC24 400–600 mg·h/L (ponto de cálculo 500 mg·h/L), evitando subexposição por redução proporcional baseada apenas na razão.`
        );
      }
    }

    // Seleção padrão baseada na faixa AUC24 400–600 quando MIC <= 1 e ainda não finalizado
    if (mic <= 1 && !result.suggestedRegimen) {
      if (result.inTargetRange) {
        result.statusCode = "within_target";
        result.headline = "Esquema atual dentro da faixa-alvo";
        result.explanation =
          `Manter o esquema atual de ${formatPtBr(currentDose, 0)} mg a cada ${formatPtBr(tau, 0)} h ` +
          `(AUC24 estimada: ${formatPtBr(auc24, 0)} mg·h/L; faixa-alvo: 400–600 mg·h/L).`;
        const pred = predictSteadyStateForRegimen(currentDose, tau, T, k, CL);
        result.suggestedRegimen = {
          type: "keep_current",
          doseMg: currentDose,
          tauHours: tau,
          dailyDoseMg: pred.dailyDoseMg
        };
        result.predictedExposure = {
          auc24: pred.auc24,
          aucMic: pred.auc24 / mic,
          aucTau: pred.aucTau,
          cPeakEstimated: pred.cPeakEstimated,
          cTroughEstimated: pred.cTroughEstimated
        };
      } else if (!limits.enabled) {
        result.statusCode = "theoretical_only";
        result.headline =
          auc24 < targets.auc24Min
            ? "Exposição atual abaixo da faixa-alvo (< 400 mg·h/L)"
            : "Exposição atual acima da faixa-alvo (> 600 mg·h/L)";
        result.explanation =
          "Regras locais de arredondamento e limites do serviço estão desativadas. " +
          `Dose teórica para AUC24 de 500 mg·h/L: ${formatPtBr(theoreticalDosePerAdminMg, 0)} mg a cada ${formatPtBr(tau, 0)} h ` +
          `(${formatPtBr(theoreticalDailyDoseMg, 0)} mg/24 h). Utilize o simulador abaixo para testar uma dose administrável disponível.`;
      } else {
        // Buscar doses administráveis permitidas mantendo o intervalo atual τ
        const step = limits.doseStepMg;
        const candidates = [];
        for (
          let d = limits.minDosePerAdminMg;
          d <= limits.maxDosePerAdminMg + 1e-9;
          d += step
        ) {
          const roundedD = Math.round(d * 1000) / 1000;
          const daily = roundedD * (24 / tau);
          if (daily > limits.maxDailyDoseMg + 1e-9) continue;
          const pred = predictSteadyStateForRegimen(roundedD, tau, T, k, CL);
          if (pred.auc24 >= targets.auc24Min && pred.auc24 <= targets.auc24Max) {
            candidates.push({
              doseMg: roundedD,
              tauHours: tau,
              pred,
              distTo500: Math.abs(pred.auc24 - targets.auc24Target)
            });
          }
        }

        if (candidates.length > 0) {
          candidates.sort((a, b) => a.distTo500 - b.distTo500);
          const best = candidates[0];
          result.statusCode =
            auc24 < targets.auc24Min ? "adjust_increase" : "adjust_decrease";
          result.headline =
            auc24 < targets.auc24Min
              ? "Esquema atual abaixo da faixa-alvo — Sugestão de ajuste para revisão clínica"
              : "Esquema atual acima da faixa-alvo — Sugestão de redução para revisão clínica";
          result.explanation =
            `Dose teórica para alvo de 500 mg·h/L: ${formatPtBr(theoreticalDosePerAdminMg, 0)} mg a cada ${formatPtBr(tau, 0)} h. ` +
            `Considerando incremento de ${formatPtBr(step, 0)} mg, teto de ${formatPtBr(limits.maxDosePerAdminMg, 0)} mg/dose e ${formatPtBr(limits.maxDailyDoseMg, 0)} mg/dia, ` +
            `a dose administrável mais próxima de 500 mg·h/L é ${formatPtBr(best.doseMg, 0)} mg a cada ${formatPtBr(tau, 0)} h.`;
          result.suggestedRegimen = {
            type: "adjusted_same_interval",
            doseMg: best.doseMg,
            tauHours: tau,
            dailyDoseMg: best.pred.dailyDoseMg
          };
          result.predictedExposure = {
            auc24: best.pred.auc24,
            aucMic: best.pred.auc24 / mic,
            aucTau: best.pred.aucTau,
            cPeakEstimated: best.pred.cPeakEstimated,
            cTroughEstimated: best.pred.cTroughEstimated
          };
        } else {
          result.statusCode = "no_allowed_option";
          result.headline =
            "Nenhuma dose permitida no intervalo atual atende à faixa-alvo (400–600 mg·h/L)";
          result.explanation =
            `A dose teórica no intervalo de ${formatPtBr(tau, 0)} h seria ${formatPtBr(theoreticalDosePerAdminMg, 0)} mg (${formatPtBr(theoreticalDailyDoseMg, 0)} mg/dia), ` +
            `porém nenhuma dose múltipla de ${formatPtBr(step, 0)} mg dentro dos limites locais (${formatPtBr(limits.minDosePerAdminMg, 0)}–${formatPtBr(limits.maxDosePerAdminMg, 0)} mg/dose e ≤ ${formatPtBr(limits.maxDailyDoseMg, 0)} mg/dia) produz AUC24 prevista entre 400 e 600 mg·h/L mantendo τ = ${formatPtBr(tau, 0)} h.`;

          // Verificar intervalos alternativos configurados apenas como informação clínica
          const altOptions = [];
          for (const altTau of limits.allowedIntervalsHours) {
            if (altTau === tau || altTau <= T) continue;
            for (
              let d = limits.minDosePerAdminMg;
              d <= limits.maxDosePerAdminMg + 1e-9;
              d += step
            ) {
              const roundedD = Math.round(d * 1000) / 1000;
              const daily = roundedD * (24 / altTau);
              if (daily > limits.maxDailyDoseMg + 1e-9) continue;
              const pred = predictSteadyStateForRegimen(roundedD, altTau, T, k, CL);
              if (pred.auc24 >= targets.auc24Min && pred.auc24 <= targets.auc24Max) {
                altOptions.push({
                  doseMg: roundedD,
                  tauHours: altTau,
                  auc24: pred.auc24,
                  distTo500: Math.abs(pred.auc24 - targets.auc24Target)
                });
              }
            }
          }
          if (altOptions.length > 0) {
            altOptions.sort((a, b) => a.distTo500 - b.distTo500);
            const topAlt = altOptions[0];
            result.alternativeIntervalsNote =
              `Para avaliação clínica, alterando o intervalo para ${formatPtBr(topAlt.tauHours, 0)} h, o esquema ${formatPtBr(topAlt.doseMg, 0)} mg q${formatPtBr(topAlt.tauHours, 0)}h teria AUC24 prevista de ${formatPtBr(topAlt.auc24, 0)} mg·h/L.`;
          }
        }
      }
    }

    // Simulação manual de dose informada pelo profissional
    const simDose = parseNumber(options.simulatedDoseMg);
    const simTau = parseNumber(options.simulatedTauHours);
    const effectiveSimTau = Number.isFinite(simTau) && simTau > 0 ? simTau : tau;
    if (Number.isFinite(simDose) && simDose > 0 && effectiveSimTau > T) {
      const simPred = predictSteadyStateForRegimen(
        simDose,
        effectiveSimTau,
        T,
        k,
        CL
      );
      result.simulation = {
        doseMg: simDose,
        tauHours: effectiveSimTau,
        dailyDoseMg: simPred.dailyDoseMg,
        auc24: simPred.auc24,
        aucMic: simPred.auc24 / mic,
        aucTau: simPred.aucTau,
        cPeakEstimated: simPred.cPeakEstimated,
        cTroughEstimated: simPred.cTroughEstimated,
        withinAuc24Range:
          simPred.auc24 >= targets.auc24Min && simPred.auc24 <= targets.auc24Max
      };
    }

    return result;
  }

  /**
   * Executa a validação completa e o cálculo farmacocinético de Sawchuk–Zaske.
   */
  function calculateSawchukZaske(rawInput, configOverrides = {}) {
    const input = rawInput || {};
    const config = getDefaultConfig();
    const limits = mergeLimits(configOverrides.localDoseLimits || configOverrides);

    const errors = [];
    const fieldErrors = {};
    const warnings = [];

    function addError(field, message) {
      errors.push({ field, message });
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = message;
      }
    }

    // 1. Verificações de escopo e premissas de equilíbrio
    const renalStable =
      input.unstableRenal === true
        ? false
        : input.renalStable === undefined
        ? true
        : Boolean(input.renalStable);
    const onRRT = Boolean(input.onRRT);
    const steadyStateConfirmed =
      input.steadyStateConfirmed === undefined ? true : Boolean(input.steadyStateConfirmed);
    const recentRegimenChange = Boolean(input.recentRegimenChange);
    const missedDose = Boolean(input.missedDose);
    const relevantDelay = Boolean(input.relevantDelay);
    const interveningInfusion = Boolean(input.interveningInfusion);

    if (!renalStable) {
      addError(
        "renalStable",
        "Função renal instável: o método de Sawchuk–Zaske em estado de equilíbrio não se aplica quando a depuração renal está variando rapidamente."
      );
    }
    if (onRRT) {
      addError(
        "onRRT",
        "Paciente em terapia renal substitutiva (TRS): fora do escopo desta primeira versão."
      );
    }
    if (!steadyStateConfirmed) {
      addError(
        "steadyStateConfirmed",
        "As premissas de estado de equilíbrio não foram confirmadas segundo o protocolo do serviço."
      );
    }
    if (interveningInfusion) {
      addError(
        "interveningInfusion",
        "Houve outra infusão entre as coletas: uma dose intermediária inviabiliza o cálculo de eliminação monoexponencial neste intervalo."
      );
    }
    if (recentRegimenChange) {
      addError(
        "recentRegimenChange",
        "Houve mudança recente de esquema antes do equilíbrio: as premissas de estado de equilíbrio não se aplicam."
      );
    }
    if (missedDose) {
      addError(
        "missedDose",
        "Houve dose omitida antes das coletas: o intervalo não representa estado de equilíbrio regular."
      );
    }
    if (relevantDelay) {
      addError(
        "relevantDelay",
        "Houve atraso relevante no esquema: revise os horários reais ou aguarde novo equilíbrio antes de aplicar a fórmula em estado de equilíbrio."
      );
    }

    // 2. Entradas numéricas principais
    const D = parseNumber(input.doseMg);
    const tau = parseNumber(input.tauHours);
    const doseNumberRaw =
      input.doseNumber === undefined || input.doseNumber === ""
        ? 3
        : parseNumber(input.doseNumber);
    const micRaw =
      input.micMgL === undefined || input.micMgL === "" ? 1 : parseNumber(input.micMgL);

    if (!Number.isFinite(D) || D <= 0) {
      addError("doseMg", "A dose por administração (mg) deve ser um número finito e maior que zero.");
    }
    if (!Number.isFinite(tau) || tau <= 0) {
      addError("tauHours", "O intervalo entre inícios das doses (τ, em horas) deve ser positivo.");
    }
    if (!Number.isFinite(doseNumberRaw) || doseNumberRaw < 1) {
      addError("doseNumber", "O número da dose monitorada deve ser um inteiro positivo (≥ 1).");
    }
    if (!Number.isFinite(micRaw) || micRaw <= 0) {
      addError("micMgL", "A MIC (mg/L) deve ser um número finito e maior que zero.");
    }

    // Concentrações C1 e C2
    const c1Parsed = normalizeConcentration(input.c1Value, input.c1Unit || "mg/L");
    if (!c1Parsed.valid) {
      addError(
        "c1Value",
        `1ª coleta (C1): ${c1Parsed.error}`
      );
    }
    const c2Parsed = normalizeConcentration(input.c2Value, input.c2Unit || "mg/L");
    if (!c2Parsed.valid) {
      addError(
        "c2Value",
        `2ª coleta (C2): ${c2Parsed.error}`
      );
    }

    if (c1Parsed.valid && c2Parsed.valid && c2Parsed.valueMgL >= c1Parsed.valueMgL) {
      addError(
        "c2Value",
        "A 2ª coleta (C2) deve ser estritamente menor que a 1ª coleta (C1 > C2 > 0) para estimar eliminação de primeira ordem."
      );
    }

    // 3. Datas e horários
    const tStart = parseDateTime(input.infusionStart);
    const tEnd = parseDateTime(input.infusionEnd);
    const t1 = parseDateTime(input.c1Time);
    const t2 = parseDateTime(input.c2Time);

    const hasNextPlanned =
      input.nextDosePlanned !== undefined &&
      input.nextDosePlanned !== null &&
      String(input.nextDosePlanned).trim() !== "";
    const hasNextActual =
      input.nextDoseActual !== undefined &&
      input.nextDoseActual !== null &&
      String(input.nextDoseActual).trim() !== "";

    const tNextPlanned = hasNextPlanned ? parseDateTime(input.nextDosePlanned) : NaN;
    const tNextActual = hasNextActual ? parseDateTime(input.nextDoseActual) : NaN;

    if (!Number.isFinite(tStart)) {
      addError("infusionStart", "Informe data e hora válidas do início da infusão monitorada.");
    }
    if (!Number.isFinite(tEnd)) {
      addError("infusionEnd", "Informe data e hora válidas do fim da infusão monitorada.");
    }
    if (hasNextPlanned && !Number.isFinite(tNextPlanned)) {
      addError("nextDosePlanned", "Horário previsto para a próxima dose inválido.");
    }
    if (hasNextActual && !Number.isFinite(tNextActual)) {
      addError("nextDoseActual", "Horário real confirmado da próxima dose inválido.");
    }
    if (!Number.isFinite(t1)) {
      addError("c1Time", "Informe data e hora válidas da 1ª coleta.");
    }
    if (!Number.isFinite(t2)) {
      addError("c2Time", "Informe data e hora válidas da 2ª coleta.");
    }

    let T = NaN;
    let tNextRef = NaN;
    let tauObserved = NaN;
    let a = NaN;
    let deltaT = NaN;
    let b = NaN;

    if (Number.isFinite(tStart) && Number.isFinite(tEnd)) {
      T = (tEnd - tStart) / 3600000;
      if (T <= 0) {
        addError("infusionEnd", "O fim da infusão deve ser posterior ao início da infusão (T > 0).");
      } else if (Number.isFinite(tau) && T >= tau) {
        addError(
          "infusionEnd",
          `A duração da infusão (T = ${formatPtBr(T, 2)} h) deve ser menor que o intervalo entre doses (τ = ${formatPtBr(tau, 2)} h).`
        );
      }
    }

    if (Number.isFinite(tStart) && Number.isFinite(tau)) {
      const expectedNextFromTau = tStart + tau * 3600000;
      if (hasNextActual && Number.isFinite(tNextActual)) {
        tNextRef = tNextActual;
      } else if (hasNextPlanned && Number.isFinite(tNextPlanned)) {
        tNextRef = tNextPlanned;
      } else {
        tNextRef = expectedNextFromTau;
      }

      tauObserved = (tNextRef - tStart) / 3600000;
      if (tauObserved <= 0) {
        addError(
          hasNextActual ? "nextDoseActual" : "nextDosePlanned",
          "O horário da próxima dose deve ser posterior ao início da infusão monitorada."
        );
      } else {
        const diffTau = Math.abs(tauObserved - tau);
        if (diffTau > limits.intervalDiscrepancyToleranceHours) {
          addError(
            hasNextActual ? "nextDoseActual" : "nextDosePlanned",
            `Discrepância relevante entre o intervalo informado (τ = ${formatPtBr(tau, 2)} h) e a administração seguinte (${formatPtBr(tauObserved, 2)} h). Revise os horários ou o intervalo.`
          );
        } else if (diffTau > 0.01) {
          warnings.push(
            `Pequena diferença de ${formatPtBr(diffTau * 60, 0)} min entre o intervalo prescrito (${formatPtBr(tau, 2)} h) e o horário da próxima dose (${formatPtBr(tauObserved, 2)} h).`
          );
        }

        if (
          hasNextPlanned &&
          Number.isFinite(tNextPlanned) &&
          Math.abs((tNextPlanned - tStart) / 3600000 - tau) > limits.intervalDiscrepancyToleranceHours
        ) {
          addError(
            "nextDosePlanned",
            "O horário previsto para a próxima dose diverge do início da infusão + τ informado. Revise os dados."
          );
        }
      }
    }

    // Validação cronológica das coletas
    if (Number.isFinite(tStart) && Number.isFinite(tEnd) && Number.isFinite(t1)) {
      if (t1 < tStart) {
        addError("c1Time", "A 1ª coleta foi registrada antes do início da infusão monitorada.");
      } else if (t1 <= tEnd) {
        addError(
          "c1Time",
          "A 1ª coleta ocorreu durante ou exatamente ao término da infusão. O método exige coleta após o fim da infusão (idealmente 1–2 h após)."
        );
      } else {
        a = (t1 - tEnd) / 3600000;
      }
    }

    if (Number.isFinite(t1) && Number.isFinite(t2)) {
      deltaT = (t2 - t1) / 3600000;
      if (deltaT <= 0) {
        addError("c2Time", "A 2ª coleta deve ser cronologicamente posterior à 1ª coleta (Δt > 0).");
      }
    }

    if (Number.isFinite(t2) && Number.isFinite(tNextRef)) {
      b = (tNextRef - t2) / 3600000;
      if (b < 0) {
        addError(
          "c2Time",
          "A 2ª coleta foi registrada após o horário da dose seguinte. As duas amostras devem pertencer ao mesmo intervalo."
        );
      } else if (b === 0 && input.confirmSampleBeforeNextDose === false) {
        addError(
          "confirmSampleBeforeNextDose",
          "A 2ª coleta e o início da próxima dose têm o mesmo horário ao minuto. Confirme que o sangue foi colhido imediatamente antes da administração."
        );
      }
    }

    // Se houver erros de validação até aqui, interrompe antes das equações PK
    if (errors.length > 0) {
      return {
        valid: false,
        errors,
        fieldErrors,
        warnings
      };
    }

    // 4. Equações de Sawchuk–Zaske (precisão completa)
    const C1 = c1Parsed.valueMgL;
    const C2 = c2Parsed.valueMgL;
    const k = Math.log(C1 / C2) / deltaT;
    const cPeakEstimated = C1 * Math.exp(k * a);
    const cTroughEstimated = C2 * Math.exp(-k * b);

    const expMinusKT = Math.exp(-k * T);
    const vdDenominator = k * (cPeakEstimated - cTroughEstimated * expMinusKT);

    if (!Number.isFinite(k) || k <= 0) {
      addError("c2Value", "Constante de eliminação (k) inválida ou não positiva.");
    }
    if (!Number.isFinite(vdDenominator) || vdDenominator <= 0) {
      addError(
        "c1Value",
        "Não foi possível determinar um volume de distribuição positivo com as concentrações e horários informados."
      );
    }

    if (errors.length > 0) {
      return { valid: false, errors, fieldErrors, warnings };
    }

    const Vd = ((D / T) * (1 - expMinusKT)) / vdDenominator;
    const CL = k * Vd;
    const halfLifeHours = Math.LN2 / k;
    const aucTau = D / CL;
    const auc24 = aucTau * (24 / tau);
    const aucMic = auc24 / micRaw;

    if (
      !Number.isFinite(Vd) ||
      Vd <= 0 ||
      !Number.isFinite(CL) ||
      CL <= 0 ||
      !Number.isFinite(halfLifeHours) ||
      halfLifeHours <= 0 ||
      !Number.isFinite(auc24) ||
      auc24 <= 0
    ) {
      addError(
        "doseMg",
        "Os parâmetros calculados (Vd, CL ou AUC24) resultaram em valores não positivos ou não finitos. Revise os dados."
      );
      return { valid: false, errors, fieldErrors, warnings };
    }

    // 5. Avisos clínicos orientativos (não bloqueantes)
    if (doseNumberRaw < 3) {
      warnings.push(
        `A amostra foi colhida na ${formatPtBr(doseNumberRaw, 0)}ª dose. A 3ª dose é a referência habitual para aproximação do estado de equilíbrio.`
      );
    }
    if (a < 1.0) {
      warnings.push(
        `1ª coleta realizada ${formatPtBr(a, 2)} h após o fim da infusão (orientação habitual: 1–2 h após o término, reduzindo influência da fase de distribuição).`
      );
    } else if (a > 2.5) {
      warnings.push(
        `1ª coleta realizada ${formatPtBr(a, 2)} h após o fim da infusão (acima da janela habitual de 1–2 h).`
      );
    }
    if (b > 1.0) {
      warnings.push(
        `2ª coleta realizada ${formatPtBr(b, 2)} h antes da próxima dose; C_vale foi extrapolado até o fim do intervalo.`
      );
    }

    const pk = {
      doseMg: D,
      tauHours: tau,
      tauObservedHours: tauObserved,
      doseNumber: doseNumberRaw,
      steadyStateConfirmed,
      T,
      a,
      deltaT,
      b,
      tStart,
      tEnd,
      tNextRef,
      t1,
      t2,
      C1,
      C2,
      c1RawUnit: input.c1Unit || "mg/L",
      c2RawUnit: input.c2Unit || "mg/L",
      k,
      halfLifeHours,
      cPeakEstimated,
      cTroughEstimated,
      Vd,
      CL,
      aucTau,
      auc24,
      micMgL: micRaw,
      micMethod: input.micMethod || "bmd",
      indicationScenario: input.indicationScenario || "mrsa_serious",
      aucMic
    };

    const suggestion = calculateMaintenanceSuggestion(pk, {
      localDoseLimits: limits,
      simulatedDoseMg: input.simulatedDoseMg,
      simulatedTauHours: input.simulatedTauHours
    });

    const curve = generateConcentrationCurve(pk);

    return {
      valid: true,
      errors: [],
      fieldErrors: {},
      warnings,
      pk,
      suggestion,
      curve
    };
  }

  /**
   * Avalia C(s) em um instante relativo s dentro de um intervalo [0, τ],
   * usando exatamente a solução por trechos do modelo de 1 compartimento em equilíbrio.
   */
  function evaluatePiecewiseCycle(s, params) {
    const { D, T, k, CL, cPeakEstimated, cTroughCycle } = params;
    if (s <= T) {
      return (
        cTroughCycle * Math.exp(-k * s) +
        (D / (T * CL)) * (1 - Math.exp(-k * s))
      );
    }
    return cPeakEstimated * Math.exp(-k * (s - T));
  }

  /**
   * Gera a curva farmacocinética do esquema atual em equilíbrio,
   * janelas de infusão, pontos medidos e integração numérica trapezoidal.
   */
  function generateConcentrationCurve(pk, options = {}) {
    const D = pk.doseMg;
    const tau = pk.tauHours;
    const T = pk.T;
    const k = pk.k;
    const CL = pk.CL;
    const cPeakEstimated = pk.cPeakEstimated;
    // C_vale periódico exato no intervalo regular τ garante continuidade entre ciclos
    const cTroughCycle = cPeakEstimated * Math.exp(-k * (tau - T));

    // Verifica se τ divide 24 horas exatamente (tolerância numérica mínima)
    const ratio24 = 24 / tau;
    const divides24h = Number.isInteger(Math.round(ratio24 * 1e6) / 1e6) && tau <= 24;

    const horizonHours = divides24h ? 24 : tau;
    const areaLabel = divides24h
      ? "AUC24 estimada do esquema atual"
      : "AUC do intervalo";
    const displayedAreaValue = divides24h ? pk.auc24 : pk.aucTau;
    const normalized24hLabel = divides24h
      ? null
      : "AUC média normalizada para 24 horas = AUCτ × 24/τ";
    const normalized24hValue = divides24h ? null : pk.auc24;

    const evalParams = { D, T, k, CL, cPeakEstimated, cTroughCycle };

    // Pontos de tempo obrigatórios: grade fina + quebras exatas de infusão/ciclo + coletas reais
    const t1Rel = (pk.t1 - pk.tStart) / 3600000;
    const t2Rel = (pk.t2 - pk.tStart) / 3600000;

    const timeSet = new Set();
    const stepHours = options.stepHours || 0.05; // 3 minutos
    const numSteps = Math.ceil(horizonHours / stepHours);
    for (let i = 0; i <= numSteps; i++) {
      const t = Math.min(horizonHours, i * stepHours);
      timeSet.add(Number(t.toFixed(8)));
    }

    const infusionWindows = [];
    const cycleCount = Math.ceil(horizonHours / tau);
    for (let c = 0; c < cycleCount; c++) {
      const cycleStart = c * tau;
      const infEnd = Math.min(horizonHours, cycleStart + T);
      const cycleEnd = Math.min(horizonHours, (c + 1) * tau);
      timeSet.add(Number(cycleStart.toFixed(8)));
      if (infEnd > cycleStart) timeSet.add(Number(infEnd.toFixed(8)));
      timeSet.add(Number(cycleEnd.toFixed(8)));
      infusionWindows.push({
        cycleIndex: c,
        startHours: cycleStart,
        endHours: infEnd,
        startTimestamp: pk.tStart + cycleStart * 3600000,
        endTimestamp: pk.tStart + infEnd * 3600000
      });
    }

    if (t1Rel >= 0 && t1Rel <= horizonHours) timeSet.add(Number(t1Rel.toFixed(8)));
    if (t2Rel >= 0 && t2Rel <= horizonHours) timeSet.add(Number(t2Rel.toFixed(8)));

    const sortedTimes = Array.from(timeSet).sort((x, y) => x - y);

    const points = sortedTimes.map((tHours) => {
      let cycleIndex = Math.floor(tHours / tau);
      let s = tHours - cycleIndex * tau;
      // No fechamento exato de um ciclo (ex.: t = τ, 2τ), avalia s = τ no ciclo anterior
      if (tHours > 0 && Math.abs(s) < 1e-9) {
        cycleIndex -= 1;
        s = tau;
      }
      const concentration = evaluatePiecewiseCycle(s, evalParams);
      return {
        tHours,
        sHours: s,
        cycleIndex,
        timestamp: pk.tStart + tHours * 3600000,
        concentration,
        phase: s <= T ? "infusion" : "elimination"
      };
    });

    // Integração numérica pela regra dos trapézios
    let numericalArea = 0;
    for (let i = 1; i < points.length; i++) {
      const dt = points[i].tHours - points[i - 1].tHours;
      numericalArea += 0.5 * (points[i].concentration + points[i - 1].concentration) * dt;
    }

    // Verificação explícita de continuidade ao término da infusão (s = T)
    const atInfusionEndLeft =
      cTroughCycle * Math.exp(-k * T) +
      (D / (T * CL)) * (1 - Math.exp(-k * T));
    const atInfusionEndRight = cPeakEstimated * Math.exp(-k * 0);

    const measuredPoints = [
      {
        label: "1ª Coleta (C1)",
        shortLabel: "C1",
        tHours: t1Rel,
        timestamp: pk.t1,
        concentration: pk.C1,
        unit: pk.c1RawUnit,
        curveAtT: evaluatePiecewiseCycle(t1Rel, evalParams)
      },
      {
        label: "2ª Coleta (C2)",
        shortLabel: "C2",
        tHours: t2Rel,
        timestamp: pk.t2,
        concentration: pk.C2,
        unit: pk.c2RawUnit,
        curveAtT: evaluatePiecewiseCycle(t2Rel, evalParams)
      }
    ];

    return {
      divides24h,
      horizonHours,
      areaLabel,
      displayedAreaValue,
      normalized24hLabel,
      normalized24hValue,
      points,
      infusionWindows,
      measuredPoints,
      extrapolatedPoints: {
        cPeak: { tHours: T, timestamp: pk.tEnd, concentration: cPeakEstimated },
        cTrough: {
          tHours: tau,
          timestamp: pk.tStart + tau * 3600000,
          concentration: pk.cTroughEstimated
        }
      },
      numericalArea,
      continuityCheck: {
        atInfusionEndLeft,
        atInfusionEndRight,
        diff: Math.abs(atInfusionEndLeft - atInfusionEndRight)
      },
      evaluateAtHour: (tHours) => {
        let cycleIndex = Math.floor(tHours / tau);
        let s = tHours - cycleIndex * tau;
        if (tHours > 0 && Math.abs(s) < 1e-9) {
          s = tau;
        }
        return evaluatePiecewiseCycle(s, evalParams);
      }
    };
  }

  const ENGINE = {
    parseNumber,
    parseDateTime,
    formatPtBr,
    formatDateTimePtBr,
    normalizeConcentration,
    predictSteadyStateForRegimen,
    calculateMaintenanceSuggestion,
    calculateSawchukZaske,
    generateConcentrationCurve
  };

  if (globalScope) {
    globalScope.__VANCOCINEMIA_ENGINE__ = ENGINE;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = ENGINE;
  }
})(typeof window !== "undefined" ? window : globalThis);
