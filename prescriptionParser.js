/**
 * prescriptionParser.js
 * Módulo para organizar e formatar prescrições médicas do Soul MV (ICHC)
 * em 7 sistemas orgânicos clínicos para rounds e prontuário.
 */

(function () {
  // Normalização de texto sem acentos e minúsculo
  function cleanText(str) {
    return (str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  // 7 Sistemas Orgânicos Canônicos
  const SYSTEMS = [
    { id: "neuro", name: "Neurológico" },
    { id: "cardio", name: "Cardiovascular" },
    { id: "resp", name: "Respiratório" },
    { id: "hemo", name: "Hematológico" },
    { id: "renal", name: "Renal/Metabólico" },
    { id: "abd", name: "Abdominal" },
    { id: "infec", name: "Infeccioso" }
  ];

  // Drogas contínuas (titulação em UTI - no início da categoria, apenas nome limpo)
  const CONTINUOUS_SEDATIVES = [
    { test: /\bpropofol\b/i, clean: "Propofol" },
    { test: /\bfentanil(a)?\b/i, clean: "Fentanil" },
    { test: /\bmidazolam\b/i, clean: "Midazolam" },
    { test: /\b(dexmedetomidina|precedex)\b/i, clean: "Dexmedetomidina" },
    { test: /\b(cetamina|ketamina)\b/i, clean: "Cetamina" },
    { test: /\bremifentanil(a)?\b/i, clean: "Remifentanil" }
  ];

  const CONTINUOUS_VASOACTIVE = [
    { test: /\b(norepinefrina|noradrenalina)\b/i, clean: "Noradrenalina" },
    { test: /\bvasopressina\b/i, clean: "Vasopressina" },
    { test: /\bdobutamina\b/i, clean: "Dobutamina" },
    { test: /\b(adrenalina|epinefrina)\b/i, clean: "Adrenalina" },
    { test: /\bmilrinona\b/i, clean: "Milrinona" },
    { test: /\b(nitroglicerina|tridil)\b/i, clean: "Nitroglicerina" },
    { test: /\b(nitroprussiato|nipride)\b/i, clean: "Nitroprussiato" }
  ];

  // Regras de Classificação por Sistema
  const DRUG_RULES = [
    // --- 1. INFECCIOSO ---
    {
      system: "infec",
      patterns: [
        { test: /anfotericina/i, name: (txt) => /lipossomal/i.test(txt) ? "Anfotericina B lipossomal" : "Anfotericina B" },
        { test: /isavuconazol/i, name: "Isavuconazol" },
        { test: /voriconazol/i, name: "Voriconazol" },
        { test: /fluconazol/i, name: "Fluconazol" },
        { test: /micafungina/i, name: "Micafungina" },
        { test: /anidulafungina/i, name: "Anidulafungina" },
        { test: /meropenem/i, name: "Meropenem" },
        { test: /ertapenem/i, name: "Ertapenem" },
        { test: /imipenem/i, name: "Imipenem" },
        { test: /linezolida/i, name: "Linezolida" },
        { test: /vancomicina/i, name: "Vancomicina" },
        { test: /teicoplanina/i, name: "Teicoplanina" },
        { test: /daptomicina/i, name: "Daptomicina" },
        { test: /polimixina\s*b/i, name: "Polimixina B" },
        { test: /polimixina/i, name: "Polimixina B" },
        { test: /colistina/i, name: "Colistina" },
        { test: /ceftazidima.*avibactam|cazavi/i, name: "Ceftazidima/Avibactam" },
        { test: /ceftolozan.*tazobactam/i, name: "Ceftolozane/Tazobactam" },
        { test: /piperacilina.*tazobactam|tazocin/i, name: "Piperacilina/Tazobactam" },
        { test: /ampicilina.*sulbactam|unasyn/i, name: "Ampicilina/Sulbactam" },
        { test: /amoxicilina.*clavulanat/i, name: "Amoxicilina/Clavulanato" },
        { test: /sulfametoxazol.*trimetoprim|bactrim|cotrimoxazol/i, name: "Sulfametoxazol/Trimetoprima" },
        { test: /ganciclovir/i, name: "Ganciclovir" },
        { test: /valganciclovir/i, name: "Valganciclovir" },
        { test: /aciclovir/i, name: "Aciclovir" },
        { test: /ceftriaxona/i, name: "Ceftriaxona" },
        { test: /cefepima/i, name: "Cefepima" },
        { test: /ceftazidima/i, name: "Ceftazidima" },
        { test: /cefazolina/i, name: "Cefazolina" },
        { test: /cefalexina/i, name: "Cefalexina" },
        { test: /ciprofloxaci/i, name: "Ciprofloxacino" },
        { test: /levofloxaci/i, name: "Levofloxacino" },
        { test: /moxifloxaci/i, name: "Moxifloxacino" },
        { test: /metronidazol/i, name: "Metronidazol" },
        { test: /clindamicina/i, name: "Clindamicina" },
        { test: /amicacina/i, name: "Amicacina" },
        { test: /gentamicina/i, name: "Gentamicina" },
        { test: /azitromicina/i, name: "Azitromicina" },
        { test: /claritromicina/i, name: "Claritromicina" },
        { test: /oxacilina/i, name: "Oxacilina" },
        { test: /ampicilina/i, name: "Ampicilina" },
        { test: /tigeciclina/i, name: "Tigeciclina" },
        { test: /rifampicina/i, name: "Rifampicina" },
        { test: /isoniazida/i, name: "Isoniazida" },
        { test: /pirazinamida/i, name: "Pirazinamida" },
        { test: /etambutol/i, name: "Etambutol" },
        { test: /dapsona/i, name: "Dapsona" }
      ]
    },

    // --- 2. CARDIOVASCULAR ---
    {
      system: "cardio",
      patterns: [
        { test: /\b(norepinefrina|noradrenalina)\b/i, name: "Noradrenalina", isContinuous: true },
        { test: /\bvasopressina\b/i, name: "Vasopressina", isContinuous: true },
        { test: /\bdobutamina\b/i, name: "Dobutamina", isContinuous: true },
        { test: /\b(adrenalina|epinefrina)\b/i, name: "Adrenalina", isContinuous: true },
        { test: /\bmilrinona\b/i, name: "Milrinona", isContinuous: true },
        { test: /\b(nitroglicerina|tridil)\b/i, name: "Nitroglicerina", isContinuous: true },
        { test: /\b(nitroprussiato|nipride)\b/i, name: "Nitroprussiato", isContinuous: true },
        // Anti-hipertensivos / Vasodilatadores / Antiarrítmicos
        { test: /\bhidralazina\b/i, name: "Hidralazina" },
        { test: /\b(anlodipino|amlodipino)\b/i, name: "Anlodipino" },
        { test: /\bisossorbida\b/i, name: (txt) => /mononitrato/i.test(txt) ? "Mononitrato de isossorbida" : "Isossorbida" },
        { test: /\batenolol\b/i, name: "Atenolol" },
        { test: /\bmetoprolol\b/i, name: "Metoprolol" },
        { test: /\bcarvedilol\b/i, name: "Carvedilol" },
        { test: /\bpropranolol\b/i, name: "Propranolol" },
        { test: /\besmolol\b/i, name: "Esmolol" },
        { test: /\bamiodarona\b/i, name: "Amiodarona" },
        { test: /\bdiltiazem\b/i, name: "Diltiazem" },
        { test: /\bverapamil\b/i, name: "Verapamil" },
        { test: /\blosartana\b/i, name: "Losartana" },
        { test: /\bvalsartana\b/i, name: "Valsartana" },
        { test: /\bcandesartana\b/i, name: "Candesartana" },
        { test: /\benalapril\b/i, name: "Enalapril" },
        { test: /\bcaptopril\b/i, name: "Captopril" },
        { test: /\bramipril\b/i, name: "Ramipril" },
        { test: /\bclonidina\b/i, name: "Clonidina" },
        { test: /\bhidrocortisona\b/i, name: "Hidrocortisona" }
      ]
    },

    // --- 3. NEUROLÓGICO ---
    {
      system: "neuro",
      patterns: [
        { test: /\bpropofol\b/i, name: "Propofol", isContinuous: true },
        { test: /\bfentanil(a)?\b/i, clean: "Fentanil", isContinuous: true },
        { test: /\bmidazolam\b/i, name: "Midazolam", isContinuous: true },
        { test: /\b(dexmedetomidina|precedex)\b/i, name: "Dexmedetomidina", isContinuous: true },
        { test: /\b(cetamina|ketamina)\b/i, name: "Cetamina", isContinuous: true },
        { test: /\bremifentanil(a)?\b/i, name: "Remifentanil", isContinuous: true },
        // Analgésicos
        { test: /\bdipirona\b/i, name: "Dipirona" },
        { test: /\bparacetamol\b/i, name: "Paracetamol" },
        { test: /\bmorfina\b/i, name: "Morfina" },
        { test: /\btramadol\b/i, name: "Tramadol" },
        { test: /\bmetadona\b/i, name: "Metadona" },
        { test: /\boxicodona\b/i, name: "Oxicodona" },
        { test: /\bcodeina\b/i, name: "Codeína" },
        // Bloqueadores neuromusculares
        { test: /\brocuronio\b/i, name: "Rocurônio" },
        { test: /\bcisatracurio\b/i, name: "Cisatracúrio" },
        { test: /\batracurio\b/i, name: "Atracúrio" },
        { test: /\bpancuronio\b/i, name: "Pancurônio" },
        { test: /\bsuccinilcolina\b/i, name: "Succinilcolina" },
        // Antiespásticos / Relaxantes
        { test: /\bbaclofeno\b/i, name: "Baclofeno" },
        // Antipsicóticos / Sedativos
        { test: /\brisperidona\b/i, name: "Risperidona" },
        { test: /\b(haloperidol|haldol)\b/i, name: "Haloperidol" },
        { test: /\bquetiapina\b/i, name: "Quetiapina" },
        { test: /\bolanzapina\b/i, name: "Olanzapina" },
        { test: /\bclorpromazina\b/i, name: "Clorpromazina" },
        { test: /\blevomepromazina\b/i, name: "Levomepromazina" },
        { test: /\b(clonazepam|rivotril)\b/i, name: "Clonazepam" },
        { test: /\bdiazepam\b/i, name: "Diazepam" },
        { test: /\blorazepam\b/i, name: "Lorazepam" },
        // Anticonvulsivantes
        { test: /\b(fenitoina|hidantal)\b/i, name: "Fenitoína" },
        { test: /\b(levetiracetam|keppra)\b/i, name: "Levetiracetam" },
        { test: /\b(valproato|acido valproico|depakene)\b/i, name: "Ácido Valproico" },
        { test: /\bcarbamazepina\b/i, name: "Carbamazepina" },
        { test: /\blamotrigina\b/i, name: "Lamotrigina" },
        { test: /\boxcarbazepina\b/i, name: "Oxcarbazepina" },
        { test: /\bgabapentina\b/i, name: "Gabapentina" },
        { test: /\bpregabalina\b/i, name: "Pregabalina" },
        { test: /\b(fenobarbital|gardenal)\b/i, name: "Fenobarbital" }
      ]
    },

    // --- 4. RESPIRATÓRIO ---
    {
      system: "resp",
      patterns: [
        { test: /\b(salbutamol|aerolin)\b/i, name: "Salbutamol" },
        { test: /\b(fenoterol|berotec)\b/i, name: "Fenoterol" },
        { test: /\b(ipratropio|atrovent)\b/i, name: "Ipratrópio" },
        { test: /\bformoterol\b/i, name: "Formoterol" },
        { test: /\bbudesonida\b/i, name: "Budesonida" },
        { test: /\bbeclometasona\b/i, name: "Beclometasona" },
        { test: /\bfluticasona\b/i, name: "Fluticasona" },
        { test: /\bdexametasona\b/i, name: "Dexametasona" },
        { test: /\bmetilprednisolona\b/i, name: "Metilprednisolona" },
        { test: /\b(prednisona|prednisolona)\b/i, name: "Prednisona" },
        { test: /\bpropantelina\b/i, name: (txt) => /gel|derm/i.test(txt) ? "Propantelina gel" : "Propantelina" },
        { test: /\batropina\b/i, name: "Atropina" },
        { test: /\bacetilcisteina\b/i, name: "Acetilcisteína" }
      ]
    },

    // --- 5. HEMATOLÓGICO ---
    {
      system: "hemo",
      patterns: [
        { test: /\bheparina\b/i, name: (txt) => /5000\s*ui/i.test(txt) ? "HNF" : "Heparina" },
        { test: /\b(enoxaparina|clexane)\b/i, name: "Enoxaparina" },
        { test: /\bfondaparinux\b/i, name: "Fondaparinux" },
        { test: /\b(varfarina|marevan)\b/i, name: "Varfarina" },
        { test: /\brivaroxaban/i, name: "Rivaroxabana" },
        { test: /\bapixaban/i, name: "Apixabana" },
        { test: /\bdabigatran/i, name: "Dabigatrana" },
        { test: /\b(acido acetilsalicilico|aspirina|aas)\b/i, name: "AAS" },
        { test: /\bclopidogrel\b/i, name: "Clopidogrel" },
        { test: /\bticagrelor\b/i, name: "Ticagrelor" },
        { test: /\bfilgrastim\b/i, name: "Filgrastim" },
        { test: /\b(eritropoetina|epo)\b/i, name: "Eritropoetina" },
        { test: /concentrado de hemacias/i, name: "Concentrado de hemácias" },
        { test: /\bplaquetas\b/i, name: "Plaquetas" },
        { test: /plasma fresco/i, name: "Plasma fresco" },
        { test: /\bcrioprecipitado\b/i, name: "Crioprecipitado" },
        { test: /\b(acido tranexamico|transamin)\b/i, name: "Ácido Tranexâmico" },
        { test: /\b(vitamina k|fitomenadiona)\b/i, name: "Vitamina K" }
      ]
    },

    // --- 6. RENAL/METABÓLICO ---
    {
      system: "renal",
      patterns: [
        // Diálise
        { test: /\b(cvvhd|hemodialise continua)\b/i, name: "CVVHD", isCustom: true },
        { test: /\bsled\b/i, name: "SLED", isCustom: true },
        { test: /\bhemodialise\b/i, name: "Hemodiálise", isCustom: true },
        // Diuréticos
        { test: /\b(furosemida|lasix)\b/i, name: "Furosemida" },
        { test: /\bespironolactona\b/i, name: "Espironolactona" },
        { test: /\b(hidroclorotiazida|hctz)\b/i, name: "HCTZ" },
        { test: /\bindapamida\b/i, name: "Indapamida" },
        // Eletrólitos e Reposições
        { test: /cloreto de sodio 20%/i, name: "NaCl 20%" },
        { test: /cloreto de sodio 0[,.]9%/i, name: "SF 0,9%" },
        { test: /glicose 50%/i, name: "Glicose 50%" },
        { test: /glicose 5%/i, name: "SG 5%" },
        { test: /cloreto de potassio|\bkcl\b/i, name: "KCl" },
        { test: /fosfatos? de potassio/i, name: "Fosfato de potássio" },
        { test: /gluconato de calcio/i, name: "Gluconato de cálcio" },
        { test: /cloreto de calcio/i, name: "CaCl" },
        { test: /sulfato de magnesio|\bmgso4\b/i, name: "Sulfato de magnésio" },
        { test: /bicarbonato de sodio/i, name: (txt) => {
          const m = txt.match(/10%/);
          return m ? "Bicarbonato de sódio 10%" : "Bicarbonato de sódio";
        }}
      ]
    },

    // --- 7. ABDOMINAL ---
    {
      system: "abd",
      patterns: [
        // Dietas
        { test: /dieta enteral/i, name: "Dieta enteral", isDiet: true },
        { test: /dieta parenteral/i, name: "Dieta parenteral", isDiet: true },
        { test: /dieta geral/i, name: (txt) => {
          const rh = cleanText(txt).match(/restricao hidrica\s*[-:]?\s*(\d+\s*ml\/?d?)/i);
          return rh ? `Dieta geral (restrição hídrica ${rh[1].replace(/\s+/g, "")})` : "Dieta geral";
        }, isDiet: true },
        { test: /dieta pastosa/i, name: "Dieta pastosa", isDiet: true },
        { test: /dieta papa/i, name: "Dieta Papa II", isDiet: true },
        { test: /dieta branda/i, name: "Dieta branda", isDiet: true },
        { test: /dieta liquida/i, name: "Dieta líquida", isDiet: true },
        { test: /\bdieta\s+zero\b|\bnpo\b|\bjejum\s+alimentar\b/i, name: "Dieta zero (jejum)", isDiet: true },
        // Água Enteral
        { test: /agua enteral/i, name: "AE", isAE: true },
        // Protetores Gástricos
        { test: /\bpantoprazol\b/i, name: "Pantoprazol" },
        { test: /\bomeprazol\b/i, name: "Omeprazol" },
        { test: /\besomeprazol\b/i, name: "Esomeprazol" },
        { test: /\branitidina\b/i, name: "Ranitidina" },
        // Laxativos / Antidiarreicos
        { test: /\bbisacodil\b/i, name: "Bisacodil" },
        { test: /\blactulose\b/i, name: "Lactulose" },
        { test: /oleo mineral/i, name: "Óleo mineral" },
        { test: /\bpicossulfato\b/i, name: "Picossulfato de sódio" },
        { test: /\b(polietilenoglicol|peg)\b/i, name: "PEG" },
        { test: /\bsimeticona\b/i, name: "Simeticona" },
        // Procinéticos / Antieméticos
        { test: /\b(metoclopramida|plasil)\b/i, name: "Metoclopramida" },
        { test: /\bbromoprida\b/i, name: "Bromoprida" },
        { test: /\bondansetrona\b/i, name: "Ondansetrona" },
        { test: /\b(dimenidrinato|dramin)\b/i, name: "Dimenidrinato" },
        // Insulina
        { test: /insulina.*bic|insulina.*diluicao/i, name: "Insulina BIC", isInsulinBIC: true },
        { test: /insulina/i, name: "Esquema de insulina", isInsulin: true }
      ]
    }
  ];

  // Helper para padronizar dose
  function formatDose(doseVal, unitStr) {
    if (!doseVal) return "";
    let num = parseFloat(doseVal.toString().replace(",", "."));
    if (isNaN(num)) return doseVal;

    const unit = cleanText(unitStr);
    if (unit.includes("miligrama") || unit === "mg") {
      if (num >= 1000 && num % 1000 === 0) {
        return `${num / 1000}g`;
      }
      return `${num}mg`;
    }
    if (unit.includes("microgram") || unit.includes("mcg")) {
      return `${num}mcg`;
    }
    if (unit.includes("unidade") || unit.includes("ui")) {
      return `${num}UI`;
    }
    if (unit.includes("mililitro") || unit.includes("ml")) {
      return `${num}ml`;
    }
    if (unit.includes("gota")) {
      return `${num}gts`;
    }
    if (unit.includes("dose")) {
      return `${num} jatos`;
    }
    if (unit.includes("ampola") || unit === "amp") {
      return `${num} amp`;
    }
    if (unit.includes("bolsa")) {
      return `${num} bolsa`;
    }
    if (unit.includes("comprimido") || unit === "cp") {
      return `${num} cp`;
    }
    if (unit.includes("bisnaga")) {
      return `${num} bisnaga`;
    }
    return `${num}${unitStr}`;
  }

  // Helper com hierarquia estrita para via de administração
  function extractRoute(fullText) {
    const clean = cleanText(fullText);
    if (/\bsne\b|\bsonda nasoenteral\b/.test(clean)) return "SNE";
    if (/\bsng\b|\bsonda nasogastrica\b/.test(clean)) return "SNG";
    if (/\biv\b|\bintravenosa\b|\bev\b/.test(clean)) return "IV";
    if (/\bsc\b|\bsubcutanea\b/.test(clean)) return "SC";
    if (/\bsl\b|\bsublingual\b/.test(clean)) return "SL";
    if (/\bin o\b|\binalatoria\b|\baerosol\b/.test(clean)) return "INAL";
    if (/\bderm\b|\btopico\b/.test(clean)) return "Tópico";
    if (/\bbuc\b|\bbucal\b/.test(clean)) return "Bucal";
    if (/\bvr\b|\bretal\b/.test(clean)) return "VR";
    if (/\boral\b|\bvo\b/.test(clean)) return "VO";
    return "";
  }

  // Helper para padronizar frequência / intervalo usando cleanText
  function extractFrequency(cleanTextStr, isSN, isACM) {
    if (cleanTextStr.includes("agora") || cleanTextStr.includes("urgente")) return "agora";
    if (cleanTextStr.includes("jejum")) return "jejum";
    if (cleanTextStr.includes("continu")) return "contínuo";

    const hourMatch = cleanTextStr.match(/(\d+)\s*\/\s*(\d+)\s*h/);
    if (hourMatch) {
      return `${hourMatch[1]}/${hourMatch[2]}h`;
    }

    if (cleanTextStr.includes("1x manha") || cleanTextStr.includes("1x man")) return "1x manhã";
    if (cleanTextStr.includes("1x tarde")) return "1x tarde";
    if (cleanTextStr.includes("1x noite")) return "1x noite";
    if (cleanTextStr.includes("pos-almoco") || cleanTextStr.includes("pos almoco") || cleanTextStr.includes("posalmoco")) return "1x/dia";
    if (cleanTextStr.includes("2xdia")) return "12/12h";
    if (cleanTextStr.includes("3xdia")) return "8/8h";
    if (cleanTextStr.includes("4xdia")) return "6/6h";
    if (cleanTextStr.includes("1 vez")) return "1x/dia";

    if (isSN) return "SN";
    if (isACM) return "ACM";

    return "";
  }

  // Segmentação do laudo em blocos de itens
  function parsePrescriptionRaw(rawText) {
    if (!rawText) return [];

    const lines = rawText.split(/\r?\n/);
    const cleanedLines = [];
    let isSkippingHeader = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Pular cabeçalhos repetidos das páginas do MV
      if (line.includes("MV PEP Prontuário") || line.includes("MV | SoulMV")) {
        isSkippingHeader = true;
        continue;
      }
      if (isSkippingHeader) {
        if (line.includes("Qtde Prescrita") || line.includes("PRESCRICAO MEDICA") || line.includes("PRESCRICAO MED DIALISE")) {
          isSkippingHeader = false;
        }
        continue;
      }
      if (line.includes("Qtd Unidade SN Apl") || line.startsWith("Qtde Prescrita") || line.startsWith("Alergias:") || line.includes("Alergia Alta Vigilância") || line.includes("Evento Adverso") || line.includes("Dose Padrão Alterada")) {
        continue;
      }
      cleanedLines.push(line);
    }

    // Agrupar em blocos por item numerado
    const items = [];
    let currentBlock = null;

    for (let i = 0; i < cleanedLines.length; i++) {
      const line = cleanedLines[i];

      const isSubItemQuantity = /^(\d+)\s*(bolsa|mililitro|miligrama|micrograma|unidade|ampola|gota|dose|bisnaga|frasco)?$/i.test(line);
      const isLineSubItem = line.startsWith("|->");
      const numMatch = line.match(/^(\d+)\s+([A-Za-zÁ-ú\(\)\/].*)/);
      const startsWithUnit = numMatch && /^(bolsa|mililitro|miligrama|micrograma|unidade|ampola|gota|dose|bisnaga|frasco)\b/i.test(numMatch[2]);

      // Detectar início de item desprovido de número (ex: medicação avulsa suspensa como difenidramina ou dieta pastosa)
      const isUnnumberedDrugStart = !isLineSubItem && !isSubItemQuantity && /^(difenidramina|bicarbonato de sodio \d+|dieta pastosa|dieta geral)/i.test(line);

      if ((numMatch && !startsWithUnit) || isUnnumberedDrugStart) {
        if (currentBlock) items.push(currentBlock);
        currentBlock = {
          itemNumber: numMatch ? numMatch[1] : null,
          header: numMatch ? numMatch[2] : line,
          lines: [numMatch ? numMatch[2] : line],
          rawText: line
        };
      } else if (isLineSubItem || (currentBlock && isSubItemQuantity)) {
        if (currentBlock) {
          currentBlock.lines.push(line);
          currentBlock.rawText += "\n" + line;
        }
      } else {
        if (currentBlock) {
          currentBlock.lines.push(line);
          currentBlock.rawText += "\n" + line;
        } else {
          currentBlock = {
            itemNumber: null,
            header: line,
            lines: [line],
            rawText: line
          };
        }
      }
    }
    if (currentBlock) items.push(currentBlock);

    return items;
  }

  // Parser principal que converte os blocos em objetos clínicos
  function processItems(rawItems) {
    const parsed = [];

    for (const item of rawItems) {
      // 1. Filtrar seções suspensas
      if (/suspenso dia\.:/i.test(item.lines.join(" "))) {
        continue;
      }

      // 2. Descartar procedimentos de enfermagem / exames de imagem / ruído
      if (/^(RX TORAX|TC CRANIO|TC ANGIO|GLICEMIA CAPILAR|QUANTIFICAR DIURESE|CUIDADOS ESPECIAIS|CAPILAR|TEMPO DE PROCEDIMENTO)/i.test(item.header)) {
        continue;
      }
      if (/^(Se intercorrências|Colher Na|Colher Cai|Duração: 24h|Temperatura do dialisato)/i.test(item.header)) {
        continue;
      }

      const fullText = item.lines.join(" ");

      // Separar linhas principais da droga das linhas de sub-itens (|-> diluentes / insumos)
      const mainLines = item.lines.filter(l => !l.startsWith("|->")).join(" ");
      const cleanMain = cleanText(mainLines);

      // 3. Extrair aditivos (|->) unindo todas as linhas do sub-item até o próximo |->
      const cleanedSubLines = [];
      let currentSub = null;
      for (let idx = 0; idx < item.lines.length; idx++) {
        const l = item.lines[idx];
        if (l.startsWith("|->")) {
          if (currentSub) cleanedSubLines.push(currentSub);
          if (/seringa|agulha|swab|sache|luva|oclusor/i.test(l)) {
            currentSub = null;
          } else {
            currentSub = l;
          }
        } else if (currentSub) {
          currentSub += " " + l;
        }
      }
      if (currentSub) cleanedSubLines.push(currentSub);

      // 4. Identificar informações de posologia
      const isSN = /\bS\s+IV\b|\bSN\b|\bVER OBSERVAÇÃO\b|se nauseas|se dor|se febre|se hiperglicemia|se dextro/i.test(fullText);
      const isACM = /\bACM\b/i.test(fullText);
      const isBIC = /bomba de infusao|bomba de infusão|uso bic|infusao estendida|infusão estendida/i.test(fullText);

      // Extrair dia de antibiótico (ex: "(D11/14)", "(D8/7)")
      const dayMatch = fullText.match(/\((D\d+\/\d+)\)/i);
      const dayCount = dayMatch ? dayMatch[1].toUpperCase() : null;

      // Extrair via com hierarquia estrita
      const route = extractRoute(fullText);

      // Extrair frequência da linha principal da medicação
      const freq = extractFrequency(cleanMain, isSN, isACM);

      // Extrair dose e unidade da linha principal (focando na dose prescrita em maiúsculas do MV)
      let dose = "";
      const doseMatch = mainLines.match(/(\d+(?:[.,]\d+)?)\s*(MILIGRAMA|MICROGRAM(?:\s*A)?|UNIDADE(?:\s*INTERNACIONAL)?|MILILITRO|GOTA|DOSE|AMPOLA|BOLSA|COMPRIMIDO|BISNAGA)\b/i);
      if (doseMatch) {
        dose = formatDose(doseMatch[1], doseMatch[2]);
      }

      // 5. Match no dicionário de sistemas usando cleanMain
      let matchedSystem = null;
      let drugName = null;
      let isContinuous = false;
      let isDiet = false;
      let isAE = false;
      let isInsulin = false;
      let isInsulinBIC = false;
      let isDialysis = false;

      // Sedativo contínuo prioritário
      for (const cs of CONTINUOUS_SEDATIVES) {
        if (cs.test.test(cleanMain)) {
          matchedSystem = "neuro";
          drugName = cs.clean;
          isContinuous = true;
          break;
        }
      }

      // DVA contínua prioritária
      if (!matchedSystem) {
        for (const cv of CONTINUOUS_VASOACTIVE) {
          if (cv.test.test(cleanMain)) {
            matchedSystem = "cardio";
            drugName = cv.clean;
            isContinuous = true;
            break;
          }
        }
      }

      // Regras gerais dos sistemas
      if (!matchedSystem) {
        for (const ruleGroup of DRUG_RULES) {
          for (const p of ruleGroup.patterns) {
            if (p.test.test(mainLines)) {
              matchedSystem = ruleGroup.system;
              if (typeof p.name === "function") {
                drugName = p.name(mainLines);
              } else {
                drugName = p.name;
              }
              if (p.isContinuous) isContinuous = true;
              if (p.isDiet) isDiet = true;
              if (p.isAE) isAE = true;
              if (p.isInsulin) isInsulin = true;
              if (p.isInsulinBIC) isInsulinBIC = true;
              if (p.isCustom) isDialysis = true;
              break;
            }
          }
          if (matchedSystem) break;
        }
      }

      // Tratar caso de diálise contínua CVVHD
      if (!matchedSystem && /cvvhd|hemodialise/i.test(mainLines)) {
        matchedSystem = "renal";
        drugName = "CVVHD";
        isDialysis = true;
      }

      // Tratar caso de hemo componentes
      if (!matchedSystem && /concentrado de hemacias|bolsa de hemacias/i.test(mainLines)) {
        matchedSystem = "hemo";
        drugName = "Concentrado de hemácias";
      }

      // Se ainda não encontrou e for dieta
      if (!matchedSystem && /dieta/i.test(mainLines)) {
        matchedSystem = "abd";
        isDiet = true;
        drugName = "Dieta enteral";
      }

      // Montar representação formatada concisa do item
      let formattedText = "";

      if (isContinuous) {
        formattedText = drugName;
      } else if (isDialysis) {
        formattedText = drugName;
      } else if (isDiet) {
        formattedText = drugName;
      } else if (isAE) {
        const mlMatch = mainLines.match(/(\d+)\s*ML/i);
        const ml = mlMatch ? `${mlMatch[1]}ml` : "";
        const f = freq || "4/4h";
        const r = route || "SNE";
        formattedText = `AE ${ml} ${f} ${r}`.replace(/\s+/g, " ").trim();
      } else if (isInsulinBIC) {
        formattedText = "Insulina BIC ACM IV";
      } else if (isInsulin) {
        formattedText = "Esquema de insulina SC";
      } else {
        // Verificar se é solução de base de hidratação ou reposição de eletrólitos com aditivos
        const isBaseHydrationSolution = /^(cloreto de sodio 0[,.]9%|sf 0[,.]9%|glicose 5%|sg 5%|solucao eletrolitica|ringer)/i.test(cleanText(item.header));

        if (cleanedSubLines.length > 0 && isBaseHydrationSolution) {
          const additives = [];
          for (const sub of cleanedSubLines) {
            const allMatches = [...sub.matchAll(/(\d+(?:[.,]\d+)?)\s*(MILILITRO|MILIGRAMA|UNIDADE|AMPOLA|BOLSA|ML|MG)\b/gi)];
            const subDoseMatch = allMatches.length > 0 ? allMatches[allMatches.length - 1] : null;
            let subDose = subDoseMatch ? formatDose(subDoseMatch[1], subDoseMatch[2]) : "";

            let subName = "";
            if (/potassio/i.test(sub)) subName = "KCl 19,1%";
            else if (/magnesio/i.test(sub)) subName = "MgSO4 10%";
            else if (/bicarbonato/i.test(sub)) subName = "HCO3 8,4%";
            else if (/calcio/i.test(sub)) subName = "CaCl 10%";
            else if (/fosfato/i.test(sub)) subName = "Fosfato de potássio";
            else {
              subName = sub.replace(/^\|->\s*/, "").split("-")[0].trim();
            }
            additives.push(`${subName} ${subDose}`.trim());
          }

          const vehicleName = drugName || "SF 0,9%";
          const parts = [`${vehicleName} ${dose}`.trim(), ...additives];
          const routePart = route ? ` ${route}` : "";
          const freqPart = freq ? ` ${freq}` : "";
          formattedText = `[${parts.join(" + ")}]${routePart}${freqPart}`.trim();
        } else {
          // Medicação regular com dose, frequência, via e dia
          const namePart = drugName || item.header.split("-")[0].trim();
          const dosePart = dose ? ` ${dose}` : "";
          const freqPart = freq && freq !== "SN" ? ` ${freq}` : "";
          const routePart = route ? ` ${route}` : "";
          const dayPart = dayCount ? ` (${dayCount})` : "";
          const snSuffix = isSN ? " SN" : (isACM && !freqPart ? " ACM" : "");

          formattedText = `${namePart}${dosePart}${freqPart}${routePart}${dayPart}${snSuffix}`
            .replace(/\s+/g, " ")
            .trim();
        }
      }

      if (matchedSystem && formattedText) {
        parsed.push({
          system: matchedSystem,
          name: drugName || item.header,
          formattedText: formattedText,
          isContinuous: isContinuous,
          isSN: isSN || (isACM && !isContinuous),
          isDiet: isDiet,
          isAE: isAE,
          originalBlock: item
        });
      }
    }

    return parsed;
  }

  // Ordenação e formatação final por sistema
  function buildOrganizedOutput(parsedItems) {
    const grouped = {};
    for (const sys of SYSTEMS) {
      grouped[sys.id] = [];
    }

    for (const item of parsedItems) {
      if (grouped[item.system]) {
        grouped[item.system].push(item);
      }
    }

    // Regras de ordenação dentro de cada sistema:
    // 1. Sedativos / DVAs contínuos em primeiro
    // 2. Horários e medicamentos regulares no meio
    // 3. SN / ACM no fim
    const resultLines = [];
    const structuredSystems = [];

    for (const sys of SYSTEMS) {
      const items = grouped[sys.id];
      let sortedItems = [];

      if (sys.id === "abd") {
        // Regra Abdominal: Dieta sempre em 1º lugar, seguida imediatamente por AE (Água Enteral)
        const diets = [];
        const aes = [];
        const abdRegular = [];
        const abdAsNeeded = [];
        for (const it of items) {
          if (it.isDiet) {
            diets.push(it);
          } else if (it.isAE) {
            aes.push(it);
          } else if (it.isSN) {
            abdAsNeeded.push(it);
          } else {
            abdRegular.push(it);
          }
        }
        // Se houver múltiplas dietas no mesmo dia (ex: troca de dieta), manter a última prescrita
        const activeDiets = diets.length > 1 ? [diets[diets.length - 1]] : diets;
        sortedItems = [...activeDiets, ...aes, ...abdRegular, ...abdAsNeeded];
      } else {
        const continuous = [];
        const regular = [];
        const asNeeded = [];
        for (const it of items) {
          if (it.isContinuous) {
            continuous.push(it);
          } else if (it.isSN) {
            asNeeded.push(it);
          } else {
            regular.push(it);
          }
        }
        sortedItems = [...continuous, ...regular, ...asNeeded];
      }
      let lineText = `${sys.name}: `;

      if (sortedItems.length === 0) {
        lineText += "-";
      } else {
        lineText += sortedItems.map(i => i.formattedText).join(" + ");
      }

      resultLines.push(lineText);
      structuredSystems.push({
        systemId: sys.id,
        systemName: sys.name,
        items: sortedItems,
        lineText: lineText
      });
    }

    const fullPlainText = resultLines.join("\n");
    return {
      plainText: fullPlainText,
      systems: structuredSystems
    };
  }

  // Função mestre que junta parser e agrupamento
  function organizePrescription(rawText) {
    const rawItems = parsePrescriptionRaw(rawText);
    const parsedItems = processItems(rawItems);
    return buildOrganizedOutput(parsedItems);
  }

  // Exportar para navegador ou Node.js
  const prescriptionApi = {
    cleanText,
    SYSTEMS,
    parsePrescriptionRaw,
    processItems,
    buildOrganizedOutput,
    organizePrescription
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = prescriptionApi;
  } else {
    window.__EXAMES_APP__ = window.__EXAMES_APP__ || {};
    window.__EXAMES_APP__.prescription = prescriptionApi;
  }
})();
