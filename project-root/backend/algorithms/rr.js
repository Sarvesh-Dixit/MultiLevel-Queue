const { buildMetrics, compressGantt, sortByArrivalThenId } = require('../utils/helpers');

function runRR(processes, timeQuantum = 2) {
  const ordered = sortByArrivalThenId(processes).map((p) => ({ ...p, remaining: p.burstTime }));
  const completionTimes = {};
  const firstResponseTimes = {};
  const rawGantt = [];
  const steps = [];

  const queue = [];
  let time = ordered[0]?.arrivalTime ?? 0;
  let completed = 0;
  let arrivalIndex = 0;

  while (completed < ordered.length) {
    while (arrivalIndex < ordered.length && ordered[arrivalIndex].arrivalTime <= time) {
      queue.push(ordered[arrivalIndex]);
      arrivalIndex += 1;
    }

    if (!queue.length) {
      if (arrivalIndex < ordered.length) {
        const nextArrival = ordered[arrivalIndex].arrivalTime;
        rawGantt.push({ processId: 'IDLE', start: time, end: nextArrival });
        steps.push(`Time ${time}: CPU idle until ${nextArrival} because RR ready queue is empty.`);
        time = nextArrival;
        continue;
      }
    }

    const current = queue.shift();
    if (firstResponseTimes[current.processId] === undefined) {
      firstResponseTimes[current.processId] = time;
    }

    const runTime = Math.min(current.remaining, timeQuantum);
    const start = time;
    const end = time + runTime;

    steps.push(
      `Time ${time}: ${current.processId} selected by RR and given a quantum of ${timeQuantum} (actual run ${runTime}).`
    );

    rawGantt.push({ processId: current.processId, start, end });
    current.remaining -= runTime;
    time = end;

    while (arrivalIndex < ordered.length && ordered[arrivalIndex].arrivalTime <= time) {
      queue.push(ordered[arrivalIndex]);
      arrivalIndex += 1;
    }

    if (current.remaining > 0) {
      steps.push(
        `Time ${time}: ${current.processId} is preempted after quantum expiry with ${current.remaining} burst time remaining.`
      );
      queue.push(current);
    } else {
      completionTimes[current.processId] = time;
      completed += 1;
      steps.push(`Time ${time}: ${current.processId} completed execution.`);
    }
  }

  return {
    ganttChart: compressGantt(rawGantt),
    metrics: buildMetrics(processes, completionTimes, firstResponseTimes),
    steps
  };
}

module.exports = runRR;
