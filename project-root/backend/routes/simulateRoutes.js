const express = require('express');
const {
  simulateMLQ,
  simulateFCFS,
  simulateSJF,
  simulateRR,
  compareAlgorithms
} = require('../controllers/simulationController');

const router = express.Router();

router.post('/simulate/mlq', simulateMLQ);
router.post('/simulate/fcfs', simulateFCFS);
router.post('/simulate/sjf', simulateSJF);
router.post('/simulate/rr', simulateRR);
router.post('/compare', compareAlgorithms);

module.exports = router;
