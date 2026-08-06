/**
 * infusoesUI.js
 * Controlador de Interface da Calculadora de Infusões do HC.
 * Gerencia renderização em tempo real, formulários, alertas clínicos,
 * ferramentas anexas, modais, histórico local e suíte de testes.
 */

(function () {
  let currentDrug = null;
  let customDilutions = [];
  let customDrugs = [];
  let favorites = [];

  // Elementos do DOM (inicializados no setup)
  let elements = {};

  function initUI() {
    cacheElements();
    if (!elements.container) return;

    loadCustomDrugs();
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
      drugSelect: document.getElementById("infusionDrugSelect"),
      presetSelect: document.getElementById("infusionPresetSelect"),
      customDilutionBtn: document.getElementById("btnCustomDilution"),
      
      weightInput: document.getElementById("infusionWeightInput"),
      weightNoticeContainer: document.getElementById("infusionWeightNotice"),

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
      btnClearForm: document.getElementById("btnClearInfusionForm"),

      // Alerta Crítico Checkbox
      criticalCheckRow: document.getElementById("infusionCriticalCheckRow"),
      criticalCheckbox: document.getElementById("infusionCriticalCheckbox"),

      // Modais
      modalCustomDilution: document.getElementById("modalCustomDilution"),
      modalCustomDrug: document.getElementById("modalCustomDrug"),
      customDrugBtn: document.getElementById("btnCustomDrug"),
      modalDisclaimer: document.getElementById("modalDisclaimer")
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
    let filtered = window.__INFUSOES_CONFIG__.drugs;
    if (catId !== "all") {
      filtered = filtered.filter(d => d.category === catId);
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
    
    const standardDrugs = drugList.filter(d => !d.isCustom);
    const userCustomDrugs = drugList.filter(d => d.isCustom);

    standardDrugs.forEach(d => {
      html += `<option value="${d.id}">${d.name}</option>`;
    });

    if (userCustomDrugs.length) {
      html += `<optgroup label="★ Medicamentos Personalizados">`;
      userCustomDrugs.forEach(d => {
        html += `<option value="${d.id}">★ ${d.name}</option>`;
      });
      html += `</optgroup>`;
    }

    if (!drugList.length) {
      html = `<option value="">Nenhum medicamento encontrado</option>`;
    }
    elements.drugSelect.innerHTML = html;
  }

  function bindEvents() {
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
      });
    }

    // Alteração de peso, valor digitado ou contexto
    [elements.weightInput, elements.inputValueInput].forEach(el => {
      if (el) el.addEventListener("input", updateCalculation);
    });

    if (elements.contextSelect) {
      elements.contextSelect.addEventListener("change", updateCalculation);
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

    // Abrir Modal de Diluição Personalizada (para o medicamento atual)
    if (elements.customDilutionBtn) {
      elements.customDilutionBtn.addEventListener("click", openCustomDilutionModal);
    }

    // Abrir Modal de Novo Medicamento Personalizado
    if (elements.customDrugBtn) {
      elements.customDrugBtn.addEventListener("click", openCustomDrugModal);
    }

    // Botões para Apagar Dados Salvos
    ["btnClearCustomData1", "btnClearCustomData2"].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener("click", clearAllCustomData);
    });
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
    if (elements.weightInput) {
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

    const unit = currentDrug.preferredUnit;
    const inputValueStr = elements.inputValueInput?.value || "";
    const inputVal = engine.parseNumericInput(inputValueStr);
    const weightKg = engine.parseNumericInput(elements.weightInput?.value);

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

    // Obter contexto ativo
    const selectedCtxId = elements.contextSelect?.value;
    const context = (currentDrug.contexts && currentDrug.contexts.find(c => c.id === selectedCtxId)) || (currentDrug.contexts && currentDrug.contexts[0]);

    // Caso não haja valor digitado
    if (isNaN(inputVal) || inputVal <= 0) {
      renderEmptyResult(context);
      return;
    }

    // Executar cálculo (mL/h -> Dose Padronizada)
    const calcResult = engine.convertMlHToDose(inputVal, unit, params);

    if (calcResult.error) {
      renderErrorResult(calcResult.error, context);
      return;
    }

    // Verificação Inversa
    const outputVal = calcResult.value;
    const invResult = engine.verifyInverse("mlh_to_dose", inputVal, outputVal, unit, params);

    // Classificação da Faixa Clínica
    const classification = classifyClinicalRange(currentDrug, context, outputVal);

    // Detecção de Erros de Unidade
    const unitError = engine.detectUnitError(currentDrug.id, unit, outputVal, weightKg);

    // Renderizar Painel de Resultado
    renderFullResult({
      drug: currentDrug,
      context,
      preset,
      unit,
      inputVal,
      outputVal,
      weightKg,
      steps: calcResult.steps,
      invResult,
      classification,
      unitError,
      params
    });
  }

  function classifyClinicalRange(drug, context, currentDose) {
    if (!context || !context.ranges || !context.ranges.length) {
      return { level: "info", title: "Faixa Usual de Referência", text: "Valor dentro dos parâmetros usuais." };
    }

    const activeRange = context.ranges.find(r => currentDose >= r.min && currentDose <= r.max);
    const messages = context.messages || {};

    if (activeRange) {
      let msgText = activeRange.text;
      if (activeRange.level === "critical" && messages.critical) msgText = messages.critical;
      else if (activeRange.level === "attention" && messages.attention) msgText = messages.attention;

      return {
        level: activeRange.level,
        title: activeRange.label,
        text: msgText
      };
    }

    // Caso a dose esteja abaixo da menor faixa
    if (currentDose < context.ranges[0].min) {
      return {
        level: "info",
        title: "Abaixo da Faixa Habitual",
        text: `Dose calculada (${currentDose.toFixed(2).replace(".", ",")} ${context.unit}) abaixo da faixa habitual.`
      };
    }

    // Caso a dose exceda a maior faixa
    const lastRange = context.ranges[context.ranges.length - 1];
    return {
      level: lastRange.level || "critical",
      title: lastRange.label || "Dose Elevada",
      text: messages.critical || messages.attention || lastRange.text
    };
  }

  function renderTherapeuticRanges(drug, context, currentDose) {
    const box = document.getElementById("infusionTherapeuticRangesBox");
    if (!box) return;

    if (!context || !context.ranges || !context.ranges.length) {
      box.innerHTML = `<em style="color: var(--text-secondary);">Sem faixas cadastradas para esta indicação.</em>`;
      return;
    }

    let html = `<div style="display: flex; flex-direction: column; gap: 6px;">`;

    context.ranges.forEach(r => {
      const isActive = !isNaN(currentDose) && currentDose > 0 && currentDose >= r.min && currentDose <= r.max;
      
      let badgeClass = "badge-info";
      let borderVar = "var(--primary)";
      if (r.level === "critical") {
        badgeClass = "badge-danger";
        borderVar = "var(--danger)";
      } else if (r.level === "attention") {
        badgeClass = "badge-warning";
        borderVar = "var(--warning, #f59e0b)";
      }

      const activeStyle = isActive 
        ? `border-left: 4px solid ${borderVar}; background: rgba(16, 102, 204, 0.12); font-weight: 700; border-radius: var(--radius-sm); padding: 8px 10px;` 
        : `border-left: 3px solid var(--border-color); background: var(--bg-card); opacity: 0.85; border-radius: var(--radius-sm); padding: 8px 10px;`;

      html += `
        <div style="${activeStyle}">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: var(--text-primary); font-size: 0.85rem;">
              ${isActive ? "👉 " : "• "}<strong>${r.text}</strong>
            </span>
            ${isActive ? `<span class="status-badge ${badgeClass}" style="font-size: 0.75rem; padding: 2px 6px;">SELECIONADO</span>` : ""}
          </div>
        </div>
      `;
    });

    html += `</div>`;
    box.innerHTML = html;
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

    if (elements.resultWeightLabel) {
      if (data.drug.requiresWeight === false) {
        elements.resultWeightLabel.textContent = "Não utilizado";
      } else {
        elements.resultWeightLabel.textContent = `${engine.formatNumber(data.weightKg)} kg`;
      }
    }

    // Valores de Entrada e Saída
    if (elements.resultInputValueLabel) {
      elements.resultInputValueLabel.textContent = `${engine.formatNumber(data.inputVal)} mL/h`;
    }

    if (elements.resultOutputValueLabel) {
      elements.resultOutputValueLabel.textContent = `${engine.formatNumber(data.outputVal)} ${data.unit}`;
    }

    // Renderizar Faixas Terapêuticas de Referência
    renderTherapeuticRanges(data.drug, data.context, data.outputVal);

    // Status Badge
    const classif = data.classification;
    if (elements.statusBadge) {
      elements.statusBadge.className = `status-badge badge-${classif.level}`;
      elements.statusBadge.textContent = classif.title;
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

  function renderEmptyResult(context) {
    if (!elements.resultCard) return;
    if (elements.resultOutputValueLabel) elements.resultOutputValueLabel.textContent = "--";
    if (elements.stepByStepBox) elements.stepByStepBox.innerHTML = "<em>Preencha o valor da bomba em mL/h para visualizar o cálculo.</em>";
    if (elements.statusBadge) {
      elements.statusBadge.className = "status-badge badge-info";
      elements.statusBadge.textContent = "Aguardando velocidade";
    }
    renderTherapeuticRanges(currentDrug, context, NaN);
    if (elements.unitErrorNoticeBox) elements.unitErrorNoticeBox.style.display = "none";
  }

  function renderErrorResult(msg, context) {
    if (!elements.resultCard) return;
    if (elements.resultOutputValueLabel) elements.resultOutputValueLabel.textContent = "Erro";
    if (elements.stepByStepBox) elements.stepByStepBox.innerHTML = `<span style="color:var(--danger);">${msg}</span>`;
    if (elements.statusBadge) {
      elements.statusBadge.className = "status-badge badge-danger";
      elements.statusBadge.textContent = "Dados Incompletos";
    }
    renderTherapeuticRanges(currentDrug, context, NaN);
    if (elements.unitErrorNoticeBox) elements.unitErrorNoticeBox.style.display = "none";
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
  // Diluição Personalizada (para o medicamento selecionado)
  // --------------------------------------------------
  function openCustomDilutionModal() {
    if (!elements.modalCustomDilution) return;

    if (!currentDrug) {
      alert("Selecione um medicamento primeiro.");
      return;
    }

    const targetLabel = document.getElementById("customDilutionTargetDrugLabel");
    if (targetLabel) {
      targetLabel.textContent = `Para: ${currentDrug.name}`;
    }

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
          id: "custom_dil_" + Date.now(),
          drugId: currentDrug.id,
          label: `${label} (${amount} ${unit} / ${volume} mL)`,
          concMcgMl,
          concMgMl,
          concUIMl
        };

        customDilutions.push(newDil);
        saveCustomDilutions();
        selectDrug(currentDrug.id); // Recarrega presets e seleciona droga
        elements.modalCustomDilution.style.display = "none";
      };
    }

    const btnClose = document.getElementById("btnCloseCustomDilutionModal");
    if (btnClose) btnClose.onclick = () => { elements.modalCustomDilution.style.display = "none"; };
  }

  // --------------------------------------------------
  // Cadastrar Novo Medicamento Personalizado
  // --------------------------------------------------
  function openCustomDrugModal() {
    if (!elements.modalCustomDrug) return;
    elements.modalCustomDrug.style.display = "flex";

    const btnSave = document.getElementById("btnSaveCustomDrug");
    if (btnSave) {
      btnSave.onclick = () => {
        const engine = window.__INFUSOES_ENGINE__;
        const drugName = document.getElementById("customDrugNameInput")?.value || "";
        if (!drugName.trim()) {
          alert("Informe o nome do medicamento.");
          return;
        }

        const category = document.getElementById("customDrugCategorySelect")?.value || "vasopressores";
        const prefUnit = document.getElementById("customDrugUnitSelect")?.value || "mcg/kg/min";
        const reqWeight = document.getElementById("customDrugRequiresWeightSelect")?.value === "yes";

        const label = document.getElementById("customDrugDilLabelInput")?.value || "Diluição Inicial";
        const amount = engine.parseNumericInput(document.getElementById("customDrugDilAmountInput")?.value);
        const unit = document.getElementById("customDrugDilUnitSelect")?.value;
        const volume = engine.parseNumericInput(document.getElementById("customDrugDilVolInput")?.value);

        if (isNaN(amount) || amount <= 0 || isNaN(volume) || volume <= 0) {
          alert("Informe quantidade e volume final válidos para a diluição.");
          return;
        }

        let concMcgMl = 0, concMgMl = 0, concUIMl = 0;
        if (unit === "mg") {
          concMgMl = amount / volume;
          concMcgMl = concMgMl * 1000;
        } else if (unit === "mcg") {
          concMcgMl = amount / volume;
          concMgMl = concMgMl / 1000;
        } else if (unit === "g") {
          concMgMl = (amount * 1000) / volume;
          concMcgMl = concMgMl * 1000;
        } else if (unit === "UI") {
          concUIMl = amount / volume;
        }

        const newDrugId = "custom_drug_" + Date.now();
        const newDrug = {
          id: newDrugId,
          name: drugName.trim(),
          category: category,
          preferredUnit: prefUnit,
          allowedUnits: [prefUnit],
          requiresWeight: reqWeight,
          isCustom: true,
          presets: [
            {
              label: `${label} (${amount} ${unit} / ${volume} mL)`,
              amountMg: unit === "mg" ? amount : 0,
              amountMcg: unit === "mcg" ? amount : 0,
              amountUI: unit === "UI" ? amount : 0,
              volumeMl: volume,
              concMcgMl,
              concMgMl,
              concUIMl
            }
          ],
          contexts: [
            {
              id: "padrao",
              name: "Infusão Contínua",
              unit: prefUnit,
              ranges: [
                { label: "Faixa Usual de Referência", min: 0, max: Infinity, level: "info", text: "Conferir protocolo institucional para medicamento personalizado." }
              ]
            }
          ]
        };

        customDrugs.push(newDrug);
        saveCustomDrugs();
        if (window.__INFUSOES_CONFIG__ && window.__INFUSOES_CONFIG__.drugs) {
          window.__INFUSOES_CONFIG__.drugs.push(newDrug);
        }
        populateDrugDropdown();
        selectDrug(newDrugId);
        elements.modalCustomDrug.style.display = "none";
      };
    }

    const btnClose = document.getElementById("btnCloseCustomDrugModal");
    if (btnClose) btnClose.onclick = () => { elements.modalCustomDrug.style.display = "none"; };
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

  function loadCustomDrugs() {
    try {
      const stored = localStorage.getItem("examesHC_infusoes_custom_drugs");
      if (stored) {
        customDrugs = JSON.parse(stored);
        if (window.__INFUSOES_CONFIG__ && window.__INFUSOES_CONFIG__.drugs) {
          customDrugs.forEach(cd => {
            if (!window.__INFUSOES_CONFIG__.drugs.some(d => d.id === cd.id)) {
              window.__INFUSOES_CONFIG__.drugs.push(cd);
            }
          });
        }
      }
    } catch (e) {
      customDrugs = [];
    }
  }

  function saveCustomDrugs() {
    try {
      localStorage.setItem("examesHC_infusoes_custom_drugs", JSON.stringify(customDrugs));
    } catch (e) {}
  }

  function clearAllCustomData() {
    if (confirm("Tem certeza que deseja apagar todos os medicamentos e diluições personalizados salvos neste navegador?")) {
      customDilutions = [];
      customDrugs = [];

      try {
        localStorage.removeItem("examesHC_infusoes_custom_dilutions");
        localStorage.removeItem("examesHC_infusoes_custom_drugs");
      } catch (e) {}

      if (window.__INFUSOES_CONFIG__ && window.__INFUSOES_CONFIG__.drugs) {
        window.__INFUSOES_CONFIG__.drugs = window.__INFUSOES_CONFIG__.drugs.filter(d => !d.isCustom);
      }

      populateDrugDropdown();

      if (window.__INFUSOES_CONFIG__ && window.__INFUSOES_CONFIG__.drugs.length > 0) {
        selectDrug(window.__INFUSOES_CONFIG__.drugs[0].id);
      }

      if (elements.modalCustomDilution) elements.modalCustomDilution.style.display = "none";
      if (elements.modalCustomDrug) elements.modalCustomDrug.style.display = "none";

      alert("Todos os dados personalizados salvos foram apagados com sucesso.");
    }
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
