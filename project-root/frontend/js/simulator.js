let ganttChartInstance = null;
let animationTimer = null;

const processTableBody = document.getElementById('processTableBody');
const algorithmSelect = document.getElementById('algorithmSelect');
const timeQuantumInput = document.getElementById('timeQuantum');
const queueConfigInput = document.getElementById('mlqQueueConfig');
const metricsBody = document.getElementById('metricsBody');
const stepsList = document.getElementById('stepsList');
const avgWT = document.getElementById('avgWT');
const avgTAT = document.getElementById('avgTAT');
const errorBox = document.getElementById('errorBox');
const currentExecution = document.getElementById('currentExecution');

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove('hidden');
}

function clearError() {
  errorBox.textContent = '';
  errorBox.classList.add('hidden');
}

function createProcessRow(data = {}) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="p-2"><input class="w-full border rounded p-2" value="${data.processId || ''}" placeholder="P1" /></td>
    <td class="p-2"><input type="number" min="0" class="w-full border rounded p-2" value="${data.arrivalTime ?? 0}" /></td>
    <td class="p-2"><input type="number" min="1" class="w-full border rounded p-2" value="${data.burstTime ?? 1}" /></td>
    <td class="p-2"><input type="number" min="1" class="w-full border rounded p-2" value="${data.queueNumber ?? 1}" /></td>
    <td class="p-2"><input type="number" min="1" class="w-full border rounded p-2" value="${data.priority ?? ''}" placeholder="Optional" /></td>
  `;
  processTableBody.appendChild(tr);
}

function extractProcesses() {
  const rows = [...processTableBody.querySelectorAll('tr')];
  if (!rows.length) {
    throw new Error('Please add at least one process.');
  }

  const processes = rows.map((row, index) => {
    const inputs = row.querySelectorAll('input');
    const processId = inputs[0].value.trim() || `P${index + 1}`;
    const arrivalTime = Number(inputs[1].value);
    const burstTime = Number(inputs[2].value);
    const queueNumber = Number(inputs[3].value || 1);
    const priorityRaw = inputs[4].value;
    const priority = priorityRaw === '' ? undefined : Number(priorityRaw);

    if (!Number.isFinite(arrivalTime) || arrivalTime < 0) {
      throw new Error(`Invalid arrival time for ${processId}.`);
    }
    if (!Number.isFinite(burstTime) || burstTime <= 0) {
      throw new Error(`Invalid burst time for ${processId}.`);
    }
    if (!Number.isFinite(queueNumber) || queueNumber <= 0) {
      throw new Error(`Invalid queue number for ${processId}.`);
    }

    return {
      processId,
      arrivalTime,
      burstTime,
      queueNumber,
      ...(priority !== undefined ? { priority } : {})
    };
  });

  return processes;
}

function parseMLQConfig() {
  try {
    const value = queueConfigInput.value.trim();
    if (!value) return undefined;
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error();
    return parsed;
  } catch (err) {
    throw new Error('MLQ queue configuration must be valid JSON array.');
  }
}

function renderMetrics(metrics) {
  metricsBody.innerHTML = '';

  for (let i = 0; i < metrics.waitingTime.length; i += 1) {
    const wt = metrics.waitingTime[i];
    const tat = metrics.turnaroundTime.find((item) => item.processId === wt.processId);
    const rt = metrics.responseTime.find((item) => item.processId === wt.processId);

    const tr = document.createElement('tr');
    tr.className = 'border-b';
    tr.innerHTML = `
      <td class="p-2 mono">${wt.processId}</td>
      <td class="p-2">${wt.value}</td>
      <td class="p-2">${tat ? tat.value : '-'}</td>
      <td class="p-2">${rt ? rt.value : '-'}</td>
    `;
    metricsBody.appendChild(tr);
  }

  avgWT.textContent = `Average WT: ${metrics.averageWT}`;
  avgTAT.textContent = `Average TAT: ${metrics.averageTAT}`;
}

function renderSteps(steps) {
  stepsList.innerHTML = '';
  steps.forEach((step, index) => {
    const li = document.createElement('li');
    li.className = 'step-item py-1';
    li.textContent = `${index + 1}. ${step}`;
    stepsList.appendChild(li);
  });
}

function drawAnimatedGantt(ganttData) {
  if (animationTimer) {
    clearInterval(animationTimer);
  }

  const ctx = document.getElementById('ganttCanvas');

  if (ganttChartInstance) {
    ganttChartInstance.destroy();
  }

  const colors = ['#264653', '#2a9d8f', '#e76f51', '#f4a261', '#e9c46a', '#bc4749', '#5f0f40'];
  const processColorMap = {};

  let colorIndex = 0;
  for (const segment of ganttData) {
    if (!processColorMap[segment.processId]) {
      processColorMap[segment.processId] = segment.processId === 'IDLE' ? '#9ca3af' : colors[colorIndex++ % colors.length];
    }
  }

  ganttChartInstance = new Chart(ctx, {
    type: 'bar',
    plugins: [ChartDataLabels],
    data: {
      datasets: [
        {
          label: 'Timeline',
          data: [],
          parsing: { xAxisKey: 'range', yAxisKey: 'lane' },
          backgroundColor: [],
          borderRadius: 6,
          borderSkipped: false,
          barPercentage: 0.7,
          categoryPercentage: 0.9
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 300
      },
      plugins: {
        tooltip: {
          callbacks: {
            label(context) {
              const item = context.raw;
              return `${item.processId}: ${item.range[0]} -> ${item.range[1]}`;
            }
          }
        },
        legend: { display: false }
        ,
        datalabels: {
          display(context) {
            const raw = context.raw;
            if (!raw || !raw.range || raw.range.length !== 2) return false;

            const xScale = context.chart.scales.x;
            const startPx = xScale.getPixelForValue(raw.range[0]);
            const endPx = xScale.getPixelForValue(raw.range[1]);
            const segmentWidth = Math.abs(endPx - startPx);

            // Keep labels only when there is enough room to render text clearly.
            return segmentWidth >= 26;
          },
          formatter(value) {
            return value.processId;
          },
          color(context) {
            return context.raw.processId === 'IDLE' ? '#111827' : '#ffffff';
          },
          font: {
            weight: '700',
            size: 11
          },
          anchor: 'center',
          align: 'center',
          clip: true
        }
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Time' }
        },
        y: {
          title: { display: true, text: 'CPU Lane' }
        }
      }
    }
  });

  let index = 0;
  animationTimer = setInterval(() => {
    if (index >= ganttData.length) {
      clearInterval(animationTimer);
      return;
    }

    const segment = ganttData[index];
    const dataset = ganttChartInstance.data.datasets[0];
    dataset.data.push({ lane: 'CPU', processId: segment.processId, range: [segment.start, segment.end] });
    dataset.backgroundColor.push(processColorMap[segment.processId]);
    ganttChartInstance.update();

    currentExecution.textContent = `Now visualized: ${segment.processId} (${segment.start} -> ${segment.end})`;
    index += 1;
  }, 420);
}

async function solve() {
  clearError();

  try {
    const algorithm = algorithmSelect.value;
    const processes = extractProcesses();
    const timeQuantum = Number(timeQuantumInput.value || 2);

    let endpoint = '/simulate/mlq';
    const payload = { processes, timeQuantum };

    if (algorithm === 'fcfs') endpoint = '/simulate/fcfs';
    if (algorithm === 'sjf') endpoint = '/simulate/sjf';
    if (algorithm === 'rr') endpoint = '/simulate/rr';
    if (algorithm === 'mlq') {
      payload.queues = parseMLQConfig();
    }

    const result = await postJSON(endpoint, payload);
    drawAnimatedGantt(result.ganttChart);
    renderMetrics(result.metrics);
    renderSteps(result.steps);
  } catch (error) {
    showError(error.message || 'Failed to simulate.');
  }
}

async function loadSample() {
  clearError();
  try {
    const response = await fetch('data/sample-data.json');
    const sample = await response.json();

    processTableBody.innerHTML = '';
    sample.processes.forEach((p) => createProcessRow(p));
    queueConfigInput.value = JSON.stringify(sample.queues, null, 2);
    timeQuantumInput.value = sample.timeQuantum || 2;
  } catch (error) {
    showError('Unable to load sample data.');
  }
}

document.getElementById('addProcessBtn').addEventListener('click', () => createProcessRow());
document.getElementById('removeProcessBtn').addEventListener('click', () => {
  const rows = processTableBody.querySelectorAll('tr');
  if (rows.length > 1) rows[rows.length - 1].remove();
});
document.getElementById('solveBtn').addEventListener('click', solve);
document.getElementById('loadSampleBtn').addEventListener('click', loadSample);

createProcessRow({ processId: 'P1', arrivalTime: 0, burstTime: 5, queueNumber: 1 });
createProcessRow({ processId: 'P2', arrivalTime: 1, burstTime: 3, queueNumber: 1 });
createProcessRow({ processId: 'P3', arrivalTime: 2, burstTime: 8, queueNumber: 2 });
