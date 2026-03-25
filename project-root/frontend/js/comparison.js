let wtChartInstance = null;
let tatChartInstance = null;

const cmpTableBody = document.getElementById('cmpProcessTableBody');
const cmpErrorBox = document.getElementById('cmpErrorBox');
const cmpResultBody = document.getElementById('cmpResultBody');

function showCmpError(message) {
  cmpErrorBox.textContent = message;
  cmpErrorBox.classList.remove('hidden');
}

function clearCmpError() {
  cmpErrorBox.textContent = '';
  cmpErrorBox.classList.add('hidden');
}

function addCmpRow(data = {}) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="p-2"><input class="w-full border rounded p-2" value="${data.processId || ''}" placeholder="P1" /></td>
    <td class="p-2"><input type="number" min="0" class="w-full border rounded p-2" value="${data.arrivalTime ?? 0}" /></td>
    <td class="p-2"><input type="number" min="1" class="w-full border rounded p-2" value="${data.burstTime ?? 1}" /></td>
    <td class="p-2"><input type="number" min="1" class="w-full border rounded p-2" value="${data.queueNumber ?? 1}" /></td>
    <td class="p-2"><input type="number" min="1" class="w-full border rounded p-2" value="${data.priority ?? ''}" placeholder="Optional" /></td>
  `;
  cmpTableBody.appendChild(tr);
}

function extractCmpProcesses() {
  const rows = [...cmpTableBody.querySelectorAll('tr')];
  if (!rows.length) throw new Error('Please add at least one process.');

  return rows.map((row, index) => {
    const inputs = row.querySelectorAll('input');
    const processId = inputs[0].value.trim() || `P${index + 1}`;
    const arrivalTime = Number(inputs[1].value);
    const burstTime = Number(inputs[2].value);
    const queueNumber = Number(inputs[3].value || 1);
    const priorityRaw = inputs[4].value;

    if (!Number.isFinite(arrivalTime) || arrivalTime < 0) {
      throw new Error(`Invalid arrival time for ${processId}.`);
    }
    if (!Number.isFinite(burstTime) || burstTime <= 0) {
      throw new Error(`Invalid burst time for ${processId}.`);
    }

    return {
      processId,
      arrivalTime,
      burstTime,
      queueNumber,
      ...(priorityRaw ? { priority: Number(priorityRaw) } : {})
    };
  });
}

function renderComparisonTable(summary) {
  cmpResultBody.innerHTML = '';

  for (const item of summary) {
    const tr = document.createElement('tr');
    tr.className = 'border-b';
    tr.innerHTML = `
      <td class="p-2 font-semibold">${item.algorithm}</td>
      <td class="p-2">${item.averageWT}</td>
      <td class="p-2">${item.averageTAT}</td>
    `;
    cmpResultBody.appendChild(tr);
  }
}

function renderBarCharts(summary) {
  const labels = summary.map((s) => s.algorithm);
  const wtValues = summary.map((s) => s.averageWT);
  const tatValues = summary.map((s) => s.averageTAT);

  if (wtChartInstance) wtChartInstance.destroy();
  if (tatChartInstance) tatChartInstance.destroy();

  wtChartInstance = new Chart(document.getElementById('wtChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Average WT',
          data: wtValues,
          backgroundColor: ['#264653', '#2a9d8f', '#e76f51', '#e9c46a']
        }
      ]
    },
    options: {
      responsive: true,
      animation: { duration: 700 },
      plugins: { legend: { display: false } }
    }
  });

  tatChartInstance = new Chart(document.getElementById('tatChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Average TAT',
          data: tatValues,
          backgroundColor: ['#bc4749', '#f4a261', '#6c757d', '#457b9d']
        }
      ]
    },
    options: {
      responsive: true,
      animation: { duration: 700 },
      plugins: { legend: { display: false } }
    }
  });
}

async function runComparison() {
  clearCmpError();
  try {
    const processes = extractCmpProcesses();
    const timeQuantum = Number(document.getElementById('cmpTimeQuantum').value || 2);

    const payload = {
      processes,
      timeQuantum,
      queues: [
        { queueNumber: 1, priority: 1, algorithm: 'RR', quantum: timeQuantum },
        { queueNumber: 2, priority: 2, algorithm: 'FCFS' }
      ]
    };

    const result = await postJSON('/compare', payload);
    renderComparisonTable(result.summary);
    renderBarCharts(result.summary);
  } catch (error) {
    showCmpError(error.message || 'Failed to run comparison.');
  }
}

async function loadCmpSample() {
  clearCmpError();
  try {
    const response = await fetch('data/sample-data.json');
    const sample = await response.json();

    cmpTableBody.innerHTML = '';
    sample.processes.forEach((p) => addCmpRow(p));
    document.getElementById('cmpTimeQuantum').value = sample.timeQuantum || 2;
  } catch (error) {
    showCmpError('Unable to load sample data.');
  }
}

document.getElementById('cmpAddProcess').addEventListener('click', () => addCmpRow());
document.getElementById('cmpRemoveProcess').addEventListener('click', () => {
  const rows = cmpTableBody.querySelectorAll('tr');
  if (rows.length > 1) rows[rows.length - 1].remove();
});
document.getElementById('cmpRunBtn').addEventListener('click', runComparison);
document.getElementById('cmpLoadSample').addEventListener('click', loadCmpSample);

addCmpRow({ processId: 'P1', arrivalTime: 0, burstTime: 5, queueNumber: 1 });
addCmpRow({ processId: 'P2', arrivalTime: 1, burstTime: 3, queueNumber: 1 });
addCmpRow({ processId: 'P3', arrivalTime: 2, burstTime: 8, queueNumber: 2 });
