/**
 * infusoesConfig.js
 * Base de dados centralizada de medicamentos, presets de diluição,
 * faixas clínicas de infusão, alertas e referências bibliográficas.
 */

(function () {
  const INFUSOES_CONFIG = {
    version: "1.0.0",
    lastRevision: "2026-08-05",
    revisedBy: "Equipe de Terapia Intensiva / Farmácia Clínica",
    disclaimer: "Ferramenta auxiliar de cálculo. Confira sempre o medicamento, a apresentação, a diluição, o peso, a unidade prescrita e a programação da bomba. As concentrações e faixas de dose devem ser validadas conforme o protocolo institucional. Esta ferramenta não substitui avaliação médica, prescrição, dupla checagem ou conferência da farmácia e da enfermagem.",
    
    categories: [
      { id: "vasopressores", name: "Vasopressores e inotrópicos" },
      { id: "sedacao", name: "Sedação, analgesia e anestesia" }
    ],

    drugs: [
      // ----------------------------------------------------
      // NORADRENALINA
      // ----------------------------------------------------
      {
        id: "noradrenalina",
        name: "Noradrenalina",
        synonyms: ["Norepinefrina", "Nora"],
        category: "vasopressores",
        requiresWeight: true,
        preferredUnit: "mcg/kg/min",
        allowedUnits: ["mcg/kg/min", "mcg/min", "mcg/h", "mL/h"],
        presets: [
          { label: "16 mg em 250 mL (Padronizada 64 mcg/mL)", amountMg: 16, volumeMl: 250, concMcgMl: 64 },
          { label: "32 mg em 250 mL (Concentrada 128 mcg/mL)", amountMg: 32, volumeMl: 250, concMcgMl: 128 }
        ],
        commercialPresentations: [
          { label: "Ampola 4 mg / 4 mL", mgPerAmp: 4, mlPerAmp: 4 }
        ],
        contexts: [
          {
            id: "choque",
            name: "Choque circulatório / Vasoplégico",
            unit: "mcg/kg/min",
            rangeInitial: { min: 0.02, max: 0.10 },
            rangeUsual: { min: 0.02, max: 1.00 },
            attentionThreshold: 0.25,
            highDoseThreshold: 0.50,
            criticalThreshold: 1.00,
            messages: {
              attention: "Dose de noradrenalina em faixa de atenção (> 0,25 mcg/kg/min). Confirme peso, concentração, unidade e programação da bomba. Avalie o contexto hemodinâmico e a necessidade de estratégias vasopressoras adicionais (ex.: vasopressina, corticoide).",
              highDose: "Dose elevada de noradrenalina (> 0,50 mcg/kg/min). Realize dupla checagem do medicamento, peso, concentração, unidade e velocidade da bomba.",
              critical: "Alerta crítico: dose muito elevada de noradrenalina (> 1 mcg/kg/min). Exige confirmação de dupla checagem e revisão de acessos e programação."
            }
          }
        ],
        references: [
          { title: "Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock", year: 2021, link: "https://www.sccm.org" },
          { title: "SCCM Guidelines on Hemodynamic Support in Septic Shock", year: 2023 }
        ]
      },

      // ----------------------------------------------------
      // ADRENALINA
      // ----------------------------------------------------
      {
        id: "adrenalina",
        name: "Adrenalina",
        synonyms: ["Epinefrina"],
        category: "vasopressores",
        requiresWeight: true,
        preferredUnit: "mcg/kg/min",
        allowedUnits: ["mcg/kg/min", "mcg/min", "mcg/h", "mL/h"],
        presets: [
          { label: "4 mg em 250 mL (16 mcg/mL)", amountMg: 4, volumeMl: 250, concMcgMl: 16 },
          { label: "8 mg em 250 mL (32 mcg/mL)", amountMg: 8, volumeMl: 250, concMcgMl: 32 },
          { label: "16 mg em 250 mL (64 mcg/mL)", amountMg: 16, volumeMl: 250, concMcgMl: 64 }
        ],
        commercialPresentations: [
          { label: "Ampola 1 mg / 1 mL", mgPerAmp: 1, mlPerAmp: 1 }
        ],
        warningNotice: "Não aplicar estas faixas a parada cardiorrespiratória, anafilaxia em bolus, uso intramuscular ou protocolos pediátricos.",
        contexts: [
          {
            id: "suporte_hemodinamico",
            name: "Suporte hemodinâmico no choque",
            unit: "mcg/kg/min",
            rangeInitial: { min: 0.05, max: 0.10 },
            rangeUsual: { min: 0.05, max: 2.00 },
            attentionThreshold: 0.50,
            highDoseThreshold: 1.00,
            referenceLimit: 2.00,
            messages: {
              attention: "Dose elevada de adrenalina (> 0,5 mcg/kg/min). Confirme concentração, unidade, peso e indicação clínica. Monitore arritmias, lactato, glicemia e sinais de isquemia periférica/visceral.",
              highDose: "Dose muito elevada de adrenalina (> 1 mcg/kg/min). Faça dupla checagem independente de dose, diluição e taxa da bomba."
            }
          }
        ],
        references: [
          { title: "SCCM Critical Care Medicine Guidelines", year: 2021 }
        ]
      },

      // ----------------------------------------------------
      // VASOPRESSINA
      // ----------------------------------------------------
      {
        id: "vasopressina",
        name: "Vasopressina",
        synonyms: ["AVP", "Pitressin"],
        category: "vasopressores",
        requiresWeight: false,
        noWeightNotice: "A vasopressina é usualmente prescrita em UI/min ou UI/h e sua conversão padrão não depende do peso corporal.",
        preferredUnit: "UI/min",
        allowedUnits: ["UI/min", "UI/h", "mL/h"],
        presets: [
          { label: "20 UI em 100 mL (0.2 UI/mL)", amountUI: 20, volumeMl: 100, concUIMl: 0.2 },
          { label: "40 UI em 100 mL (0.4 UI/mL)", amountUI: 40, volumeMl: 100, concUIMl: 0.4 }
        ],
        commercialPresentations: [
          { label: "Ampola 20 UI / 1 mL", uiPerAmp: 20, mlPerAmp: 1 }
        ],
        equivalences: [
          "0,01 UI/min = 0,6 UI/h",
          "0,03 UI/min = 1,8 UI/h",
          "0,04 UI/min = 2,4 UI/h",
          "0,07 UI/min = 4,2 UI/h",
          "0,10 UI/min = 6,0 UI/h"
        ],
        contexts: [
          {
            id: "choque_septico",
            name: "Choque séptico / Vasodilatatório",
            unit: "UI/min",
            rangeInitial: { min: 0.01, max: 0.01 },
            frequentDose: 0.03,
            rangeUsual: { min: 0.01, max: 0.04 },
            attentionThreshold: 0.04,
            referenceLimitSeptic: 0.07,
            referenceLimitCardiotomy: 0.10,
            messages: {
              attention: "Dose de vasopressina acima de 0,04 UI/min (faixa mais frequentemente empregada no choque séptico). Confirme a indicação e monitore sinais de isquemia coronariana, mesentérica e digital."
            }
          }
        ],
        references: [
          { title: "Surviving Sepsis Campaign Guidelines", year: 2021 }
        ]
      },

      // ----------------------------------------------------
      // DOBUTAMINA
      // ----------------------------------------------------
      {
        id: "dobutamina",
        name: "Dobutamina",
        synonyms: ["Dobutrex"],
        category: "vasopressores",
        requiresWeight: true,
        preferredUnit: "mcg/kg/min",
        allowedUnits: ["mcg/kg/min", "mg/kg/h", "mg/h", "mL/h"],
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
            id: "inotropico",
            name: "Suporte inotrópico no choque cardiogênico / disfunção miocárdica",
            unit: "mcg/kg/min",
            rangeInitial: { min: 0.5, max: 2.5 },
            rangeUsual: { min: 2.5, max: 15.0 },
            attentionThreshold: 15.0,
            highDoseThreshold: 20.0,
            exceptionalLimit: 40.0,
            messages: {
              attention: "Dose elevada de dobutamina (> 15 mcg/kg/min). Confirme peso, concentração e programação da bomba. Avalie frequência cardíaca, arritmias, pressão arterial, perfusão e resposta hemodinâmica.",
              highDose: "Dose muito elevada de dobutamina (> 20 mcg/kg/min). Doses próximas a 40 mcg/kg/min são excepcionais e não representam faixa habitual."
            }
          }
        ],
        references: [
          { title: "European Society of Cardiology Heart Failure Guidelines", year: 2021 }
        ]
      },

      // ----------------------------------------------------
      // DOPAMINA
      // ----------------------------------------------------
      {
        id: "dopamina",
        name: "Dopamina",
        synonyms: ["Revivan"],
        category: "vasopressores",
        requiresWeight: true,
        preferredUnit: "mcg/kg/min",
        allowedUnits: ["mcg/kg/min", "mg/kg/h", "mg/h", "mL/h"],
        presets: [
          { label: "200 mg em 250 mL (0.8 mg/mL)", amountMg: 200, volumeMl: 250, concMgMl: 0.8 },
          { label: "400 mg em 250 mL (1.6 mg/mL)", amountMg: 400, volumeMl: 250, concMgMl: 1.6 },
          { label: "800 mg em 250 mL (3.2 mg/mL)", amountMg: 800, volumeMl: 250, concMgMl: 3.2 }
        ],
        commercialPresentations: [
          { label: "Ampola 50 mg / 10 mL", mgPerAmp: 50, mlPerAmp: 10 }
        ],
        warningNotice: "Não utilizar ou exibir o conceito de 'dose renal'. A dopamina não é recomendada para prevenção ou tratamento de lesão renal aguda.",
        contexts: [
          {
            id: "inotropico_vasopressao",
            name: "Inotropismo / Vasopressão",
            unit: "mcg/kg/min",
            rangeInitial: { min: 2.0, max: 5.0 },
            rangeUsual: { min: 2.0, max: 20.0 },
            attentionThreshold: 10.0,
            highDoseThreshold: 20.0,
            referenceLimit: 50.0,
            messages: {
              attention: "Dose acima de 10 mcg/kg/min associada a maior efeito alfa-adrenérgico e maior risco de taquiarritmias. Confirme peso, concentração, unidade e indicação."
            }
          }
        ],
        references: [
          { title: "AHA/ACC Heart Failure & Shock Guidelines", year: 2022 }
        ]
      },

      // ----------------------------------------------------
      // MIDAZOLAM
      // ----------------------------------------------------
      {
        id: "midazolam",
        name: "Midazolam",
        synonyms: ["Dormonid"],
        category: "sedacao",
        requiresWeight: true,
        preferredUnit: "mg/kg/h",
        allowedUnits: ["mg/h", "mg/kg/h", "mcg/kg/min", "mL/h"],
        presets: [
          { label: "50 mg em 50 mL (1 mg/mL)", amountMg: 50, volumeMl: 50, concMgMl: 1 },
          { label: "100 mg em 100 mL (1 mg/mL)", amountMg: 100, volumeMl: 100, concMgMl: 1 },
          { label: "100 mg em 250 mL (0.4 mg/mL)", amountMg: 100, volumeMl: 250, concMgMl: 0.4 }
        ],
        commercialPresentations: [
          { label: "Ampola 50 mg / 10 mL", mgPerAmp: 50, mlPerAmp: 10 },
          { label: "Ampola 15 mg / 3 mL", mgPerAmp: 15, mlPerAmp: 3 }
        ],
        warningNotice: "O midazolam e seus metabólitos ativos podem acumular-se em infusões prolongadas, idosos, obesidade, insuficiência renal ou disfunção hepática.",
        equivalences: [
          "0,02 mg/kg/h = 0,33 mcg/kg/min",
          "0,05 mg/kg/h = 0,83 mcg/kg/min",
          "0,10 mg/kg/h = 1,67 mcg/kg/min",
          "0,20 mg/kg/h = 3,33 mcg/kg/min"
        ],
        contexts: [
          {
            id: "sedacao_continua",
            name: "Sedação contínua de adultos em ventilação mecânica",
            unit: "mg/kg/h",
            rangeInitial: { min: 0.02, max: 0.05 },
            rangeUsual: { min: 0.02, max: 0.10 },
            attentionThreshold: 0.10,
            criticalThreshold: 0.20,
            messages: {
              attention: "Dose elevada de midazolam para sedação contínua (> 0,10 mg/kg/h). Avalie tolerância, acúmulo, função renal, função hepática, interação medicamentosa e alvo de sedação RASS.",
              critical: "Alerta crítico: dose muito elevada de midazolam (> 0,20 mg/kg/h). Risco aumentado de sedação prolongada e desmame ventilatório difícil."
            }
          }
        ],
        references: [
          { title: "PADIS Guidelines: Prevention and Management of Pain, Agitation/Sedation, Delirium, Immobility, and Sleep Disruption in Adult Patients in the ICU", year: 2018 }
        ]
      },

      // ----------------------------------------------------
      // FENTANIL
      // ----------------------------------------------------
      {
        id: "fentanil",
        name: "Fentanil",
        synonyms: ["Fentanest", "Fentany"],
        category: "sedacao",
        requiresWeight: false,
        preferredUnit: "mcg/h",
        allowedUnits: ["mcg/h", "mcg/kg/h", "mcg/kg/min", "mL/h"],
        presets: [
          { label: "500 mcg em 50 mL (10 mcg/mL)", amountMcg: 500, volumeMl: 50, concMcgMl: 10 },
          { label: "1.000 mcg em 100 mL (10 mcg/mL)", amountMcg: 1000, volumeMl: 100, concMcgMl: 10 },
          { label: "2.500 mcg em 250 mL (10 mcg/mL)", amountMcg: 2500, volumeMl: 250, concMcgMl: 10 }
        ],
        commercialPresentations: [
          { label: "Frasco-ampola 500 mcg / 10 mL", mcgPerAmp: 500, mlPerAmp: 10 },
          { label: "Ampola 250 mcg / 5 mL", mcgPerAmp: 250, mlPerAmp: 5 }
        ],
        contexts: [
          {
            id: "analgesia_continua",
            name: "Analgesia contínua em adultos",
            unit: "mcg/h",
            rangeInitial: { min: 25, max: 50 },
            rangeUsual: { min: 25, max: 200 },
            attentionThreshold: 200,
            highDoseThreshold: 300,
            messages: {
              attention: "Dose elevada de fentanil (> 200 mcg/h). Confirme concentração e unidade. Avalie tolerância, exposição prévia a opioides, ventilação, rigidez torácica, íleo paralítico e necessidade de analgesia multimodal."
            }
          },
          {
            id: "analgesia_peso",
            name: "Analgesia orientada por peso",
            unit: "mcg/kg/h",
            rangeUsual: { min: 0.5, max: 2.0 },
            attentionThreshold: 2.0,
            highDoseThreshold: 4.0,
            messages: {
              attention: "Dose de fentanil orientada por peso em faixa de atenção (> 2 mcg/kg/h)."
            }
          }
        ],
        references: [
          { title: "PADIS Guidelines for Pain Management in ICU", year: 2018 }
        ]
      },

      // ----------------------------------------------------
      // MORFINA
      // ----------------------------------------------------
      {
        id: "morfina",
        name: "Morfina",
        synonyms: ["Dimorf"],
        category: "sedacao",
        requiresWeight: false,
        preferredUnit: "mg/h",
        allowedUnits: ["mg/h", "mg/kg/h", "mcg/kg/h", "mL/h"],
        presets: [
          { label: "50 mg em 50 mL (1 mg/mL)", amountMg: 50, volumeMl: 50, concMgMl: 1 },
          { label: "100 mg em 100 mL (1 mg/mL)", amountMg: 100, volumeMl: 100, concMgMl: 1 },
          { label: "100 mg em 250 mL (0.4 mg/mL)", amountMg: 100, volumeMl: 250, concMgMl: 0.4 }
        ],
        commercialPresentations: [
          { label: "Ampola 10 mg / 1 mL", mgPerAmp: 10, mlPerAmp: 1 }
        ],
        warningNotice: "A morfina possui metabólitos ativos (morfina-6-glicuronídeo e morfina-3-glicuronídeo) eliminados pelos rins e pode apresentar acúmulo significativo na disfunção renal.",
        contexts: [
          {
            id: "analgesia_morfina",
            name: "Analgesia contínua em adultos",
            unit: "mg/h",
            rangeInitial: { min: 1, max: 2 },
            rangeUsual: { min: 1, max: 5 },
            attentionThreshold: 5,
            highDoseThreshold: 10,
            messages: {
              attention: "Dose elevada de morfina (> 5 mg/h). Avalie tolerância, função renal, acúmulo de metabólitos ativos, depressão respiratória, hipotensão e íleo."
            }
          }
        ],
        references: [
          { title: "PADIS Pain Management Guidelines", year: 2018 }
        ]
      },

      // ----------------------------------------------------
      // PROPOFOL
      // ----------------------------------------------------
      {
        id: "propofol",
        name: "Propofol",
        synonyms: ["Diprivan", "Fresofol"],
        category: "sedacao",
        requiresWeight: true,
        preferredUnit: "mcg/kg/min",
        allowedUnits: ["mcg/kg/min", "mg/kg/h", "mg/h", "mL/h"],
        presets: [
          { label: "Solução a 1%: 10 mg/mL (Frasco sem diluição)", amountMg: 1000, volumeMl: 100, concMgMl: 10 },
          { label: "Solução a 2%: 20 mg/mL (Frasco concentrado)", amountMg: 2000, volumeMl: 100, concMgMl: 20 }
        ],
        commercialPresentations: [
          { label: "Frasco 100 mL a 1% (1000 mg)", mgPerAmp: 1000, mlPerAmp: 100 },
          { label: "Frasco 50 mL a 1% (500 mg)", mgPerAmp: 500, mlPerAmp: 50 }
        ],
        equivalences: [
          "5 mcg/kg/min = 0,3 mg/kg/h",
          "25 mcg/kg/min = 1,5 mg/kg/h",
          "50 mcg/kg/min = 3,0 mg/kg/h",
          "67 mcg/kg/min ≈ 4,0 mg/kg/h",
          "80 mcg/kg/min = 4,8 mg/kg/h"
        ],
        monitoringSuggestions: [
          "Pressão arterial e estabilidade hemodinâmica",
          "Nível de triglicérides séricos (após 48h de infusão)",
          "Creatinoquinase (CPK) e mioglobinúria",
          "Lactato arterial e equilíbrio ácido-base",
          "Potássio sérico (risco de hipercalemia)",
          "Função renal e eletrocardiograma (arritmias/BVT)"
        ],
        contexts: [
          {
            id: "sedacao_propofol",
            name: "Sedação contínua de adultos em ventilação mecânica",
            unit: "mcg/kg/min",
            rangeInitial: { min: 5, max: 5 },
            rangeUsual: { min: 5, max: 50 },
            attentionThreshold: 50,
            reinforcedAlertThreshold: 67, // ~ 4 mg/kg/h
            highDoseThreshold: 80,
            messages: {
              attention: "Dose de propofol em faixa de atenção (> 50 mcg/kg/min).",
              reinforced: "Dose de propofol acima de aproximadamente 4 mg/kg/h (67 mcg/kg/min). Reavalie a necessidade clínica e o risco de Síndrome da Infusão do Propofol (PRIS), especialmente em uso prolongado (> 48h) ou associado a catecolaminas e corticosteroides."
            }
          }
        ],
        references: [
          { title: "Propofol Infusion Syndrome (PRIS) Consensus & DailyMed Official Label", year: 2022 }
        ]
      },

      // ----------------------------------------------------
      // CETAMINA
      // ----------------------------------------------------
      {
        id: "cetamina",
        name: "Cetamina",
        synonyms: ["Quetamina", "Ketamina", "Ketamine", "Ketalar"],
        category: "sedacao",
        requiresWeight: true,
        preferredUnit: "mg/kg/h",
        allowedUnits: ["mg/kg/h", "mcg/kg/min", "mg/h", "mL/h"],
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
            id: "analgesia_subanestesica",
            name: "Analgesia subanestésica",
            unit: "mg/kg/h",
            rangeInitial: { min: 0.05, max: 0.10 },
            rangeUsual: { min: 0.05, max: 0.30 },
            attentionThreshold: 0.30,
            messages: {
              attention: "Dose de cetamina acima da faixa usual de analgesia subanestésica (> 0,30 mg/kg/h)."
            }
          },
          {
            id: "sedacao_uti",
            name: "Sedação adjuvante na UTI",
            unit: "mg/kg/h",
            rangeUsual: { min: 0.10, max: 1.00 },
            attentionThreshold: 1.00,
            highDoseThreshold: 2.00,
            messages: {
              attention: "Dose elevada de cetamina para sedação contínua (> 1 mg/kg/h). Confirme indicação e monitore efeitos cardiovasculares, hipersalivação, manifestações psicomiméticas e exposição cumulativa."
            }
          },
          {
            id: "anestesia",
            name: "Anestesia (Referência separada)",
            unit: "mg/min",
            referenceInfusion: { min: 0.10, max: 0.50 },
            messages: {
              info: "Faixa de infusão anestésica de referência: 0,1 a 0,5 mg/min. Não combinar automaticamente doses anestésicas com analgesia/sedação de UTI."
            }
          }
        ],
        references: [
          { title: "Subanesthetic Ketamine Infusion for Pain Management Consensus Guidelines (ASRA/AAPM)", year: 2018 }
        ]
      },

      // ----------------------------------------------------
      // DEXMEDETOMIDINA
      // ----------------------------------------------------
      {
        id: "dexmedetomidina",
        name: "Dexmedetomidina",
        synonyms: ["Precedex"],
        category: "sedacao",
        requiresWeight: true,
        preferredUnit: "mcg/kg/h",
        allowedUnits: ["mcg/kg/h", "mcg/kg/min", "mcg/h", "mL/h"],
        presets: [
          { label: "200 mcg em 50 mL (4 mcg/mL)", amountMcg: 200, volumeMl: 50, concMcgMl: 4 },
          { label: "400 mcg em 100 mL (4 mcg/mL)", amountMcg: 400, volumeMl: 100, concMcgMl: 4 },
          { label: "1.000 mcg em 250 mL (4 mcg/mL)", amountMcg: 1000, volumeMl: 250, concMcgMl: 4 }
        ],
        commercialPresentations: [
          { label: "Frasco-ampola 200 mcg / 2 mL", mcgPerAmp: 200, mlPerAmp: 2 }
        ],
        warningNotice: "Cautela adicional em idosos, disfunção hepática, bradicardia prévia, distúrbios de condução atrioventricular e uso de outros agentes cronotrópicos negativos.",
        equivalences: [
          "0,2 mcg/kg/h = 0,0033 mcg/kg/min",
          "0,7 mcg/kg/h = 0,0117 mcg/kg/min",
          "1,0 mcg/kg/h = 0,0167 mcg/kg/min",
          "1,5 mcg/kg/h = 0,0250 mcg/kg/min"
        ],
        contexts: [
          {
            id: "sedacao_precedex",
            name: "Sedação consciente em UTI",
            unit: "mcg/kg/h",
            rangeInitial: { min: 0.2, max: 0.7 },
            rangeUsual: { min: 0.2, max: 1.0 },
            attentionThreshold: 0.7,
            highDoseThreshold: 1.0,
            criticalThreshold: 1.5,
            messages: {
              attention: "Dose acima da faixa usual conservadora (> 0,7 mcg/kg/h). Monitore bradicardia e hipotensão.",
              highDose: "Dose acima da faixa de referência cadastrada (> 1 mcg/kg/h). Confirme indicação e protocolo institucional. Monitore bradicardia, bloqueio atrioventricular e hipotensão."
            }
          }
        ],
        references: [
          { title: "PADIS Guidelines: Dexmedetomidina for Non-intubated and Intubated ICU Patients", year: 2018 }
        ]
      }
    ]
  };

  // Expor no escopo global
  window.__INFUSOES_CONFIG__ = INFUSOES_CONFIG;
})();
