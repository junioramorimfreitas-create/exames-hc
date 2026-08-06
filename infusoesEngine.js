/**
 * infusoesEngine.js
 * Motor de cálculo puro para conversões de infusão contínua em bomba,
 * verificação matemática inversa, detecção de erros de unidade e calculadoras auxiliares.
 */

(function () {
  // Parsing de números aceitando ponto ou vírgula
  function parseNumericInput(val) {
    if (val === null || val === undefined) return NaN;
    if (typeof val === "number") return val;
    const cleanStr = String(val).trim().replace(",", ".");
    if (cleanStr === "") return NaN;
    return parseFloat(cleanStr);
  }

  // Formatação clínica de números (remove zeros desnecessários, sem notação científica)
  function formatNumber(num, maxDecimals = 3) {
    if (num === null || num === undefined || isNaN(num)) return "--";
    if (!isFinite(num)) return "Infinito";

    // Arredonda para o número de casas desejado
    const factor = Math.pow(10, maxDecimals);
    const rounded = Math.round(num * factor) / factor;

    // Converte para string em Notação Fixa (evita notação científica para valores clínicos usuais)
    let str = rounded.toFixed(maxDecimals);

    // Remove zeros à direita e o ponto decimal se desnecessário
    if (str.indexOf(".") !== -1) {
      str = str.replace(/0+$/, "").replace(/\.$/, "");
    }

    // Retorna com vírgula para padrão pt-BR
    return str.replace(".", ",");
  }

  /**
   * Converte velocidade em mL/h para a dose desejada na unidade especificada.
   * Params: { rateMlH, concMcgMl, concMgMl, concUIMl, weightKg }
   */
  function convertMlHToDose(rateMlH, unit, params) {
    const rate = parseNumericInput(rateMlH);
    const weight = parseNumericInput(params.weightKg);

    if (isNaN(rate) || rate < 0) return { error: "Velocidade inválida" };

    const concMcgMl = parseNumericInput(params.concMcgMl);
    const concMgMl = parseNumericInput(params.concMgMl);
    const concUIMl = parseNumericInput(params.concUIMl);

    let dose = 0;
    let steps = [];

    switch (unit) {
      case "mcg/kg/min":
        if (isNaN(weight) || weight <= 0) return { error: "Peso obrigatório e maior que zero" };
        if (isNaN(concMcgMl) || concMcgMl <= 0) return { error: "Concentração em mcg/mL inválida" };
        
        // Formula: rate * concMcgMl / weight / 60
        dose = (rate * concMcgMl) / (weight * 60);
        steps.push(`${formatNumber(rate)} mL/h × ${formatNumber(concMcgMl)} mcg/mL = ${formatNumber(rate * concMcgMl)} mcg/h`);
        steps.push(`${formatNumber(rate * concMcgMl)} mcg/h ÷ ${formatNumber(weight)} kg = ${formatNumber((rate * concMcgMl) / weight)} mcg/kg/h`);
        steps.push(`${formatNumber((rate * concMcgMl) / weight)} mcg/kg/h ÷ 60 = ${formatNumber(dose, 3)} mcg/kg/min`);
        break;

      case "mcg/kg/h":
        if (isNaN(weight) || weight <= 0) return { error: "Peso obrigatório e maior que zero" };
        if (isNaN(concMcgMl) || concMcgMl <= 0) return { error: "Concentração em mcg/mL inválida" };
        
        dose = (rate * concMcgMl) / weight;
        steps.push(`${formatNumber(rate)} mL/h × ${formatNumber(concMcgMl)} mcg/mL = ${formatNumber(rate * concMcgMl)} mcg/h`);
        steps.push(`${formatNumber(rate * concMcgMl)} mcg/h ÷ ${formatNumber(weight)} kg = ${formatNumber(dose, 2)} mcg/kg/h`);
        break;

      case "mg/kg/h":
        if (isNaN(weight) || weight <= 0) return { error: "Peso obrigatório e maior que zero" };
        if (isNaN(concMgMl) || concMgMl <= 0) return { error: "Concentração em mg/mL inválida" };
        
        dose = (rate * concMgMl) / weight;
        steps.push(`${formatNumber(rate)} mL/h × ${formatNumber(concMgMl)} mg/mL = ${formatNumber(rate * concMgMl)} mg/h`);
        steps.push(`${formatNumber(rate * concMgMl)} mg/h ÷ ${formatNumber(weight)} kg = ${formatNumber(dose, 3)} mg/kg/h`);
        break;

      case "mg/h":
        if (isNaN(concMgMl) || concMgMl <= 0) return { error: "Concentração em mg/mL inválida" };
        
        dose = rate * concMgMl;
        steps.push(`${formatNumber(rate)} mL/h × ${formatNumber(concMgMl)} mg/mL = ${formatNumber(dose, 2)} mg/h`);
        break;

      case "mcg/h":
        if (isNaN(concMcgMl) || concMcgMl <= 0) return { error: "Concentração em mcg/mL inválida" };
        
        dose = rate * concMcgMl;
        steps.push(`${formatNumber(rate)} mL/h × ${formatNumber(concMcgMl)} mcg/mL = ${formatNumber(dose, 2)} mcg/h`);
        break;

      case "mcg/min":
        if (isNaN(concMcgMl) || concMcgMl <= 0) return { error: "Concentração em mcg/mL inválida" };
        
        dose = (rate * concMcgMl) / 60;
        steps.push(`${formatNumber(rate)} mL/h × ${formatNumber(concMcgMl)} mcg/mL = ${formatNumber(rate * concMcgMl)} mcg/h`);
        steps.push(`${formatNumber(rate * concMcgMl)} mcg/h ÷ 60 = ${formatNumber(dose, 3)} mcg/min`);
        break;

      case "mg/min":
        if (isNaN(concMgMl) || concMgMl <= 0) return { error: "Concentração em mg/mL inválida" };
        
        dose = (rate * concMgMl) / 60;
        steps.push(`${formatNumber(rate)} mL/h × ${formatNumber(concMgMl)} mg/mL = ${formatNumber(rate * concMgMl)} mg/h`);
        steps.push(`${formatNumber(rate * concMgMl)} mg/h ÷ 60 = ${formatNumber(dose, 3)} mg/min`);
        break;

      case "UI/min":
        if (isNaN(concUIMl) || concUIMl <= 0) return { error: "Concentração em UI/mL inválida" };
        
        dose = (rate * concUIMl) / 60;
        steps.push(`${formatNumber(rate)} mL/h × ${formatNumber(concUIMl)} UI/mL = ${formatNumber(rate * concUIMl)} UI/h`);
        steps.push(`${formatNumber(rate * concUIMl)} UI/h ÷ 60 = ${formatNumber(dose, 3)} UI/min`);
        break;

      case "UI/h":
        if (isNaN(concUIMl) || concUIMl <= 0) return { error: "Concentração em UI/mL inválida" };
        
        dose = rate * concUIMl;
        steps.push(`${formatNumber(rate)} mL/h × ${formatNumber(concUIMl)} UI/mL = ${formatNumber(dose, 2)} UI/h`);
        break;

      default:
        return { error: `Unidade não suportada: ${unit}` };
    }

    return { value: dose, steps };
  }

  /**
   * Converte a dose desejada para a velocidade correspondente da bomba em mL/h.
   */
  function convertDoseToMlH(doseInput, unit, params) {
    const dose = parseNumericInput(doseInput);
    const weight = parseNumericInput(params.weightKg);

    if (isNaN(dose) || dose < 0) return { error: "Dose inválida" };

    const concMcgMl = parseNumericInput(params.concMcgMl);
    const concMgMl = parseNumericInput(params.concMgMl);
    const concUIMl = parseNumericInput(params.concUIMl);

    let rate = 0;
    let steps = [];

    switch (unit) {
      case "mcg/kg/min":
        if (isNaN(weight) || weight <= 0) return { error: "Peso obrigatório e maior que zero" };
        if (isNaN(concMcgMl) || concMcgMl <= 0) return { error: "Concentração em mcg/mL inválida" };

        rate = (dose * weight * 60) / concMcgMl;
        steps.push(`${formatNumber(dose, 3)} mcg/kg/min × ${formatNumber(weight)} kg = ${formatNumber(dose * weight)} mcg/min`);
        steps.push(`${formatNumber(dose * weight)} mcg/min × 60 = ${formatNumber(dose * weight * 60)} mcg/h`);
        steps.push(`${formatNumber(dose * weight * 60)} mcg/h ÷ ${formatNumber(concMcgMl)} mcg/mL = ${formatNumber(rate, 2)} mL/h`);
        break;

      case "mcg/kg/h":
        if (isNaN(weight) || weight <= 0) return { error: "Peso obrigatório e maior que zero" };
        if (isNaN(concMcgMl) || concMcgMl <= 0) return { error: "Concentração em mcg/mL inválida" };

        rate = (dose * weight) / concMcgMl;
        steps.push(`${formatNumber(dose, 2)} mcg/kg/h × ${formatNumber(weight)} kg = ${formatNumber(dose * weight)} mcg/h`);
        steps.push(`${formatNumber(dose * weight)} mcg/h ÷ ${formatNumber(concMcgMl)} mcg/mL = ${formatNumber(rate, 2)} mL/h`);
        break;

      case "mg/kg/h":
        if (isNaN(weight) || weight <= 0) return { error: "Peso obrigatório e maior que zero" };
        if (isNaN(concMgMl) || concMgMl <= 0) return { error: "Concentração em mg/mL inválida" };

        rate = (dose * weight) / concMgMl;
        steps.push(`${formatNumber(dose, 3)} mg/kg/h × ${formatNumber(weight)} kg = ${formatNumber(dose * weight)} mg/h`);
        steps.push(`${formatNumber(dose * weight)} mg/h ÷ ${formatNumber(concMgMl)} mg/mL = ${formatNumber(rate, 2)} mL/h`);
        break;

      case "mg/h":
        if (isNaN(concMgMl) || concMgMl <= 0) return { error: "Concentração em mg/mL inválida" };

        rate = dose / concMgMl;
        steps.push(`${formatNumber(dose, 2)} mg/h ÷ ${formatNumber(concMgMl)} mg/mL = ${formatNumber(rate, 2)} mL/h`);
        break;

      case "mcg/h":
        if (isNaN(concMcgMl) || concMcgMl <= 0) return { error: "Concentração em mcg/mL inválida" };

        rate = dose / concMcgMl;
        steps.push(`${formatNumber(dose, 2)} mcg/h ÷ ${formatNumber(concMcgMl)} mcg/mL = ${formatNumber(rate, 2)} mL/h`);
        break;

      case "mcg/min":
        if (isNaN(concMcgMl) || concMcgMl <= 0) return { error: "Concentração em mcg/mL inválida" };

        rate = (dose * 60) / concMcgMl;
        steps.push(`${formatNumber(dose, 3)} mcg/min × 60 = ${formatNumber(dose * 60)} mcg/h`);
        steps.push(`${formatNumber(dose * 60)} mcg/h ÷ ${formatNumber(concMcgMl)} mcg/mL = ${formatNumber(rate, 2)} mL/h`);
        break;

      case "mg/min":
        if (isNaN(concMgMl) || concMgMl <= 0) return { error: "Concentração em mg/mL inválida" };

        rate = (dose * 60) / concMgMl;
        steps.push(`${formatNumber(dose, 3)} mg/min × 60 = ${formatNumber(dose * 60)} mg/h`);
        steps.push(`${formatNumber(dose * 60)} mg/h ÷ ${formatNumber(concMgMl)} mg/mL = ${formatNumber(rate, 2)} mL/h`);
        break;

      case "UI/min":
        if (isNaN(concUIMl) || concUIMl <= 0) return { error: "Concentração em UI/mL inválida" };

        rate = (dose * 60) / concUIMl;
        steps.push(`${formatNumber(dose, 3)} UI/min × 60 = ${formatNumber(dose * 60)} UI/h`);
        steps.push(`${formatNumber(dose * 60)} UI/h ÷ ${formatNumber(concUIMl)} UI/mL = ${formatNumber(rate, 2)} mL/h`);
        break;

      case "UI/h":
        if (isNaN(concUIMl) || concUIMl <= 0) return { error: "Concentração em UI/mL inválida" };

        rate = dose / concUIMl;
        steps.push(`${formatNumber(dose, 2)} UI/h ÷ ${formatNumber(concUIMl)} UI/mL = ${formatNumber(rate, 2)} mL/h`);
        break;

      default:
        return { error: `Unidade não suportada: ${unit}` };
    }

    return { value: rate, steps };
  }

  /**
   * Verificação Matemática Inversa Independente.
   * Tolerância matemática predefinida: < 1e-4.
   */
  function verifyInverse(direction, inputValue, calculatedResult, unit, params) {
    const inputVal = parseNumericInput(inputValue);
    const resultVal = parseNumericInput(calculatedResult);

    if (isNaN(inputVal) || isNaN(resultVal)) return { verified: false, error: "Valores numéricos inválidos" };

    let reconverted = 0;
    if (direction === "mlh_to_dose") {
      // Input foi mL/h, Result foi Dose -> Reconverter Dose para mL/h
      const inv = convertDoseToMlH(resultVal, unit, params);
      if (inv.error) return { verified: false, error: inv.error };
      reconverted = inv.value;
    } else {
      // Input foi Dose, Result foi mL/h -> Reconverter mL/h para Dose
      const inv = convertMlHToDose(resultVal, unit, params);
      if (inv.error) return { verified: false, error: inv.error };
      reconverted = inv.value;
    }

    const diff = Math.abs(reconverted - inputVal);
    const verified = diff < 1e-4;

    return {
      verified,
      reconverted,
      difference: diff
    };
  }

  /**
   * Detector de Possíveis Erros de Ordem de Grandeza de Unidade.
   */
  function detectUnitError(drugId, unit, value, weightKg) {
    const val = parseNumericInput(value);
    if (isNaN(val) || val <= 0) return null;

    if (drugId === "noradrenalina" && unit === "mcg/kg/min" && val >= 5) {
      return "O valor de Noradrenalina informado (" + formatNumber(val) + " mcg/kg/min) é extremamente elevado. Verifique se a unidade prescrita é mcg/min ou se a bomba foi programada incorretamente.";
    }

    if (drugId === "dexmedetomidina" && unit === "mcg/kg/min" && val >= 0.2) {
      return "A Dexmedetomidina é usualmente prescrita em mcg/kg/h. O valor " + formatNumber(val) + " mcg/kg/min equivale a " + formatNumber(val * 60) + " mcg/kg/h, o que é muito superior à faixa usual. Confirme se a unidade correta não é mcg/kg/h.";
    }

    if (drugId === "vasopressina" && unit === "UI/min" && val >= 1) {
      return "A Vasopressina em choque é usualmente prescrita entre 0,01 e 0,04 UI/min. O valor de " + formatNumber(val) + " UI/min é 100 vezes superior ao habitual. Verifique se a unidade correta é UI/h ou se o valor correto é 0,0" + val + " UI/min.";
    }

    if (drugId === "fentanil" && (unit === "mg/h" || (unit === "mcg/h" && val >= 10000))) {
      return "O Fentanil em UTI é medido em microgramas (mcg/h). O valor informado pode representar uma confusão entre mg e mcg.";
    }

    return null;
  }

  /**
   * Calculadora de Troca de Concentração (Manter a mesma dose).
   * rateNew = rateOld * (concOld / concNew)
   */
  function calculateConcentrationSwap(rateOldMlH, concOldMgMl, concNewMgMl) {
    const rateOld = parseNumericInput(rateOldMlH);
    const concOld = parseNumericInput(concOldMgMl);
    const concNew = parseNumericInput(concNewMgMl);

    if (isNaN(rateOld) || isNaN(concOld) || isNaN(concNew) || concNew <= 0) {
      return { error: "Dados para troca de concentração inválidos" };
    }

    const factor = concOld / concNew;
    const rateNew = rateOld * factor;

    let explanation = "";
    if (factor === 0.5) {
      explanation = "A nova concentração é o DOBRO da atual. Para manter a mesma dose, a velocidade da bomba deve ser REDUZIDA PELA METADE.";
    } else if (factor === 2) {
      explanation = "A nova concentração é a METADE da atual. Para manter a mesma dose, a velocidade da bomba deve ser DOBRADA.";
    } else {
      explanation = `Fator de concentração: ${formatNumber(factor, 3)}×. Programe a nova velocidade da bomba para ${formatNumber(rateNew, 2)} mL/h.`;
    }

    return { rateNew, factor, explanation };
  }

  /**
   * Gerador de Tabela de Titulação.
   */
  function generateTitrationTable(currentRateMlH, stepMlH, unit, params, drugConfig) {
    const baseRate = parseNumericInput(currentRateMlH) || 10;
    const step = parseNumericInput(stepMlH) || 1;

    const ratesToTest = [
      Math.max(0.1, baseRate - step * 2),
      Math.max(0.1, baseRate - step),
      baseRate,
      baseRate + step,
      baseRate + step * 2,
      baseRate + step * 4
    ];

    // Eliminar duplicatas
    const uniqueRates = [...new Set(ratesToTest)].sort((a, b) => a - b);

    const rows = uniqueRates.map(r => {
      const res = convertMlHToDose(r, unit, params);
      return {
        rateMlH: r,
        doseValue: res.error ? null : res.value,
        formattedDose: res.error ? "--" : formatNumber(res.value, 3)
      };
    });

    return rows;
  }

  /**
   * Calculadora de Tempo Restante.
   */
  function calculateTimeRemaining(remainingVolumeMl, rateMlH, totalDrugAmount, unitLabel) {
    const vol = parseNumericInput(remainingVolumeMl);
    const rate = parseNumericInput(rateMlH);

    if (isNaN(vol) || vol <= 0 || isNaN(rate) || rate <= 0) {
      return { error: "Informe volume restante e velocidade da bomba válidos" };
    }

    const hoursTotal = vol / rate;
    const hoursInt = Math.floor(hoursTotal);
    const minutesInt = Math.round((hoursTotal - hoursInt) * 60);

    const now = new Date();
    const finishTime = new Date(now.getTime() + hoursTotal * 3600 * 1000);

    const formattedFinish = finishTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let remainingDrugText = "";
    if (totalDrugAmount && parseNumericInput(totalDrugAmount) > 0) {
      // Se soubermos o volume inicial/total, podemos estimar a quantidade restante de medicamento
      remainingDrugText = `${formatNumber(totalDrugAmount * (vol / 250), 2)} ${unitLabel || ""}`;
    }

    return {
      hours: hoursInt,
      minutes: minutesInt,
      timeText: `${hoursInt}h ${minutesInt}min`,
      finishTimeFormatted: formattedFinish,
      remainingDrugText
    };
  }

  /**
   * Calculadora de Consumo 6h / 12h / 24h.
   */
  function calculateConsumption(rateMlH, concMgMl, concMcgMl, concUIMl, commercialPres) {
    const rate = parseNumericInput(rateMlH);
    if (isNaN(rate) || rate <= 0) return null;

    const vol6h = rate * 6;
    const vol12h = rate * 12;
    const vol24h = rate * 24;

    let mg24h = 0;
    let ampCount24h = null;

    if (concMgMl && parseNumericInput(concMgMl) > 0) {
      mg24h = vol24h * concMgMl;
      if (commercialPres && commercialPres.mgPerAmp) {
        ampCount24h = Math.ceil(mg24h / commercialPres.mgPerAmp);
      }
    } else if (concMcgMl && parseNumericInput(concMcgMl) > 0) {
      const mcg24h = vol24h * concMcgMl;
      if (commercialPres && commercialPres.mcgPerAmp) {
        ampCount24h = Math.ceil(mcg24h / commercialPres.mcgPerAmp);
      }
    } else if (concUIMl && parseNumericInput(concUIMl) > 0) {
      const ui24h = vol24h * concUIMl;
      if (commercialPres && commercialPres.uiPerAmp) {
        ampCount24h = Math.ceil(ui24h / commercialPres.uiPerAmp);
      }
    }

    return {
      vol6h,
      vol12h,
      vol24h,
      mg24h,
      ampCount24h
    };
  }

  /**
   * Calculadora de Peso Ideal e Ajustado.
   * Devine Formula:
   * Male: 50 + 0.905 * (heightCm - 152.4)
   * Female: 45.5 + 0.905 * (heightCm - 152.4)
   * Adjusted Weight = IBW + 0.4 * (ABW - IBW)
   */
  function calculateIdealAndAdjustedWeight(gender, heightCm, actualWeightKg) {
    const h = parseNumericInput(heightCm);
    const w = parseNumericInput(actualWeightKg);

    if (isNaN(h) || h < 100 || h > 250) return { error: "Altura inválida" };

    const isMale = gender === "male";
    const baseVal = isMale ? 50 : 45.5;
    const idealWeight = baseVal + 0.905 * (h - 152.4);

    let adjustedWeight = idealWeight;
    if (!isNaN(w) && w > idealWeight) {
      adjustedWeight = idealWeight + 0.4 * (w - idealWeight);
    }

    return {
      idealWeight: Math.max(30, idealWeight),
      adjustedWeight: Math.max(30, adjustedWeight)
    };
  }

  /**
   * Módulo Opcional de Dose Equivalente de Noradrenalina (NEE).
   * Fórmula padrão de pesquisa: NEE (mcg/kg/min) = Nora + Adrenalina + (Vasopressina * 2.5) + (Dopamina / 150)
   */
  function calculateNEE(doses) {
    // doses: { nora, adrena, vaso, dopa } todas em mcg/kg/min (ou UI/min para vasopressina)
    const nora = parseNumericInput(doses.nora) || 0;
    const adrena = parseNumericInput(doses.adrena) || 0;
    const vaso = parseNumericInput(doses.vaso) || 0; // UI/min
    const dopa = parseNumericInput(doses.dopa) || 0;

    // Vasopressina 0.04 UI/min equivale a aprox 0.1 mcg/kg/min de Nora no score de pesquisa
    const vasoEquivalent = vaso * 2.5; 
    const dopaEquivalent = dopa / 150;

    const nee = nora + adrena + vasoEquivalent + dopaEquivalent;

    return {
      nee: Math.max(0, nee),
      breakdown: { nora, adrena, vasoEquivalent, dopaEquivalent }
    };
  }

  // Expor engine no escopo global
  window.__INFUSOES_ENGINE__ = {
    parseNumericInput,
    formatNumber,
    convertMlHToDose,
    convertDoseToMlH,
    verifyInverse,
    detectUnitError,
    calculateConcentrationSwap,
    generateTitrationTable,
    calculateTimeRemaining,
    calculateConsumption,
    calculateIdealAndAdjustedWeight,
    calculateNEE
  };
})();
