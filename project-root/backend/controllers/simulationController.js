const { validateSimulationInput, validateRRInput, validateMLQInput } = require('../utils/validation');
const runFCFS = require('../algorithms/fcfs');
const runSJF = require('../algorithms/sjf');
const runRR = require('../algorithms/rr');
const runMLQ = require('../algorithms/mlq');

function simulateFCFS(req, res) {
  const validation = validateSimulationInput(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }

  const result = runFCFS(validation.processes);
  return res.json(result);
}

function simulateSJF(req, res) {
  const validation = validateSimulationInput(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }

  const result = runSJF(validation.processes);
  return res.json(result);
}

function simulateRR(req, res) {
  const validation = validateRRInput(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }

  const result = runRR(validation.processes, validation.timeQuantum);
  return res.json(result);
}

function simulateMLQ(req, res) {
  const validation = validateMLQInput(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }

  const result = runMLQ(validation.processes, validation.queues);
  return res.json(result);
}

function compareAlgorithms(req, res) {
  const validation = validateRRInput(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }

  const mlqValidation = validateMLQInput(req.body);
  const fcfs = runFCFS(validation.processes);
  const sjf = runSJF(validation.processes);
  const rr = runRR(validation.processes, validation.timeQuantum);

  const defaultMLQQueues = mlqValidation.valid
    ? mlqValidation.queues
    : [
        { queueNumber: 1, priority: 1, algorithm: 'RR', quantum: validation.timeQuantum },
        { queueNumber: 2, priority: 2, algorithm: 'FCFS' }
      ];

  const mlq = runMLQ(validation.processes, defaultMLQQueues);

  return res.json({
    summary: [
      { algorithm: 'FCFS', averageWT: fcfs.metrics.averageWT, averageTAT: fcfs.metrics.averageTAT },
      { algorithm: 'SJF', averageWT: sjf.metrics.averageWT, averageTAT: sjf.metrics.averageTAT },
      { algorithm: 'RR', averageWT: rr.metrics.averageWT, averageTAT: rr.metrics.averageTAT },
      { algorithm: 'MLQ', averageWT: mlq.metrics.averageWT, averageTAT: mlq.metrics.averageTAT }
    ],
    details: { fcfs, sjf, rr, mlq }
  });
}

module.exports = {
  simulateFCFS,
  simulateSJF,
  simulateRR,
  simulateMLQ,
  compareAlgorithms
};
