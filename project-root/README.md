# Algorithm Analysis and Visualization of Multilevel Queue CPU Scheduling

A complete full-stack web application that explains and visualizes CPU scheduling algorithms with emphasis on Multilevel Queue (MLQ).

## Stack

- Backend: Node.js + Express.js
- Frontend: HTML + Tailwind CSS + Vanilla JavaScript
- Visualization: Chart.js
- Data exchange: JSON APIs

## Features

- Explains MLQ scheduling theory
- Interactive simulator for FCFS, SJF, RR, and MLQ
- Step-by-step execution reasoning
- Animated Gantt chart visualization
- Process-wise metrics (WT, TAT, RT)
- Comparison dashboard for all algorithms
- Sample dataset for quick testing

## Project Structure

project-root/
- backend/
  - server.js
  - package.json
  - routes/
  - controllers/
  - algorithms/
  - utils/
- frontend/
  - index.html
  - simulator.html
  - comparison.html
  - css/
  - js/
  - data/

## API Endpoints

- POST /api/simulate/mlq
- POST /api/simulate/fcfs
- POST /api/simulate/sjf
- POST /api/simulate/rr
- POST /api/compare

### Base Request Body

```json
{
  "processes": [
    { "processId": "P1", "arrivalTime": 0, "burstTime": 5, "queueNumber": 1 }
  ],
  "timeQuantum": 2,
  "queues": [
    { "queueNumber": 1, "priority": 1, "algorithm": "RR", "quantum": 2 },
    { "queueNumber": 2, "priority": 2, "algorithm": "FCFS" }
  ]
}
```

## Run Instructions

1. Open terminal in project-root/backend
2. Install dependencies:
   npm install
3. Start server:
   npm start
4. Open browser at:
   http://localhost:4000/index.html

## MLQ Logic Notes (Viva Friendly)

- MLQ keeps separate ready queues by class/category.
- A global queue priority is applied first.
- In this app, if a higher-priority queue becomes ready, it can preempt lower-priority execution.
- Each queue uses its own local scheduling:
  - RR queue uses quantum and rotates processes.
  - FCFS queue follows earliest arrival order.
  - SJF queue picks shortest job among ready processes.
- Metrics are derived from completion and response timestamps.

## Formulae

- Turnaround Time (TAT) = Completion Time - Arrival Time
- Waiting Time (WT) = Turnaround Time - Burst Time
- Response Time (RT) = First CPU Start - Arrival Time

## Notes

- The frontend is served statically by Express from ../frontend.
- You can edit MLQ queue config JSON directly in simulator page.
