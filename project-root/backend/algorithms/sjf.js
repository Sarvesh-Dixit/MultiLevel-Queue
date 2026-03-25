const { buildMetrics, compressGantt } = require('../utils/helpers');

function pickShortestAvailable(processes, completed, time) {
  let chosen = null;

  for (const p of processes) {
    if (completed.has(p.processId)) continue;
    if (p.arrivalTime > time) continue;

    if (
      !chosen ||
      p.burstTime < chosen.burstTime ||
      (p.burstTime === chosen.burstTime && p.arrivalTime < chosen.arrivalTime) ||
      (p.burstTime === chosen.burstTime && p.arrivalTime === chosen.arrivalTime && String(p.processId) < String(chosen.processId))
    ) {
      chosen = p;
    }
  }

  return chosen;
}

function runSJF(processes) {
  const completionTimes = {};
  const firstResponseTimes = {};
  const completed = new Set();
  const rawGantt = [];
  const steps = [];

  let time = 0;

  while (completed.size < processes.length) {
    const nextProcess = pickShortestAvailable(processes, completed, time);

    if (!nextProcess) {
      const nextArrival = Math.min(...processes.filter((p) => !completed.has(p.processId)).map((p) => p.arrivalTime));
      steps.push(`Time ${time}: CPU idle until ${nextArrival} because no available process has arrived.`);
      rawGantt.push({ processId: 'IDLE', start: time, end: nextArrival });
      time = nextArrival;
      continue;
    }

    if (firstResponseTimes[nextProcess.processId] === undefined) {
      firstResponseTimes[nextProcess.processId] = time;
    }

    steps.push(
      `Time ${time}: ${nextProcess.processId} selected by SJF because it has the smallest burst time among ready processes.`
    );

    const start = time;
    const end = time + nextProcess.burstTime;
    rawGantt.push({ processId: nextProcess.processId, start, end });

    time = end;
    completionTimes[nextProcess.processId] = time;
    completed.add(nextProcess.processId);
    steps.push(`Time ${time}: ${nextProcess.processId} completed execution.`);
  }

  return {
    ganttChart: compressGantt(rawGantt),
    metrics: buildMetrics(processes, completionTimes, firstResponseTimes),
    steps
  };
}

module.exports = runSJF;
