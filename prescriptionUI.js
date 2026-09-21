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

  const SYSTEM_ICONS = {
    neuro: "🧠",
    cardio: "🫀",
    resp: "🫁",
    hemo: "🩸",
    renal: "💧",
    abd: "🍽️",
    infec: "🦠"
  };

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

  // Atualiza o textarea de saída a partir do estado atual dos sistemas
  function syncOutputFromState() {
    if (!currentSystemsState || currentSystemsState.length === 0) {
      if (prescOutput) prescOutput.value = "";
      return;
    }

    const lines = currentSystemsState.map(sys => {
      if (!sys.items || sys.items.length === 0) {
        return `${sys.systemName}: -`;
      }
      return `${sys.systemName}: ${sys.items.map(i => i.formattedText).join(" + ")}`;
    });

    if (prescOutput) {
      prescOutput.value = lines.join("\n");
    }
  }

  // Renderiza os cartões interativos dos 7 sistemas
  function renderCards() {
    if (!prescInteractiveContainer) return;
    prescInteractiveContainer.innerHTML = "";

    if (!currentSystemsState || currentSystemsState.length === 0) {
      prescInteractiveContainer.innerHTML = `
        <div class="empty-state-notice">
          Cole a prescrição do Soul MV à esquerda e clique em <strong>"Organizar Prescrição"</strong> para visualizar os 7 sistemas clínicos interativos.
        </div>
      `;
      return;
    }

    currentSystemsState.forEach((sys, sysIdx) => {
      const card = document.createElement("div");
      card.className = `system-card system-${sys.systemId}`;

      const icon = SYSTEM_ICONS[sys.systemId] || "📋";

      // Header do Card
      const header = document.createElement("div");
      header.className = "system-card-header";
      header.innerHTML = `
        <div class="system-title">
          <span class="system-icon">${icon}</span>
          <span class="system-name">${sys.systemName}</span>
          <span class="system-count badge">${sys.items.length}</span>
        </div>
        <div class="system-card-actions">
          <button type="button" class="btn-system-action btn-copy-line" title="Copiar apenas esta linha">📋 Copiar</button>
        </div>
      `;

      // Botão de cópia individual da linha
      const btnCopyLine = header.querySelector(".btn-copy-line");
      btnCopyLine.addEventListener("click", () => {
        const textToCopy = sys.items.length === 0 
          ? `${sys.systemName}: -` 
          : `${sys.systemName}: ${sys.items.map(i => i.formattedText).join(" + ")}`;
        
        navigator.clipboard.writeText(textToCopy).then(() => {
          btnCopyLine.textContent = "✓ Copiado!";
          setTimeout(() => { btnCopyLine.textContent = "📋 Copiar"; }, 2000);
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
          const chip = document.createElement("div");
          chip.className = `drug-chip ${item.isContinuous ? "chip-continuous" : ""} ${item.isSN ? "chip-sn" : ""}`;
          
          let badgePrefix = "";
          if (item.isContinuous) badgePrefix = `<span class="chip-badge-tag" title="Infusão Contínua / BIC">BIC</span>`;
          if (item.isSN) badgePrefix = `<span class="chip-badge-tag" title="Se Necessário / ACM">SN</span>`;

          chip.innerHTML = `
            ${badgePrefix}
            <span class="chip-text">${item.formattedText}</span>
            <button type="button" class="chip-remove" title="Remover este item">&times;</button>
          `;

          // Ação de remover chip
          chip.querySelector(".chip-remove").addEventListener("click", () => {
            sys.items.splice(itemIdx, 1);
            syncOutputFromState();
            renderCards();
          });

          chipsList.appendChild(chip);
        });

        body.appendChild(chipsList);
      }

      // Adicionar item manual ao sistema
      const addRow = document.createElement("div");
      addRow.className = "system-add-row";
      addRow.innerHTML = `
        <input type="text" class="input-add-drug" placeholder="+ Adicionar medicação a este sistema..." />
        <button type="button" class="btn-add-drug btn-secondary btn-small">Adicionar</button>
      `;

      const inputAdd = addRow.querySelector(".input-add-drug");
      const btnAdd = addRow.querySelector(".btn-add-drug");

      const handleAdd = () => {
        const val = inputAdd.value.trim();
        if (!val) return;
        sys.items.push({
          system: sys.systemId,
          name: val,
          formattedText: val,
          isContinuous: false,
          isSN: /\bSN\b|\bACM\b/i.test(val)
        });
        inputAdd.value = "";
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
      showStatus("Organizando pelos 7 sistemas orgânicos...", "info");
      const result = parser.organizePrescription(rawText);
      currentSystemsState = result.systems;

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
    if (prescOutput) prescOutput.value = "";
    currentSystemsState = [];
    renderCards();
    showStatus("Dados limpos.", "info");
  }

  // Copiar resultado consolidado para o clipboard
  function handleCopy() {
    if (!prescOutput || !prescOutput.value.trim()) {
      showStatus("Nada para copiar. Organize uma prescrição primeiro.", "error");
      return;
    }

    navigator.clipboard.writeText(prescOutput.value).then(() => {
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
      prescOutput.select();
      document.execCommand("copy");
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
