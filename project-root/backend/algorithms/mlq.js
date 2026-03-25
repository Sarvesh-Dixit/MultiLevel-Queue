const { buildMetrics, compressGantt } = require('../utils/helpers');

function runMLQ(processes, queues) {
  const state = processes.map((p) => ({ ...p, remaining: p.burstTime }));
  const completionTimes = {};
  const firstResponseTimes = {};
  const rawGantt = [];
  const steps = [];

  const queueConfig = [...queues].sort((a, b) => a.priority - b.priority);
  const queueMap = Object.fromEntries(queueConfig.map((q) => [q.queueNumber, q]));
  const rrState = {};

  for (const q of queueConfig) {
    if (q.algorithm === 'RR') {
      rrState[q.queueNumber] = { ready: [], running: null, quantumUsed: 0 };
    }
  }

  let time = Math.min(...state.map((p) => p.arrivalTime));
  let completed = 0;
  let current = null;

  function isQueueAvailable(queueNumber) {
    const cfg = queueMap[queueNumber];
    if (!cfg) return false;

    if (cfg.algorithm === 'RR') {
      const rr = rrState[queueNumber];
      return rr.ready.length > 0 || rr.running !== null;
    }

    return state.some((p) => p.queueNumber === queueNumber && p.arrivalTime <= time && p.remaining > 0);
  }

  function selectFromQueue(queueNumber) {
    const cfg = queueMap[queueNumber];

    if (cfg.algorithm === 'RR') {
      const rr = rrState[queueNumber];
      if (rr.running !== null) {
        return rr.running;
      }
      rr.running = rr.ready.shift();
      rr.quantumUsed = 0;
      return rr.running;
    }

    if (current && current.queueNumber === queueNumber && current.remaining > 0) {
      return current;
    }

    const candidates = state.filter(
      (p) => p.queueNumber === queueNumber && p.arrivalTime <= time && p.remaining > 0
    );

    if (!candidates.length) return null;

    if (cfg.algorithm === 'SJF') {
      candidates.sort((a, b) => {
        if (a.remaining !== b.remaining) return a.remaining - b.remaining;
        if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
        return String(a.processId).localeCompare(String(b.processId));
      });
      return candidates[0];
    }

    candidates.sort((a, b) => {
      if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
      return String(a.processId).localeCompare(String(b.processId));
    });

    return candidates[0];
  }

  function enqueueArrivals(currentTime) {
    for (const p of state) {
      const cfg = queueMap[p.queueNumber];
      if (!cfg || cfg.algorithm !== 'RR') continue;

      const rr = rrState[p.queueNumber];
      const alreadyQueued = rr.ready.includes(p);
      const isRunning = rr.running === p;

      if (p.arrivalTime <= currentTime && p.remaining > 0 && !alreadyQueued && !isRunning) {
        rr.ready.push(p);
      }
    }
  }

  while (completed < state.length) {
    enqueueArrivals(time);

    let activeQueue = null;
    for (const q of queueConfig) {
      if (isQueueAvailable(q.queueNumber)) {
        activeQueue = q;
        break;
      }
    }

    if (!activeQueue) {
      rawGantt.push({ processId: 'IDLE', start: time, end: time + 1 });
      steps.push(`Time ${time}: CPU idle because no process is available in any queue.`);
      time += 1;
      continue;
    }

    if (current && current.queueNumber !== activeQueue.queueNumber) {
      const currentCfg = queueMap[current.queueNumber];
      const oldPriority = currentCfg?.priority ?? Number.MAX_SAFE_INTEGER;
      if (activeQueue.priority < oldPriority) {
        if (currentCfg?.algorithm === 'RR') {
          const rr = rrState[current.queueNumber];
          if (rr.running === current) {
            rr.ready.push(current);
            rr.running = null;
            rr.quantumUsed = 0;
          }
        }
        steps.push(
          `Time ${time}: ${current.processId} preempted because a higher-priority queue (${activeQueue.queueNumber}) became available.`
        );
        current = null;
      }
    }

    const selected = selectFromQueue(activeQueue.queueNumber);

    if (!selected) {
      rawGantt.push({ processId: 'IDLE', start: time, end: time + 1 });
      time += 1;
      continue;
    }

    if (firstResponseTimes[selected.processId] === undefined) {
      firstResponseTimes[selected.processId] = time;
    }

    if (!current || current.processId !== selected.processId) {
      steps.push(
        `Time ${time}: ${selected.processId} selected from Queue ${selected.queueNumber} (${activeQueue.algorithm}) because it is in the highest-priority non-empty queue.`
      );
    }

    rawGantt.push({ processId: selected.processId, start: time, end: time + 1 });
    selected.remaining -= 1;
    time += 1;
    current = selected;

    if (activeQueue.algorithm === 'RR') {
      const rr = rrState[activeQueue.queueNumber];
      rr.quantumUsed += 1;

      if (selected.remaining <= 0) {
        rr.running = null;
        rr.quantumUsed = 0;
      } else if (rr.quantumUsed >= activeQueue.quantum) {
        rr.ready.push(selected);
        rr.running = null;
        rr.quantumUsed = 0;
        steps.push(
          `Time ${time}: ${selected.processId} moved to end of Queue ${selected.queueNumber} after RR quantum ${activeQueue.quantum}.`
        );
        current = null;
      }
    }

    if (selected.remaining <= 0) {
      completionTimes[selected.processId] = time;
      completed += 1;
      steps.push(`Time ${time}: ${selected.processId} completed execution.`);

      if (current && current.processId === selected.processId) {
        current = null;
      }
    }
  }

  return {
    ganttChart: compressGantt(rawGantt),
    metrics: buildMetrics(processes, completionTimes, firstResponseTimes),
    steps
  };
}

module.exports = runMLQ;
