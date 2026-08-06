/**
 * infusoesUI.js
 * Controlador de Interface da Calculadora de Infusões do HC.
 * Gerencia renderização em tempo real, formulários, alertas clínicos,
 * ferramentas anexas, modais, histórico local e suíte de testes.
 */

(function () {
  let currentDrug = null;
  let customDilutions = [];
  let favorites = [];

  // Elementos do DOM (inicializados no setup)
  let elements = {};

  function initUI() {
    cacheElements();
    if (!elements.container) return;

    loadCustomDilutions();
    loadFavorites();
    populateCategoryFilters();
    populateDrugDropdown();
    bindEvents();
    checkFirstUseDisclaimer();

    // Selecionar primeiro medicamento por padrão (Noradrenalina)
    if (window.__INFUSOES_CONFIG__ && window.__INFUSOES_CONFIG__.drugs.length > 0) {
      selectDrug(window.__INFUSOES_CONFIG__.drugs[0].id);
    }
  }

  function cacheElements() {
    elements = {
      container: document.getElementById("infusionsSection"),
      categoryFilterContainer: document.getElementById("infusionCategoryFilters"),
      drugSearchInput: document.getElementById("infusionDrugSearch"),
      drugSelect: document.getElementById("infusionDrugSelect"),
      presetSelect: document.getElementById("infusionPresetSelect"),
      customDilutionBtn: document.getElementById("btnCustomDilution"),
      
      weightInput: document.getElementById("infusionWeightInput"),
      weightTypeSelect: document.getElementById("infusionWeightTypeSelect"),
      btnIdealWeightModal: document.getElementById("btnIdealWeightModal"),
      weightNoticeContainer: document.getElementById("infusionWeightNotice"),

      directionToggleMlHToDose: document.getElementById("btnDirMlHToDose"),
      directionToggleDoseToMlH: document.getElementById("btnDirDoseToMlH"),

      doseUnitSelect: document.getElementById("infusionDoseUnitSelect"),
      inputValueInput: document.getElementById("infusionInputValue"),
      contextSelectRow: document.getElementById("infusionContextRow"),
      contextSelect: document.getElementById("infusionContextSelect"),

      // Área de Resultado
      resultCard: document.getElementById("infusionResultCard"),
      resultTitle: document.getElementById("infusionResultTitle"),
      resultDilutionLabel: document.getElementById("infusionResultDilutionLabel"),
      resultConcLabel: document.getElementById("infusionResultConcLabel"),
      resultWeightLabel: document.getElementById("infusionResultWeightLabel"),
      resultInputValueLabel: document.getElementById("infusionResultInputValueLabel"),
      resultOutputValueLabel: document.getElementById("infusionResultOutputValueLabel"),
      
      statusBadge: document.getElementById("infusionStatusBadge"),
      alertNoticeBox: document.getElementById("infusionAlertNoticeBox"),
      unitErrorNoticeBox: document.getElementById("infusionUnitErrorNoticeBox"),
      reverseCheckBadge: document.getElementById("infusionReverseCheckBadge"),

      stepByStepBox: document.getElementById("infusionStepByStepBox"),
      equivalencesBox: document.getElementById("infusionEquivalencesBox"),
      
      // Botões de Ação
      btnCopyResult: document.getElementById("btnCopyInfusionResult"),
      btnCopySteps: document.getElementById("btnCopyInfusionSteps"),
      btnReverseDir: document.getElementById("btnReverseInfusionDir"),
      btnClearForm: document.getElementById("btnClearInfusionForm"),
      btnFavoriteDilution: document.getElementById("btnFavoriteDilution"),

      // Alerta Crítico Checkbox
      criticalCheckRow: document.getElementById("infusionCriticalCheckRow"),
      criticalCheckbox: document.getElementById("infusionCriticalCheckbox"),

      // Ferramentas Secundárias
      swapRateInput: document.getElementById("swapCurrentRate"),
      swapNewPresetSelect: document.getElementById("swapNewPresetSelect"),
      swapResultText: document.getElementById("swapResultText"),

      titrationStepSelect: document.getElementById("titrationStepSelect"),
      titrationTableBody: document.getElementById("titrationTableBody"),
      btnCopyTitration: document.getElementById("btnCopyTitration"),

      timeVolInput: document.getElementById("timeRemainingVolInput"),
      timeResultText: document.getElementById("timeRemainingResultText"),

      consumptionResultText: document.getElementById("consumptionResultText"),

      // Modais
      modalIdealWeight: document.getElementById("modalIdealWeight"),
      modalCustomDilution: document.getElementById("modalCustomDilution"),
      modalAdmin: document.getElementById("modalAdmin"),
      modalTests: document.getElementById("modalTests"),
      modalDisclaimer: document.getElementById("modalDisclaimer"),

      // Histórico
      historyTableBody: document.getElementById("infusionHistoryTableBody"),
      btnClearHistory: document.getElementById("btnClearInfusionHistory")
    };
  }

  function populateCategoryFilters() {
    if (!elements.categoryFilterContainer || !window.__INFUSOES_CONFIG__) return;
    const cats = window.__INFUSOES_CONFIG__.categories;

    let html = `<button type="button" class="category-btn active" data-cat="all">Todas as Categorias</button>`;
    cats.forEach(c => {
      html += `<button type="button" class="category-btn" data-cat="${c.id}">${c.name}</button>`;
    });

    elements.categoryFilterContainer.innerHTML = html;

    elements.categoryFilterContainer.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      [...elements.categoryFilterContainer.querySelectorAll("button")].forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filterDrugsByCategory(btn.dataset.cat);
    });
  }

  function filterDrugsByCategory(catId) {
    if (!window.__INFUSOES_CONFIG__) return;
    const searchVal = (elements.drugSearchInput?.value || "").toLowerCase().trim();

    let filtered = window.__INFUSOES_CONFIG__.drugs;
    if (catId !== "all") {
      filtered = filtered.filter(d => d.category === catId);
    }

    if (searchVal) {
      filtered = filtered.filter(d => {
        const nameMatch = d.name.toLowerCase().includes(searchVal);
        const synMatch = d.synonyms && d.synonyms.some(s => s.toLowerCase().includes(searchVal));
        return nameMatch || synMatch;
      });
    }

    populateDrugSelectWithOptions(filtered);
  }

  function populateDrugDropdown() {
    if (!window.__INFUSOES_CONFIG__) return;
    filterDrugsByCategory("all");
  }

  function populateDrugSelectWithOptions(drugList) {
    if (!elements.drugSelect) return;
    let html = "";
    drugList.forEach(d => {
      html += `<option value="${d.id}">${d.name}</option>`;
    });
    if (!drugList.length) {
      html = `<option value="">Nenhum medicamento encontrado</option>`;
    }
    elements.drugSelect.innerHTML = html;
  }

  function bindEvents() {
    // Busca de Medicamentos por texto ou sinônimo
    if (elements.drugSearchInput) {
      elements.drugSearchInput.addEventListener("input", () => {
        const activeCatBtn = elements.categoryFilterContainer?.querySelector("button.active");
        const activeCat = activeCatBtn ? activeCatBtn.dataset.cat : "all";
        filterDrugsByCategory(activeCat);
        if (elements.drugSelect.options.length > 0) {
          selectDrug(elements.drugSelect.value);
        }
      });
    }

    // Seleção de Medicamento
    if (elements.drugSelect) {
      elements.drugSelect.addEventListener("change", (e) => {
        selectDrug(e.target.value);
      });
    }

    // Seleção de Preset
    if (elements.presetSelect) {
      elements.presetSelect.addEventListener("change", () => {
        updateCalculation();
        populateSwapNewPresetDropdown();
      });
    }

    // Alteração de peso, tipo de peso, valor ou unidade
    [elements.weightInput, elements.inputValueInput].forEach(el => {
      if (el) el.addEventListener("input", updateCalculation);
    });

    [elements.weightTypeSelect, elements.doseUnitSelect, elements.contextSelect].forEach(el => {
      if (el) el.addEventListener("change", updateCalculation);
    });

    // Alternância de Sentido (mL/h -> Dose vs Dose -> mL/h)
    if (elements.directionToggleMlHToDose && elements.directionToggleDoseToMlH) {
      elements.directionToggleMlHToDose.addEventListener("click", () => {
        elements.directionToggleMlHToDose.classList.add("active");
        elements.directionToggleDoseToMlH.classList.remove("active");
        updateCalculation();
      });

      elements.directionToggleDoseToMlH.addEventListener("click", () => {
        elements.directionToggleDoseToMlH.classList.add("active");
        elements.directionToggleMlHToDose.classList.remove("active");
        updateCalculation();
      });
    }

    // Inverter Sentido
    if (elements.btnReverseDir) {
      elements.btnReverseDir.addEventListener("click", () => {
    const isMlHToDose = elements.directionToggleMlHToDose?.classList?.contains("active");
        if (isMlHToDose) {
          elements.directionToggleDoseToMlH?.click();
        } else {
          elements.directionToggleMlHToDose?.click();
        }
      });
    }

    // Limpar formulário
    if (elements.btnClearForm) {
      elements.btnClearForm.addEventListener("click", () => {
        if (elements.inputValueInput) elements.inputValueInput.value = "";
        updateCalculation();
      });
    }

    // Copiar Resultado
    if (elements.btnCopyResult) {
      elements.btnCopyResult.addEventListener("click", () => copyTextToClipboard(getFormattedResultSummaryText()));
    }

    // Copiar Cálculo Completo
    if (elements.btnCopySteps) {
      elements.btnCopySteps.addEventListener("click", () => copyTextToClipboard(getFormattedFullMathText()));
    }

    // Checkbox de confirmação para Alerta Crítico
    if (elements.criticalCheckbox) {
      elements.criticalCheckbox.addEventListener("change", () => {
        updateActionButtonsState();
      });
    }

    // Abrir Modal de Calculadora de Peso Ideal
    if (elements.btnIdealWeightModal) {
      elements.btnIdealWeightModal.addEventListener("click", openIdealWeightModal);
    }

    // Abrir Modal de Diluição Personalizada
    if (elements.customDilutionBtn) {
      elements.customDilutionBtn.addEventListener("click", openCustomDilutionModal);
    }

    // Ferramentas Anexas: Troca de Concentração
    if (elements.swapRateInput) elements.swapRateInput.addEventListener("input", updateSwapCalculation);
    if (elements.swapNewPresetSelect) elements.swapNewPresetSelect.addEventListener("change", updateSwapCalculation);

    // Titulação
    if (elements.titrationStepSelect) elements.titrationStepSelect.addEventListener("change", updateTitrationTable);
    if (elements.btnCopyTitration) elements.btnCopyTitration.addEventListener("click", copyTitrationTable);

    // Tempo Restante
    if (elements.timeVolInput) elements.timeVolInput.addEventListener("input", updateTimeRemainingCalculation);

    // Limpar Histórico
    if (elements.btnClearHistory) {
      elements.btnClearHistory.addEventListener("click", () => {
        localStorage.removeItem("examesHC_infusoes_history");
        renderHistory();
      });
    }
  }

  function selectDrug(drugId) {
    if (!window.__INFUSOES_CONFIG__) return;
    const drug = window.__INFUSOES_CONFIG__.drugs.find(d => d.id === drugId);
    if (!drug) return;

    currentDrug = drug;

    // Atualizar Presets
    let presetHtml = "";
    drug.presets.forEach((p, idx) => {
      presetHtml += `<option value="${idx}">${p.label}</option>`;
    });

    // Adicionar diluições personalizadas salvas para este medicamento
    const customForDrug = customDilutions.filter(cd => cd.drugId === drug.id);
    if (customForDrug.length) {
      presetHtml += `<optgroup label="Minhas Diluições Personalizadas">`;
      customForDrug.forEach(cd => {
        presetHtml += `<option value="custom_${cd.id}">★ ${cd.label}</option>`;
      });
      presetHtml += `</optgroup>`;
    }

    if (elements.presetSelect) elements.presetSelect.innerHTML = presetHtml;

    // Atualizar Unidades Permitidas
    let unitHtml = "";
    drug.allowedUnits.forEach(u => {
      const selectedAttr = u === drug.preferredUnit ? "selected" : "";
      unitHtml += `<option value="${u}" ${selectedAttr}>${u}</option>`;
    });
    if (elements.doseUnitSelect) elements.doseUnitSelect.innerHTML = unitHtml;

    // Atualizar Aviso de Peso
    if (elements.weightNoticeContainer) {
      if (drug.noWeightNotice) {
        elements.weightNoticeContainer.style.display = "block";
        elements.weightNoticeContainer.textContent = `ℹ️ ${drug.noWeightNotice}`;
      } else {
        elements.weightNoticeContainer.style.display = "none";
      }
    }

    // Habilitar / Desabilitar campo de Peso se o medicamento não utilizar
    if (elements.weightInput && elements.weightTypeSelect) {
      if (drug.requiresWeight === false) {
        elements.weightInput.placeholder = "Não aplicável";
      } else {
        elements.weightInput.placeholder = "Ex.: 70";
      }
    }

    // Contextos Clínicos
    if (elements.contextSelectRow && elements.contextSelect) {
      if (drug.contexts && drug.contexts.length > 1) {
        elements.contextSelectRow.style.display = "block";
        let ctxHtml = "";
        drug.contexts.forEach(c => {
          ctxHtml += `<option value="${c.id}">${c.name}</option>`;
        });
        elements.contextSelect.innerHTML = ctxHtml;
      } else {
        elements.contextSelectRow.style.display = "none";
      }
    }

    populateSwapNewPresetDropdown();
    updateCalculation();
  }

  function getSelectedPresetData() {
    if (!currentDrug || !elements.presetSelect) return null;
    const val = elements.presetSelect.value;
    if (val.startsWith("custom_")) {
      const cId = val.replace("custom_", "");
      return customDilutions.find(cd => cd.id === cId);
    }
    const idx = parseInt(val, 10);
    return currentDrug.presets[idx] || currentDrug.presets[0];
  }

  function updateCalculation() {
    const engine = window.__INFUSOES_ENGINE__;
    if (!engine || !currentDrug) return;

    const preset = getSelectedPresetData();
    if (!preset) return;

    const isMlHToDose = elements.directionToggleMlHToDose?.classList?.contains("active");
    const direction = isMlHToDose ? "mlh_to_dose" : "dose_to_mlh";

    const unit = elements.doseUnitSelect?.value || currentDrug.preferredUnit;
    const inputValueStr = elements.inputValueInput?.value || "";
    const inputVal = engine.parseNumericInput(inputValueStr);

    const weightKg = engine.parseNumericInput(elements.weightInput?.value);
    const weightType = elements.weightTypeSelect?.value || "real";

    // Preparar concentrações em mcg/mL, mg/mL, UI/mL
    let concMcgMl = preset.concMcgMl || (preset.concMgMl ? preset.concMgMl * 1000 : 0);
    let concMgMl = preset.concMgMl || (preset.concMcgMl ? preset.concMcgMl / 1000 : 0);
    let concUIMl = preset.concUIMl || 0;

    const params = {
      concMcgMl,
      concMgMl,
      concUIMl,
      weightKg
    };

    // Caso não haja valor digitado
    if (isNaN(inputVal) || inputVal <= 0) {
      renderEmptyResult();
      return;
    }

    // Executar cálculo
    let calcResult = null;
    if (direction === "mlh_to_dose") {
      calcResult = engine.convertMlHToDose(inputVal, unit, params);
    } else {
      calcResult = engine.convertDoseToMlH(inputVal, unit, params);
    }

    if (calcResult.error) {
      renderErrorResult(calcResult.error);
      return;
    }

    // Verificação Inversa
    const outputVal = calcResult.value;
    const invResult = engine.verifyInverse(direction, inputVal, outputVal, unit, params);

    // Validação de Faixa Clínica
    const selectedCtxId = elements.contextSelect?.value;
    const context = (currentDrug.contexts && currentDrug.contexts.find(c => c.id === selectedCtxId)) || (currentDrug.contexts && currentDrug.contexts[0]);
    const classification = classifyClinicalRange(currentDrug, context, direction, unit, inputVal, outputVal, weightKg);

    // Detecção de Erros de Unidade
    const unitError = engine.detectUnitError(currentDrug.id, unit, isMlHToDose ? outputVal : inputVal, weightKg);

    // Renderizar Painel de Resultado
    renderFullResult({
      drug: currentDrug,
      preset,
      direction,
      unit,
      inputVal,
      outputVal,
      weightKg,
      weightType,
      steps: calcResult.steps,
      invResult,
      classification,
      unitError,
      params
    });

    // Atualizar Ferramentas Anexas
    updateSwapCalculation();
    updateTitrationTable();
    updateTimeRemainingCalculation();
    updateConsumptionCalculation(isMlHToDose ? inputVal : outputVal, params);

    // Salvar no Histórico Local (se verificado)
    if (invResult.verified) {
      saveToHistory({
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        drugName: currentDrug.name,
        presetLabel: preset.label,
        weightKg,
        weightType,
        direction,
        inputValue: inputVal,
        inputUnit: isMlHToDose ? "mL/h" : unit,
        outputValue: outputVal,
        outputUnit: isMlHToDose ? unit : "mL/h",
        statusLevel: classification.level
      });
    }
  }

  function classifyClinicalRange(drug, context, direction, unit, inputVal, outputVal, weightKg) {
    if (!context) return { level: "info", title: "Faixa usual", text: "Valor dentro dos parâmetros gerais." };

    // A dose a ser avaliada na faixa deve ser em dose (não mL/h)
    const doseVal = direction === "mlh_to_dose" ? outputVal : inputVal;

    const messages = context.messages || {};

    // 1. Alerta Crítico
    if (context.criticalThreshold && doseVal >= context.criticalThreshold) {
      return {
        level: "critical",
        title: "Alerta Crítico de Segurança",
        text: messages.critical || `Dose muito elevada de ${drug.name} (≥ ${context.criticalThreshold} ${context.unit}). Faça dupla checagem independente.`
      };
    }

    // 2. Alerta Reforçado (ex. Propofol PRIS > 67 mcg/kg/min)
    if (context.reinforcedAlertThreshold && doseVal >= context.reinforcedAlertThreshold) {
      return {
        level: "critical",
        title: "Alerta de Risco (PRIS / Toxicidade)",
        text: messages.reinforced || `Dose acima de ${context.reinforcedAlertThreshold} ${context.unit}. Reavalie necessidade clínica.`
      };
    }

    // 3. Dose Elevada
    if (context.highDoseThreshold && doseVal >= context.highDoseThreshold) {
      return {
        level: "attention",
        title: "Dose Elevada",
        text: messages.highDose || `Dose elevada de ${drug.name} (> ${context.highDoseThreshold} ${context.unit}). Confirme peso, concentração e taxa.`
      };
    }

    // 4. Faixa de Atenção
    if (context.attentionThreshold && doseVal >= context.attentionThreshold) {
      return {
        level: "attention",
        title: "Faixa de Atenção",
        text: messages.attention || `Valor acima da faixa usual de referência (${context.attentionThreshold} ${context.unit}). Confirme os dados e o contexto clínico.`
      };
    }

    // 5. Faixa Usual
    return {
      level: "info",
      title: "Faixa Usual de Referência",
      text: "Valor dentro da faixa usual de infusão de referência."
    };
  }

  function renderFullResult(data) {
    const engine = window.__INFUSOES_ENGINE__;
    if (!elements.resultCard) return;

    elements.resultCard.style.display = "block";

    // Título e Metadados
    if (elements.resultTitle) elements.resultTitle.textContent = data.drug.name.toUpperCase();
    if (elements.resultDilutionLabel) elements.resultDilutionLabel.textContent = data.preset.label;
    
    let concStr = "";
    if (data.preset.concMcgMl) concStr = `${engine.formatNumber(data.preset.concMcgMl)} mcg/mL`;
    else if (data.preset.concMgMl) concStr = `${engine.formatNumber(data.preset.concMgMl)} mg/mL`;
    else if (data.preset.concUIMl) concStr = `${engine.formatNumber(data.preset.concUIMl)} UI/mL`;
    if (elements.resultConcLabel) elements.resultConcLabel.textContent = concStr;

    const wTypeLabel = getWeightTypeLabel(data.weightType);
    if (elements.resultWeightLabel) {
      if (data.drug.requiresWeight === false) {
        elements.resultWeightLabel.textContent = "Não utilizado no cálculo padrão";
      } else {
        elements.resultWeightLabel.textContent = `${engine.formatNumber(data.weightKg)} kg (${wTypeLabel})`;
      }
    }

    // Valores de Entrada e Saída
    const isMlHToDose = data.direction === "mlh_to_dose";
    if (elements.resultInputValueLabel) {
      elements.resultInputValueLabel.textContent = `${engine.formatNumber(data.inputVal)} ${isMlHToDose ? "mL/h" : data.unit}`;
    }

    if (elements.resultOutputValueLabel) {
      elements.resultOutputValueLabel.textContent = `${engine.formatNumber(data.outputVal)} ${isMlHToDose ? data.unit : "mL/h"}`;
    }

    // Status Badge & Alertas Clínicos
    const classif = data.classification;
    if (elements.statusBadge) {
      elements.statusBadge.className = `status-badge badge-${classif.level}`;
      elements.statusBadge.textContent = classif.title;
    }

    if (elements.alertNoticeBox) {
      elements.alertNoticeBox.className = `alert-box box-${classif.level}`;
      elements.alertNoticeBox.innerHTML = `<strong>${classif.title}:</strong> ${classif.text}`;
    }

    // Erro de Unidade
    if (elements.unitErrorNoticeBox) {
      if (data.unitError) {
        elements.unitErrorNoticeBox.style.display = "block";
        elements.unitErrorNoticeBox.innerHTML = `⚠️ <strong>Possível Erro de Unidade:</strong> ${data.unitError}`;
      } else {
        elements.unitErrorNoticeBox.style.display = "none";
      }
    }

    // Verificação Inversa Badge
    if (elements.reverseCheckBadge) {
      if (data.invResult.verified) {
        elements.reverseCheckBadge.style.display = "inline-flex";
        elements.reverseCheckBadge.innerHTML = `✓ Verificação Inversa Confirmada (Tolerância &lt; 0,0001)`;
      } else {
        elements.reverseCheckBadge.style.display = "inline-flex";
        elements.reverseCheckBadge.className = "reverse-badge badge-fail";
        elements.reverseCheckBadge.innerHTML = `❌ Falha na Verificação Inversa. Revise os dados.`;
      }
    }

    // Cálculo Passo a Passo
    if (elements.stepByStepBox) {
      elements.stepByStepBox.innerHTML = data.steps.map(s => `<div>• ${s}</div>`).join("");
    }

    // Equivalências de Unidades Simultâneas
    if (elements.equivalencesBox) {
      if (data.drug.equivalences && data.drug.equivalences.length) {
        elements.equivalencesBox.style.display = "block";
        elements.equivalencesBox.innerHTML = `<strong>Equivalências Notáveis:</strong><br>` + data.drug.equivalences.map(e => `• ${e}`).join("<br>");
      } else {
        elements.equivalencesBox.style.display = "none";
      }
    }

    // Controle do Alerta Crítico (Exigir checkbox de confirmação)
    if (elements.criticalCheckRow) {
      if (classif.level === "critical") {
        elements.criticalCheckRow.style.display = "block";
      } else {
        elements.criticalCheckRow.style.display = "none";
      }
    }

    updateActionButtonsState();
  }

  function updateActionButtonsState() {
    const isCritical = elements.criticalCheckRow?.style.display === "block";
    const isChecked = elements.criticalCheckbox?.checked;

    const disabled = isCritical && !isChecked;

    if (elements.btnCopyResult) elements.btnCopyResult.disabled = disabled;
    if (elements.btnCopySteps) elements.btnCopySteps.disabled = disabled;
  }

  function renderEmptyResult() {
    if (!elements.resultCard) return;
    if (elements.resultOutputValueLabel) elements.resultOutputValueLabel.textContent = "--";
    if (elements.stepByStepBox) elements.stepByStepBox.innerHTML = "<em>Preencha os campos para visualizar o cálculo passo a passo.</em>";
    if (elements.statusBadge) {
      elements.statusBadge.className = "status-badge badge-info";
      elements.statusBadge.textContent = "Aguardando dados";
    }
    if (elements.alertNoticeBox) {
      elements.alertNoticeBox.className = "alert-box box-info";
      elements.alertNoticeBox.textContent = "Preencha a velocidade ou dose desejada.";
    }
    if (elements.reverseCheckBadge) elements.reverseCheckBadge.style.display = "none";
    if (elements.unitErrorNoticeBox) elements.unitErrorNoticeBox.style.display = "none";
  }

  function renderErrorResult(msg) {
    if (!elements.resultCard) return;
    if (elements.resultOutputValueLabel) elements.resultOutputValueLabel.textContent = "Erro";
    if (elements.stepByStepBox) elements.stepByStepBox.innerHTML = `<span style="color:var(--danger);">${msg}</span>`;
    if (elements.statusBadge) {
      elements.statusBadge.className = "status-badge badge-danger";
      elements.statusBadge.textContent = "Dados Incompletos";
    }
    if (elements.alertNoticeBox) {
      elements.alertNoticeBox.className = "alert-box box-danger";
      elements.alertNoticeBox.textContent = msg;
    }
  }

  function getWeightTypeLabel(type) {
    switch (type) {
      case "ideal": return "Peso Ideal";
      case "adjusted": return "Peso Ajustado";
      case "dry": return "Peso Seco";
      case "manual": return "Manual";
      default: return "Peso Real";
    }
  }

  function getFormattedResultSummaryText() {
    const drugName = elements.resultTitle?.textContent || "";
    const dil = elements.resultDilutionLabel?.textContent || "";
    const inputVal = elements.resultInputValueLabel?.textContent || "";
    const outputVal = elements.resultOutputValueLabel?.textContent || "";
    const status = elements.statusBadge?.textContent || "";

    return `[CALCULADORA DE INFUSÕES UTI]\nMedicamento: ${drugName}\nDiluição: ${dil}\nEntrada: ${inputVal}\nResultado: ${outputVal}\nClassificação: ${status}\n\nConferir antes de administrar.`;
  }

  function getFormattedFullMathText() {
    const summary = getFormattedResultSummaryText();
    const steps = elements.stepByStepBox?.innerText || "";
    return `${summary}\n\n--- CÁLCULO DETALHADO PASSO A PASSO ---\n${steps}`;
  }

  function copyTextToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      alert("Copiado para a área de transferência com sucesso!");
    }).catch(err => {
      console.error("Erro ao copiar: ", err);
    });
  }

  // --------------------------------------------------
  // Troca de Concentração
  // --------------------------------------------------
  function populateSwapNewPresetDropdown() {
    if (!currentDrug || !elements.swapNewPresetSelect) return;
    let html = "";
    currentDrug.presets.forEach((p, idx) => {
      html += `<option value="${idx}">${p.label}</option>`;
    });
    elements.swapNewPresetSelect.innerHTML = html;
  }

  function updateSwapCalculation() {
    const engine = window.__INFUSOES_ENGINE__;
    if (!engine || !currentDrug || !elements.swapResultText) return;

    const currentPreset = getSelectedPresetData();
    const newIdx = parseInt(elements.swapNewPresetSelect?.value || "0", 10);
    const newPreset = currentDrug.presets[newIdx];

    const currentRate = engine.parseNumericInput(elements.swapRateInput?.value || elements.inputValueInput?.value || "10");

    if (!currentPreset || !newPreset || isNaN(currentRate) || currentRate <= 0) {
      elements.swapResultText.textContent = "Informe a velocidade atual para calcular a nova bomba.";
      return;
    }

    const cOld = currentPreset.concMgMl || (currentPreset.concMcgMl / 1000) || (currentPreset.concUIMl);
    const cNew = newPreset.concMgMl || (newPreset.concMcgMl / 1000) || (newPreset.concUIMl);

    const swapRes = engine.calculateConcentrationSwap(currentRate, cOld, cNew);
    if (swapRes.error) {
      elements.swapResultText.textContent = swapRes.error;
    } else {
      elements.swapResultText.innerHTML = `🔄 <strong>Resultado da Troca:</strong> ${swapRes.explanation}`;
    }
  }

  // --------------------------------------------------
  // Tabela de Titulação
  // --------------------------------------------------
  function updateTitrationTable() {
    const engine = window.__INFUSOES_ENGINE__;
    if (!engine || !currentDrug || !elements.titrationTableBody) return;

    const currentPreset = getSelectedPresetData();
    if (!currentPreset) return;

    const isMlHToDose = elements.directionToggleMlHToDose?.classList?.contains("active");
    const unit = elements.doseUnitSelect?.value || currentDrug.preferredUnit;
    const currentRate = engine.parseNumericInput(elements.inputValueInput?.value || "10");
    const weightKg = engine.parseNumericInput(elements.weightInput?.value);
    const step = engine.parseNumericInput(elements.titrationStepSelect?.value || "1");

    const params = {
      concMcgMl: currentPreset.concMcgMl || (currentPreset.concMgMl ? currentPreset.concMgMl * 1000 : 0),
      concMgMl: currentPreset.concMgMl || (currentPreset.concMcgMl ? currentPreset.concMcgMl / 1000 : 0),
      concUIMl: currentPreset.concUIMl || 0,
      weightKg
    };

    const rows = engine.generateTitrationTable(currentRate, step, unit, params, currentDrug);

    let html = "";
    rows.forEach(r => {
      const isCurrent = Math.abs(r.rateMlH - currentRate) < 1e-3;
      html += `<tr ${isCurrent ? 'style="font-weight:700; background:rgba(16,102,204,0.1);"' : ''}>
        <td>${engine.formatNumber(r.rateMlH, 1)} mL/h</td>
        <td>${r.formattedDose} ${unit}</td>
      </tr>`;
    });

    elements.titrationTableBody.innerHTML = html;
  }

  function copyTitrationTable() {
    const engine = window.__INFUSOES_ENGINE__;
    if (!currentDrug) return;
    const unit = elements.doseUnitSelect?.value || currentDrug.preferredUnit;

    let text = `[TABELA DE TITULAÇÃO - ${currentDrug.name.toUpperCase()}]\nVelocidade (mL/h) | Dose (${unit})\n----------------------------------------\n`;

    const rows = elements.titrationTableBody?.querySelectorAll("tr") || [];
    rows.forEach(r => {
      const cols = r.querySelectorAll("td");
      if (cols.length === 2) {
        text += `${cols[0].innerText} | ${cols[1].innerText}\n`;
      }
    });

    copyTextToClipboard(text);
  }

  // --------------------------------------------------
  // Tempo Restante
  // --------------------------------------------------
  function updateTimeRemainingCalculation() {
    const engine = window.__INFUSOES_ENGINE__;
    if (!engine || !elements.timeResultText) return;

    const rate = engine.parseNumericInput(elements.inputValueInput?.value || "10");
    const vol = engine.parseNumericInput(elements.timeVolInput?.value);

    if (isNaN(vol) || vol <= 0 || isNaN(rate) || rate <= 0) {
      elements.timeResultText.textContent = "Informe o volume restante na seringa/bolsa.";
      return;
    }

    const res = engine.calculateTimeRemaining(vol, rate);
    if (res.error) {
      elements.timeResultText.textContent = res.error;
    } else {
      elements.timeResultText.innerHTML = `⏱️ <strong>Tempo Restante:</strong> ${res.timeText} | Término estimado às <strong>${res.finishTimeFormatted}</strong>`;
    }
  }

  // --------------------------------------------------
  // Consumo 6h / 12h / 24h
  // --------------------------------------------------
  function updateConsumptionCalculation(rateMlH, params) {
    const engine = window.__INFUSOES_ENGINE__;
    if (!engine || !elements.consumptionResultText || !currentDrug) return;

    const commPres = currentDrug.commercialPresentations && currentDrug.commercialPresentations[0];
    const res = engine.calculateConsumption(rateMlH, params.concMgMl, params.concMcgMl, params.concUIMl, commPres);

    if (!res) {
      elements.consumptionResultText.textContent = "Preencha a velocidade da bomba.";
      return;
    }

    let ampStr = "";
    if (res.ampCount24h && commPres) {
      ampStr = ` (${res.ampCount24h} frascos/ampolas de ${commPres.label})`;
    }

    elements.consumptionResultText.innerHTML = `
      <strong>Previsão de Consumo:</strong><br>
      • 6 horas: ${engine.formatNumber(res.vol6h, 1)} mL<br>
      • 12 horas: ${engine.formatNumber(res.vol12h, 1)} mL<br>
      • 24 horas: <strong>${engine.formatNumber(res.vol24h, 1)} mL</strong>${ampStr}
    `;
  }

  // --------------------------------------------------
  // Calculadora de Peso Ideal & Ajustado Modal
  // --------------------------------------------------
  function openIdealWeightModal() {
    if (!elements.modalIdealWeight) return;
    elements.modalIdealWeight.style.display = "flex";

    const btnCalc = document.getElementById("btnCalcIdealWeight");
    if (btnCalc) {
      btnCalc.onclick = () => {
        const engine = window.__INFUSOES_ENGINE__;
        const gender = document.getElementById("calcGenderSelect")?.value;
        const height = document.getElementById("calcHeightInput")?.value;
        const actualW = elements.weightInput?.value;

        const res = engine.calculateIdealAndAdjustedWeight(gender, height, actualW);
        if (res.error) {
          alert(res.error);
        } else {
          document.getElementById("idealWeightResultText").innerHTML = `
            <strong>Peso Ideal (IBW - Devine):</strong> ${engine.formatNumber(res.idealWeight, 1)} kg<br>
            <strong>Peso Ajustado:</strong> ${engine.formatNumber(res.adjustedWeight, 1)} kg
          `;

          // Botão para aplicar Peso Ideal
          document.getElementById("btnApplyIdealWeight").onclick = () => {
            if (elements.weightInput) elements.weightInput.value = engine.formatNumber(res.idealWeight, 1);
            if (elements.weightTypeSelect) elements.weightTypeSelect.value = "ideal";
            elements.modalIdealWeight.style.display = "none";
            updateCalculation();
          };

          // Botão para aplicar Peso Ajustado
          document.getElementById("btnApplyAdjustedWeight").onclick = () => {
            if (elements.weightInput) elements.weightInput.value = engine.formatNumber(res.adjustedWeight, 1);
            if (elements.weightTypeSelect) elements.weightTypeSelect.value = "adjusted";
            elements.modalIdealWeight.style.display = "none";
            updateCalculation();
          };
        }
      };
    }

    const btnClose = document.getElementById("btnCloseIdealWeightModal");
    if (btnClose) btnClose.onclick = () => { elements.modalIdealWeight.style.display = "none"; };
  }

  // --------------------------------------------------
  // Diluições Personalizadas
  // --------------------------------------------------
  function openCustomDilutionModal() {
    if (!elements.modalCustomDilution) return;
    elements.modalCustomDilution.style.display = "flex";

    const btnSave = document.getElementById("btnSaveCustomDilution");
    if (btnSave) {
      btnSave.onclick = () => {
        const engine = window.__INFUSOES_ENGINE__;
        const label = document.getElementById("customDilLabelInput")?.value || "Diluição Personalizada";
        const amount = engine.parseNumericInput(document.getElementById("customDilAmountInput")?.value);
        const unit = document.getElementById("customDilUnitSelect")?.value;
        const volume = engine.parseNumericInput(document.getElementById("customDilVolInput")?.value);

        if (isNaN(amount) || amount <= 0 || isNaN(volume) || volume <= 0) {
          alert("Informe quantidade e volume final válidos.");
          return;
        }

        let concMcgMl = 0, concMgMl = 0, concUIMl = 0;
        if (unit === "mg") {
          concMgMl = amount / volume;
          concMcgMl = concMgMl * 1000;
        } else if (unit === "mcg") {
          concMcgMl = amount / volume;
          concMgMl = concMcgMl / 1000;
        } else if (unit === "g") {
          concMgMl = (amount * 1000) / volume;
          concMcgMl = concMgMl * 1000;
        } else if (unit === "UI") {
          concUIMl = amount / volume;
        }

        const newDil = {
          id: "custom_" + Date.now(),
          drugId: currentDrug.id,
          label: `${label} (${amount} ${unit} / ${volume} mL)`,
          concMcgMl,
          concMgMl,
          concUIMl
        };

        customDilutions.push(newDil);
        saveCustomDilutions();
        selectDrug(currentDrug.id); // Recarrega dropdown
        elements.modalCustomDilution.style.display = "none";
      };
    }

    const btnClose = document.getElementById("btnCloseCustomDilutionModal");
    if (btnClose) btnClose.onclick = () => { elements.modalCustomDilution.style.display = "none"; };
  }

  function loadCustomDilutions() {
    try {
      const stored = localStorage.getItem("examesHC_infusoes_custom_dilutions");
      if (stored) customDilutions = JSON.parse(stored);
    } catch (e) {
      customDilutions = [];
    }
  }

  function saveCustomDilutions() {
    try {
      localStorage.setItem("examesHC_infusoes_custom_dilutions", JSON.stringify(customDilutions));
    } catch (e) {}
  }

  function loadFavorites() {
    try {
      const stored = localStorage.getItem("examesHC_infusoes_favorites");
      if (stored) favorites = JSON.parse(stored);
    } catch (e) {
      favorites = [];
    }
  }

  // --------------------------------------------------
  // Histórico Local
  // --------------------------------------------------
  function saveToHistory(item) {
    try {
      let history = [];
      const stored = localStorage.getItem("examesHC_infusoes_history");
      if (stored) history = JSON.parse(stored);

      // Evita duplicata se o último registro for idêntico
      if (history.length > 0) {
        const last = history[0];
        if (last.drugName === item.drugName && last.inputValue === item.inputValue && last.inputUnit === item.inputUnit) {
          return;
        }
      }

      history.unshift(item);
      if (history.length > 20) history = history.slice(0, 20); // Mantém até 20

      localStorage.setItem("examesHC_infusoes_history", JSON.stringify(history));
      renderHistory();
    } catch (e) {}
  }

  function renderHistory() {
    if (!elements.historyTableBody) return;
    const engine = window.__INFUSOES_ENGINE__;
    try {
      const stored = localStorage.getItem("examesHC_infusoes_history");
      if (!stored) {
        elements.historyTableBody.innerHTML = `<tr><td colspan="5"><em>Nenhum histórico recente.</em></td></tr>`;
        return;
      }

      const history = JSON.parse(stored);
      let html = "";
      history.forEach(h => {
        html += `<tr>
          <td>${h.time}</td>
          <td><strong>${h.drugName}</strong> (${h.presetLabel})</td>
          <td>${engine.formatNumber(h.inputValue)} ${h.inputUnit}</td>
          <td><strong>${engine.formatNumber(h.outputValue)} ${h.outputUnit}</strong></td>
          <td><span class="status-badge badge-${h.statusLevel}">${h.statusLevel.toUpperCase()}</span></td>
        </tr>`;
      });

      elements.historyTableBody.innerHTML = html;
    } catch (e) {}
  }

  function checkFirstUseDisclaimer() {
    const accepted = localStorage.getItem("examesHC_infusoes_disclaimer_accepted");
    if (!accepted && elements.modalDisclaimer) {
      elements.modalDisclaimer.style.display = "flex";
      const btnAccept = document.getElementById("btnAcceptDisclaimer");
      if (btnAccept) {
        btnAccept.onclick = () => {
          localStorage.setItem("examesHC_infusoes_disclaimer_accepted", "true");
          elements.modalDisclaimer.style.display = "none";
        };
      }
    }
  }

  // Inicializar quando o DOM estiver pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUI);
  } else {
    initUI();
  }
})();
