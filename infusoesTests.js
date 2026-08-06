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
    // CASO 1: Noradrenalina 16 mg/250 mL (64 mcg/mL), Peso 80 kg, 12 mL/h -> 0.16 mcg/kg/min
    // ------------------------------------------------------------------------
    const c1 = engine.convertMlHToDose(12, "mcg/kg/min", { concMcgMl: 64, weightKg: 80 });
    assertEqual(c1.value, 0.16, 1e-3, "Noradrenalina: 12 mL/h -> 0.16 mcg/kg/min");
    assertValidInverse("mlh_to_dose", 12, c1.value, "mcg/kg/min", { concMcgMl: 64, weightKg: 80 }, "Noradrenalina Inversa");

    // ------------------------------------------------------------------------
    // CASO 2: Adrenalina 4 mg/250 mL (16 mcg/mL), Peso 80 kg, 15 mL/h -> 0.05 mcg/kg/min
    // ------------------------------------------------------------------------
    const c2 = engine.convertMlHToDose(15, "mcg/kg/min", { concMcgMl: 16, weightKg: 80 });
    assertEqual(c2.value, 0.05, 1e-3, "Adrenalina: 15 mL/h -> 0.05 mcg/kg/min");
    assertValidInverse("mlh_to_dose", 15, c2.value, "mcg/kg/min", { concMcgMl: 16, weightKg: 80 }, "Adrenalina Inversa");

    // ------------------------------------------------------------------------
    // CASO 3: Dopamina 200 mg/250 mL (0.8 mg/mL), Peso 80 kg, 15 mL/h -> 2.5 mcg/kg/min
    // ------------------------------------------------------------------------
    const c3 = engine.convertMlHToDose(15, "mcg/kg/min", { concMcgMl: 800, concMgMl: 0.8, weightKg: 80 });
    assertEqual(c3.value, 2.5, 1e-3, "Dopamina: 15 mL/h -> 2.5 mcg/kg/min");
    assertValidInverse("mlh_to_dose", 15, c3.value, "mcg/kg/min", { concMcgMl: 800, concMgMl: 0.8, weightKg: 80 }, "Dopamina Inversa");

    // ------------------------------------------------------------------------
    // CASO 4: Dobutamina 250 mg/250 mL (1 mg/mL), Peso 75 kg, 22.5 mL/h -> 5 mcg/kg/min
    // ------------------------------------------------------------------------
    const c4 = engine.convertMlHToDose(22.5, "mcg/kg/min", { concMcgMl: 1000, concMgMl: 1, weightKg: 75 });
    assertEqual(c4.value, 5.0, 1e-3, "Dobutamina: 22.5 mL/h -> 5 mcg/kg/min");
    assertValidInverse("mlh_to_dose", 22.5, c4.value, "mcg/kg/min", { concMcgMl: 1000, concMgMl: 1, weightKg: 75 }, "Dobutamina Inversa");

    // ------------------------------------------------------------------------
    // CASO 5: Vasopressina 20 UI/100 mL (0.2 UI/mL), Bomba 9 mL/h -> 0.03 UI/min
    // ------------------------------------------------------------------------
    const c5 = engine.convertMlHToDose(9, "UI/min", { concUIMl: 0.2 });
    assertEqual(c5.value, 0.03, 1e-3, "Vasopressina: 9 mL/h -> 0.03 UI/min");
    assertValidInverse("mlh_to_dose", 9, c5.value, "UI/min", { concUIMl: 0.2 }, "Vasopressina Inversa");

    // ------------------------------------------------------------------------
    // CASO 6: Midazolam 50 mg/50 mL (1 mg/mL), Peso 80 kg, 4 mL/h -> 0.05 mg/kg/h
    // ------------------------------------------------------------------------
    const c6 = engine.convertMlHToDose(4, "mg/kg/h", { concMgMl: 1, weightKg: 80 });
    assertEqual(c6.value, 0.05, 1e-3, "Midazolam: 4 mL/h -> 0.05 mg/kg/h");
    assertValidInverse("mlh_to_dose", 4, c6.value, "mg/kg/h", { concMgMl: 1, weightKg: 80 }, "Midazolam Inversa");

    // ------------------------------------------------------------------------
    // CASO 7: Propofol 1% (10 mg/mL), Peso 60 kg, 18 mL/h -> 50 mcg/kg/min
    // ------------------------------------------------------------------------
    const c7 = engine.convertMlHToDose(18, "mcg/kg/min", { concMcgMl: 10000, concMgMl: 10, weightKg: 60 });
    assertEqual(c7.value, 50.0, 1e-3, "Propofol: 18 mL/h -> 50 mcg/kg/min");
    assertValidInverse("mlh_to_dose", 18, c7.value, "mcg/kg/min", { concMcgMl: 10000, concMgMl: 10, weightKg: 60 }, "Propofol Inversa");

    // ------------------------------------------------------------------------
    // CASO 8: Fentanil 500 mcg/50 mL (10 mcg/mL), Peso 70 kg, 10 mL/h -> 1.4285 mcg/kg/h
    // ------------------------------------------------------------------------
    const c8 = engine.convertMlHToDose(10, "mcg/kg/h", { concMcgMl: 10, weightKg: 70 });
    assertEqual(c8.value, 1.4285, 1e-2, "Fentanil: 10 mL/h -> 1.43 mcg/kg/h");
    assertValidInverse("mlh_to_dose", 10, c8.value, "mcg/kg/h", { concMcgMl: 10, weightKg: 70 }, "Fentanil Inversa");

    // ------------------------------------------------------------------------
    // CASO 9: Cetamina 250 mg/50 mL (5 mg/mL), Peso 70 kg, 7 mL/h -> 0.5 mg/kg/h
    // ------------------------------------------------------------------------
    const c9 = engine.convertMlHToDose(7, "mg/kg/h", { concMgMl: 5, weightKg: 70 });
    assertEqual(c9.value, 0.5, 1e-3, "Cetamina: 7 mL/h -> 0.5 mg/kg/h");
    assertValidInverse("mlh_to_dose", 7, c9.value, "mg/kg/h", { concMgMl: 5, weightKg: 70 }, "Cetamina Inversa");

    // ------------------------------------------------------------------------
    // CASO 10: Dexmedetomidina 200 mcg/50 mL (4 mcg/mL), Peso 70 kg, 12.25 mL/h -> 0.7 mcg/kg/h
    // ------------------------------------------------------------------------
    const c10 = engine.convertMlHToDose(12.25, "mcg/kg/h", { concMcgMl: 4, weightKg: 70 });
    assertEqual(c10.value, 0.7, 1e-3, "Dexmedetomidina: 12.25 mL/h -> 0.7 mcg/kg/h");
    assertValidInverse("mlh_to_dose", 12.25, c10.value, "mcg/kg/h", { concMcgMl: 4, weightKg: 70 }, "Dexmedetomidina Inversa");

    // ------------------------------------------------------------------------
    // CASO 11: Morfina 50 mg/50 mL (1 mg/mL), 3 mL/h -> 3 mg/h
    // ------------------------------------------------------------------------
    const c11 = engine.convertMlHToDose(3, "mg/h", { concMgMl: 1 });
    assertEqual(c11.value, 3.0, 1e-3, "Morfina: 3 mL/h -> 3 mg/h");
    assertValidInverse("mlh_to_dose", 3, c11.value, "mg/h", { concMgMl: 1 }, "Morfina Inversa");

    // ------------------------------------------------------------------------
    // CASO 12: Nitroglicerina 50 mg/250 mL (200 mcg/mL), 15 mL/h -> 50 mcg/min
    // ------------------------------------------------------------------------
    const c12 = engine.convertMlHToDose(15, "mcg/min", { concMcgMl: 200 });
    assertEqual(c12.value, 50.0, 1e-3, "Nitroglicerina: 15 mL/h -> 50 mcg/min");
    assertValidInverse("mlh_to_dose", 15, c12.value, "mcg/min", { concMcgMl: 200 }, "Nitroglicerina Inversa");

    // ------------------------------------------------------------------------
    // CASO 13: Nitroprussiato 50 mg/250 mL (200 mcg/mL), Peso 70 kg, 21 mL/h -> 1 mcg/kg/min
    // ------------------------------------------------------------------------
    const c13 = engine.convertMlHToDose(21, "mcg/kg/min", { concMcgMl: 200, weightKg: 70 });
    assertEqual(c13.value, 1.0, 1e-3, "Nitroprussiato: 21 mL/h -> 1 mcg/kg/min");
    assertValidInverse("mlh_to_dose", 21, c13.value, "mcg/kg/min", { concMcgMl: 200, weightKg: 70 }, "Nitroprussiato Inversa");

    // ------------------------------------------------------------------------
    // CASO 14: Cisatracúrio 100 mg/100 mL (1000 mcg/mL), Peso 70 kg, 6.3 mL/h -> 1.5 mcg/kg/min
    // ------------------------------------------------------------------------
    const c14 = engine.convertMlHToDose(6.3, "mcg/kg/min", { concMcgMl: 1000, weightKg: 70 });
    assertEqual(c14.value, 1.5, 1e-3, "Cisatracúrio: 6.3 mL/h -> 1.5 mcg/kg/min");
    assertValidInverse("mlh_to_dose", 6.3, c14.value, "mcg/kg/min", { concMcgMl: 1000, weightKg: 70 }, "Cisatracúrio Inversa");

    // ------------------------------------------------------------------------
    // CASO 15: Rocurônio 500 mg/100 mL (5000 mcg/mL), Peso 70 kg, 4.2 mL/h -> 5 mcg/kg/min
    // ------------------------------------------------------------------------
    const c15 = engine.convertMlHToDose(4.2, "mcg/kg/min", { concMcgMl: 5000, weightKg: 70 });
    assertEqual(c15.value, 5.0, 1e-3, "Rocurônio: 4.2 mL/h -> 5 mcg/kg/min");
    assertValidInverse("mlh_to_dose", 4.2, c15.value, "mcg/kg/min", { concMcgMl: 5000, weightKg: 70 }, "Rocurônio Inversa");

    // ------------------------------------------------------------------------
    // TESTES ADICIONAIS: Validações
    // ------------------------------------------------------------------------
    // Separador vírgula
    const cComma = engine.convertMlHToDose("12,5", "mcg/kg/min", { concMcgMl: 64, weightKg: 80 });
    assertEqual(cComma.value, 0.1666, 1e-2, "Teste Vírgula Decimal (12,5 mL/h)");

    // Bloqueio Peso Zero
    const cZeroW = engine.convertMlHToDose(10, "mcg/kg/min", { concMcgMl: 64, weightKg: 0 });
    assertEqual(cZeroW.error ? true : false, true, 0, "Bloqueio Peso Zero");
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
