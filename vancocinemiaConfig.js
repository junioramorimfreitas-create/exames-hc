/**
 * vancocinemiaConfig.js
 * Configurações institucionais, metas terapêuticas, limites locais de dose
 * e casos clínicos de referência para conferência pela Farmácia Clínica.
 *
 * Onde configurar os limites locais de dose do serviço:
 * - Edite o objeto `localDoseLimits` abaixo para definir o incremento de arredondamento
 *   (`doseStepMg`), limites por administração (`minDosePerAdminMg`, `maxDosePerAdminMg`),
 *   teto diário (`maxDailyDoseMg`) e intervalos permitidos (`allowedIntervalsHours`).
 * - Também é possível ajustar ou desativar temporariamente as regras diretamente na
 *   interface da calculadora ("Limites locais de dose do serviço").
 */

(function (globalScope) {
  const VANCOCINEMIA_CONFIG = {
    version: "1.0.0",
    lastRevision: "2026-11-12",
    scopeNotice:
      "Primeira versão validada para adultos com função renal estável, sem terapia renal substitutiva (TRS), recebendo doses regulares de vancomicina IV intermitente próximas do estado de equilíbrio.",
    references: [
      {
        label: "Diretriz ASHP/IDSA/PIDS/SIDP (2020)",
        url: "https://www.ashp.org/-/media/assets/policy-guidelines/docs/therapeutic-guidelines/therapeutic-guidelines-monitoring-vancomycin-ASHP-IDSA-PIDS.pdf"
      },
      {
        label: "Equações de Sawchuk–Zaske",
        url: "https://clincalc.com/vancomycin/"
      },
      {
        label: "Protocolo de Monitorização de Stanford",
        url: "https://med.stanford.edu/content/dam/sm/bugsanddrugs/documents/antimicrobial-dosing-protocols/SHC-Vancomycin-Dosing-Guide.pdf"
      }
    ],

    targets: {
      auc24Min: 400,
      auc24Max: 600,
      auc24Target: 500,
      referenceMic: 1.0
    },

    /**
     * Limites locais de dose configuráveis pelo serviço / farmácia clínica.
     */
    localDoseLimits: {
      enabled: true,
      doseStepMg: 250,
      minDosePerAdminMg: 250,
      maxDosePerAdminMg: 2000,
      maxDailyDoseMg: 4500,
      allowedIntervalsHours: [8, 12, 24, 36, 48],
      // Discrepância entre (início + τ) e horário informado da próxima dose acima da qual
      // o sistema exige revisão dos dados antes de calcular.
      intervalDiscrepancyToleranceHours: 0.5
    },

    /**
     * Casos clínicos de referência para conferência pela farmácia clínica.
     */
    referenceCases: [
      {
        id: "caso_dentro_meta",
        label: "Caso 1: Dentro da meta (1.000 mg q12h)",
        description:
          "Esquema 1.000 mg IV a cada 12 h, infusão 08h–09h, C1 = 30 mg/L (10h) e C2 = 12 mg/L (20h), MIC = 1 mg/L. Esperado: AUC24 ≈ 501 mg·h/L (manter esquema).",
        input: {
          doseMg: 1000,
          tauHours: 12,
          doseNumber: 3,
          steadyStateConfirmed: true,
          infusionStart: "2026-11-12T08:00",
          infusionEnd: "2026-11-12T09:00",
          nextDosePlanned: "2026-11-12T20:00",
          nextDoseActual: "",
          renalStable: true,
          onRRT: false,
          recentRegimenChange: false,
          missedDose: false,
          relevantDelay: false,
          interveningInfusion: false,
          c1Value: "30",
          c1Unit: "mg/L",
          c1Time: "2026-11-12T10:00",
          c2Value: "12",
          c2Unit: "mg/L",
          c2Time: "2026-11-12T20:00",
          confirmSampleBeforeNextDose: true,
          micMgL: "1",
          micMethod: "bmd",
          indicationScenario: "mrsa_serious"
        }
      },
      {
        id: "caso_abaixo_meta",
        label: "Caso 2: Abaixo da meta (20 / 8 mg/L)",
        description:
          "Esquema 1.000 mg IV a cada 12 h, infusão 08h–09h, C1 = 20 mg/L (10h) e C2 = 8 mg/L (20h), MIC = 1 mg/L. Esperado: AUC24 ≈ 334 mg·h/L; dose teórica ≈ 1.497 mg q12h; sugerida 1.500 mg q12h (AUC24 prevista ≈ 501 mg·h/L).",
        input: {
          doseMg: 1000,
          tauHours: 12,
          doseNumber: 3,
          steadyStateConfirmed: true,
          infusionStart: "2026-11-12T08:00",
          infusionEnd: "2026-11-12T09:00",
          nextDosePlanned: "2026-11-12T20:00",
          nextDoseActual: "",
          renalStable: true,
          onRRT: false,
          recentRegimenChange: false,
          missedDose: false,
          relevantDelay: false,
          interveningInfusion: false,
          c1Value: "20",
          c1Unit: "mg/L",
          c1Time: "2026-11-12T10:00",
          c2Value: "8",
          c2Unit: "mg/L",
          c2Time: "2026-11-12T20:00",
          confirmSampleBeforeNextDose: true,
          micMgL: "1",
          micMethod: "bmd",
          indicationScenario: "mrsa_serious"
        }
      },
      {
        id: "caso_intervalo_36h",
        label: "Caso 3: Intervalo estendido (36 h)",
        description:
          "Esquema 1.000 mg IV a cada 36 h, infusão 08h–09h, C1 = 28 mg/L (10h30) e C2 = 9 mg/L (19h30 do dia seguinte), MIC = 1 mg/L. Demonstra gráfico de 1 intervalo τ (36 h) com AUCτ e AUC média normalizada para 24 h.",
        input: {
          doseMg: 1000,
          tauHours: 36,
          doseNumber: 3,
          steadyStateConfirmed: true,
          infusionStart: "2026-11-12T08:00",
          infusionEnd: "2026-11-12T09:00",
          nextDosePlanned: "2026-11-13T20:00",
          nextDoseActual: "",
          renalStable: true,
          onRRT: false,
          recentRegimenChange: false,
          missedDose: false,
          relevantDelay: false,
          interveningInfusion: false,
          c1Value: "28",
          c1Unit: "mg/L",
          c1Time: "2026-11-12T10:30",
          c2Value: "9",
          c2Unit: "mg/L",
          c2Time: "2026-11-13T19:30",
          confirmSampleBeforeNextDose: true,
          micMgL: "1",
          micMethod: "bmd",
          indicationScenario: "mrsa_serious"
        }
      },
      {
        id: "caso_mic_2",
        label: "Caso 4: MIC = 2 mg/L (Revisão clínica)",
        description:
          "Mesmo perfil farmacocinético do Caso 1 com MIC = 2 mg/L. Demonstra cálculo da razão AUC24/MIC e bloqueio de escalonamento automático visando AUC24 = 1.000 mg·h/L.",
        input: {
          doseMg: 1000,
          tauHours: 12,
          doseNumber: 3,
          steadyStateConfirmed: true,
          infusionStart: "2026-11-12T08:00",
          infusionEnd: "2026-11-12T09:00",
          nextDosePlanned: "2026-11-12T20:00",
          nextDoseActual: "",
          renalStable: true,
          onRRT: false,
          recentRegimenChange: false,
          missedDose: false,
          relevantDelay: false,
          interveningInfusion: false,
          c1Value: "30",
          c1Unit: "mg/L",
          c1Time: "2026-11-12T10:00",
          c2Value: "12",
          c2Unit: "mg/L",
          c2Time: "2026-11-12T20:00",
          confirmSampleBeforeNextDose: true,
          micMgL: "2",
          micMethod: "bmd",
          indicationScenario: "mrsa_serious"
        }
      }
    ]
  };

  if (globalScope) {
    globalScope.__VANCOCINEMIA_CONFIG__ = VANCOCINEMIA_CONFIG;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = VANCOCINEMIA_CONFIG;
  }
})(typeof window !== "undefined" ? window : globalThis);
