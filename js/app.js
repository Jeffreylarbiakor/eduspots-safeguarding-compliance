// app.js
// Rendering, navigation, filters, modal, and all view logic.
// Depends on: real-data.js, data.js, charts.js

// ── State ────────────────────────────────────────────────────────────────────
let currentView   = "overview";
let rosterFilter  = { rc: "all", status: "all" };
let activeModal   = null;

// ── Nav ──────────────────────────────────────────────────────────────────────
function setView(view) {
  currentView = view;

  // Update nav active state
  document.querySelectorAll(".nav-link").forEach(el => {
    el.classList.toggle("active", el.dataset.view === view);
  });

  // Show/hide views
  document.querySelectorAll(".view").forEach(el => {
    el.classList.toggle("hidden", el.id !== `view-${view}`);
  });

  renderCurrentView();
}

function renderCurrentView() {
  switch (currentView) {
    case "overview":   renderOverview();   break;
    case "roster":     renderRoster();     break;
    case "clusters":   renderClusters();   break;
    case "reminders":  renderReminders();  break;
  }
}

// ── KPI helpers ──────────────────────────────────────────────────────────────
function getKPIs(catalysts) {
  const total      = catalysts.length;
  const compliant  = catalysts.filter(c => c.status === "compliant").length;
  const expiringSoon = catalysts.filter(c => c.status === "expiring-soon").length;
  const overdue    = catalysts.filter(c => c.status === "overdue").length;
  const pct        = total > 0 ? Math.round((compliant / total) * 100) : 0;

  // Average days-to-renewal-after-expiry (overdue catalysts only)
  const overdueList = catalysts.filter(c => c.status === "overdue");
  const avgOverdueDays = overdueList.length > 0
    ? Math.round(overdueList.reduce((sum, c) => sum + Math.abs(c.daysUntilExpiry), 0) / overdueList.length)
    : 0;

  return { total, compliant, expiringSoon, overdue, pct, avgOverdueDays };
}

// ── Overview view ─────────────────────────────────────────────────────────────
function renderOverview() {
  const kpis = getKPIs(CATALYSTS);

  document.getElementById("kpi-total").textContent      = kpis.total;
  document.getElementById("kpi-pct").textContent        = kpis.pct + "%";
  document.getElementById("kpi-expiring").textContent   = kpis.expiringSoon;
  document.getElementById("kpi-overdue").textContent    = kpis.overdue;
  document.getElementById("kpi-avg-days").textContent   = kpis.avgOverdueDays > 0
    ? kpis.avgOverdueDays + "d" : "—";

  renderCharts(CATALYSTS);
}

// ── Roster view ───────────────────────────────────────────────────────────────
function renderRoster() {
  const rcSelect     = document.getElementById("filter-rc");
  const statusSelect = document.getElementById("filter-status");

  // Populate RC filter if empty
  if (rcSelect.options.length <= 1) {
    REAL_REGIONAL_COORDINATORS.forEach(rc => {
      const opt = document.createElement("option");
      opt.value       = rc.id;
      opt.textContent = rc.name;
      rcSelect.appendChild(opt);
    });
  }

  const filtered = CATALYSTS.filter(c => {
    const rcMatch     = rosterFilter.rc     === "all" || c.rcId   === rosterFilter.rc;
    const statusMatch = rosterFilter.status === "all" || c.status === rosterFilter.status;
    return rcMatch && statusMatch;
  });

  const tbody = document.getElementById("roster-tbody");
  tbody.innerHTML = "";

  filtered.forEach(c => {
    const rc  = REAL_REGIONAL_COORDINATORS.find(r => r.id === c.rcId);
    const tr  = document.createElement("tr");
    tr.dataset.id = c.id;
    tr.innerHTML = `
      <td class="td-name">${escHtml(c.name)}</td>
      <td>${escHtml(c.spotName)}</td>
      <td>${escHtml(rc ? rc.name : "—")}</td>
      <td class="td-mono">${formatDate(c.completionDate)}</td>
      <td class="td-mono">${formatDate(c.expiryDate)}</td>
      <td><span class="badge badge-${c.status}">${statusLabel(c.status)}</span></td>
    `;
    tr.addEventListener("click", () => openModal(c.id));
    tbody.appendChild(tr);
  });

  document.getElementById("roster-count").textContent =
    `${filtered.length} of ${CATALYSTS.length} Catalysts`;
}

// ── Clusters view ─────────────────────────────────────────────────────────────
function renderClusters() {
  const tbody = document.getElementById("clusters-tbody");
  tbody.innerHTML = "";

  REAL_REGIONAL_COORDINATORS.forEach(rc => {
    const group = CATALYSTS.filter(c => c.rcId === rc.id);
    const total       = group.length;
    const compliant   = group.filter(c => c.status === "compliant").length;
    const expiring    = group.filter(c => c.status === "expiring-soon").length;
    const overdue     = group.filter(c => c.status === "overdue").length;
    const pct         = total > 0 ? Math.round((compliant / total) * 100) : 0;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="td-rc-name">${escHtml(rc.name)}</td>
      <td class="td-region">${escHtml(rc.region)}</td>
      <td class="td-num">${total}</td>
      <td class="td-num td-compliant">${compliant}</td>
      <td class="td-num td-expiring"><span class="badge badge-expiring-soon">${expiring}</span></td>
      <td class="td-num td-overdue"><span class="badge badge-overdue">${overdue}</span></td>
      <td class="td-num">
        <span class="pct-pill pct-pill--${pct >= 85 ? "good" : pct >= 70 ? "warn" : "bad"}">${pct}%</span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ── Reminders view ────────────────────────────────────────────────────────────
function renderReminders() {
  const flagged = CATALYSTS.filter(
    c => c.status === "overdue" || c.status === "expiring-soon"
  ).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry); // worst first

  const container = document.getElementById("reminders-list");
  container.innerHTML = "";

  if (flagged.length === 0) {
    container.innerHTML = `<p class="empty-state">No Catalysts require follow-up at this time.</p>`;
    return;
  }

  document.getElementById("reminders-count").textContent =
    `${flagged.length} Catalyst${flagged.length !== 1 ? "s" : ""} require follow-up`;

  flagged.forEach(c => {
    const rc  = REAL_REGIONAL_COORDINATORS.find(r => r.id === c.rcId);
    const ackd = isAcknowledged(c.id);

    const card = document.createElement("div");
    card.className = `reminder-card reminder-card--${c.status}${ackd ? " reminder-card--ackd" : ""}`;
    card.id = `reminder-${c.id}`;
    card.innerHTML = `
      <div class="reminder-main">
        <div class="reminder-header">
          <span class="reminder-name">${escHtml(c.name)}</span>
          <span class="badge badge-${c.status}">${statusLabel(c.status)}</span>
        </div>
        <div class="reminder-meta">
          <span>${escHtml(c.spotName)}</span>
          <span class="sep">·</span>
          <span>RC: ${escHtml(rc ? rc.name : "—")}</span>
        </div>
        <p class="reminder-reason">${escHtml(c.reason)}</p>
        <p class="reminder-expiry">Expiry date: <span class="mono">${formatDate(c.expiryDate)}</span></p>
      </div>
      <div class="reminder-action">
        ${ackd
          ? `<span class="ack-done">✓ Reminder sent to RC</span>`
          : `<button class="btn-ack" data-id="${c.id}">Acknowledge — reminder sent</button>`
        }
        <p class="ack-note">Logging this acknowledges that an RC has been notified. It does not change this Catalyst's compliance status — only a completed training event can do that.</p>
      </div>
    `;
    container.appendChild(card);
  });

  // Bind acknowledge buttons
  container.querySelectorAll(".btn-ack").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      acknowledgeReminder(id);
      renderReminders();
    });
  });
}

// ── Detail modal ──────────────────────────────────────────────────────────────
function openModal(catalystId) {
  const c  = CATALYSTS.find(x => x.id === catalystId);
  if (!c) return;
  const rc = REAL_REGIONAL_COORDINATORS.find(r => r.id === c.rcId);

  document.getElementById("modal-name").textContent   = c.name;
  document.getElementById("modal-spot").textContent   = c.spotName;
  document.getElementById("modal-rc").textContent     = rc ? rc.name : "—";
  document.getElementById("modal-region").textContent = rc ? rc.region : "—";
  document.getElementById("modal-status").innerHTML   =
    `<span class="badge badge-${c.status}">${statusLabel(c.status)}</span>`;
  document.getElementById("modal-expiry").textContent = formatDate(c.expiryDate);

  // Training history list (completion dates only — nothing else)
  const histEl = document.getElementById("modal-history");
  histEl.innerHTML = "";

  const allDates = [...c.trainingHistory, c.completionDate]
    .sort()
    .reverse();

  allDates.forEach((dateStr, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="mono">Trained: ${formatDate(dateStr)}</span>${i === 0 ? " <span class='current-tag'>current</span>" : ""}`;
    histEl.appendChild(li);
  });

  if (c.reason) {
    document.getElementById("modal-reason").textContent = c.reason;
    document.getElementById("modal-reason-row").classList.remove("hidden");
  } else {
    document.getElementById("modal-reason-row").classList.add("hidden");
  }

  document.getElementById("modal-overlay").classList.remove("hidden");
  document.getElementById("modal-overlay").setAttribute("aria-hidden", "false");
  activeModal = catalystId;
}

function closeModal() {
  document.getElementById("modal-overlay").classList.add("hidden");
  document.getElementById("modal-overlay").setAttribute("aria-hidden", "true");
  activeModal = null;
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(isoStr) {
  if (!isoStr) return "—";
  const d = new Date(isoStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function statusLabel(status) {
  return { compliant: "Compliant", "expiring-soon": "Expiring soon", overdue: "Overdue" }[status] || status;
}

// ── Event wiring ──────────────────────────────────────────────────────────────
function initEventListeners() {
  // Nav links
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      setView(link.dataset.view);
    });
  });

  // Roster filters
  document.getElementById("filter-rc").addEventListener("change", e => {
    rosterFilter.rc = e.target.value;
    renderRoster();
  });
  document.getElementById("filter-status").addEventListener("change", e => {
    rosterFilter.status = e.target.value;
    renderRoster();
  });

  // Modal close
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("modal-overlay").addEventListener("click", e => {
    if (e.target === document.getElementById("modal-overlay")) closeModal();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && activeModal) closeModal();
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initEventListeners();
  setView("overview");
});
