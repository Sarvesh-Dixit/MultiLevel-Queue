const { sortByArrivalThenId, buildMetrics, compressGantt } = require('../utils/helpers');

function runFCFS(processes) {
  const ordered = sortByArrivalThenId(processes);
  const completionTimes = {};
  const firstResponseTimes = {};
  const rawGantt = [];
  const steps = [];

  let time = 0;

  for (const process of ordered) {
    if (time < process.arrivalTime) {
      steps.push(`Time ${time}: CPU is idle until ${process.arrivalTime} because no process has arrived.`);
      rawGantt.push({ processId: 'IDLE', start: time, end: process.arrivalTime });
      time = process.arrivalTime;
    }

    firstResponseTimes[process.processId] = time;
    steps.push(
      `Time ${time}: ${process.processId} selected by FCFS because it is the earliest arrived unexecuted process.`
    );

    const start = time;
    const end = time + process.burstTime;
    rawGantt.push({ processId: process.processId, start, end });

    time = end;
    completionTimes[process.processId] = time;
    steps.push(`Time ${time}: ${process.processId} completed execution.`);
  }

  return {
    ganttChart: compressGantt(rawGantt),
    metrics: buildMetrics(processes, completionTimes, firstResponseTimes),
    steps
  };
}

module.exports = runFCFS;
