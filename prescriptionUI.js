/**
 * prescriptionUI.js
 * Interface de usuário e interação para a ferramenta "Prescrição por Sistemas".
 */

(function () {
  const app = window.__EXAMES_APP__ = window.__EXAMES_APP__ || {};
  const parser = app.prescription;

  // Elementos do DOM
  const prescInput = document.getElementById("prescInput");
  const prescOutput = document.getElementById("prescOutput");
  const btnOrganizePrescription = document.getElementById("btnOrganizePrescription");
  const btnClearPrescInput = document.getElementById("btnClearPrescInput");
  const btnCopyPrescription = document.getElementById("btnCopyPrescription");
  const prescStatus = document.getElementById("prescStatus");
  const prescInteractiveContainer = document.getElementById("prescInteractiveCards");
  const btnSamplePrescription = document.getElementById("btnSamplePrescription");

  // Estado local dos sistemas para permitir edição fina e reatividade
  let currentSystemsState = [];
  let selectedChipItem = null; // Referência direta ao objeto item selecionado para exibir controles BIC/SN

  // Ícones por sistema para enriquecer a visualização clínica
  const SYSTEM_ICONS = {
    neuro: "🧠",
    cardio: "🫀",
    resp: "🫁",
    hemo: "🩸",
    renal: "💧",
    abd: "🍽️",
    infec: "🦠",
    outros: "🧴"
  };

  // Reordena os itens de um sistema respeitando a hierarquia clínica:
  // Dieta -> AE -> Contínuos (BIC) -> Regulares -> Se Necessário (SN/ACM)
  function sortSystemItemsInPlace(sys) {
    if (!sys || !sys.items) return;
    const diets = [];
    const aes = [];
    const continuous = [];
    const regular = [];
    const asNeeded = [];

    for (const it of sys.items) {
      if (it.isDiet) diets.push(it);
      else if (it.isAE) aes.push(it);
      else if (it.isContinuous) continuous.push(it);
      else if (it.isSN) asNeeded.push(it);
      else regular.push(it);
    }

    sys.items = [...diets, ...aes, ...continuous, ...regular, ...asNeeded];
  }

  // Extrai o nome conciso da medicação a partir do texto posológico (para modo BIC)
  function extractConciseDrugName(item) {
    if (item.name && !/\d+\s*(mg|mcg|g|ml|ui|gts|cp|amp|fa)\b/i.test(item.name)) {
      return item.name.trim();
    }
    const base = (item.regularFormattedText || item.formattedText || "").trim();
    // Remove posologia numérica a partir da primeira dose (ex: "Morfina 2mg 4/4h IV" -> "Morfina")
    const m = base.match(/^([A-Za-zÀ-ÿ\s\/\-]+?)(?=\s+\d|\s+(?:ACM|SN|IV|EV|VO|SNE|SNG|GTRS|SC|SL|INAL)\b|$)/i);
    return m && m[1].trim() ? m[1].trim() : base;
  }

  // Identifica a classe visual da via (EV vs. Enteral/VO) para chips regulares
  function getChipRouteClass(item) {
    if (!item || item.isContinuous || item.isSN || item.isDiet) return "";
    const r = (item.route || "").toUpperCase();
    const txt = item.formattedText || "";

    if (r === "IV" || r === "EV" || /\b(IV|EV)\b/.test(txt)) {
      return "chip-route-iv";
    }
    if (r === "VO" || r === "SNE" || r === "SNG" || r === "GTRS" || /\b(VO|SNE|SNG|GTRS)\b/.test(txt)) {
      return "chip-route-enteral";
    }
    return "";
  }

  // Alterna a tag BIC ou SN em um item e sincroniza texto + ordenação
  function toggleItemTag(sys, item, tagType) {
    if (!item.regularFormattedText) {
      item.regularFormattedText = item.formattedText.replace(/\s+(?:SN|ACM)$/i, "").trim();
    }

    if (tagType === "BIC") {
      item.isContinuous = !item.isContinuous;
      if (item.isContinuous) {
        item.isSN = false;
        item.formattedText = extractConciseDrugName(item);
      } else {
        item.formattedText = item.regularFormattedText || item.name;
      }
    } else if (tagType === "SN") {
      item.isSN = !item.isSN;
      if (item.isSN) {
        item.isContinuous = false;
        const base = (item.regularFormattedText || item.formattedText).replace(/\s+(?:SN|ACM)$/i, "").trim();
        item.formattedText = /\b(SN|ACM)\b$/i.test(base) ? base : `${base} SN`;
      } else {
        item.formattedText = (item.regularFormattedText || item.formattedText).replace(/\s+(?:SN|ACM)$/i, "").trim();
      }
    }

    sortSystemItemsInPlace(sys);
    syncOutputFromState();
    renderCards();
  }

  function getVisibleSystems() {
    if (!currentSystemsState || currentSystemsState.length === 0) return [];
    return currentSystemsState.filter(sys => {
      if (sys.optional || sys.systemId === "outros") {
        return sys.items && sys.items.length > 0;
      }
      return true;
    });
  }

  function showStatus(msg, type = "info") {
    if (!prescStatus) return;
    prescStatus.textContent = msg;
    prescStatus.className = `status-text ${type}`;
    if (type === "success") {
      setTimeout(() => {
        if (prescStatus.textContent === msg) prescStatus.textContent = "";
      }, 4000);
    }
  }

  // Gera texto puro e limpo para cópia (sem ** e sem <b>)
  function getPlainTextOutput() {
    const visible = getVisibleSystems();
    if (visible.length === 0) return "";
    return visible.map(sys => {
      const content = (!sys.items || sys.items.length === 0)
        ? "-"
        : sys.items.map(i => i.formattedText).join(" + ");
      return `${sys.systemName}: ${content}`;
    }).join("\n");
  }

  // Atualiza o painel de saída: visualmente com nome dos sistemas em negrito
  function syncOutputFromState() {
    const visible = getVisibleSystems();
    if (visible.length === 0) {
      if (prescOutput) prescOutput.innerHTML = "";
      return;
    }

    const htmlLines = visible.map(sys => {
      const content = (!sys.items || sys.items.length === 0)
        ? "-"
        : sys.items.map(i => i.formattedText).join(" + ");
      return `<div class="presc-system-line"><strong class="presc-system-name">${sys.systemName}:</strong> ${content}</div>`;
    });

    if (prescOutput) {
      prescOutput.innerHTML = htmlLines.join("");
    }
    if (window.__EXAMES_APP__ && typeof window.__EXAMES_APP__.notifyComposerUpdate === "function") {
      window.__EXAMES_APP__.notifyComposerUpdate();
    }
  }

  // Renderiza os cartões interativos dos sistemas
  function renderCards() {
    if (!prescInteractiveContainer) return;
    prescInteractiveContainer.innerHTML = "";

    const visibleSystems = getVisibleSystems();

    if (visibleSystems.length === 0) {
      prescInteractiveContainer.classList.remove("has-eight-cards");
      prescInteractiveContainer.innerHTML = `
        <div class="empty-state-notice">
          Cole a prescrição do Soul MV à esquerda e clique em <strong>"Organizar Prescrição"</strong> para visualizar os sistemas clínicos interativos.
        </div>
      `;
      return;
    }

    prescInteractiveContainer.classList.toggle("has-eight-cards", visibleSystems.length >= 8);

    visibleSystems.forEach((sys, sysIdx) => {
      const card = document.createElement("div");
      card.className = `system-card system-${sys.systemId}`;

      // Header do Card
      const header = document.createElement("div");
      header.className = "system-card-header";
      const icon = SYSTEM_ICONS[sys.systemId] || "💊";
      header.innerHTML = `
        <div class="system-title">
          <span class="system-icon">${icon}</span>
          <span class="system-name">${sys.systemName}</span>
          <span class="system-count badge">${sys.items.length}</span>
        </div>
        <div class="system-card-actions">
          <button type="button" class="btn-system-action btn-copy-line" title="Copiar apenas esta linha">Copiar</button>
        </div>
      `;

      // Botão de cópia individual da linha (texto puro e limpo, sem ** ou <b>)
      const btnCopyLine = header.querySelector(".btn-copy-line");
      btnCopyLine.addEventListener("click", () => {
        const content = sys.items.length === 0 
          ? "-" 
          : sys.items.map(i => i.formattedText).join(" + ");
        const textToCopy = `${sys.systemName}: ${content}`;

        navigator.clipboard.writeText(textToCopy).then(() => {
          btnCopyLine.textContent = "✓ Copiado";
          setTimeout(() => { btnCopyLine.textContent = "Copiar"; }, 2000);
        });
      });

      // Body do Card: Chips de medicamentos
      const body = document.createElement("div");
      body.className = "system-card-body";

      if (sys.items.length === 0) {
        const emptyBadge = document.createElement("span");
        emptyBadge.className = "empty-system-badge";
        emptyBadge.textContent = "Nenhuma medicação (-)";
        body.appendChild(emptyBadge);
      } else {
        const chipsList = document.createElement("div");
        chipsList.className = "system-chips-list";

        sys.items.forEach((item, itemIdx) => {
          const isSelected = selectedChipItem === item;
          const routeClass = getChipRouteClass(item);
          const chip = document.createElement("div");
          chip.className = `drug-chip ${item.isContinuous ? "chip-continuous" : ""} ${item.isSN ? "chip-sn" : ""} ${routeClass} ${isSelected ? "chip-selected" : ""}`.replace(/\s+/g, " ").trim();
          chip.title = "Clique para selecionar e marcar como BIC ou SN";
          
          let badgePrefix = "";
          if (item.isContinuous) badgePrefix = `<span class="chip-badge-tag" title="Infusão Contínua / BIC">BIC</span>`;
          if (item.isSN) badgePrefix = `<span class="chip-badge-tag" title="Se Necessário / ACM">SN</span>`;

          const tagActionsHtml = isSelected ? `
            <span class="chip-tag-actions">
              <button type="button" class="chip-tag-btn chip-tag-bic ${item.isContinuous ? "active" : ""}" title="Alternar tag BIC (Infusão Contínua — move para o início)">BIC</button>
              <button type="button" class="chip-tag-btn chip-tag-sn ${item.isSN ? "active" : ""}" title="Alternar tag SN (Se Necessário — move para o fim)">SN</button>
            </span>
          ` : "";

          chip.innerHTML = `
            ${badgePrefix}
            <span class="chip-text">${item.formattedText}</span>
            ${tagActionsHtml}
            <button type="button" class="chip-remove" title="Remover este item">&times;</button>
          `;

          // Selecionar/desselecionar chip ao clicar no texto ou corpo do chip
          chip.addEventListener("click", (e) => {
            if (e.target.closest(".chip-remove") || e.target.closest(".chip-tag-btn")) return;
            selectedChipItem = (selectedChipItem === item) ? null : item;
            renderCards();
          });

          if (isSelected) {
            const btnBic = chip.querySelector(".chip-tag-bic");
            const btnSn = chip.querySelector(".chip-tag-sn");
            if (btnBic) {
              btnBic.addEventListener("click", (e) => {
                e.stopPropagation();
                toggleItemTag(sys, item, "BIC");
              });
            }
            if (btnSn) {
              btnSn.addEventListener("click", (e) => {
                e.stopPropagation();
                toggleItemTag(sys, item, "SN");
              });
            }
          }

          // Ação de remover chip
          chip.querySelector(".chip-remove").addEventListener("click", (e) => {
            e.stopPropagation();
            if (selectedChipItem === item) selectedChipItem = null;
            sys.items.splice(itemIdx, 1);
            syncOutputFromState();
            renderCards();
          });

          chipsList.appendChild(chip);
        });

        body.appendChild(chipsList);
      }

      // Adicionar item manual ao sistema (com opção de pré-selecionar BIC ou SN)
      const addRow = document.createElement("div");
      addRow.className = "system-add-row";
      addRow.innerHTML = `
        <input type="text" class="input-add-drug" placeholder="+ Adicionar medicação..." />
        <div class="add-tag-toggles" title="Opcional: marcar nova medicação como BIC ou SN">
          <button type="button" class="btn-add-tag btn-add-bic" data-tag="BIC" title="Adicionar como Infusão Contínua (BIC)">BIC</button>
          <button type="button" class="btn-add-tag btn-add-sn" data-tag="SN" title="Adicionar como Se Necessário (SN)">SN</button>
        </div>
        <button type="button" class="btn-add-drug btn-secondary btn-small">Adicionar</button>
      `;

      const inputAdd = addRow.querySelector(".input-add-drug");
      const btnAdd = addRow.querySelector(".btn-add-drug");
      const btnAddBic = addRow.querySelector(".btn-add-bic");
      const btnAddSn = addRow.querySelector(".btn-add-sn");
      let pendingTag = null;

      const updatePendingTagUI = () => {
        btnAddBic.classList.toggle("active", pendingTag === "BIC");
        btnAddSn.classList.toggle("active", pendingTag === "SN");
      };

      btnAddBic.addEventListener("click", () => {
        pendingTag = (pendingTag === "BIC") ? null : "BIC";
        updatePendingTagUI();
        inputAdd.focus();
      });

      btnAddSn.addEventListener("click", () => {
        pendingTag = (pendingTag === "SN") ? null : "SN";
        updatePendingTagUI();
        inputAdd.focus();
      });

      const handleAdd = () => {
        const val = inputAdd.value.trim();
        if (!val) return;
        const isAutoSN = /\bSN\b|\bACM\b/i.test(val);
        const isBic = pendingTag === "BIC";
        const isSn = pendingTag === "SN" || (!isBic && isAutoSN);

        let formatted = val;
        if (isSn && !/\b(SN|ACM)\b$/i.test(formatted)) {
          formatted = `${formatted} SN`;
        }

        const newItem = {
          system: sys.systemId,
          name: val.replace(/\s+(?:SN|ACM)$/i, "").trim(),
          formattedText: formatted,
          regularFormattedText: val.replace(/\s+(?:SN|ACM)$/i, "").trim(),
          isContinuous: isBic,
          isSN: isSn
        };

        if (isBic) {
          newItem.formattedText = extractConciseDrugName(newItem);
        }

        sys.items.push(newItem);
        sortSystemItemsInPlace(sys);
        inputAdd.value = "";
        pendingTag = null;
        syncOutputFromState();
        renderCards();
      };

      btnAdd.addEventListener("click", handleAdd);
      inputAdd.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleAdd();
      });

      card.appendChild(header);
      card.appendChild(body);
      card.appendChild(addRow);
      prescInteractiveContainer.appendChild(card);
    });
  }

  // Ação principal: Processar e Organizar Prescrição
  function handleOrganize() {
    const rawText = (prescInput && prescInput.value) ? prescInput.value.trim() : "";
    if (!rawText) {
      showStatus("Por favor, cole a prescrição do Soul MV antes de organizar.", "error");
      return;
    }

    try {
      showStatus("Organizando pelos sistemas orgânicos...", "info");
      const result = parser.organizePrescription(rawText);
      currentSystemsState = result.systems;
      selectedChipItem = null;

      syncOutputFromState();
      renderCards();
      showStatus("Prescrição organizada com sucesso!", "success");
    } catch (err) {
      console.error("Erro ao organizar prescrição:", err);
      showStatus("Erro ao processar a prescrição. Verifique o texto colado.", "error");
    }
  }

  // Limpar entrada e resultados
  function handleClear() {
    if (prescInput) prescInput.value = "";
    if (prescOutput) prescOutput.innerHTML = "";
    currentSystemsState = [];
    selectedChipItem = null;
    renderCards();
    showStatus("Dados limpos.", "info");
  }

  // Copiar resultado consolidado para o clipboard (texto puro e limpo, sem ** ou <b>)
  function handleCopy() {
    const textToCopy = getPlainTextOutput();
    if (!textToCopy.trim()) {
      showStatus("Nada para copiar. Organize uma prescrição primeiro.", "error");
      return;
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
      const originalText = btnCopyPrescription.textContent;
      btnCopyPrescription.textContent = "✓ Prescrição Copiada!";
      btnCopyPrescription.classList.add("btn-copied");
      showStatus("Copiado com sucesso para a área de transferência!", "success");

      setTimeout(() => {
        btnCopyPrescription.textContent = originalText;
        btnCopyPrescription.classList.remove("btn-copied");
      }, 2500);
    }).catch(err => {
      console.error("Erro ao copiar:", err);
      const ta = document.createElement("textarea");
      ta.value = textToCopy;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showStatus("Copiado para o prontuário!", "success");
    });
  }

  // Inicialização de eventos
  function init() {
    if (btnOrganizePrescription) {
      btnOrganizePrescription.addEventListener("click", handleOrganize);
    }
    if (btnClearPrescInput) {
      btnClearPrescInput.addEventListener("click", handleClear);
    }
    if (btnCopyPrescription) {
      btnCopyPrescription.addEventListener("click", handleCopy);
    }

    renderCards();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Exportar API UI
  app.prescriptionUI = {
    handleOrganize,
    handleClear,
    handleCopy,
    renderCards
  };
})();
