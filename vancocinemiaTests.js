/**
 * vancocinemiaTests.js
 * Suíte de testes automatizados de aceitação e casos de borda para a
 * Calculadora de Vancocinemia por Duas Coletas (Sawchuk–Zaske).
 *
 * Pode ser executada no navegador via `window.__VANCOCINEMIA_TESTS__.runAll()`
 * ou diretamente via Node.js: `node vancocinemiaTests.js`.
 */

(function (globalScope) {
  function getEngine() {
    if (globalScope && globalScope.__VANCOCINEMIA_ENGINE__) {
      return globalScope.__VANCOCINEMIA_ENGINE__;
    }
    if (typeof require === "function") {
      return require("./vancocinemiaEngine.js");
    }
    return null;
  }

  function runAllTests() {
    const engine = getEngine();
    if (!engine) {
      return {
        total: 1,
        passed: 0,
        failed: 1,
        logs: ["❌ ERRO: Motor __VANCOCINEMIA_ENGINE__ não encontrado."]
      };
    }

    const results = [];
    let passed = 0;
    let failed = 0;

    function assertClose(actual, expected, tolerance, name) {
      const ok =
        typeof actual === "number" &&
        Number.isFinite(actual) &&
        Math.abs(actual - expected) <= tolerance;
      if (ok) {
        passed++;
        results.push({
          success: true,
          message: `✅ PASS: ${name} (Obtido: ${actual.toFixed(4)}, Esperado: ${expected})`
        });
      } else {
        failed++;
        results.push({
          success: false,
          message: `❌ FAIL: ${name} (Obtido: ${actual}, Esperado: ${expected} ± ${tolerance})`
        });
      }
    }

    function assertTrue(condition, name, detail = "") {
      if (condition) {
        passed++;
        results.push({ success: true, message: `✅ PASS: ${name}` });
      } else {
        failed++;
        results.push({
          success: false,
          message: `❌ FAIL: ${name}${detail ? " — " + detail : ""}`
        });
      }
    }

    // ------------------------------------------------------------------------
    // TESTE 1: Esquema dentro da meta (1.000 mg q12h, 08h-09h, C1=30@10h, C2=12@20h)
    // ------------------------------------------------------------------------
    const baseInput = {
      doseMg: 1000,
      tauHours: 12,
      doseNumber: 3,
      steadyStateConfirmed: true,
      infusionStart: "2026-11-12T08:00",
      infusionEnd: "2026-11-12T09:00",
      nextDosePlanned: "2026-11-12T20:00",
      renalStable: true,
      onRRT: false,
      c1Value: 30,
      c1Unit: "mg/L",
      c1Time: "2026-11-12T10:00",
      c2Value: 12,
      c2Unit: "mg/L",
      c2Time: "2026-11-12T20:00",
      confirmSampleBeforeNextDose: true,
      micMgL: 1,
      micMethod: "bmd",
      indicationScenario: "mrsa_serious"
    };

    const res1 = engine.calculateSawchukZaske(baseInput);
    assertTrue(res1.valid, "Caso 1 (Dentro da meta): validação aprovada");
    assertClose(res1.pk.k, 0.09163, 1e-4, "Caso 1: k ≈ 0,09163 h⁻¹");
    assertClose(res1.pk.cPeakEstimated, 32.88, 0.02, "Caso 1: C_pico ≈ 32,88 mg/L");
    assertClose(res1.pk.Vd, 43.575, 0.05, "Caso 1: Vd ≈ 43,57 L");
    assertClose(res1.pk.CL, 3.993, 0.005, "Caso 1: CL ≈ 3,993 L/h");
    assertClose(res1.pk.auc24, 501, 0.5, "Caso 1: AUC24 ≈ 501 mg·h/L");
    assertTrue(
      res1.suggestion.inTargetRange &&
        res1.suggestion.headline.includes("Esquema atual dentro da faixa-alvo") &&
        res1.suggestion.suggestedRegimen.doseMg === 1000 &&
        res1.suggestion.suggestedRegimen.tauHours === 12,
      "Caso 1: indica manutenção do esquema atual (1.000 mg q12h)"
    );

    // ------------------------------------------------------------------------
    // TESTE 2: Esquema abaixo da meta (C1=20@10h, C2=8@20h)
    // ------------------------------------------------------------------------
    const lowInput = Object.assign({}, baseInput, { c1Value: 20, c2Value: 8 });
    const res2 = engine.calculateSawchukZaske(lowInput);
    assertTrue(res2.valid, "Caso 2 (Abaixo da meta): validação aprovada");
    assertClose(res2.pk.auc24, 334, 0.5, "Caso 2: AUC24 atual ≈ 334 mg·h/L");
    assertClose(
      res2.suggestion.theoreticalDosePerAdminMg,
      1497.4,
      1.0,
      "Caso 2: dose teórica ≈ 1.497 mg q12h"
    );
    assertTrue(
      res2.suggestion.suggestedRegimen &&
        res2.suggestion.suggestedRegimen.doseMg === 1500 &&
        res2.suggestion.suggestedRegimen.tauHours === 12,
      "Caso 2: sugere 1.500 mg q12h quando incremento de 250 mg permite"
    );
    assertClose(
      res2.suggestion.predictedExposure.auc24,
      501,
      0.5,
      "Caso 2: AUC24 prevista para 1.500 mg q12h ≈ 501 mg·h/L"
    );
    assertClose(
      res2.curve.displayedAreaValue,
      334,
      0.5,
      "Caso 2: gráfico principal mantém exposição atual de ≈ 334 mg·h/L"
    );

    // ------------------------------------------------------------------------
    // TESTE 3: Coerência do gráfico (pontos medidos, continuidade, integral e 36h)
    // ------------------------------------------------------------------------
    const cAtT1 = res1.curve.evaluateAtHour(res1.curve.measuredPoints[0].tHours);
    const cAtT2 = res1.curve.evaluateAtHour(res1.curve.measuredPoints[1].tHours);
    assertClose(cAtT1, 30, 1e-6, "Gráfico Caso 1: curva passa exatamente por C1 = 30 mg/L");
    assertClose(cAtT2, 12, 1e-6, "Gráfico Caso 1: curva passa exatamente por C2 = 12 mg/L");
    assertTrue(
      res1.curve.continuityCheck.diff < 1e-9,
      "Gráfico Caso 1: continuidade ao término da infusão (s = T)",
      `diff=${res1.curve.continuityCheck.diff}`
    );
    const relErr24h =
      Math.abs(res1.curve.numericalArea - res1.pk.auc24) / res1.pk.auc24;
    assertTrue(
      relErr24h < 0.01 && Math.abs(res1.curve.numericalArea - 501) <= 5.01,
      "Gráfico Caso 1: integração numérica de 24 h aproxima 501 mg·h/L (< 1%)",
      `integral=${res1.curve.numericalArea.toFixed(2)}, erroRel=${(relErr24h * 100).toFixed(4)}%`
    );

    // Intervalo de 36 h
    const input36h = {
      doseMg: 1000,
      tauHours: 36,
      doseNumber: 3,
      steadyStateConfirmed: true,
      infusionStart: "2026-11-12T08:00",
      infusionEnd: "2026-11-12T09:00",
      nextDosePlanned: "2026-11-13T20:00",
      renalStable: true,
      onRRT: false,
      c1Value: 28,
      c1Unit: "mg/L",
      c1Time: "2026-11-12T10:30",
      c2Value: 9,
      c2Unit: "mg/L",
      c2Time: "2026-11-13T19:30",
      confirmSampleBeforeNextDose: true,
      micMgL: 1
    };
    const res36 = engine.calculateSawchukZaske(input36h);
    assertTrue(res36.valid, "Intervalo 36 h: cálculo válido");
    assertTrue(
      res36.curve.divides24h === false &&
        res36.curve.horizonHours === 36 &&
        res36.curve.areaLabel === "AUC do intervalo" &&
        res36.curve.normalized24hLabel ===
          "AUC média normalizada para 24 horas = AUCτ × 24/τ",
      "Intervalo 36 h: exibe 1 intervalo (36 h), rótulo 'AUC do intervalo' e AUC média normalizada para 24 h"
    );
    assertClose(
      res36.curve.displayedAreaValue,
      res36.pk.aucTau,
      1e-6,
      "Intervalo 36 h: área exibida corresponde a AUCτ"
    );
    assertClose(
      res36.curve.normalized24hValue,
      res36.pk.auc24,
      1e-6,
      "Intervalo 36 h: AUC normalizada corresponde a AUCτ × 24/36"
    );
    const relErr36h =
      Math.abs(res36.curve.numericalArea - res36.pk.aucTau) / res36.pk.aucTau;
    assertTrue(
      relErr36h < 0.01,
      "Intervalo 36 h: integração numérica aproxima AUCτ (< 1%)",
      `integral=${res36.curve.numericalArea.toFixed(2)}, AUCτ=${res36.pk.aucTau.toFixed(2)}`
    );

    // ------------------------------------------------------------------------
    // TESTE 4: Casos de borda
    // ------------------------------------------------------------------------
    // 4.1 Virada de data
    const midnightInput = Object.assign({}, baseInput, {
      infusionStart: "2026-11-12T22:00",
      infusionEnd: "2026-11-12T23:00",
      c1Time: "2026-11-13T00:00",
      c2Time: "2026-11-13T10:00",
      nextDosePlanned: "2026-11-13T10:00"
    });
    const resMidnight = engine.calculateSawchukZaske(midnightInput);
    assertTrue(resMidnight.valid, "Borda: virada de data (22h dia 1 -> 10h dia 2)");
    assertClose(
      resMidnight.pk.auc24,
      res1.pk.auc24,
      1e-6,
      "Borda: virada de data mantém AUC24 idêntica"
    );

    // 4.2 Vale colhido 15 min antes da dose (b = 0.25 h)
    const earlyTroughInput = Object.assign({}, baseInput, {
      c2Time: "2026-11-12T19:45"
    });
    const resEarlyTrough = engine.calculateSawchukZaske(earlyTroughInput);
    assertTrue(resEarlyTrough.valid, "Borda: vale colhido 15 min antes da dose");
    assertClose(resEarlyTrough.pk.b, 0.25, 1e-6, "Borda: intervalo b = 0,25 h");
    assertTrue(
      resEarlyTrough.pk.cTroughEstimated < 12,
      "Borda: C_vale extrapolado fica menor que C2 (12 mg/L)"
    );

    // 4.3 Vírgula decimal e unidades equivalentes (µg/mL vs mg/L)
    const commaUnitInput = Object.assign({}, baseInput, {
      doseMg: "1000,0",
      c1Value: "30,0",
      c1Unit: "µg/mL",
      c2Value: "12,0",
      c2Unit: "µg/mL",
      micMgL: "1,0"
    });
    const resComma = engine.calculateSawchukZaske(commaUnitInput);
    assertTrue(resComma.valid, "Borda: vírgula decimal e unidade µg/mL");
    assertClose(
      resComma.pk.auc24,
      res1.pk.auc24,
      1e-9,
      "Borda: µg/mL produz exatamente o mesmo resultado que mg/L"
    );

    // 4.4 Concentração zero
    const zeroConcInput = Object.assign({}, baseInput, { c2Value: 0 });
    const resZeroConc = engine.calculateSawchukZaske(zeroConcInput);
    assertTrue(
      !resZeroConc.valid && Boolean(resZeroConc.fieldErrors.c2Value),
      "Borda: rejeita concentração zero"
    );

    // 4.5 C2 >= C1
    const c2GeC1Equal = engine.calculateSawchukZaske(
      Object.assign({}, baseInput, { c1Value: 20, c2Value: 20 })
    );
    const c2GeC1Greater = engine.calculateSawchukZaske(
      Object.assign({}, baseInput, { c1Value: 15, c2Value: 22 })
    );
    assertTrue(
      !c2GeC1Equal.valid && !c2GeC1Greater.valid,
      "Borda: rejeita C2 >= C1"
    );

    // 4.6 Coleta durante a infusão
    const duringInfInput = Object.assign({}, baseInput, {
      c1Time: "2026-11-12T08:30"
    });
    const resDuringInf = engine.calculateSawchukZaske(duringInfInput);
    assertTrue(
      !resDuringInf.valid &&
        resDuringInf.fieldErrors.c1Time &&
        resDuringInf.fieldErrors.c1Time.toLowerCase().includes("durante"),
      "Borda: rejeita coleta durante a infusão com mensagem específica"
    );

    // 4.7 Coleta no mesmo minuto da próxima dose sem confirmação
    const unconfirmedTrough = Object.assign({}, baseInput, {
      confirmSampleBeforeNextDose: false
    });
    const resUnconfirmed = engine.calculateSawchukZaske(unconfirmedTrough);
    assertTrue(
      !resUnconfirmed.valid &&
        Boolean(resUnconfirmed.fieldErrors.confirmSampleBeforeNextDose),
      "Borda: exige confirmação quando C2 e próxima dose têm o mesmo horário ao minuto"
    );

    // 4.8 Função renal instável
    const unstableRenal = Object.assign({}, baseInput, { renalStable: false });
    const resUnstable = engine.calculateSawchukZaske(unstableRenal);
    assertTrue(
      !resUnstable.valid &&
        resUnstable.fieldErrors.renalStable &&
        resUnstable.fieldErrors.renalStable.toLowerCase().includes("instável"),
      "Borda: rejeita função renal instável com mensagem específica"
    );

    // 4.9 MIC = 0,5 mg/L (não sugerir redução proporcional visando AUC24 = 250)
    const mic05Input = Object.assign({}, baseInput, { micMgL: "0,5" });
    const resMic05 = engine.calculateSawchukZaske(mic05Input);
    assertTrue(resMic05.valid, "Borda: MIC = 0,5 mg/L aceito");
    assertClose(
      resMic05.pk.aucMic,
      resMic05.pk.auc24 / 0.5,
      1e-6,
      "Borda: MIC = 0,5 mg/L calcula razão AUC24/MIC ≈ 1002"
    );
    assertTrue(
      resMic05.suggestion.suggestedRegimen &&
        resMic05.suggestion.suggestedRegimen.doseMg === 1000 &&
        resMic05.suggestion.inTargetRange === true,
      "Borda: MIC = 0,5 mg/L não reduz dose proporcionalmente quando AUC24 já está em 400–600"
    );

    // 4.10 MIC = 2 mg/L (não gera sugestão automática visando AUC24 = 1.000)
    const mic2Input = Object.assign({}, baseInput, { micMgL: 2 });
    const resMic2 = engine.calculateSawchukZaske(mic2Input);
    assertTrue(resMic2.valid, "Borda: MIC = 2 mg/L aceito");
    assertClose(
      resMic2.pk.aucMic,
      resMic2.pk.auc24 / 2,
      1e-6,
      "Borda: MIC = 2 mg/L calcula razão AUC24/MIC ≈ 250"
    );
    assertTrue(
      resMic2.suggestion.statusCode === "mic_gt_1_clinical_review" &&
        resMic2.suggestion.suggestedRegimen === null,
      "Borda: MIC = 2 mg/L não gera sugestão automática de dose visando AUC24 de 1.000"
    );

    return {
      total: passed + failed,
      passed,
      failed,
      logs: results.map((r) => r.message)
    };
  }

  if (globalScope) {
    globalScope.__VANCOCINEMIA_TESTS__ = {
      runAll: runAllTests
    };
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { runAll: runAllTests };
    if (require.main === module) {
      const summary = runAllTests();
      console.log(summary.logs.join("\n"));
      console.log(
        `\nResumo Vancocinemia: ${summary.passed}/${summary.total} testes passaram (${summary.failed} falharam).`
      );
      process.exit(summary.failed > 0 ? 1 : 0);
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
