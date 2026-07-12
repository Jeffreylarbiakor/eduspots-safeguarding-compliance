// charts.js
// Chart.js wrappers for the Overview view.
// Two charts:
//   1. Compliance rate by RC cluster (horizontal bar)
//   2. Training completions over last 12 months (line)

let clusterBarChart = null;
let completionLineChart = null;

// Shared chart defaults — forest/gold/sky/clay palette, Space Grotesk labels
const CHART_DEFAULTS = {
  font: {
    family: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
    size: 12,
  },
  color: "#6B6558",
};

Chart.defaults.font.family = CHART_DEFAULTS.font.family;
Chart.defaults.font.size   = CHART_DEFAULTS.font.size;
Chart.defaults.color       = CHART_DEFAULTS.color;

// ── 1. Compliance by RC cluster (horizontal bar) ─────────────────────────────
function renderClusterBarChart(catalysts) {
  const ctx = document.getElementById("chart-cluster-bar").getContext("2d");

  // Aggregate per RC
  const rcData = {};
  REAL_REGIONAL_COORDINATORS.forEach(rc => {
    rcData[rc.id] = { name: rc.name.split(" ").slice(-1)[0], total: 0, compliant: 0 };
  });

  catalysts.forEach(c => {
    if (!rcData[c.rcId]) return;
    rcData[c.rcId].total++;
    if (c.status === "compliant") rcData[c.rcId].compliant++;
  });

  const labels = REAL_REGIONAL_COORDINATORS.map(rc => rcData[rc.id].name);
  const rates  = REAL_REGIONAL_COORDINATORS.map(rc => {
    const d = rcData[rc.id];
    return d.total > 0 ? Math.round((d.compliant / d.total) * 100) : 0;
  });

  if (clusterBarChart) clusterBarChart.destroy();

  clusterBarChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Compliance rate (%)",
        data: rates,
        backgroundColor: rates.map(r =>
          r >= 85 ? "rgba(18,53,36,0.75)"   // forest — healthy
          : r >= 70 ? "rgba(217,166,46,0.8)" // gold — caution
          : "rgba(181,72,52,0.8)"            // clay — overdue concern
        ),
        borderColor: rates.map(r =>
          r >= 85 ? "#123524" : r >= 70 ? "#D9A62E" : "#B54834"
        ),
        borderWidth: 1,
        borderRadius: 3,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.x}% compliant`,
          },
        },
      },
      scales: {
        x: {
          min: 0,
          max: 100,
          grid: { color: "rgba(26,26,22,0.06)" },
          ticks: {
            callback: v => v + "%",
          },
        },
        y: {
          grid: { display: false },
        },
      },
    },
  });
}

// ── 2. Training completions — last 12 months (line) ──────────────────────────
function renderCompletionLineChart(catalysts) {
  const ctx = document.getElementById("chart-completion-line").getContext("2d");

  // Build month buckets: last 12 calendar months ending at TODAY
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(TODAY);
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push({
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
      count: 0,
    });
  }

  // Count completions per month (current + history)
  catalysts.forEach(c => {
    const allDates = [c.completionDate, ...c.trainingHistory];
    allDates.forEach(dateStr => {
      const key = dateStr.slice(0, 7);
      const bucket = months.find(m => m.key === key);
      if (bucket) bucket.count++;
    });
  });

  if (completionLineChart) completionLineChart.destroy();

  completionLineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: months.map(m => m.label),
      datasets: [{
        label: "Completions",
        data: months.map(m => m.count),
        borderColor: "#3E7CB1",
        backgroundColor: "rgba(62,124,177,0.10)",
        borderWidth: 2,
        pointBackgroundColor: "#3E7CB1",
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.y} completion${ctx.parsed.y !== 1 ? "s" : ""}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(26,26,22,0.06)" },
        },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(26,26,22,0.06)" },
          ticks: { precision: 0 },
        },
      },
    },
  });
}

function renderCharts(catalysts) {
  renderClusterBarChart(catalysts);
  renderCompletionLineChart(catalysts);
}
