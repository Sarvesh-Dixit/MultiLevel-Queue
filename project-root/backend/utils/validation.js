function normalizeProcesses(processes) {
  return processes.map((p, index) => ({
    processId: String(p.processId || `P${index + 1}`),
    arrivalTime: Number(p.arrivalTime),
    burstTime: Number(p.burstTime),
    queueNumber: p.queueNumber !== undefined ? Number(p.queueNumber) : 1,
    priority: p.priority !== undefined ? Number(p.priority) : null
  }));
}

function validateSimulationInput(body) {
  if (!body || !Array.isArray(body.processes) || body.processes.length === 0) {
    return { valid: false, message: 'A non-empty processes array is required.' };
  }

  const processes = normalizeProcesses(body.processes);

  for (const p of processes) {
    if (!Number.isFinite(p.arrivalTime) || p.arrivalTime < 0) {
      return { valid: false, message: `Invalid arrivalTime for ${p.processId}.` };
    }
    if (!Number.isFinite(p.burstTime) || p.burstTime <= 0) {
      return { valid: false, message: `Invalid burstTime for ${p.processId}.` };
    }
    if (!Number.isFinite(p.queueNumber) || p.queueNumber <= 0) {
      return { valid: false, message: `Invalid queueNumber for ${p.processId}.` };
    }
  }

  return { valid: true, processes };
}

function validateRRInput(body) {
  const base = validateSimulationInput(body);
  if (!base.valid) return base;

  const timeQuantum = Number(body.timeQuantum || 2);
  if (!Number.isFinite(timeQuantum) || timeQuantum <= 0) {
    return { valid: false, message: 'timeQuantum must be a positive number.' };
  }

  return { valid: true, processes: base.processes, timeQuantum };
}

function validateMLQInput(body) {
  const base = validateSimulationInput(body);
  if (!base.valid) return base;

  let queues = body.queues;

  if (!Array.isArray(queues) || queues.length === 0) {
    const distinctQueues = [...new Set(base.processes.map((p) => p.queueNumber))].sort((a, b) => a - b);
    queues = distinctQueues.map((q, index) => ({
      queueNumber: q,
      priority: index + 1,
      algorithm: q === 1 ? 'RR' : 'FCFS',
      quantum: 2
    }));
  }

  const normalizedQueues = queues.map((q) => ({
    queueNumber: Number(q.queueNumber),
    priority: Number(q.priority),
    algorithm: String(q.algorithm || 'FCFS').toUpperCase(),
    quantum: q.quantum !== undefined ? Number(q.quantum) : 2
  }));

  for (const q of normalizedQueues) {
    if (!Number.isFinite(q.queueNumber) || q.queueNumber <= 0) {
      return { valid: false, message: 'Each queue must have a positive queueNumber.' };
    }
    if (!Number.isFinite(q.priority) || q.priority <= 0) {
      return { valid: false, message: 'Each queue must have a positive priority.' };
    }
    if (!['FCFS', 'SJF', 'RR'].includes(q.algorithm)) {
      return { valid: false, message: `Unsupported queue algorithm: ${q.algorithm}.` };
    }
    if (q.algorithm === 'RR' && (!Number.isFinite(q.quantum) || q.quantum <= 0)) {
      return { valid: false, message: `Queue ${q.queueNumber} requires a positive quantum.` };
    }
  }

  return { valid: true, processes: base.processes, queues: normalizedQueues };
}

module.exports = {
  validateSimulationInput,
  validateRRInput,
  validateMLQInput
};
