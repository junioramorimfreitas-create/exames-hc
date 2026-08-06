/**
 * infusoesTests.js
 * Suíte de testes automatizados para validação clínica do motor de cálculo de infusões.
 * Pode ser executada visualmente na aplicação ou no terminal via Node.js.
 */

(function () {
  function runAllTests() {
    const engine = window.__INFUSOES_ENGINE__;
    if (!engine) {
      console.error("Motor de infusões (__INFUSOES_ENGINE__) não encontrado.");
      return { total: 0, passed: 0, failed: 1, logs: ["ERRO: Engine não carregado"] };
    }

    const results = [];
    let passed = 0;
    let failed = 0;

    function assertEqual(actual, expected, tolerance = 1e-3, testName = "") {
      const isNum = typeof actual === "number" && typeof expected === "number";
      const isOK = isNum ? Math.abs(actual - expected) <= tolerance : actual === expected;

      if (isOK) {
        passed++;
        results.push({ success: true, message: `✅ PASS: ${testName} (Obtido: ${actual}, Esperado: ${expected})` });
      } else {
        failed++;
        results.push({ success: false, message: `❌ FAIL: ${testName} (Obtido: ${actual}, Esperado: ${expected})` });
      }
    }

    function assertValidInverse(direction, inputVal, resultVal, unit, params, testName = "") {
      const inv = engine.verifyInverse(direction, inputVal, resultVal, unit, params);
      if (inv.verified) {
        passed++;
        results.push({ success: true, message: `✅ PASS [Inversa]: ${testName}` });
      } else {
        failed++;
        results.push({ success: false, message: `❌ FAIL [Inversa]: ${testName} - Diff: ${inv.difference}` });
      }
    }

    // ------------------------------------------------------------------------
    // CASO 1: Noradrenalina 16 mg/250 mL, Peso 80 kg, Bomba 12 mL/h -> 0.16 mcg/kg/min
    // ------------------------------------------------------------------------
    const c1 = engine.convertMlHToDose(12, "mcg/kg/min", { concMcgMl: 64, weightKg: 80 });
    assertEqual(c1.value, 0.16, 1e-3, "Caso 1: Noradrenalina 12 mL/h -> mcg/kg/min");
    assertValidInverse("mlh_to_dose", 12, c1.value, "mcg/kg/min", { concMcgMl: 64, weightKg: 80 }, "Caso 1 Inversa");

    // ------------------------------------------------------------------------
    // CASO 2: Noradrenalina 32 mg/250 mL, Peso 80 kg, Dose 0.2 mcg/kg/min -> 7.5 mL/h
    // ------------------------------------------------------------------------
    const c2 = engine.convertDoseToMlH(0.2, "mcg/kg/min", { concMcgMl: 128, weightKg: 80 });
    assertEqual(c2.value, 7.5, 1e-3, "Caso 2: Noradrenalina 0.2 mcg/kg/min -> mL/h");
    assertValidInverse("dose_to_mlh", 0.2, c2.value, "mcg/kg/min", { concMcgMl: 128, weightKg: 80 }, "Caso 2 Inversa");

    // ------------------------------------------------------------------------
    // CASO 3: Vasopressina 20 UI/100 mL, Bomba 9 mL/h -> 0.03 UI/min e 1.8 UI/h
    // ------------------------------------------------------------------------
    const c3a = engine.convertMlHToDose(9, "UI/min", { concUIMl: 0.2 });
    assertEqual(c3a.value, 0.03, 1e-3, "Caso 3a: Vasopressina 9 mL/h -> UI/min");
    assertValidInverse("mlh_to_dose", 9, c3a.value, "UI/min", { concUIMl: 0.2 }, "Caso 3a Inversa");

    const c3b = engine.convertMlHToDose(9, "UI/h", { concUIMl: 0.2 });
    assertEqual(c3b.value, 1.8, 1e-3, "Caso 3b: Vasopressina 9 mL/h -> UI/h");
    assertValidInverse("mlh_to_dose", 9, c3b.value, "UI/h", { concUIMl: 0.2 }, "Caso 3b Inversa");

    // ------------------------------------------------------------------------
    // CASO 4: Dobutamina 250 mg/250 mL, Peso 75 kg, Bomba 22.5 mL/h -> 5 mcg/kg/min
    // ------------------------------------------------------------------------
    const c4 = engine.convertMlHToDose(22.5, "mcg/kg/min", { concMcgMl: 1000, concMgMl: 1, weightKg: 75 });
    assertEqual(c4.value, 5.0, 1e-3, "Caso 4: Dobutamina 22.5 mL/h -> 5 mcg/kg/min");
    assertValidInverse("mlh_to_dose", 22.5, c4.value, "mcg/kg/min", { concMcgMl: 1000, concMgMl: 1, weightKg: 75 }, "Caso 4 Inversa");

    // ------------------------------------------------------------------------
    // CASO 5: Propofol 10 mg/mL, Peso 60 kg, Bomba 18 mL/h -> 50 mcg/kg/min e 3 mg/kg/h
    // ------------------------------------------------------------------------
    const c5a = engine.convertMlHToDose(18, "mcg/kg/min", { concMcgMl: 10000, concMgMl: 10, weightKg: 60 });
    assertEqual(c5a.value, 50.0, 1e-3, "Caso 5a: Propofol 18 mL/h -> 50 mcg/kg/min");

    const c5b = engine.convertMlHToDose(18, "mg/kg/h", { concMgMl: 10, weightKg: 60 });
    assertEqual(c5b.value, 3.0, 1e-3, "Caso 5b: Propofol 18 mL/h -> 3 mg/kg/h");

    // ------------------------------------------------------------------------
    // CASO 6: Dexmedetomidina 4 mcg/mL, Peso 70 kg, Dose 0.7 mcg/kg/h -> 12.25 mL/h
    // ------------------------------------------------------------------------
    const c6 = engine.convertDoseToMlH(0.7, "mcg/kg/h", { concMcgMl: 4, weightKg: 70 });
    assertEqual(c6.value, 12.25, 1e-3, "Caso 6: Dexmedetomidina 0.7 mcg/kg/h -> 12.25 mL/h");
    assertValidInverse("dose_to_mlh", 0.7, c6.value, "mcg/kg/h", { concMcgMl: 4, weightKg: 70 }, "Caso 6 Inversa");

    // ------------------------------------------------------------------------
    // CASO 7: Midazolam 1 mg/mL, Peso 80 kg, Bomba 4 mL/h -> 4 mg/h, 0.05 mg/kg/h, ~0.833 mcg/kg/min
    // ------------------------------------------------------------------------
    const c7a = engine.convertMlHToDose(4, "mg/h", { concMgMl: 1, weightKg: 80 });
    assertEqual(c7a.value, 4.0, 1e-3, "Caso 7a: Midazolam 4 mL/h -> 4 mg/h");

    const c7b = engine.convertMlHToDose(4, "mg/kg/h", { concMgMl: 1, weightKg: 80 });
    assertEqual(c7b.value, 0.05, 1e-3, "Caso 7b: Midazolam 4 mL/h -> 0.05 mg/kg/h");

    const c7c = engine.convertMlHToDose(4, "mcg/kg/min", { concMcgMl: 1000, weightKg: 80 });
    assertEqual(c7c.value, 0.8333, 1e-2, "Caso 7c: Midazolam 4 mL/h -> 0.833 mcg/kg/min");

    // ------------------------------------------------------------------------
    // CASO 8: Fentanil 10 mcg/mL, Peso 70 kg, Bomba 10 mL/h -> 100 mcg/h, ~1.43 mcg/kg/h
    // ------------------------------------------------------------------------
    const c8a = engine.convertMlHToDose(10, "mcg/h", { concMcgMl: 10, weightKg: 70 });
    assertEqual(c8a.value, 100.0, 1e-3, "Caso 8a: Fentanil 10 mL/h -> 100 mcg/h");

    const c8b = engine.convertMlHToDose(10, "mcg/kg/h", { concMcgMl: 10, weightKg: 70 });
    assertEqual(c8b.value, 1.4285, 1e-2, "Caso 8b: Fentanil 10 mL/h -> ~1.43 mcg/kg/h");

    // ------------------------------------------------------------------------
    // TESTES ADICIONAIS: Validações e Casos Limite
    // ------------------------------------------------------------------------
    // Separador vírgula
    const cComma = engine.convertDoseToMlH("0,2", "mcg/kg/min", { concMcgMl: 128, weightKg: 80 });
    assertEqual(cComma.value, 7.5, 1e-3, "Teste Vírgula Decimal (0,2)");

    // Bloqueio Peso Zero
    const cZeroW = engine.convertMlHToDose(10, "mcg/kg/min", { concMcgMl: 64, weightKg: 0 });
    assertEqual(cZeroW.error != null, true, true, "Bloqueio Peso Zero");

    // Troca de concentração (16mg/250mL a 20 mL/h para 32mg/250mL -> 10 mL/h)
    const swap = engine.calculateConcentrationSwap(20, 0.064, 0.128);
    assertEqual(swap.rateNew, 10.0, 1e-3, "Troca de Concentração (20 mL/h -> 10 mL/h)");

    // Detector de erro de unidade (Dexmedetomidina 0.7 mcg/kg/min)
    const unitErr = engine.detectUnitError("dexmedetomidina", "mcg/kg/min", 0.7, 70);
    assertEqual(unitErr != null, true, true, "Detector de Erro de Unidade Dexmedetomidina");

    return {
      total: passed + failed,
      passed,
      failed,
      logs: results.map(r => r.message)
    };
  }

  // Expor no window para execução visual
  window.__INFUSOES_TESTS__ = {
    runAll: runAllTests
  };
})();
