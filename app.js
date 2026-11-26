"use strict";

const DATA_URL = "./data.json";
const CHECKS_KEY = "za_checks";

let DATA = null;
let activeTab = "roadmap";
let activePhase = 1;
let tmSearch = "";
let tmMethod = "all";
let tmSort = "number";

const $ = (selector) => document.querySelector(selector);

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function readChecks() {
  try {
    return JSON.parse(localStorage.getItem(CHECKS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveChecks(checks) {
  localStorage.setItem(CHECKS_KEY, JSON.stringify(checks));
}

function getAllRows() {
  return DATA.phases.flatMap((phase) =>
    phase.rows.map((row, index) => ({
      ...row,
      phaseId: phase.id,
      phaseName: phase.name,
      rowId: `p${phase.id}-r${index}`
    }))
  );
}

/* PHASE NAVIGATION */

function renderPhaseTabs() {
  const root = $("#phaseTabs");
  if (!root) return;

  root.innerHTML = DATA.phases.map((phase) => `
    <button
      class="phase-tab ${phase.id === activePhase ? "active" : ""}"
      type="button"
      data-phase="${phase.id}"
      aria-pressed="${phase.id === activePhase}"
    >
      <span class="phase-tab-number">PHASE ${phase.id}</span>
      <span class="phase-tab-name">${escapeHTML(phase.name)}</span>
    </button>
  `).join("");

  root.querySelectorAll("[data-phase]").forEach((button) => {
    button.addEventListener("click", () => {
      selectPhase(Number(button.dataset.phase));
    });
  });
}

function selectPhase(phaseId) {
  activePhase = phaseId;

  document.querySelectorAll(".phase-tab").forEach((button) => {
    const selected = Number(button.dataset.phase) === phaseId;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  document.querySelectorAll(".phase-card").forEach((card) => {
    card.hidden = Number(card.dataset.phaseId) !== phaseId;
  });

  const selectedTab = document.querySelector(
    `.phase-tab[data-phase="${phaseId}"]`
  );

  if (selectedTab) {
    selectedTab.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest"
    });
  }
}

/* ROADMAP */

function renderPhases() {
  const root = $("#phaseList");
  if (!root) return;

  root.innerHTML = DATA.phases.map((phase) => `
    <section
      class="phase-card"
      id="phase-${phase.id}"
      data-phase-id="${phase.id}"
      ${phase.id !== activePhase ? "hidden" : ""}
    >
      <div class="phase-heading">
        <div>
          <p class="eyebrow">PHASE ${phase.id}</p>
          <h2>${escapeHTML(phase.name)}</h2>
        </div>
        <span class="phase-count">${phase.rows.length} entries</span>
      </div>

      <div class="table-wrap">
        <table class="phase-table">
          <thead>
            <tr>
              <th>Pokémon</th>
              <th>Where / How</th>
              <th>Move Set</th>
              <th>Where / How</th>
              <th>Held Item</th>
              <th>Where / How</th>
            </tr>
          </thead>
          <tbody>
            ${phase.rows.map((row) => `
              <tr>
                <td class="pokemon-cell">${escapeHTML(row.pokemon)}</td>
                <td>${escapeHTML(row.where)}</td>
                <td>${escapeHTML(row.moves)}</td>
                <td>${escapeHTML(row.moveWhere)}</td>
                <td>${escapeHTML(row.item)}</td>
                <td>${escapeHTML(row.itemWhere)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `).join("");

  renderPhaseTabs();
  selectPhase(activePhase);
}

/* TM CATALOGUE */

function getResearchLevel(tmNumber) {
  const reward = DATA.tmCatalogue.researchRewards.find(
    (entry) => entry.tm === tmNumber
  );

  return reward ? reward.level : null;
}

function getTMAvailability(tm) {
  if (tm.method.includes("Research Level")) {
    const level = getResearchLevel(tm.number);
    return level ? `Research Level ${level}` : "Research reward";
  }

  const missionMatch = tm.method.match(/after Main Mission (\d+)/i);
  if (missionMatch) return `After Mission ${missionMatch[1]}`;
  if (tm.method.includes("postgame")) return "Postgame";
  if (tm.method.includes("Side Mission")) return "Side Mission";
  if (tm.method.includes("Defeat")) return "Battle reward";

  return "World pickup";
}

function renderTMCatalogue() {
  const root = $("#tmList");
  const count = $("#tmCount");
  if (!root) return;

  let tms = [...DATA.tmCatalogue.tms];

  if (tmSearch.trim()) {
    const query = tmSearch.trim().toLowerCase();

    tms = tms.filter((tm) =>
      String(tm.number).padStart(3, "0").includes(query) ||
      tm.name.toLowerCase().includes(query) ||
      tm.location.toLowerCase().includes(query) ||
      tm.method.toLowerCase().includes(query)
    );
  }

  if (tmMethod === "research") {
    tms = tms.filter((tm) => tm.method.includes("Research Level"));
  } else if (tmMethod === "mission") {
    tms = tms.filter((tm) =>
      tm.method.includes("Mission") || tm.method.includes("Defeat")
    );
  } else if (tmMethod === "pickup") {
    tms = tms.filter((tm) =>
      !tm.method.includes("Research Level") &&
      !tm.method.includes("Mission") &&
      !tm.method.includes("Defeat")
    );
  }

  if (tmSort === "name") {
    tms.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    tms.sort((a, b) => a.number - b.number);
  }

  if (count) {
    count.textContent =
      `${tms.length} of ${DATA.tmCatalogue.tms.length} TMs`;
  }

  if (!tms.length) {
    root.innerHTML =
      `<div class="empty-state">No TMs match your search.</div>`;
    return;
  }

  root.innerHTML = tms.map((tm) => {
    const number = String(tm.number).padStart(3, "0");
    const researchLevel = getResearchLevel(tm.number);

    return `
      <article class="tm-card">
        <div class="tm-number">TM${number}</div>

        <div class="tm-main">
          <h3>${escapeHTML(tm.name)}</h3>
          <p class="tm-location">${escapeHTML(tm.location)}</p>
          <p class="tm-method">${escapeHTML(tm.method)}</p>
        </div>

        <div class="tm-unlock">
          ${researchLevel
            ? `<span class="unlock-tag">Research Lv. ${researchLevel}</span>`
            : `<span class="unlock-tag">${escapeHTML(getTMAvailability(tm))}</span>`}
        </div>
      </article>
    `;
  }).join("");
}

function renderResearchRewards() {
  const root = $("#researchRewards");
  if (!root) return;

  root.innerHTML = DATA.tmCatalogue.researchRewards
    .slice()
    .sort((a, b) => a.level - b.level)
    .map((reward) => {
      const tm = DATA.tmCatalogue.tms.find(
        (entry) => entry.number === reward.tm
      );

      return `
        <div class="research-row">
          <span>Research Level ${reward.level}</span>
          <strong>
            TM${String(reward.tm).padStart(3, "0")} —
            ${escapeHTML(tm?.name || "Unknown TM")}
          </strong>
        </div>
      `;
    }).join("");
}

/* PROGRESS TRACKER */

function renderChecks() {
  const root = $("#progressList");
  if (!root) return;

  const checks = readChecks();
  const rows = getAllRows();

  root.innerHTML = DATA.phases.map((phase) => {
    const phaseRows = rows.filter(
      (row) => row.phaseId === phase.id
    );

    return `
      <section class="progress-phase">
        <h3>Phase ${phase.id}: ${escapeHTML(phase.name)}</h3>

        ${phaseRows.map((row) => `
          <label class="progress-item">
            <input
              type="checkbox"
              data-check-id="${row.rowId}"
              ${checks[row.rowId] ? "checked" : ""}
            >
            <span>${escapeHTML(row.pokemon)}</span>
          </label>
        `).join("")}
      </section>
    `;
  }).join("");

  root.querySelectorAll("input[data-check-id]").forEach((input) => {
    input.addEventListener("change", () => {
      const updated = readChecks();
      updated[input.dataset.checkId] = input.checked;

      saveChecks(updated);
      updateProgressSummary();
    });
  });

  updateProgressSummary();
}

function updateProgressSummary() {
  const checks = readChecks();
  const rows = getAllRows();

  const completed = rows.filter(
    (row) => checks[row.rowId]
  ).length;

  const total = rows.length;
  const percent = total
    ? Math.round((completed / total) * 100)
    : 0;

  const count = $("#progressCount");
  const bar = $("#progressBar");
  const percentLabel = $("#progressPercent");

  if (count) {
    count.textContent = `${completed} / ${total} entries completed`;
  }

  if (bar) bar.style.width = `${percent}%`;
  if (percentLabel) percentLabel.textContent = `${percent}%`;
}

/* MAIN NAVIGATION */

function wireTabs() {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.dataset.tab;
      activeTab = tab;

      document.querySelectorAll("[data-tab]").forEach((item) => {
        item.classList.toggle("active", item.dataset.tab === tab);
      });

      document.querySelectorAll("[data-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.panel !== tab;
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

/* TM CONTROLS */

function wireTMControls() {
  const search = $("#tmSearch");
  const method = $("#tmMethod");
  const sort = $("#tmSort");

  if (search) {
    search.addEventListener("input", () => {
      tmSearch = search.value;
      renderTMCatalogue();
    });
  }

  if (method) {
    method.addEventListener("change", () => {
      tmMethod = method.value;
      renderTMCatalogue();
    });
  }

  if (sort) {
    sort.addEventListener("change", () => {
      tmSort = sort.value;
      renderTMCatalogue();
    });
  }
}

/* PROGRESS CONTROLS */

function wireProgressControls() {
  const reset = $("#resetProgress");
  if (!reset) return;

  reset.addEventListener("click", () => {
    const confirmed = window.confirm(
      "Reset all roadmap progress? This cannot be undone."
    );

    if (!confirmed) return;

    localStorage.removeItem(CHECKS_KEY);
    renderChecks();
  });
}

/* GUIDE NOTES */

function renderGuideNotes() {
  const root = $("#guideNotes");
  if (!root) return;

  root.innerHTML = `
    <section class="note-card">
      <h3>How to use the roadmap</h3>
      <p>Follow the phases in mission order. A Pokémon, move, or held item should only be added to your active plan after its listed encounter, evolution, mission, or Research Level requirement has been met.</p>
    </section>

    <section class="note-card">
      <h3>Research Level</h3>
      <p>Research Level rewards depend on completing available research tasks. Treat the listed level as the unlock requirement for that specific reward, not as a mandatory target for every phase.</p>
    </section>

    <section class="note-card">
      <h3>TM Catalogue</h3>
      <p>The catalogue covers base-game TM001–TM107. TMs are reusable. The location and unlock method describe where each TM is obtained; they do not guarantee compatibility with every Pokémon.</p>
    </section>

    <section class="note-card">
      <h3>DLC content</h3>
      <p>Mega Dimension content is kept in Phase 8. DLC Pokémon, forms, stones, orbs, and TMs should only be added after their corresponding mission or reward becomes available.</p>
    </section>

    <section class="note-card">
      <h3>Verification status</h3>
      <p>Some encounter, held-item, Mega Stone, move, and DLC details remain under verification. Check the audit status in the data file before treating an entry as final.</p>
    </section>
  `;
}

/* INITIALIZATION */

async function init() {
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Could not load data.json (${response.status})`);
    }

    DATA = await response.json();

    if (!Array.isArray(DATA.phases) || !DATA.phases.length) {
      throw new Error("The phase data is missing or invalid.");
    }

    activePhase = DATA.phases[0].id;

    renderPhases();
    renderTMCatalogue();
    renderResearchRewards();
    renderChecks();
    renderGuideNotes();

    wireTabs();
    wireTMControls();
    wireProgressControls();

    const year = $("#footerYear");
    if (year) {
      year.textContent = new Date().getFullYear();
    }

  } catch (error) {
    console.error(error);

    const root = $("#appError");

    if (root) {
      root.hidden = false;
      root.textContent =
        `The roadmap could not load. Check that data.json is valid JSON and is in the same folder as app.js. Details: ${error.message}`;
    }
  }
}

document.addEventListener("DOMContentLoaded", init);
