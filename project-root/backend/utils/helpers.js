function sortByArrivalThenId(processes) {
  return [...processes].sort((a, b) => {
    if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
    return String(a.processId).localeCompare(String(b.processId));
  });
}

function compressGantt(rawGantt) {
  if (!rawGantt.length) return [];
  const compressed = [rawGantt[0]];

  for (let i = 1; i < rawGantt.length; i += 1) {
    const prev = compressed[compressed.length - 1];
    const current = rawGantt[i];

    if (prev.processId === current.processId && prev.end === current.start) {
      prev.end = current.end;
    } else {
      compressed.push({ ...current });
    }
  }

  return compressed;
}

function buildMetrics(processes, completionTimes, firstResponseTimes) {
  const waitingTime = [];
  const turnaroundTime = [];
  const responseTime = [];

  let totalWT = 0;
  let totalTAT = 0;

  for (const process of processes) {
    const completion = completionTimes[process.processId];
    const tat = completion - process.arrivalTime;
    const wt = tat - process.burstTime;
    const rt = firstResponseTimes[process.processId] - process.arrivalTime;

    waitingTime.push({ processId: process.processId, value: wt });
    turnaroundTime.push({ processId: process.processId, value: tat });
    responseTime.push({ processId: process.processId, value: rt });

    totalWT += wt;
    totalTAT += tat;
  }

  return {
    waitingTime,
    turnaroundTime,
    responseTime,
    averageWT: Number((totalWT / processes.length).toFixed(2)),
    averageTAT: Number((totalTAT / processes.length).toFixed(2))
  };
}

module.exports = {
  sortByArrivalThenId,
  compressGantt,
  buildMetrics
};
