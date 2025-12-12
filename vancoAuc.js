(function () {

  function calcBMI(weight, height) {
    return weight / Math.pow(height / 100, 2);
  }

  function bsaMosteller(weightKg, heightCm) {
    return Math.sqrt((heightCm * weightKg) / 3600);
  }

  function ckdEpi2021({ cr, age, sex }) {
    const k = sex === "female" ? 0.7 : 0.9;
    const a = sex === "female" ? -0.241 : -0.302;
    const sexFactor = sex === "female" ? 1.012 : 1;

    return (
      142 *
      Math.pow(Math.min(cr / k, 1), a) *
      Math.pow(Math.max(cr / k, 1), -1.2) *
      Math.pow(0.9938, age) *
      sexFactor
    );
  }

  function ckdEpi2021_indexed({ cr, age, sex }) {
  return ckdEpi2021({ cr, age, sex }); // mL/min/1.73m²
}

function egfrAbsoluteMlMin({ cr, age, sex, weight, height }) {
  const egfr_idx = ckdEpi2021_indexed({ cr, age, sex }); // mL/min/1.73
  const bsa = bsaMosteller(weight, height);              // m²
  return egfr_idx * (bsa / 1.73);                        // mL/min absoluto
}


  function selectModel({ bmi, critical }) {
    if (bmi >= 40) return "adane";
    if (critical) return "masich";
    return "buelga";
  }

function mlMinToLh(mlMin) {
  return (mlMin * 60) / 1000; // 0.06 * mlMin
}

 function getPopulationParams(model, patient) {
  if (model === "buelga") {
    const clcrLh = mlMinToLh(patient.eGFR_mlMin); // L/h
    return {
      V: 0.98 * patient.weight,         // L (TBW)
      CL: 1.08 * clcrLh                 // L/h
    };
  }

  if (model === "masich") {
    return {
      V: 85, // L (Vc)
      CL: 6.88 * Math.pow(patient.eGFR_mlMin / 40, 0.69) // L/h
    };
  }

  // adane pendente (ok deixar sem usar por enquanto)
  if (model === "adane") {
    return {
      V: 0.51 * patient.weight,
      CL: 6.54 * (patient.eGFR_mlMin / 125)
    };
  }
}

// ===============================
// 1C SS (intermitente) + Bayes MAP
// ===============================

function parseDateTimeLocalToMs(isoLocal) {
  // isoLocal: "yyyy-mm-ddThh:mm"
  const d = new Date(isoLocal);
  const ms = d.getTime();
  return Number.isFinite(ms) ? ms : NaN;
}

function posMod(x, m) {
  return ((x % m) + m) % m;
}

function hoursBetween(msA, msB) {
  return (msA - msB) / (1000 * 60 * 60);
}

/**
 * Concentração em steady-state (1 compartimento, infusão intermitente)
 * t = horas desde o início da infusão (0..tau)
 * doseMg = dose por administração (mg)
 * tinH = tempo de infusão (h)
 * tauH = intervalo (h)
 * CL = L/h
 * V = L
 * retorna mg/L
 */
function predictCssOneCompIntermittent({ doseMg, tinH, tauH, CL, V, t }) {
  if (CL <= 0 || V <= 0 || tinH <= 0 || tauH <= 0) return NaN;

  const k = CL / V;               // 1/h
  const R0 = doseMg / tinH;       // mg/h

  // termo comum
  const eTau = Math.exp(-k * tauH);
  const eTin = Math.exp(-k * tinH);

  // Cmin_ss (no início da infusão, imediatamente antes da dose)
  // Cmin = [ (R0/CL)*(1-exp(-k*tin))*exp(-k*(tau-tin)) ] / (1-exp(-k*tau))
  const numerator = (R0 / CL) * (1 - eTin) * Math.exp(-k * (tauH - tinH));
  const denom = (1 - eTau);
  const Cmin = denom !== 0 ? (numerator / denom) : NaN;

  // C no tempo t
  if (t <= tinH) {
    // durante infusão
    return Cmin * Math.exp(-k * t) + (R0 / CL) * (1 - Math.exp(-k * t));
  } else {
    // pós-infusão
    const Cend = Cmin * Math.exp(-k * tinH) + (R0 / CL) * (1 - Math.exp(-k * tinH));
    return Cend * Math.exp(-k * (t - tinH));
  }
}

/**
 * Converte horário de coleta (datetime-local) para t dentro do intervalo (0..tau)
 * usando como referência o "Início da última infusão" informado.
 */
function calcTwithinIntervalHours({ sampleIso, lastInfStartIso, tauH }) {
  const msSample = parseDateTimeLocalToMs(sampleIso);
  const msRef = parseDateTimeLocalToMs(lastInfStartIso);
  if (!Number.isFinite(msSample) || !Number.isFinite(msRef)) return NaN;

  const dtH = hoursBetween(msSample, msRef);
  return posMod(dtH, tauH);
}

function lnVarFromCV(cv) {
  // para prior log-normal: var(ln X) = ln(1 + CV^2)
  const c = Math.max(0.0001, Number(cv) || 0.3);
  return Math.log(1 + c * c);
}

/**
 * Ajuste Bayesiano MAP por grid search + refinamento.
 * Ajusta CL e V para explicar 2 níveis (pico/vale), com prior log-normal.
 */
function fitBayesMAP({
  CL0, V0,
  cvCL, cvV,
  obsSd,              // SD em mg/L (erro de medição/modelo)
  doseMg, tinH, tauH,
  lastInfStartIso,
  levels              // [{ type:'peak'|'trough', conc: number, iso:'yyyy-mm-ddThh:mm' }]
}) {
  const sigma = Math.max(0.1, Number(obsSd) || 2.0);
  const s2CL = lnVarFromCV(cvCL);
  const s2V  = lnVarFromCV(cvV);

  const y = levels.map(l => ({
    type: l.type,
    conc: Number(l.conc),
    t: calcTwithinIntervalHours({ sampleIso: l.iso, lastInfStartIso, tauH })
  }));

  if (y.some(p => !Number.isFinite(p.conc) || !Number.isFinite(p.t))) {
    throw new Error("Horários/valores dos níveis inválidos (verifique data/hora e números).");
  }

  function obj(CL, V) {
    if (!(CL > 0 && V > 0)) return Infinity;

    // penalidade do prior (log-normal)
    const lnCL = Math.log(CL), lnV = Math.log(V);
    const lnCL0 = Math.log(CL0), lnV0 = Math.log(V0);
    const priorPenalty =
      ((lnCL - lnCL0) ** 2) / s2CL +
      ((lnV  - lnV0)  ** 2) / s2V;

    // SSE dos níveis
    let sse = 0;
    for (const p of y) {
      const pred = predictCssOneCompIntermittent({ doseMg, tinH, tauH, CL, V, t: p.t });
      if (!Number.isFinite(pred)) return Infinity;
      const r = (p.conc - pred);
      sse += (r * r);
    }

    return (sse / (sigma * sigma)) + priorPenalty;
  }

  // 1) grid grosso
  let best = { CL: CL0, V: V0, f: obj(CL0, V0) };

  const CLmin = CL0 / 3, CLmax = CL0 * 3;
  const Vmin  = V0  / 3, Vmax  = V0  * 3;

  const n1 = 35; // ajuste fino o suficiente e ainda rápido
  for (let i = 0; i < n1; i++) {
    const CL = CLmin * Math.pow(CLmax / CLmin, i / (n1 - 1));
    for (let j = 0; j < n1; j++) {
      const V = Vmin * Math.pow(Vmax / Vmin, j / (n1 - 1));
      const f = obj(CL, V);
      if (f < best.f) best = { CL, V, f };
    }
  }

  // 2) refinamento local (mais 2 rodadas)
  for (let round = 0; round < 2; round++) {
    const CLc = best.CL, Vc = best.V;
    const CLmin2 = CLc / 1.6, CLmax2 = CLc * 1.6;
    const Vmin2  = Vc  / 1.6, Vmax2  = Vc  * 1.6;

    const n2 = 25;
    let best2 = best;
    for (let i = 0; i < n2; i++) {
      const CL = CLmin2 * Math.pow(CLmax2 / CLmin2, i / (n2 - 1));
      for (let j = 0; j < n2; j++) {
        const V = Vmin2 * Math.pow(Vmax2 / Vmin2, j / (n2 - 1));
        const f = obj(CL, V);
        if (f < best2.f) best2 = { CL, V, f };
      }
    }
    best = best2;
  }

  // também retorna predições nos pontos
  const preds = y.map(p => ({
    type: p.type,
    t: p.t,
    pred: predictCssOneCompIntermittent({ doseMg, tinH, tauH, CL: best.CL, V: best.V, t: p.t })
  }));

  return { CL: best.CL, V: best.V, preds, objective: best.f };
}

/**
 * Lê os níveis selecionados no UI (tabela) e retorna os 2 pontos.
 * Exige 1 pico + 1 vale.
 */
function readLevelsFromUI() {
  const wrap = document.getElementById("vancoLevelsWrap");
  if (!wrap) return [];

  const rows = [...wrap.querySelectorAll("tbody tr")];
  const picked = [];

  for (const r of rows) {
    const cb = r.querySelector('input[type="checkbox"][data-idx]');
    if (!cb || !cb.checked) continue;

    const sel = r.querySelector('select[data-role="type"]');
    const dt  = r.querySelector('input[data-role="time"]');
    const valCell = r.querySelector("td:nth-child(3)");
    const valTxt = valCell ? valCell.textContent : "";

    const type = (sel?.value || "").trim();
    const iso = (dt?.value || "").trim();
    const conc = Number(String(valTxt).replace(",", "."));

    if (!type || !iso || !Number.isFinite(conc)) continue;

    picked.push({ type, iso, conc });
  }

  // valida 2 níveis: 1 peak + 1 trough
  if (picked.length !== 2) {
    throw new Error("Selecione exatamente 2 níveis (1 Pico e 1 Vale).");
  }
  const nPeak = picked.filter(x => x.type === "peak").length;
  const nTrough = picked.filter(x => x.type === "trough").length;
  if (nPeak !== 1 || nTrough !== 1) {
    throw new Error("Você precisa marcar 1 nível como Pico e 1 nível como Vale.");
  }

  return picked;
}


  function calculateAUC24({ dose, tau, CL }) {
    return (dose * 24 / tau) / CL;
  }

  function calculateAucMic(input) {

    if (input.dialysis) {
      throw new Error("Paciente em diálise: AUC não calculável.");
    }

    if (!input.steady) {
      throw new Error("Paciente fora de steady-state.");
    }

    const bmi = calcBMI(input.weight, input.height);

    const eGFR_mlMin = egfrAbsoluteMlMin({
        cr: input.cr,
        age: input.age,
        sex: input.sex,
        weight: input.weight,
        height: input.height
    });

    const model =
      input.model === "auto"
        ? selectModel({ bmi, critical: input.critical })
        : input.model;

 const egfr_idx = ckdEpi2021_indexed({ cr: input.cr, age: input.age, sex: input.sex });

 const pop = getPopulationParams(model, {
  weight: input.weight,
  eGFR_mlMin
});

// prior
let CL_used = pop.CL;
let V_used  = pop.V;

// se tiver 2 níveis (pico+vale), ajusta Bayes (MAP)
let bayes = null;
if (input.levels && input.levels.length === 2) {
  bayes = fitBayesMAP({
    CL0: pop.CL,
    V0: pop.V,
    cvCL: input.priorCvCL,
    cvV: input.priorCvV,
    obsSd: input.obsSd,
    doseMg: input.dose,
    tinH: input.tinH,
    tauH: input.tau,
    lastInfStartIso: input.infStartIso,
    levels: input.levels
  });

  CL_used = bayes.CL;
  V_used  = bayes.V;
}

const auc24 = calculateAUC24({
  dose: input.dose,
  tau: input.tau,
  CL: CL_used
});

return {
  model,
  BMI: bmi.toFixed(1),
  eGFR_indexado: egfr_idx.toFixed(1),
  eGFR: eGFR_mlMin.toFixed(1),
  CL: CL_used.toFixed(2),
  V: V_used.toFixed(1),
  AUC24: auc24.toFixed(0),
  AUC_MIC: (auc24 / input.mic).toFixed(0),
  bayes // pode renderizar preds no UI se quiser
};

  }

  // 👇 ISSO É O MAIS IMPORTANTE
  window.__VANCO_AUC__ = {
    calculateAucMic
  };

function getVancoLevelsFromAppSnapshot() {
  const app = window.__EXAMES_APP__;
  const dateMap = app?.last?.dateMap;
  if (!dateMap) return [];

  const out = [];
  for (const [date, bucket] of dateMap.entries()) {
    if (!bucket?.Vancomicina) continue;

    out.push({
      value: parseFloat(String(bucket.Vancomicina.value).replace(",", ".")),
      date,
      time: bucket.__time || ""
    });
  }

  out.sort((a, b) => {
    const ta = toIsoLocal(a.date, a.time || "23:59");
    const tb = toIsoLocal(b.date, b.time || "23:59");
    return ta.localeCompare(tb);
  });

  return out;
}


function toIsoLocal(dateBr, timeHHMM) {
  // "dd/mm/yyyy" + "hh:mm" -> "yyyy-mm-ddThh:mm"
  const m = String(dateBr).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  const dd = m[1], mm = m[2], yyyy = m[3];
  const t = (timeHHMM && /^\d{2}:\d{2}$/.test(timeHHMM)) ? timeHHMM : "00:00";
  return `${yyyy}-${mm}-${dd}T${t}`;
}


function renderVancoLevels(levels) {
  const wrap = document.getElementById("vancoLevelsWrap");
  if (!wrap) return;

  if (!levels.length) {
    wrap.innerHTML = "<em>Nenhum nível de vancomicina encontrado no laudo.</em>";
    return;
  }

  wrap.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Usar</th>
          <th>Tipo</th>
          <th>Valor (mg/L)</th>
          <th>Data/Hora (editável)</th>
        </tr>
      </thead>
      <tbody>
        ${levels.map((lvl, i) => `
          <tr>
            <td><input type="checkbox" data-idx="${i}" checked></td>
            <td>
              <select data-role="type" data-idx="${i}">
                <option value="">—</option>
                <option value="peak">Pico</option>
                <option value="trough">Vale</option>
              </select>
            </td>
            <td>${lvl.value}</td>
            <td>
              <input type="datetime-local"
                data-role="time"
                data-idx="${i}"
                value="${toIsoLocal(lvl.date, lvl.time)}">
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

  function toDatetimeLocal(dt) {
    const [d, t] = dt.split(" ");
    const [dd, mm, yyyy] = d.split("/");
    return `${yyyy}-${mm}-${dd}T${t}`;
  }

document.getElementById("vancoLoadFromLaudo")?.addEventListener("click", () => {
  const status = document.getElementById("vancoStatus");
  const levels = getVancoLevelsFromAppSnapshot();

  status.textContent = levels.length
    ? `${levels.length} nível(is) de vancomicina importado(s).`
    : "Nenhum nível de vancomicina encontrado (gere o texto primeiro ou marque Vancomicina nos filtros).";

  renderVancoLevels(levels);
});





window.__VANCO_AUC__ = {
  calculateAucMic,
  readLevelsFromUI
};




})();
