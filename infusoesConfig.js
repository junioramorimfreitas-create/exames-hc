/**
 * infusoesConfig.js
 * Base de dados centralizada de medicamentos, presets de diluição,
 * unidades padronizadas e faixas terapêuticas clínicas de infusão.
 */

(function () {
  const INFUSOES_CONFIG = {
    version: "2.0.0",
    lastRevision: "2026-08-06",
    revisedBy: "Equipe de Terapia Intensiva / Farmácia Clínica",
    disclaimer: "Ferramenta auxiliar de cálculo. Confira sempre o medicamento, a apresentação, a diluição, o peso e a programação da bomba. As concentrações e faixas de dose devem ser validadas conforme o protocolo institucional. Esta ferramenta não substitui avaliação médica, prescrição, dupla checagem ou conferência da farmácia e da enfermagem.",
    
    categories: [
      { id: "vasopressores", name: "Vasopressores e inotrópicos" },
      { id: "sedacao", name: "Sedação, analgesia e anestesia" },
      { id: "bnm", name: "Bloqueadores neuromusculares" }
    ],

    drugs: [
      // ----------------------------------------------------
      // 1. NORADRENALINA
      // ----------------------------------------------------
      {
        id: "noradrenalina",
        name: "Noradrenalina",
        synonyms: ["Norepinefrina", "Nora"],
        category: "vasopressores",
        requiresWeight: true,
        preferredUnit: "mcg/kg/min",
        allowedUnits: ["mcg/kg/min"],
        presets: [
          { label: "16 mg em 250 mL (Padronizada 64 mcg/mL)", amountMg: 16, volumeMl: 250, concMcgMl: 64 },
          { label: "32 mg em 250 mL (Concentrada 128 mcg/mL)", amountMg: 32, volumeMl: 250, concMcgMl: 128 }
        ],
        commercialPresentations: [
          { label: "Ampola 4 mg / 4 mL", mgPerAmp: 4, mlPerAmp: 4 }
        ],
        contexts: [
          {
            id: "padrao",
            name: "Infusão Contínua",
            unit: "mcg/kg/min",
            ranges: [
              { label: "Faixa habitual", min: 0.02, max: 0.30, level: "info", text: "0,02 – 0,30 mcg/kg/min → faixa habitual" },
              { label: "Dose elevada", min: 0.30001, max: 0.50, level: "attention", text: "> 0,30 – 0,50 mcg/kg/min → dose elevada" },
              { label: "Dose alta / choque refratário", min: 0.50001, max: Infinity, level: "critical", text: "> 0,50 mcg/kg/min → dose alta / choque refratário" }
            ],
            messages: {
              attention: "Dose elevada de noradrenalina (> 0,30 mcg/kg/min). Avalie resposta hemodinâmica e vasopressores adicionais.",
              critical: "Dose alta / choque refratário de noradrenalina (> 0,50 mcg/kg/min). Realize dupla checagem rigorosa."
            }
          }
        ]
      },

      // ----------------------------------------------------
      // 2. ADRENALINA
      // ----------------------------------------------------
      {
        id: "adrenalina",
        name: "Adrenalina",
        synonyms: ["Epinefrina"],
        category: "vasopressores",
        requiresWeight: true,
        preferredUnit: "mcg/kg/min",
        allowedUnits: ["mcg/kg/min"],
        presets: [
          { label: "4 mg em 250 mL (16 mcg/mL)", amountMg: 4, volumeMl: 250, concMcgMl: 16 },
          { label: "8 mg em 250 mL (32 mcg/mL)", amountMg: 8, volumeMl: 250, concMcgMl: 32 },
          { label: "16 mg em 250 mL (64 mcg/mL)", amountMg: 16, volumeMl: 250, concMcgMl: 64 }
        ],
        commercialPresentations: [
          { label: "Ampola 1 mg / 1 mL", mgPerAmp: 1, mlPerAmp: 1 }
        ],
        contexts: [
          {
            id: "padrao",
            name: "Infusão Contínua",
            unit: "mcg/kg/min",
            ranges: [
              { label: "Faixa habitual", min: 0.01, max: 0.30, level: "info", text: "0,01 – 0,30 mcg/kg/min → faixa habitual" },
              { label: "Dose elevada", min: 0.30001, max: 0.50, level: "attention", text: "> 0,30 – 0,50 mcg/kg/min → dose elevada" },
              { label: "Dose alta / choque refratário", min: 0.50001, max: Infinity, level: "critical", text: "> 0,50 mcg/kg/min → dose alta / choque refratário" }
            ],
            messages: {
              attention: "Dose elevada de adrenalina (> 0,30 mcg/kg/min). Monitore arritmias, lactato e perfusão.",
              critical: "Dose alta / choque refratário de adrenalina (> 0,50 mcg/kg/min). Realize dupla checagem rigorosa."
            }
          }
        ]
      },

      // ----------------------------------------------------
      // 3. DOPAMINA
      // ----------------------------------------------------
      {
        id: "dopamina",
        name: "Dopamina",
        synonyms: ["Revivan"],
        category: "vasopressores",
        requiresWeight: true,
        preferredUnit: "mcg/kg/min",
        allowedUnits: ["mcg/kg/min"],
        presets: [
          { label: "200 mg em 250 mL (0.8 mg/mL)", amountMg: 200, volumeMl: 250, concMgMl: 0.8 },
          { label: "400 mg em 250 mL (1.6 mg/mL)", amountMg: 400, volumeMl: 250, concMgMl: 1.6 },
          { label: "800 mg em 250 mL (3.2 mg/mL)", amountMg: 800, volumeMl: 250, concMgMl: 3.2 }
        ],
        commercialPresentations: [
          { label: "Ampola 50 mg / 10 mL", mgPerAmp: 50, mlPerAmp: 10 }
        ],
        contexts: [
          {
            id: "padrao",
            name: "Infusão Contínua",
            unit: "mcg/kg/min",
            ranges: [
              { label: "Dose baixa", min: 2.0, max: 5.0, level: "info", text: "2 – 5 mcg/kg/min → dose baixa" },
              { label: "Efeito predominantemente inotrópico", min: 5.00001, max: 10.0, level: "info", text: "> 5 – 10 mcg/kg/min → efeito predominantemente inotrópico" },
              { label: "Efeito vasopressor", min: 10.00001, max: 20.0, level: "attention", text: "> 10 – 20 mcg/kg/min → efeito vasopressor" },
              { label: "Dose alta", min: 20.00001, max: 50.0, level: "critical", text: "> 20 mcg/kg/min → dose alta (50 mcg/kg/min = máximo em bula)" },
              { label: "Excede máximo em bula", min: 50.00001, max: Infinity, level: "critical", text: "> 50 mcg/kg/min → excede máximo sugerido em bula" }
            ],
            messages: {
              attention: "Dose com efeito vasopressor (> 10 mcg/kg/min). Risco aumentado de taquiarritmias.",
              critical: "Dose alta de dopamina (> 20 mcg/kg/min). 50 mcg/kg/min é o máximo sugerido em bula."
            }
          }
        ]
      },

      // ----------------------------------------------------
      // 4. DOBUTAMINA
      // ----------------------------------------------------
      {
        id: "dobutamina",
        name: "Dobutamina",
        synonyms: ["Dobutrex"],
        category: "vasopressores",
        requiresWeight: true,
        preferredUnit: "mcg/kg/min",
        allowedUnits: ["mcg/kg/min"],
        presets: [
          { label: "250 mg em 250 mL (1 mg/mL)", amountMg: 250, volumeMl: 250, concMgMl: 1 },
          { label: "500 mg em 250 mL (2 mg/mL)", amountMg: 500, volumeMl: 250, concMgMl: 2 },
          { label: "1.000 mg em 250 mL (4 mg/mL)", amountMg: 1000, volumeMl: 250, concMgMl: 4 }
        ],
        commercialPresentations: [
          { label: "Ampola 250 mg / 20 mL", mgPerAmp: 250, mlPerAmp: 20 }
        ],
        contexts: [
          {
            id: "padrao",
            name: "Infusão Contínua",
            unit: "mcg/kg/min",
            ranges: [
              { label: "Faixa habitual", min: 2.5, max: 10.0, level: "info", text: "2,5 – 10 mcg/kg/min → faixa habitual" },
              { label: "Dose elevada", min: 10.00001, max: 15.0, level: "attention", text: "> 10 – 15 mcg/kg/min → dose elevada" },
              { label: "Dose alta", min: 15.00001, max: 20.0, level: "attention", text: "> 15 – 20 mcg/kg/min → dose alta" },
              { label: "Uso excepcional (arritmias)", min: 20.00001, max: 40.0, level: "critical", text: "> 20 – 40 mcg/kg/min → uso excepcional; maior risco de taquicardia e arritmias" },
              { label: "Acima da faixa de referência", min: 40.00001, max: Infinity, level: "critical", text: "> 40 mcg/kg/min → excede faixa de referência" }
            ],
            messages: {
              attention: "Dose elevada de dobutamina (> 10 mcg/kg/min). Monitore frequência cardíaca e arritmias.",
              critical: "Uso excepcional (> 20 mcg/kg/min). Elevado risco de taquicardia e taquiarritmias."
            }
          }
        ]
      },

      // ----------------------------------------------------
      // 5. VASOPRESSINA
      // ----------------------------------------------------
      {
        id: "vasopressina",
        name: "Vasopressina",
        synonyms: ["AVP", "Pitressin"],
        category: "vasopressores",
        requiresWeight: false,
        noWeightNotice: "A vasopressina é prescrita em UI/min e seu cálculo não depende do peso corporal.",
        preferredUnit: "UI/min",
        allowedUnits: ["UI/min"],
        presets: [
          { label: "20 UI em 100 mL (0.2 UI/mL)", amountUI: 20, volumeMl: 100, concUIMl: 0.2 },
          { label: "40 UI em 100 mL (0.4 UI/mL)", amountUI: 40, volumeMl: 100, concUIMl: 0.4 }
        ],
        commercialPresentations: [
          { label: "Ampola 20 UI / 1 mL", uiPerAmp: 20, mlPerAmp: 1 }
        ],
        contexts: [
          {
            id: "padrao",
            name: "Infusão Contínua",
            unit: "UI/min",
            ranges: [
              { label: "Faixa habitual", min: 0.01, max: 0.04001, level: "info", text: "0,01 – 0,04 unidades/min → faixa habitual (0,03 UI/min é a dose fixa mais utilizada no choque séptico)" },
              { label: "Dose alta / resgate (isquemia)", min: 0.04001001, max: Infinity, level: "critical", text: "> 0,04 unidades/min → dose alta / resgate, com maior risco de isquemia" }
            ],
            messages: {
              critical: "Dose alta / resgate (> 0,04 UI/min). Elevado risco de isquemia coronariana, mesentérica e digital."
            }
          }
        ]
      },

      // ----------------------------------------------------
      // 6. MIDAZOLAM
      // ----------------------------------------------------
      {
        id: "midazolam",
        name: "Midazolam",
        synonyms: ["Dormonid"],
        category: "sedacao",
        requiresWeight: true,
        preferredUnit: "mg/kg/h",
        allowedUnits: ["mg/kg/h"],
        presets: [
          { label: "50 mg em 50 mL (1 mg/mL)", amountMg: 50, volumeMl: 50, concMgMl: 1 },
          { label: "100 mg em 100 mL (1 mg/mL)", amountMg: 100, volumeMl: 100, concMgMl: 1 },
          { label: "100 mg em 250 mL (0.4 mg/mL)", amountMg: 100, volumeMl: 250, concMgMl: 0.4 }
        ],
        commercialPresentations: [
          { label: "Ampola 50 mg / 10 mL", mgPerAmp: 50, mlPerAmp: 10 }
        ],
        contexts: [
          {
            id: "padrao",
            name: "Infusão Contínua",
            unit: "mg/kg/h",
            ranges: [
              { label: "Faixa habitual", min: 0.02, max: 0.10, level: "info", text: "0,02 – 0,10 mg/kg/h → faixa habitual" },
              { label: "Dose alta", min: 0.10001, max: 0.20, level: "attention", text: "> 0,10 – 0,20 mg/kg/h → dose alta" },
              { label: "Dose muito alta / excepcional", min: 0.20001, max: Infinity, level: "critical", text: "> 0,20 mg/kg/h → dose muito alta / excepcional" }
            ],
            messages: {
              attention: "Dose alta de midazolam (> 0,10 mg/kg/h). Avalie acúmulo e desmame ventilatório.",
              critical: "Dose muito alta / excepcional (> 0,20 mg/kg/h). Elevado risco de desmame difícil."
            }
          }
        ]
      },

      // ----------------------------------------------------
      // 7. PROPOFOL
      // ----------------------------------------------------
      {
        id: "propofol",
        name: "Propofol",
        synonyms: ["Diprivan", "Fresofol"],
        category: "sedacao",
        requiresWeight: true,
        preferredUnit: "mcg/kg/min",
        allowedUnits: ["mcg/kg/min"],
        presets: [
          { label: "Solução a 1%: 10 mg/mL (Frasco sem diluição)", amountMg: 1000, volumeMl: 100, concMgMl: 10 },
          { label: "Solução a 2%: 20 mg/mL (Frasco concentrado)", amountMg: 2000, volumeMl: 100, concMgMl: 20 }
        ],
        commercialPresentations: [
          { label: "Frasco 100 mL a 1% (1000 mg)", mgPerAmp: 1000, mlPerAmp: 100 }
        ],
        contexts: [
          {
            id: "padrao",
            name: "Infusão Contínua",
            unit: "mcg/kg/min",
            ranges: [
              { label: "Faixa habitual de sedação na UTI", min: 5.0, max: 50.0, level: "info", text: "5 – 50 mcg/kg/min → faixa habitual de sedação na UTI" },
              { label: "Dose alta", min: 50.00001, max: 67.0, level: "attention", text: "> 50 – 67 mcg/kg/min → dose alta" },
              { label: "Dose muito alta (Risco PRIS)", min: 67.00001, max: Infinity, level: "critical", text: "> 67 mcg/kg/min ou > 4 mg/kg/h → dose muito alta (risco de PRIS)" }
            ],
            messages: {
              attention: "Dose alta de propofol (> 50 mcg/kg/min). Monitore triglicérides e estabilidade hemodinâmica.",
              critical: "Dose muito alta (> 67 mcg/kg/min ou > 4 mg/kg/h). Risco de Síndrome da Infusão do Propofol (PRIS)."
            }
          }
        ]
      },

      // ----------------------------------------------------
      // 8. FENTANIL
      // ----------------------------------------------------
      {
        id: "fentanil",
        name: "Fentanil",
        synonyms: ["Fentanest", "Fentany"],
        category: "sedacao",
        requiresWeight: true,
        preferredUnit: "mcg/kg/h",
        allowedUnits: ["mcg/kg/h"],
        presets: [
          { label: "500 mcg em 50 mL (10 mcg/mL)", amountMcg: 500, volumeMl: 50, concMcgMl: 10 },
          { label: "1.000 mcg em 100 mL (10 mcg/mL)", amountMcg: 1000, volumeMl: 100, concMcgMl: 10 },
          { label: "2.500 mcg em 250 mL (10 mcg/mL)", amountMcg: 2500, volumeMl: 250, concMcgMl: 10 }
        ],
        commercialPresentations: [
          { label: "Frasco-ampola 500 mcg / 10 mL", mcgPerAmp: 500, mlPerAmp: 10 }
        ],
        contexts: [
          {
            id: "padrao",
            name: "Infusão Contínua",
            unit: "mcg/kg/h",
            ranges: [
              { label: "Faixa habitual", min: 0.5, max: 3.0, level: "info", text: "0,5 – 3 mcg/kg/h → faixa habitual" },
              { label: "Dose elevada", min: 3.00001, max: 5.0, level: "attention", text: "> 3 – 5 mcg/kg/h → dose elevada" },
              { label: "Dose alta", min: 5.00001, max: Infinity, level: "critical", text: "> 5 mcg/kg/h → dose alta; avaliar tolerância, hiperalgesia e acúmulo" }
            ],
            messages: {
              attention: "Dose elevada de fentanil (> 3 mcg/kg/h). Avalie tolerância e analgesia multimodal.",
              critical: "Dose alta de fentanil (> 5 mcg/kg/h). Avaliar tolerância, hiperalgesia e acúmulo."
            }
          }
        ]
      },

      // ----------------------------------------------------
      // 9. CETAMINA
      // ----------------------------------------------------
      {
        id: "cetamina",
        name: "Cetamina",
        synonyms: ["Quetamina", "Ketamina", "Ketalar"],
        category: "sedacao",
        requiresWeight: true,
        preferredUnit: "mg/kg/h",
        allowedUnits: ["mg/kg/h"],
        presets: [
          { label: "100 mg em 50 mL (2 mg/mL)", amountMg: 100, volumeMl: 50, concMgMl: 2 },
          { label: "250 mg em 50 mL (5 mg/mL)", amountMg: 250, volumeMl: 50, concMgMl: 5 },
          { label: "500 mg em 100 mL (5 mg/mL)", amountMg: 500, volumeMl: 100, concMgMl: 5 },
          { label: "500 mg em 250 mL (2 mg/mL)", amountMg: 500, volumeMl: 250, concMgMl: 2 }
        ],
        commercialPresentations: [
          { label: "Frasco-ampola 500 mg / 10 mL (50 mg/mL)", mgPerAmp: 500, mlPerAmp: 10 }
        ],
        contexts: [
          {
            id: "analgesia",
            name: "Indicação: Analgesia",
            unit: "mg/kg/h",
            ranges: [
              { label: "Faixa analgésica habitual", min: 0.05, max: 0.40, level: "info", text: "0,05 – 0,40 mg/kg/h → faixa analgésica habitual" },
              { label: "Dose analgésica elevada", min: 0.40001, max: 1.00, level: "attention", text: "> 0,40 – 1 mg/kg/h → dose analgésica elevada" },
              { label: "Acima da faixa analgésica", min: 1.00001, max: Infinity, level: "critical", text: "> 1,00 mg/kg/h → acima da faixa analgésica habitual" }
            ],
            messages: {
              attention: "Dose analgésica elevada (> 0,40 mg/kg/h)."
            }
          },
          {
            id: "sedacao",
            name: "Indicação: Sedação",
            unit: "mg/kg/h",
            ranges: [
              { label: "Faixa sedativa habitual", min: 0.5, max: 2.0, level: "info", text: "0,5 – 2 mg/kg/h → faixa sedativa habitual" },
              { label: "Dose alta", min: 2.00001, max: 4.0, level: "attention", text: "> 2 – 4 mg/kg/h → dose alta, reservada para situações selecionadas" },
              { label: "Dose muito alta", min: 4.00001, max: Infinity, level: "critical", text: "> 4 mg/kg/h → dose muito alta" }
            ],
            messages: {
              attention: "Dose alta de sedação (> 2 mg/kg/h), reservada para situações selecionadas."
            }
          }
        ]
      },

      // ----------------------------------------------------
      // 10. DEXMEDETOMIDINA
      // ----------------------------------------------------
      {
        id: "dexmedetomidina",
        name: "Dexmedetomidina",
        synonyms: ["Precedex"],
        category: "sedacao",
        requiresWeight: true,
        preferredUnit: "mcg/kg/h",
        allowedUnits: ["mcg/kg/h"],
        presets: [
          { label: "200 mcg em 50 mL (4 mcg/mL)", amountMcg: 200, volumeMl: 50, concMcgMl: 4 },
          { label: "400 mcg em 100 mL (4 mcg/mL)", amountMcg: 400, volumeMl: 100, concMcgMl: 4 },
          { label: "1.000 mcg em 250 mL (4 mcg/mL)", amountMcg: 1000, volumeMl: 250, concMcgMl: 4 }
        ],
        commercialPresentations: [
          { label: "Frasco-ampola 200 mcg / 2 mL", mcgPerAmp: 200, mlPerAmp: 2 }
        ],
        contexts: [
          {
            id: "padrao",
            name: "Infusão Contínua",
            unit: "mcg/kg/h",
            ranges: [
              { label: "Faixa habitual aprovada", min: 0.2, max: 0.7, level: "info", text: "0,2 – 0,7 mcg/kg/h → faixa habitual aprovada" },
              { label: "Dose elevada", min: 0.70001, max: 1.5, level: "attention", text: "> 0,7 – 1,5 mcg/kg/h → dose elevada, utilizada em alguns protocolos" },
              { label: "Dose muito alta", min: 1.50001, max: Infinity, level: "critical", text: "> 1,5 mcg/kg/h → dose muito alta; provavelmente pouco benefício adicional e mais bradicardia/hipotensão" }
            ],
            messages: {
              attention: "Dose elevada (> 0,7 mcg/kg/h). Monitore bradicardia e hipotensão.",
              critical: "Dose muito alta (> 1,5 mcg/kg/h). Pouco benefício adicional e maior risco de bradicardia/hipotensão."
            }
          }
        ]
      },

      // ----------------------------------------------------
      // 11. MORFINA
      // ----------------------------------------------------
      {
        id: "morfina",
        name: "Morfina",
        synonyms: ["Dimorf"],
        category: "sedacao",
        requiresWeight: false,
        noWeightNotice: "A morfina é prescrita em mg/h e seu cálculo não depende do peso corporal.",
        preferredUnit: "mg/h",
        allowedUnits: ["mg/h"],
        presets: [
          { label: "50 mg em 50 mL (1 mg/mL)", amountMg: 50, volumeMl: 50, concMgMl: 1 },
          { label: "100 mg em 100 mL (1 mg/mL)", amountMg: 100, volumeMl: 100, concMgMl: 1 },
          { label: "100 mg em 250 mL (0.4 mg/mL)", amountMg: 100, volumeMl: 250, concMgMl: 0.4 }
        ],
        commercialPresentations: [
          { label: "Ampola 10 mg / 1 mL", mgPerAmp: 10, mlPerAmp: 1 }
        ],
        contexts: [
          {
            id: "padrao",
            name: "Infusão Contínua",
            unit: "mg/h",
            ranges: [
              { label: "Faixa habitual", min: 1.0, max: 5.0, level: "info", text: "1 – 5 mg/h → faixa habitual" },
              { label: "Dose elevada", min: 5.00001, max: 10.0, level: "attention", text: "> 5 – 10 mg/h → dose elevada" },
              { label: "Dose alta", min: 10.00001, max: Infinity, level: "critical", text: "> 10 mg/h → dose alta, embora possa ser necessária em pacientes tolerantes" }
            ],
            messages: {
              attention: "Dose elevada de morfina (> 5 mg/h). Avalie tolerância e função renal.",
              critical: "Dose alta de morfina (> 10 mg/h)."
            }
          }
        ]
      },

      // ----------------------------------------------------
      // 12. NITROGLICERINA (TRIDIL)
      // ----------------------------------------------------
      {
        id: "nitroglicerina",
        name: "Nitroglicerina",
        synonyms: ["Tridil", "NTG"],
        category: "vasopressores",
        requiresWeight: false,
        preferredUnit: "mcg/min",
        allowedUnits: ["mcg/min"],
        presets: [
          { label: "25 mg em 250 mL (100 mcg/mL)", amountMg: 25, volumeMl: 250, concMgMl: 0.1, concMcgMl: 100 },
          { label: "50 mg em 250 mL (200 mcg/mL)", amountMg: 50, volumeMl: 250, concMgMl: 0.2, concMcgMl: 200 },
          { label: "100 mg em 250 mL (400 mcg/mL)", amountMg: 100, volumeMl: 250, concMgMl: 0.4, concMcgMl: 400 }
        ],
        commercialPresentations: [
          { label: "Ampola 50 mg / 10 mL", mgPerAmp: 50, mlPerAmp: 10 }
        ],
        contexts: [
          {
            id: "padrao",
            name: "Infusão Contínua",
            unit: "mcg/min",
            ranges: [
              { label: "Faixa habitual", min: 5.0, max: 100.0, level: "info", text: "5 – 100 mcg/min → faixa habitual" },
              { label: "Dose elevada", min: 100.0001, max: 200.0, level: "attention", text: "> 100 – 200 mcg/min → dose elevada" },
              { label: "Dose alta", min: 200.0001, max: 400.0, level: "critical", text: "> 200 – 400 mcg/min → dose alta (EAP hipertensivo)" },
              { label: "Dose excepcional", min: 400.0001, max: Infinity, level: "critical", text: "> 400 mcg/min → dose excepcional, dependente de protocolo" }
            ],
            messages: {
              attention: "Dose elevada de nitroglicerina (> 100 mcg/min). Monitorar PA e cefaleia.",
              critical: "Dose alta / excepcional de nitroglicerina (> 200 mcg/min). Risco de hipotensão severa e taquifilaxia."
            }
          }
        ]
      },

      // ----------------------------------------------------
      // 13. NITROPRUSSIATO DE SÓDIO (NIPRIDE)
      // ----------------------------------------------------
      {
        id: "nitroprussiato",
        name: "Nitroprussiato de sódio",
        synonyms: ["Nipride", "SNP"],
        category: "vasopressores",
        requiresWeight: true,
        preferredUnit: "mcg/kg/min",
        allowedUnits: ["mcg/kg/min"],
        presets: [
          { label: "50 mg em 250 mL (200 mcg/mL)", amountMg: 50, volumeMl: 250, concMgMl: 0.2, concMcgMl: 200 },
          { label: "50 mg em 100 mL (500 mcg/mL)", amountMg: 50, volumeMl: 100, concMgMl: 0.5, concMcgMl: 500 }
        ],
        commercialPresentations: [
          { label: "Ampola 50 mg / 2 mL", mgPerAmp: 50, mlPerAmp: 2 }
        ],
        contexts: [
          {
            id: "padrao",
            name: "Infusão Contínua",
            unit: "mcg/kg/min",
            ranges: [
              { label: "Faixa habitual", min: 0.3, max: 2.0, level: "info", text: "0,3 – 2 mcg/kg/min → faixa habitual" },
              { label: "Dose elevada", min: 2.0001, max: 5.0, level: "attention", text: "> 2 – 5 mcg/kg/min → dose elevada; maior produção de cianeto" },
              { label: "Dose alta / resgate", min: 5.0001, max: 10.0, level: "critical", text: "> 5 – 10 mcg/kg/min → dose alta/resgate (limitar ao menor tempo possível e não manter >10 min em dose máxima)" },
              { label: "Acima da dose máxima", min: 10.0001, max: Infinity, level: "critical", text: "> 10 mcg/kg/min → dose máxima excedida" }
            ],
            messages: {
              attention: "Dose elevada de nitroprussiato (> 2 mcg/kg/min).\nObs. na disfunção renal: TFGe <30 mL/min/1,73 m²: manter dose média < 3 mcg/kg/min. Anúria: manter dose média ≤ 1 mcg/kg/min.",
              critical: "Dose alta de nitroprussiato (> 5 mcg/kg/min). Risco grave de cianeto e tiocianato. Na disfunção renal (TFGe <30 mL/min/1,73 m²): manter dose média < 3 mcg/kg/min. Anúria: manter dose média ≤ 1 mcg/kg/min."
            }
          }
        ]
      },

      // ----------------------------------------------------
      // 14. CISATRACÚRIO (NIMBIUM)
      // ----------------------------------------------------
      {
        id: "cisatracurio",
        name: "Cisatracúrio",
        synonyms: ["Nimbium"],
        category: "bnm",
        requiresWeight: true,
        preferredUnit: "mcg/kg/min",
        allowedUnits: ["mcg/kg/min"],
        presets: [
          { label: "100 mg em 100 mL (1 mg/mL)", amountMg: 100, volumeMl: 100, concMgMl: 1, concMcgMl: 1000 }
        ],
        commercialPresentations: [
          { label: "Ampola 10 mg / 5 mL", mgPerAmp: 10, mlPerAmp: 5 },
          { label: "Ampola 20 mg / 10 mL", mgPerAmp: 20, mlPerAmp: 10 }
        ],
        contexts: [
          {
            id: "padrao",
            name: "Infusão Contínua",
            unit: "mcg/kg/min",
            ranges: [
              { label: "Manutenção habitual", min: 1.0, max: 2.0, level: "info", text: "1 – 2 mcg/kg/min → manutenção habitual" },
              { label: "Dose elevada", min: 2.0001, max: 3.0, level: "attention", text: "> 2 – 3 mcg/kg/min → dose elevada" },
              { label: "Dose alta", min: 3.0001, max: 5.0, level: "critical", text: "> 3 – 5 mcg/kg/min → dose alta" },
              { label: "Dose excepcional", min: 5.0001, max: 10.2, level: "critical", text: "> 5 – 10,2 mcg/kg/min → dose excepcional" },
              { label: "Acima do limite", min: 10.2001, max: Infinity, level: "critical", text: "> 10,2 mcg/kg/min → acima do limite superior descrito" }
            ],
            messages: {
              attention: "Dose elevada de cisatracúrio (> 2 mcg/kg/min). Monitorar profundidade de bloqueio (TOF).",
              critical: "Dose alta / excepcional de cisatracúrio (> 3 mcg/kg/min). Garantir sedação profunda adequada e monitorar TOF."
            }
          }
        ]
      },

      // ----------------------------------------------------
      // 15. ROCURÔNIO (ESMERON)
      // ----------------------------------------------------
      {
        id: "rocuronio",
        name: "Rocurônio",
        synonyms: ["Esmeron"],
        category: "bnm",
        requiresWeight: true,
        preferredUnit: "mcg/kg/min",
        allowedUnits: ["mcg/kg/min"],
        presets: [
          { label: "500 mg em 100 mL (5 mg/mL)", amountMg: 500, volumeMl: 100, concMgMl: 5, concMcgMl: 5000 },
          { label: "500 mg em 500 mL (1 mg/mL)", amountMg: 500, volumeMl: 500, concMgMl: 1, concMcgMl: 1000 }
        ],
        commercialPresentations: [
          { label: "Frasco-ampola 50 mg / 5 mL", mgPerAmp: 50, mlPerAmp: 5 }
        ],
        contexts: [
          {
            id: "padrao",
            name: "Infusão Contínua",
            unit: "mcg/kg/min",
            ranges: [
              { label: "Faixa habitual", min: 4.0, max: 10.0, level: "info", text: "4 – 10 mcg/kg/min → faixa habitual" },
              { label: "Dose elevada", min: 10.0001, max: 16.0, level: "attention", text: "> 10 – 16 mcg/kg/min → dose elevada" },
              { label: "Acima da faixa habitual", min: 16.0001, max: Infinity, level: "critical", text: "> 16 mcg/kg/min → acima da faixa habitual descrita; confirmar indicação e monitorização" }
            ],
            messages: {
              attention: "Dose elevada de rocurônio (> 10 mcg/kg/min). Monitorar TOF.",
              critical: "Dose acima da faixa habitual de rocurônio (> 16 mcg/kg/min). Confirmar indicação, sedação profunda e monitorização neuromuscular."
            }
          }
        ]
      }
    ]
  };

  // Expor no escopo global
  window.__INFUSOES_CONFIG__ = INFUSOES_CONFIG;
})();
