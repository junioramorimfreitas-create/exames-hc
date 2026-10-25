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

  // Sistemas Orgânicos Canônicos (7 principais + "Outros" condicional)
  const SYSTEMS = [
    { id: "neuro", name: "Neurológico" },
    { id: "cardio", name: "Cardiovascular" },
    { id: "resp", name: "Respiratório" },
    { id: "hemo", name: "Hematológico" },
    { id: "renal", name: "Renal/Metabólico" },
    { id: "abd", name: "Abdominal" },
    { id: "infec", name: "Infeccioso" },
    { id: "outros", name: "Outros", optional: true }
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
        { test: /itraconazol/i, name: "Itraconazol" },
        { test: /posaconazol/i, name: "Posaconazol" },
        { test: /micafungina/i, name: "Micafungina" },
        { test: /anidulafungina/i, name: "Anidulafungina" },
        { test: /caspofungina/i, name: "Caspofungina" },
        { test: /nistatina/i, name: "Nistatina" },
        { test: /cetoconazol/i, name: (txt) => /creme|pomada|derm|top/i.test(txt) ? "Cetoconazol creme" : "Cetoconazol" },
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
        { test: /sulfametoxazol.*trimetopri[mn]|bactrim|cotrimoxazol/i, name: "Sulfametoxazol/Trimetoprima" },
        { test: /tenofovir.*lamivudina/i, name: "Tenofovir/Lamivudina" },
        { test: /dolutegravir/i, name: "Dolutegravir" },
        { test: /darunavir/i, name: "Darunavir" },
        { test: /ritonavir/i, name: "Ritonavir" },
        { test: /efavirenz/i, name: "Efavirenz" },
        { test: /entecavir/i, name: "Entecavir" },
        { test: /tenofovir/i, name: "Tenofovir" },
        { test: /lamivudina/i, name: "Lamivudina" },
        { test: /ganciclovir/i, name: "Ganciclovir" },
        { test: /valganciclovir/i, name: "Valganciclovir" },
        { test: /foscarnet/i, name: "Foscarnet" },
        { test: /aciclovir/i, name: "Aciclovir" },
        { test: /oseltamivir/i, name: "Oseltamivir" },
        { test: /ceftriaxona/i, name: "Ceftriaxona" },
        { test: /cefepima/i, name: "Cefepima" },
        { test: /ceftazidima/i, name: "Ceftazidima" },
        { test: /cefazolina/i, name: "Cefazolina" },
        { test: /cefalexina/i, name: "Cefalexina" },
        { test: /cefuroxima/i, name: "Cefuroxima" },
        { test: /ciprofloxaci/i, name: "Ciprofloxacino" },
        { test: /levofloxaci/i, name: "Levofloxacino" },
        { test: /moxifloxaci/i, name: "Moxifloxacino" },
        { test: /metronidazol/i, name: "Metronidazol" },
        { test: /clindamicina/i, name: "Clindamicina" },
        { test: /amicacina/i, name: "Amicacina" },
        { test: /gentamicina/i, name: (txt) => /pomada|creme|derm|oto/i.test(txt) ? "Gentamicina pomada" : "Gentamicina" },
        { test: /azitromicina/i, name: "Azitromicina" },
        { test: /claritromicina/i, name: "Claritromicina" },
        { test: /oxacilina/i, name: "Oxacilina" },
        { test: /ampicilina/i, name: "Ampicilina" },
        { test: /amoxicilina/i, name: "Amoxicilina" },
        { test: /penicilina/i, name: "Penicilina" },
        { test: /tigeciclina/i, name: "Tigeciclina" },
        { test: /doxiciclina/i, name: "Doxiciclina" },
        { test: /rifampicina\s*\+\s*isoniazida.*pirazinamida.*etambutol|\bripe\b/i, name: "RIPE" },
        { test: /rifampicina\s*\+\s*isoniazida/i, name: "Rifampicina/Isoniazida" },
        { test: /rifampicina/i, name: "Rifampicina" },
        { test: /isoniazida/i, name: "Isoniazida" },
        { test: /pirazinamida/i, name: "Pirazinamida" },
        { test: /etambutol/i, name: "Etambutol" },
        { test: /dapsona/i, name: "Dapsona" },
        { test: /ivermectina/i, name: "Ivermectina" },
        { test: /albendazol/i, name: "Albendazol" }
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
        // Anti-hipertensivos / Vasodilatadores / Antiarrítmicos / Estatinas / Corticoides hemodinâmicos
        { test: /\bhidralazina\b/i, name: "Hidralazina" },
        { test: /\b(anlodipino|amlodipino)\b/i, name: "Anlodipino" },
        { test: /\bnifedipino\b/i, name: "Nifedipino" },
        { test: /\bisossorbida\b/i, name: (txt) => /mononitrato/i.test(txt) ? "Mononitrato de isossorbida" : "Isossorbida" },
        { test: /\batenolol\b/i, name: "Atenolol" },
        { test: /\bmetoprolol\b/i, name: "Metoprolol" },
        { test: /\bcarvedilol\b/i, name: "Carvedilol" },
        { test: /\bpropranolol\b/i, name: "Propranolol" },
        { test: /\bbisoprolol\b/i, name: "Bisoprolol" },
        { test: /\besmolol\b/i, name: "Esmolol" },
        { test: /\bamiodarona\b/i, name: "Amiodarona" },
        { test: /\bdigoxina\b/i, name: "Digoxina" },
        { test: /\bdiltiazem\b/i, name: "Diltiazem" },
        { test: /\bverapamil\b/i, name: "Verapamil" },
        { test: /\blosartana\b/i, name: "Losartana" },
        { test: /\bvalsartana\b/i, name: "Valsartana" },
        { test: /\bcandesartana\b/i, name: "Candesartana" },
        { test: /\benalapril\b/i, name: "Enalapril" },
        { test: /\bcaptopril\b/i, name: "Captopril" },
        { test: /\bramipril\b/i, name: "Ramipril" },
        { test: /\bclonidina\b/i, name: "Clonidina" },
        { test: /\batorvastatina\b/i, name: "Atorvastatina" },
        { test: /\bsinvastatina\b/i, name: "Sinvastatina" },
        { test: /\brosuvastatina\b/i, name: "Rosuvastatina" },
        { test: /\bhidrocortisona\b/i, name: "Hidrocortisona" },
        { test: /\bfludrocortisona\b/i, name: "Fludrocortisona" }
      ]
    },

    // --- 3. NEUROLÓGICO ---
    {
      system: "neuro",
      patterns: [
        { test: /\bpropofol\b/i, name: "Propofol", isContinuous: true },
        { test: /\bfentanil(a)?\b/i, name: "Fentanil", isContinuous: true },
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
        { test: /\bciclobenzaprina\b/i, name: "Ciclobenzaprina" },
        // Antipsicóticos / Sedativos / Antidepressivos / Outros SNC
        { test: /\brisperidona\b/i, name: "Risperidona" },
        { test: /\b(haloperidol|haldol)\b/i, name: "Haloperidol" },
        { test: /\bquetiapina\b/i, name: "Quetiapina" },
        { test: /\bolanzapina\b/i, name: "Olanzapina" },
        { test: /\bclorpromazina\b/i, name: "Clorpromazina" },
        { test: /\blevomepromazina\b/i, name: "Levomepromazina" },
        { test: /\b(clonazepam|rivotril)\b/i, name: "Clonazepam" },
        { test: /\bclobazam\b/i, name: "Clobazam" },
        { test: /\bdiazepam\b/i, name: "Diazepam" },
        { test: /\blorazepam\b/i, name: "Lorazepam" },
        { test: /\bsertralina\b/i, name: "Sertralina" },
        { test: /\bescitalopram\b/i, name: "Escitalopram" },
        { test: /\bcitalopram\b/i, name: "Citalopram" },
        { test: /\bfluoxetina\b/i, name: "Fluoxetina" },
        { test: /\bparoxetina\b/i, name: "Paroxetina" },
        { test: /\bvenlafaxina\b/i, name: "Venlafaxina" },
        { test: /\bduloxetina\b/i, name: "Duloxetina" },
        { test: /\bmirtazapina\b/i, name: "Mirtazapina" },
        { test: /\btrazodona\b/i, name: "Trazodona" },
        { test: /\bamitriptilina\b/i, name: "Amitriptilina" },
        { test: /\bnortriptilina\b/i, name: "Nortriptilina" },
        { test: /\bnicotina\b/i, name: (txt) => /adesivo|transderm/i.test(txt) ? "Nicotina adesivo" : "Nicotina" },
        // Anticonvulsivantes
        { test: /\b(fenitoina|hidantal)\b/i, name: "Fenitoína" },
        { test: /\b(levetiracetam|keppra)\b/i, name: "Levetiracetam" },
        { test: /\b(valproato|acido valproico|depakene)\b/i, name: "Ácido Valproico" },
        { test: /\bcarbamazepina\b/i, name: "Carbamazepina" },
        { test: /\blamotrigina\b/i, name: "Lamotrigina" },
        { test: /\boxcarbazepina\b/i, name: "Oxcarbazepina" },
        { test: /\btopiramato\b/i, name: "Topiramato" },
        { test: /\blacosamida\b/i, name: "Lacosamida" },
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
        { test: /\bsalmeterol\b/i, name: "Salmeterol" },
        { test: /\btiotropio\b/i, name: "Tiotrópio" },
        { test: /\bbudesonida\b/i, name: "Budesonida" },
        { test: /\bbeclometasona\b/i, name: "Beclometasona" },
        { test: /\bfluticasona\b/i, name: "Fluticasona" },
        { test: /\bdexametasona\b/i, name: "Dexametasona" },
        { test: /\bmetilprednisolona\b/i, name: "Metilprednisolona" },
        { test: /\b(prednisona|prednisolona)\b/i, name: "Prednisona" },
        { test: /\bpropantelina\b/i, name: (txt) => /gel|derm/i.test(txt) ? "Propantelina gel" : "Propantelina" },
        { test: /\batropina\b/i, name: "Atropina" },
        { test: /\bescopolamina\b/i, name: "Escopolamina" },
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
        { test: /\b(eritropoietina|eritropoetina|epo)\b/i, name: "Eritropoetina" },
        { test: /\beltrombopague\b/i, name: "Eltrombopague" },
        { test: /vitamina\s*b12|cianocobalamina|hidroxicobalamina/i, name: "Vitamina B12" },
        { test: /acido\s*folico/i, name: "Ácido Fólico" },
        { test: /folinato|acido\s*folinico|leucovorin/i, name: "Ácido Folínico" },
        // Imunossupressores
        { test: /\btacrolimo\b/i, name: "Tacrolimo" },
        { test: /\bciclosporina\b/i, name: "Ciclosporina" },
        { test: /\bhidroxicloroquina\b/i, name: "Hidroxicloroquina" },
        { test: /\bmicofenolato\b/i, name: "Micofenolato" },
        { test: /\bazatioprina\b/i, name: "Azatioprina" },
        { test: /\bsirolimo\b/i, name: "Sirolimo" },
        { test: /\beverolimo\b/i, name: "Everolimo" },
        // Hemocomponentes e Hemostáticos
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
        { test: /\bclortalidona\b/i, name: "Clortalidona" },
        { test: /\bacetazolamida\b/i, name: "Acetazolamida" },
        // Hormônios / Metabólico / Vitaminas e Oligoelementos
        { test: /\blevotiroxina\b/i, name: "Levotiroxina" },
        { test: /\btiamina\b|vitamina\s*b1\b/i, name: "Tiamina" },
        { test: /\bpiridoxina\b|vitamina\s*b6\b/i, name: "Piridoxina" },
        { test: /\bmultivitaminas\b|\bpolivitaminico\b/i, name: "Multivitaminas" },
        { test: /\bmicroelementos\b|\boligoelementos\b/i, name: "Microelementos" },
        // Eletrólitos e Reposições
        { test: /cloreto de sodio 20%/i, name: "NaCl 20%" },
        { test: /cloreto de sodio 0[,.]9%/i, name: "SF 0,9%" },
        { test: /glicose 50%/i, name: "Glicose 50%" },
        { test: /glicose 5%/i, name: "SG 5%" },
        { test: /glicose\s+15\s*g/i, name: "Glicose" },
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
        { test: /dieta parenteral|\bnpt\b/i, name: "Dieta parenteral", isDiet: true },
        { test: /dieta geral/i, name: (txt) => {
          const rh = cleanText(txt).match(/restricao hidrica\s*[-:]?\s*(\d+\s*ml\/?d?)/i);
          return rh ? `Dieta geral (restrição hídrica ${rh[1].replace(/\s+/g, "")})` : "Dieta geral";
        }, isDiet: true },
        { test: /dieta pastosa/i, name: "Dieta pastosa", isDiet: true },
        { test: /dieta papa/i, name: "Dieta Papa II", isDiet: true },
        { test: /dieta branda/i, name: "Dieta branda", isDiet: true },
        { test: /dieta liquida/i, name: "Dieta líquida", isDiet: true },
        { test: /^\s*jejum\b|\bdieta\s+zero\b|\bnpo\b|\bjejum\s+alimentar\b/i, name: "Dieta zero (jejum)", isDiet: true },
        // Água Enteral e Água VO
        { test: /agua enteral/i, name: "AE", isAE: true },
        { test: /^\s*agua\s+vo\b/i, name: (txt) => /pequenos goles/i.test(txt) ? "Água VO (pequenos goles)" : "Água VO", isCustom: true },
        // Protetores Gástricos
        { test: /\bpantoprazol\b/i, name: "Pantoprazol" },
        { test: /\bomeprazol\b/i, name: "Omeprazol" },
        { test: /\besomeprazol\b/i, name: "Esomeprazol" },
        { test: /\branitidina\b/i, name: "Ranitidina" },
        // Ácidos biliares / Hepatologia
        { test: /acido\s+ursodesoxicolico|ursodesoxicolico|ursacol/i, name: "Ácido ursodesoxicólico" },
        // Laxativos / Enemas / Antidiarreicos
        { test: /\bbisacodil\b/i, name: "Bisacodil" },
        { test: /\blactulose\b/i, name: "Lactulose" },
        { test: /oleo mineral/i, name: "Óleo mineral" },
        { test: /\bpicossulfato\b/i, name: "Picossulfato de sódio" },
        { test: /\b(polietilenoglicol|macrogol|peg)\b/i, name: "PEG" },
        { test: /glicerina.*retal|clister/i, name: "Glicerina 12%" },
        { test: /\bsimeticona\b/i, name: "Simeticona" },
        { test: /\bloperamida\b/i, name: "Loperamida" },
        // Procinéticos / Antieméticos
        { test: /\b(metoclopramida|plasil)\b/i, name: "Metoclopramida" },
        { test: /\bbromoprida\b/i, name: "Bromoprida" },
        { test: /\bondansetrona\b/i, name: "Ondansetrona" },
        { test: /\b(dimenidrinato|dramin)\b/i, name: "Dimenidrinato" },
        // Insulina
        { test: /insulina.*bic|insulina.*diluicao/i, name: "Insulina BIC", isInsulinBIC: true },
        { test: /insulina/i, name: "Esquema de insulina", isInsulin: true }
      ]
    },

    // --- 8. OUTROS (Tópicos não-infecciosos, Colutórios, Anti-histamínicos, etc.) ---
    {
      system: "outros",
      patterns: [
        { test: /\bdifenidramina\b/i, name: "Difenidramina" },
        { test: /\bloratadina\b/i, name: "Loratadina" },
        { test: /\bdexclorfeniramina\b/i, name: "Dexclorfeniramina" },
        { test: /\bhidroxizina\b/i, name: "Hidroxizina" },
        { test: /\bfexofenadina\b/i, name: "Fexofenadina" },
        { test: /vaselina.*lanolina|lanolina.*vaselina/i, name: "Vaselina/Lanolina pomada" },
        { test: /\bvaselina\b/i, name: "Vaselina" },
        { test: /cold\s*cream/i, name: "Cold cream" },
        { test: /\bbetametasona\b/i, name: (txt) => /creme|pomada|derm|top/i.test(txt) ? "Betametasona creme" : "Betametasona" },
        { test: /\blidocaina\b/i, name: (txt) => /gel|pomada|creme|derm|top/i.test(txt) ? "Lidocaína gel" : "Lidocaína" },
        { test: /hialuronato\s+de\s+sodio/i, name: "Hialuronato de sódio colutório" },
        { test: /clorexidina.*colutorio|colutorio.*clorexidina/i, name: "Clorexidina colutório" }
      ]
    }
  ];

  // Helper para padronizar dose
  function formatNumberBR(num) {
    return Number.isInteger(num) ? `${num}` : num.toString().replace(".", ",");
  }

  function formatDose(doseVal, unitStr) {
    if (!doseVal) return "";
    let num = parseFloat(doseVal.toString().replace(",", "."));
    if (isNaN(num)) return doseVal;

    const unit = cleanText(unitStr).replace(/\s+/g, "");
    if (unit.includes("miligrama") || unit === "mg") {
      if (num >= 1000 && (num % 1000 === 0 || num % 250 === 0 || num % 100 === 0)) {
        return `${formatNumberBR(num / 1000)}g`;
      }
      return `${formatNumberBR(num)}mg`;
    }
    if (unit.includes("microgram") || unit === "mcg") {
      return `${formatNumberBR(num)}mcg`;
    }
    if (unit.includes("grama") || unit === "g") {
      return `${formatNumberBR(num)}g`;
    }
    if (unit.includes("unidade") || unit.includes("ui")) {
      return `${formatNumberBR(num)}UI`;
    }
    if (unit.includes("mililitro") || unit === "ml") {
      return `${formatNumberBR(num)}ml`;
    }
    if (unit.includes("gota")) {
      return `${formatNumberBR(num)}gts`;
    }
    if (unit.includes("dose")) {
      return `${formatNumberBR(num)} jatos`;
    }
    if (unit.includes("frascoampola") || unit.includes("frasco-ampola")) {
      return `${formatNumberBR(num)} FA`;
    }
    if (unit.includes("ampola") || unit === "amp") {
      return `${formatNumberBR(num)} amp`;
    }
    if (unit.includes("bolsa")) {
      return `${formatNumberBR(num)} bolsa`;
    }
    if (unit.includes("comprimid") || unit === "cp") {
      return `${formatNumberBR(num)} cp`;
    }
    if (unit.includes("bisnaga")) {
      return `${formatNumberBR(num)} bisnaga`;
    }
    if (unit.includes("envelope") || unit === "env") {
      return `${formatNumberBR(num)} env`;
    }
    return `${formatNumberBR(num)}${unitStr}`;
  }

  // Helper com hierarquia estrita para via de administração
  function extractRoute(fullText) {
    const clean = cleanText(fullText);
    if (/\bgtrs\b|\bgastrostomia\b/.test(clean)) return "GTRS";
    if (/\bsne\b|\bsonda nasoenteral\b/.test(clean)) return "SNE";
    if (/\bsng\b|\bsonda nasogastrica\b/.test(clean)) return "SNG";
    if (/\biv\b|\bintravenosa\b|\bev\b/.test(clean)) return "IV";
    if (/\bsc\b|\bsubcutanea\b/.test(clean)) return "SC";
    if (/\bsubl\b|\bsl\b|\bsublingual\b/.test(clean)) return "SL";
    if (/\bin\s+o\b|\binal\b|\binalatoria\b|\baerosol\b/.test(clean)) return "INAL";
    if (/\btder\b|\btransdermic[oa]?\b/.test(clean)) return "Transdérmico";
    if (/\boto\b|\botologic[oa]?\b/.test(clean)) return "Otológico";
    if (/\bderm\b|\btop\b|\btopico\b/.test(clean)) return "Tópico";
    if (/\bbuc\b|\bbc\b|\bbucal\b/.test(clean)) return "Bucal";
    if (/\bvr\b|\bret\b|\bretal\b/.test(clean)) return "VR";
    if (/\boral\b|\bvo\b/.test(clean)) return "VO";
    return "";
  }

  // Helper para padronizar frequência / intervalo usando cleanText
  function extractFrequency(cleanTextStr, isSN, isACM) {
    if (cleanTextStr.includes("agora") || cleanTextStr.includes("urgente")) return "agora";
    if (cleanTextStr.includes("dias pares")) return "dias pares";
    if (cleanTextStr.includes("dias impares")) return "dias ímpares";
    if (cleanTextStr.includes("segundas e quintas") || cleanTextStr.includes("2x/seman")) return "2x/sem";
    if (cleanTextStr.includes("3x/seman") || cleanTextStr.includes("segqua-sex") || cleanTextStr.includes("seg-qua-sex")) return "3x/sem";

    const hourMatch = cleanTextStr.match(/(\d+)\s*\/\s*(\d+)\s*h/);
    if (hourMatch) {
      return `${hourMatch[1]}/${hourMatch[2]}h`;
    }

    if (cleanTextStr.includes("2x ao dia") || cleanTextStr.includes("2xdia")) return "12/12h";
    if (cleanTextStr.includes("3xdia") || cleanTextStr.includes("3x pre")) return "8/8h";
    if (cleanTextStr.includes("4xdia")) return "6/6h";
    if (cleanTextStr.includes("1x manha") || cleanTextStr.includes("1x man")) return "1x manhã";
    if (cleanTextStr.includes("1x tarde")) return "1x tarde";
    if (cleanTextStr.includes("1x noite")) return "1x noite";
    if (cleanTextStr.includes("1xdia") || cleanTextStr.includes("1x ao dia") || cleanTextStr.includes("1x/dia")) return "1x/dia";
    if (cleanTextStr.includes("pos-almoco") || cleanTextStr.includes("pos almoco") || cleanTextStr.includes("posalmoco")) return "1x/dia";
    if (cleanTextStr.includes("1 vez")) return "1x/dia";
    if (cleanTextStr.includes("jejum")) return "jejum";
    if (cleanTextStr.includes("continu")) return "contínuo";

    if (isSN) return "SN";
    if (isACM) return "ACM";

    return "";
  }

  // Verifica se uma linha sem número inicial representa o cabeçalho de um novo item (ex: item suspenso no MV)
  function isUnnumberedMedicationStart(line, currentBlock) {
    if (!line || line.startsWith("|->")) return false;
    const clean = cleanText(line);

    // Linhas que são claramente continuação ou metadados do item anterior
    if (/^(obs\.:|justificativa:|prescricao\.+:|suspenso dia\.:|miliequivalente:|milimol:|cada ampola|concentracao|tempo minimo|no campo da|incluir o codigo|diluir a ampola|a solucao diluida|aplicar |dissolver |menor que|maior que|corrigir |conforme |se dxt|se dextro|se glicemia|infusao|favor diluir|oferta deve|dispositivo:|fluxo de |uf \d|na \d+|\[\d{2}\/\d{2}\]|\*|\d+\s*[-a]\s*\d+)/i.test(clean)) {
      return false;
    }

    // 1. Linha começa com contador de dias de antimicrobiano sem número de item antes: "(D1/99) tenofovir..."
    if (/^\(d\d+\/\d+\)\s+[a-z]/i.test(clean)) {
      return true;
    }

    // 2. Linha contém "Suspenso dia.:" mas começa com nome de medicação/dieta
    if (/suspenso dia\.:/i.test(clean) && /^[a-z\(]/i.test(clean)) {
      return true;
    }

    // 3. Inícios explícitos conhecidos de itens sem número
    if (/^(difenidramina|bicarbonato de sodio \d+|dieta pastosa|dieta geral|concentrado de hemacias|cloreto de potassio|propantelina|lactulose \d+|bisacodil \d+|dipirona.*solucao|tenofovir \d+)/i.test(clean)) {
      // Se o bloco atual ainda não tem linhas de posologia/horário e o cabeçalho for igual (quebra de linha), cuidado:
      // Mas todos esses nomes são cabeçalhos completos de drogas. Se currentBlock já tiver mais de 1 linha ou já tiver posologia, é novo bloco!
      if (!currentBlock || currentBlock.lines.length >= 2) {
        return true;
      }
    }

    return false;
  }

  // Segmentação do laudo em blocos de itens
  function parsePrescriptionRaw(rawText) {
    if (!rawText) return [];

    const lines = rawText.split(/\r?\n/);
    const items = [];
    let currentBlock = null;
    let isSkippingHeader = false;

    const flushBlock = () => {
      if (currentBlock) {
        items.push(currentBlock);
        currentBlock = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Pular cabeçalhos e rodapés repetidos das páginas do MV
      if (line.includes("MV PEP Prontuário") || line.includes("MV | SoulMV") || line.startsWith("CRM :") || line.includes("HOSPITAL DAS CLINICAS DE SAO PAULO")) {
        flushBlock();
        if (line.includes("MV PEP Prontuário") || line.includes("MV | SoulMV") || line.startsWith("CRM :")) {
          isSkippingHeader = true;
        }
        continue;
      }
      if (isSkippingHeader) {
        if (line.includes("Qtde Prescrita") || line.includes("PRESCRICAO MEDICA") || line.includes("PRESCRICAO MED DIALISE")) {
          isSkippingHeader = false;
        }
        continue;
      }
      if (
        line.includes("Qtd Unidade SN Apl") ||
        line.startsWith("Qtde Prescrita") ||
        line.startsWith("Alergias:") ||
        line.includes("Alergia Alta Vigilância") ||
        line.includes("Evento Adverso") ||
        line.includes("Dose Padrão Alterada") ||
        line === "Antimicrobiano"
      ) {
        flushBlock();
        continue;
      }

      const isSubItemQuantity = /^(\d+(?:[.,]\d+)?)\s*(bolsa|mililitro|miligrama|micrograma?|unidade|ampola|gota|dose|bisnaga|frasco|comprimid[oa]?|envelope|gramas?|mg|ml|mcg|g|ui)?$/i.test(line);
      const isLineSubItem = line.startsWith("|->");
      const numMatch = line.match(/^(\d+)\s+([A-Za-zÁ-ú\(\[\)\/].*)/);
      const startsWithUnit = numMatch && /^(bolsa|mililitro|miligrama|micrograma?|unidade|ampola|gota|dose|bisnaga|frasco|comprimid[oa]?|capsula|envelope|seringa|gramas?|hora|horas|min|mg|ml|mcg|g|ui|meq|mmol|l|h|hr|dia|dias|a)\b/i.test(cleanText(numMatch[2]));

      const isUnnumberedStart = !isLineSubItem && !isSubItemQuantity && isUnnumberedMedicationStart(line, currentBlock);

      if ((numMatch && !startsWithUnit) || isUnnumberedStart) {
        flushBlock();
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
    flushBlock();

    return items;
  }

  // Converte doses prescritas em mL para mg/g quando se tratar de solução/suspensão oral com concentração explícita
  function tryConvertOralSolutionMlToMg(mainLines, cleanMain, mlDoseStr) {
    // Lista de itens cuja posologia clínica padrão é mantida em mL
    if (/\b(lactulose|bicarbonato|cloreto|fosfato|sulfato|gluconato|glicose|agua|dieta|microelementos|oligoelementos|glicerina|nistatina|hialuronato|concentrado de hemacias)\b/i.test(cleanMain)) {
      return null;
    }

    const mlVal = parseFloat(mlDoseStr.toString().replace(",", "."));
    if (isNaN(mlVal) || mlVal <= 0) return null;

    // 1. Concentração combinada: "(200 mg+40 mg)/5ml" ou "150 mg + 75 mg/5mL"
    const comboMatch = mainLines.match(/\(?(\d+(?:[.,]\d+)?)\s*mg\s*\+\s*(\d+(?:[.,]\d+)?)\s*mg\)?\s*\/\s*(\d+(?:[.,]\d+)?)?\s*ml/i);
    if (comboMatch) {
      const mg1 = parseFloat(comboMatch[1].replace(",", "."));
      const mg2 = parseFloat(comboMatch[2].replace(",", "."));
      const perMl = comboMatch[3] ? parseFloat(comboMatch[3].replace(",", ".")) : 1;
      if (perMl > 0) {
        const d1 = (mlVal * mg1) / perMl;
        const d2 = (mlVal * mg2) / perMl;
        return `${formatNumberBR(d1)}/${formatNumberBR(d2)}mg`;
      }
    }

    // 2. Concentração simples: "25 mg/5ml", "100 mg/ml", "1mg/ml", "300MG/5ML"
    const singleMatch = mainLines.match(/(\d+(?:[.,]\d+)?)\s*mg\s*\/\s*(\d+(?:[.,]\d+)?)?\s*ml/i);
    if (singleMatch) {
      const mg = parseFloat(singleMatch[1].replace(",", "."));
      const perMl = singleMatch[2] ? parseFloat(singleMatch[2].replace(",", ".")) : 1;
      if (perMl > 0) {
        const totalMg = (mlVal * mg) / perMl;
        return formatDose(totalMg, "mg");
      }
    }

    return null;
  }

  // Parser principal que converte os blocos em objetos clínicos
  function processItems(rawItems) {
    const parsed = [];

    for (const item of rawItems) {
      // 1. Filtrar seções suspensas
      if (/suspenso dia\.:/i.test(item.lines.join(" "))) {
        continue;
      }

      const fullText = item.lines.join(" ");
      const mainLines = item.lines.filter(l => !l.startsWith("|->")).join(" ");
      const cleanMain = cleanText(mainLines);
      const cleanHeader = cleanText(item.header);

      // Linhas de descrição da medicação (sem Justificativa e sem Obs.: para não contaminar o nome da droga)
      const drugIdentityLines = item.lines
        .filter(l => !l.startsWith("|->") && !/^(justificativa:|obs\.:|reconstituir |cada ampola|concentracao|tempo minimo|no campo da|incluir o codigo|diluir a ampola|a solucao diluida|dissolver )/i.test(cleanText(l)))
        .join(" ");
      const cleanIdentity = cleanText(drugIdentityLines);

      // 2. Descartar procedimentos de enfermagem / exames de imagem / insumos de máquina de diálise / ruído
      if (/^(rx torax|tc cranio|tc angio|glicemia capilar|quantificar diurese|cuidados especiais|capilar|tempo de procedimento|contencao mecanica|manter cabeceira|solucao eletrolitica|solucao acd|protocolo calcio|protocolo citrato)/i.test(cleanHeader)) {
        continue;
      }
      if (/^(se intercorrencias|colher na|colher cai|duracao: 24h|temperatura do dialisato)/i.test(cleanHeader)) {
        continue;
      }
      // Descartar soluções exclusivas do circuito da máquina de diálise e heparina lock de cateter
      if (/dispositivo:\s*maquina de dialise|\bacm\s+bi\b|\block\b/i.test(cleanMain)) {
        continue;
      }

      // 3. Extrair aditivos (|->) unindo todas as linhas do sub-item até o próximo |->
      const cleanedSubLines = [];
      let currentSub = null;
      for (let idx = 0; idx < item.lines.length; idx++) {
        const l = item.lines[idx];
        if (l.startsWith("|->")) {
          if (currentSub) cleanedSubLines.push(currentSub);
          if (/seringa|agulha|swab|sache|luva|oclusor|agua para injetaveis|exames pre/i.test(cleanText(l))) {
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
      const hasSColumnFlag = /\bS\s+(IV|SNE|SNG|ORAL|GTRS|SC|SUBL|SL|INAL|IN\s+O|DERM|TOP|RET|VR|BUC|BC)\b/i.test(mainLines);
      const hasSNCondition = /\bSN\b|se\s+(nauseas?|dor|febre|hiperglicemia|hipoglicemia|dextro|glicemia|agitacao|constipacao|necessario)|dextro\s*(<|menor)/i.test(cleanText(fullText));
      const isSN = hasSColumnFlag || hasSNCondition;
      const isACM = /\bACM\b/i.test(mainLines);
      const isBIC = /bomba de infusao|uso bic|infusao estendida|\bem bic\b|com diluicao\s*-\s*bolsa/i.test(cleanText(fullText));

      // Extrair dia de antibiótico (ex: "(D11/14)", "(D8/7)")
      const dayMatch = fullText.match(/\((D\d+\/\d+)\)/i);
      const dayCount = dayMatch ? dayMatch[1].toUpperCase() : null;

      // Extrair via com hierarquia estrita (priorizando a linha principal da medicação)
      const route = extractRoute(mainLines) || extractRoute(fullText);

      // Extrair frequência da linha principal da medicação
      const freq = extractFrequency(cleanMain, isSN, isACM);

      // Extrair dose e unidade da linha principal (focando na coluna de dose prescrita em MAIÚSCULAS do MV e ignorando taxas /Hr)
      let dose = "";
      const doseMatch = mainLines.match(/(?:^|\s)(\d+(?:[.,]\d+)?)\s*(MILIGRAMA|MICROGRAM(?:\s*A)?|UNIDADE(?:\s+S)?(?:\s*INTERNACIO(?:\s*NAL)?)?|MILILITRO|GRAMAS?|GOTA|DOSE|FRASCO(?:\s*-?\s*AMPOLA)?|AMPOLA|BOLSA|COMPRIMID(?:\s*O)?|BISNAGA|ENVELOPE)\b(?!\s*\/\s*Hr)/);
      if (doseMatch) {
        const rawVal = doseMatch[1];
        const rawUnit = doseMatch[2];
        if (/mililitro/i.test(rawUnit)) {
          const converted = tryConvertOralSolutionMlToMg(mainLines, cleanMain, rawVal);
          dose = converted || formatDose(rawVal, rawUnit);
        } else if (/comprimid/i.test(rawUnit) && !/\+/.test(drugIdentityLines)) {
          const strengthMatch = drugIdentityLines.match(/(\d+(?:[.,]\d+)?)\s*mg\b/i);
          const count = parseFloat(rawVal.replace(",", "."));
          if (strengthMatch && !isNaN(count) && count > 0) {
            const totalMg = count * parseFloat(strengthMatch[1].replace(",", "."));
            dose = formatDose(totalMg, "mg");
          } else {
            dose = formatDose(rawVal, rawUnit);
          }
        } else if (/^unidade$/i.test(rawUnit.trim()) && /adesivo/i.test(cleanIdentity)) {
          const strengthMatch = drugIdentityLines.match(/(\d+(?:[.,]\d+)?)\s*mg\b/i);
          const count = parseFloat(rawVal.replace(",", "."));
          if (strengthMatch && !isNaN(count) && count > 0) {
            const totalMg = count * parseFloat(strengthMatch[1].replace(",", "."));
            dose = formatDose(totalMg, "mg");
          } else {
            dose = `${formatNumberBR(count)} adesivo`;
          }
        } else {
          dose = formatDose(rawVal, rawUnit);
        }
      }

      // Ajuste específico para Concentrado de Hemácias quando prescrito "1 MILILITRO" no MV
      if (/concentrado de hemacias/i.test(cleanMain) && dose === "1ml") {
        dose = "1 bolsa";
      }

      // 5. Match no dicionário de sistemas usando cleanIdentity (sem Obs/Justificativa)
      let matchedSystem = null;
      let drugName = null;
      let isContinuous = false;
      let isDiet = false;
      let isAE = false;
      let isInsulin = false;
      let isInsulinBIC = false;
      let isDialysis = false;

      // Sedativo contínuo prioritário (exceto se for bolus isolado "Agora" sem BIC)
      for (const cs of CONTINUOUS_SEDATIVES) {
        if (cs.test.test(cleanIdentity)) {
          matchedSystem = "neuro";
          drugName = cs.clean;
          const isBolusOnly = (freq === "agora" || /\bem bolus\b/i.test(cleanIdentity)) && !/bomba de infusao|uso bic|\bem bic\b/i.test(cleanMain);
          isContinuous = !isBolusOnly;
          break;
        }
      }

      // Morfina contínua em BIC ("COM DILUICAO - Bolsa" / "EM BIC")
      if (!matchedSystem && /\bmorfina\b/i.test(cleanIdentity) && /\bem bic\b|com diluicao\s*-\s*bolsa|bomba de infusao/i.test(cleanMain)) {
        matchedSystem = "neuro";
        drugName = "Morfina";
        isContinuous = true;
      }

      // DVA contínua prioritária
      if (!matchedSystem) {
        for (const cv of CONTINUOUS_VASOACTIVE) {
          if (cv.test.test(cleanIdentity)) {
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
            if (p.test.test(drugIdentityLines) || p.test.test(cleanIdentity)) {
              matchedSystem = ruleGroup.system;
              if (typeof p.name === "function") {
                drugName = p.name(drugIdentityLines);
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
      if (!matchedSystem && /cvvhd|hemodialise/i.test(cleanIdentity)) {
        matchedSystem = "renal";
        drugName = "CVVHD";
        isDialysis = true;
      }

      // Tratar caso de hemo componentes
      if (!matchedSystem && /concentrado de hemacias|bolsa de hemacias/i.test(cleanIdentity)) {
        matchedSystem = "hemo";
        drugName = "Concentrado de hemácias";
      }

      // Se ainda não encontrou e for dieta
      if (!matchedSystem && /dieta/i.test(cleanIdentity)) {
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
        const allMlMatches = [...mainLines.matchAll(/(\d+)\s*ML(?!\/Hr)/gi)];
        const mlMatch = allMlMatches.length > 0 ? allMlMatches[allMlMatches.length - 1] : mainLines.match(/(\d+)\s*ML/i);
        const ml = mlMatch ? `${mlMatch[1]}ml` : "";
        const f = freq || "4/4h";
        const r = route || "SNE";
        formattedText = `AE ${ml} ${f} ${r}`.replace(/\s+/g, " ").trim();
      } else if (isInsulinBIC) {
        formattedText = "Insulina BIC ACM IV";
      } else if (isInsulin) {
        formattedText = "Esquema de insulina SC";
      } else {
        // Verificar se é solução de base de hidratação ou reposição de eletrólitos com diluente/aditivos
        const isBaseHydrationSolution = /^(cloreto de sodio 0[,.]9%|sf 0[,.]9%|glicose 5%|sg 5%|solucao eletrolitica|ringer)/i.test(cleanHeader);
        const isElectrolyteReplacementWithDiluent = matchedSystem === "renal" && /^(cloreto de potassio|sulfato de magnesio|fosfatos? de potassio|gluconato de calcio|cloreto de calcio|bicarbonato de sodio|cloreto de sodio 20%)/i.test(cleanHeader);

        if (cleanedSubLines.length > 0 && (isBaseHydrationSolution || isElectrolyteReplacementWithDiluent)) {
          const additives = [];
          for (const sub of cleanedSubLines) {
            const cleanSub = cleanText(sub);
            const allMatches = [...sub.matchAll(/(\d+(?:[.,]\d+)?)\s*(MILILITRO|MILIGRAMA|UNIDADE|AMPOLA|BOLSA|ML|MG)\b/gi)];
            const subDoseMatch = allMatches.length > 0 ? allMatches[allMatches.length - 1] : null;
            let subDose = subDoseMatch ? formatDose(subDoseMatch[1], subDoseMatch[2]) : "";

            let subName = "";
            if (/cloreto de sodio 0[,.]9%|sf 0[,.]9%/i.test(cleanSub)) subName = "SF 0,9%";
            else if (/glicose 5%|sg 5%/i.test(cleanSub)) subName = "SG 5%";
            else if (/fosfatos? de potassio/i.test(cleanSub)) subName = "Fosfato de potássio";
            else if (/potassio/i.test(cleanSub)) subName = "KCl 19,1%";
            else if (/magnesio/i.test(cleanSub)) subName = "MgSO4 10%";
            else if (/bicarbonato/i.test(cleanSub)) subName = "HCO3 8,4%";
            else if (/calcio/i.test(cleanSub)) subName = "CaCl 10%";
            else {
              subName = sub.replace(/^\|->\s*/, "").split("-")[0].trim();
            }
            additives.push(`${subName} ${subDose}`.trim());
          }

          let mainComponentName = drugName || "SF 0,9%";
          if (/cloreto de potassio/i.test(cleanHeader) && /19[,.]1%/i.test(cleanMain)) {
            mainComponentName = "KCl 19,1%";
          } else if (/sulfato de magnesio/i.test(cleanHeader) && /10%/i.test(cleanMain)) {
            mainComponentName = "MgSO4 10%";
          }

          const parts = [`${mainComponentName} ${dose}`.trim(), ...additives];
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
          freq: freq,
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

  // Filtra doses avulsas ("agora") quando a mesma droga já existe fixa/contínua/SN no sistema e remove duplicatas exatas
  function deduplicateSystemItems(items) {
    // 1. Verificar quais drogas (por nome canônico) possuem prescrição não-"agora" (horário fixo, contínuo ou SN/ACM)
    const drugsWithRegularOrContinuous = new Set();
    for (const it of items) {
      if (it.isContinuous || it.freq !== "agora") {
        drugsWithRegularOrContinuous.add(it.name);
      }
    }

    // 2. Descartar itens "agora" se a mesma droga já está prescrita regularmente/continuamente/SN no sistema
    // (Exceto reposições hidroeletrolíticas no Renal/Metabólico e hemocomponentes)
    const filtered = items.filter(it => {
      if (it.system === "renal" || /hemacias|plaquetas|plasma|crioprecipitado/i.test(it.name)) {
        return true;
      }
      if (!it.isContinuous && it.freq === "agora" && drugsWithRegularOrContinuous.has(it.name)) {
        return false;
      }
      return true;
    });

    // 3. Remover duplicatas exatas de formattedText mantendo a primeira ocorrência (ou a com maior D de antibiótico)
    const seenTexts = new Set();
    const unique = [];
    for (const it of filtered) {
      if (!seenTexts.has(it.formattedText)) {
        seenTexts.add(it.formattedText);
        unique.push(it);
      }
    }
    return unique;
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
    const boldResultLines = [];
    const htmlResultLines = [];
    const structuredSystems = [];

    for (const sys of SYSTEMS) {
      const items = deduplicateSystemItems(grouped[sys.id] || []);
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

      // Se o sistema for opcional ("Outros") e estiver vazio, não exibir
      if (sys.optional && sortedItems.length === 0) {
        continue;
      }

      const content = sortedItems.length === 0
        ? "-"
        : sortedItems.map(i => i.formattedText).join(" + ");

      const plainLine = `${sys.name}: ${content}`;
      const boldLine = `**${sys.name}:** ${content}`;
      const htmlLine = `<p style="margin: 0 0 4px 0;"><b>${sys.name}:</b> ${content}</p>`;

      resultLines.push(plainLine);
      boldResultLines.push(boldLine);
      htmlResultLines.push(htmlLine);

      structuredSystems.push({
        systemId: sys.id,
        systemName: sys.name,
        optional: !!sys.optional,
        items: sortedItems,
        lineText: plainLine,
        boldLineText: boldLine,
        htmlLineText: htmlLine
      });
    }

    const fullPlainText = resultLines.join("\n");
    const fullBoldText = boldResultLines.join("\n");
    const fullHtmlText = htmlResultLines.join("\n");

    return {
      plainText: fullPlainText,
      boldText: fullBoldText,
      htmlText: fullHtmlText,
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
