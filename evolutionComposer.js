// ==========================================================================
// Compositor de Evolução Consolidada & Reset Rápido de Paciente (V3.0)
// ==========================================================================

(function () {
  const app = (window.__EXAMES_APP__ = window.__EXAMES_APP__ || {});

  const drawer = document.getElementById("evolutionComposerDrawer");
  const btnOpenComposer = document.getElementById("btnOpenComposer");
  const btnCloseComposer = document.getElementById("btnCloseComposer");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const composerCountBadge = document.getElementById("composerCountBadge");
  const composerShowTitles = document.getElementById("composerShowTitles");
  const btnRefreshComposer = document.getElementById("btnRefreshComposer");
  const composerBlocksList = document.getElementById("composerBlocksList");
  const composerFinalOutput = document.getElementById("composerFinalOutput");
  const composerStatus = document.getElementById("composerStatus");
  const btnCopyConsolidated = document.getElementById("btnCopyConsolidated");
  const btnResetAllTabs = document.getElementById("btnResetAllTabs");
  const btnResetPatientSidebar = document.getElementById("btnResetPatientSidebar");

  // Definição ordenada dos 5 blocos da evolução médica
  const composerBlocks = [
    {
      id: "vitals",
      label: "Controles & Balanço Hídrico (24h)",
      headerTitle: "CONTROLES E BALANÇO HÍDRICO:",
      enabled: true,
      getText: () => {
        const el = document.getElementById("vitalsOutput");
        const val = (el?.value || "").trim();
        if (!val || val.startsWith("Erro")) return "";
        return val;
      }
    },
    {
      id: "curves",
      label: "Curva Térmica & Glicemia Capilar",
      headerTitle: "CURVA TÉRMICA E GLICEMIA:",
      enabled: true,
      getText: () => {
        const tempEl = document.getElementById("temperatureOutput");
        const glycEl = document.getElementById("glycemiaOutput");
        const tVal = (tempEl?.value || "").trim();
        const gVal = (glycEl?.value || "").trim();
        const parts = [];
        if (tVal && !tVal.startsWith("Erro") && !tVal.startsWith("Nenhum")) {
          parts.push(`Febres: ${tVal}`);
        }
        if (gVal && !gVal.startsWith("Erro") && !gVal.startsWith("Nenhum")) {
          parts.push(`Dextros:\n${gVal}`);
        }
        return parts.join("\n");
      }
    },
    {
      id: "antibiotics",
      label: "Linha do Tempo de Antimicrobianos",
      headerTitle: "ANTIMICROBIANOS:",
      enabled: true,
      getText: () => {
        const el = document.getElementById("antOutput");
        const val = (el?.value || "").trim();
        if (!val || val.startsWith("Nenhum") || val.startsWith("Erro")) return "";
        return val;
      }
    },
    {
      id: "cultures",
      label: "Culturas & Microbiologia",
      headerTitle: "CULTURAS E MICROBIOLOGIA:",
      enabled: true,
      getText: () => {
        const el = document.getElementById("culturesOutput");
        const val = (el?.value || "").trim();
        if (!val || val.startsWith("Nenhuma cultura") || val.startsWith("Erro")) return "";
        return val;
      }
    },
    {
      id: "exams",
      label: "Exames Laboratoriais",
      headerTitle: "EXAMES COMPLEMENTARES:",
      enabled: true,
      getText: () => {
        const el = document.getElementById("outputText");
        const val = (el?.value || "").trim();
        if (!val || val.startsWith("Nenhum exame")) return "";
        return val;
      }
    },
    {
      id: "prescription",
      label: "Prescrição por Sistemas (7 Sistemas)",
      headerTitle: "CONDUTA / PRESCRIÇÃO POR SISTEMAS:",
      enabled: true,
      getText: () => {
        const el = document.getElementById("prescOutput");
        if (!el) return "";
        const val = (el.innerText || el.textContent || "").trim();
        return val;
      }
    }
  ];

  function getActiveBlocksCount() {
    let readyCount = 0;
    for (const b of composerBlocks) {
      if (b.getText().length > 0) readyCount++;
    }
    return readyCount;
  }

  function updateBadge() {
    if (!composerCountBadge) return;
    const ready = getActiveBlocksCount();
    composerCountBadge.textContent = `${ready}/${composerBlocks.length}`;
    composerCountBadge.classList.toggle("has-items", ready > 0);
  }

  function buildConsolidatedText() {
    const showTitles = composerShowTitles ? composerShowTitles.checked : true;
    const sections = [];

    for (const block of composerBlocks) {
      if (!block.enabled) continue;
      const content = block.getText();
      if (!content) continue;

      if (showTitles) {
        sections.push(`${block.headerTitle}\n${content}`);
      } else {
        sections.push(content);
      }
    }

    return sections.join("\n\n");
  }

  function renderComposerDrawer() {
    updateBadge();
    if (!composerBlocksList) return;

    composerBlocksList.innerHTML = composerBlocks
      .map((block, idx) => {
        const content = block.getText();
        const hasData = content.length > 0;
        const previewLine = hasData
          ? content.split(/\r?\n/)[0].slice(0, 58) + (content.length > 58 ? "..." : "")
          : "Sem dados gerados nesta aba ainda";

        return `
        <div class="composer-block-card ${hasData ? "has-data" : "empty-data"}">
          <div class="composer-block-info">
            <input type="checkbox" class="composer-block-cb" data-block-idx="${idx}" ${block.enabled ? "checked" : ""} />
            <div style="min-width: 0; flex: 1;">
              <div class="composer-block-title">${block.label}</div>
              <div class="composer-block-status">${escapeHtml(previewLine)}</div>
            </div>
          </div>
          <div class="composer-block-actions">
            <button type="button" class="btn-move-block" data-dir="-1" data-block-idx="${idx}" ${idx === 0 ? "disabled" : ""} title="Mover para cima">↑</button>
            <button type="button" class="btn-move-block" data-dir="1" data-block-idx="${idx}" ${idx === composerBlocks.length - 1 ? "disabled" : ""} title="Mover para baixo">↓</button>
          </div>
        </div>
      `;
      })
      .join("");

    composerBlocksList.querySelectorAll(".composer-block-cb").forEach((cb) => {
      cb.addEventListener("change", () => {
        const i = parseInt(cb.getAttribute("data-block-idx"), 10);
        if (composerBlocks[i]) {
          composerBlocks[i].enabled = cb.checked;
          if (composerFinalOutput) {
            composerFinalOutput.value = buildConsolidatedText();
          }
        }
      });
    });

    composerBlocksList.querySelectorAll(".btn-move-block").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.getAttribute("data-block-idx"), 10);
        const dir = parseInt(btn.getAttribute("data-dir"), 10);
        const targetIdx = i + dir;
        if (targetIdx >= 0 && targetIdx < composerBlocks.length) {
          const temp = composerBlocks[i];
          composerBlocks[i] = composerBlocks[targetIdx];
          composerBlocks[targetIdx] = temp;
          renderComposerDrawer();
        }
      });
    });

    if (composerFinalOutput) {
      composerFinalOutput.value = buildConsolidatedText();
    }
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function openComposer() {
    if (!drawer) return;
    // Fechar drawer de filtros de exames se estiver aberto
    const examDrawer = document.getElementById("examFilterDrawer");
    if (examDrawer) examDrawer.classList.remove("open");

    renderComposerDrawer();
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    if (drawerBackdrop) drawerBackdrop.classList.add("open");
  }

  function closeComposer() {
    if (!drawer) return;
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    if (drawerBackdrop) drawerBackdrop.classList.remove("open");
  }

  function resetAllPatientData() {
    // 1. Limpar Exames
    const rawInput = document.getElementById("rawInput");
    const outputText = document.getElementById("outputText");
    const statusEl = document.getElementById("status");
    const tableContainer = document.getElementById("tableContainer");
    if (rawInput) rawInput.value = "";
    if (outputText) outputText.value = "";
    if (statusEl) statusEl.textContent = "";
    if (tableContainer) tableContainer.innerHTML = "";
    if (typeof app.autoGenerate === "function") app.autoGenerate();

    // 2. Limpar Prescrição por Sistemas
    document.getElementById("btnClearPrescInput")?.click();

    // 3. Limpar Controles & BH
    document.getElementById("btnClearVitalsInput")?.click();
    if (typeof app.resetVitalsBhAccumulator === "function") {
      app.resetVitalsBhAccumulator();
    }

    // 4. Limpar Antibióticos e Culturas
    document.getElementById("btnClearAntInput")?.click();
    document.getElementById("btnClearCultures")?.click();

    // 5. Limpar Glicemia e Temperatura
    document.getElementById("btnClearGlycemiaInput")?.click();
    document.getElementById("btnClearTemperatureInput")?.click();

    renderComposerDrawer();
    if (typeof app.showToast === "function") {
      app.showToast("Dados limpos. Pronto para o próximo paciente.");
    }
  }

  // Eventos de abertura / fechamento da gaveta
  btnOpenComposer?.addEventListener("click", () => {
    if (drawer?.classList.contains("open")) {
      closeComposer();
    } else {
      openComposer();
    }
  });

  btnCloseComposer?.addEventListener("click", closeComposer);

  drawerBackdrop?.addEventListener("click", () => {
    if (drawer?.classList.contains("open")) {
      closeComposer();
    }
  });

  composerShowTitles?.addEventListener("change", () => {
    if (composerFinalOutput) {
      composerFinalOutput.value = buildConsolidatedText();
    }
  });

  btnRefreshComposer?.addEventListener("click", () => {
    renderComposerDrawer();
    if (typeof app.showToast === "function") {
      app.showToast("Evolução consolidada sincronizada!");
    }
  });

  btnCopyConsolidated?.addEventListener("click", () => {
    const text = (composerFinalOutput?.value || "").trim();
    if (!text) {
      if (typeof app.showToast === "function") {
        app.showToast("Nenhum bloco preenchido ainda para copiar.");
      }
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      if (composerStatus) composerStatus.textContent = "Copiado!";
      btnCopyConsolidated.classList.add("btn-copied");
      const orig = btnCopyConsolidated.innerHTML;
      btnCopyConsolidated.innerHTML = "✓ Evolução Completa Copiada!";
      if (typeof app.showToast === "function") {
        app.showToast("Evolução consolidada copiada para o prontuário!");
      }
      setTimeout(() => {
        btnCopyConsolidated.classList.remove("btn-copied");
        btnCopyConsolidated.innerHTML = orig;
        if (composerStatus) composerStatus.textContent = "";
      }, 2000);
    });
  });

  btnResetAllTabs?.addEventListener("click", resetAllPatientData);
  btnResetPatientSidebar?.addEventListener("click", resetAllPatientData);

  // Observar cliques nos botões de gerar/limpar de todas as abas para atualizar o contador X/5 em tempo real
  const triggerIds = [
    "btnGenerateAntTimeline",
    "btnClearAntInput",
    "btnOrganizePrescription",
    "btnClearPrescInput",
    "btnGenerateVitals",
    "btnClearVitalsInput",
    "btnGenerateGlycemia",
    "btnClearGlycemiaInput",
    "btnGenerateTemperature",
    "btnClearTemperatureInput"
  ];

  triggerIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("click", () => {
        setTimeout(() => {
          updateBadge();
          if (drawer?.classList.contains("open")) {
            renderComposerDrawer();
          }
        }, 50);
      });
    }
  });

  // Observar edições no #prescOutput (contenteditable)
  const prescOut = document.getElementById("prescOutput");
  if (prescOut) {
    prescOut.addEventListener("input", () => {
      updateBadge();
    });
  }

  app.notifyComposerUpdate = () => {
    updateBadge();
    if (drawer?.classList.contains("open")) {
      renderComposerDrawer();
    }
  };

  // Inicializar badge
  updateBadge();
})();

