# 🚀 Algorithm Analysis and Visualization of Multilevel Queue CPU Scheduling

An interactive web-based platform to **simulate, visualize, and analyze CPU scheduling algorithms**, with a special focus on **Multilevel Queue (MLQ) Scheduling**.

---

## 📌 📖 Project Overview

This project is designed to help students and developers understand how CPU scheduling algorithms work **step-by-step** through **visualization and explanation**.

Unlike traditional simulators, this system not only computes results but also explains **WHY each process is selected at every step**.

---

## 🎯 Features

✅ Interactive Simulator for CPU Scheduling
✅ Supports Multiple Algorithms:

* First Come First Serve (FCFS)
* Shortest Job First (SJF)
* Round Robin (RR)
* Multilevel Queue (MLQ) ⭐

✅ Dynamic Input Table for Processes
✅ Gantt Chart Visualization 📊
✅ Step-by-Step Execution Explanation 🧠
✅ Performance Metrics Calculation:

* Waiting Time (WT)
* Turnaround Time (TAT)
* Response Time

✅ Algorithm Comparison Dashboard ⚖️
✅ Clean and Responsive UI

---

## 🧠 Multilevel Queue (MLQ) - Highlight

* Multiple queues with fixed priority
* Each queue can use a different scheduling algorithm
* Higher priority queues are executed first

This project visually demonstrates how MLQ works in real-time.

---

## 🛠️ Tech Stack

**Frontend:**

* HTML
* CSS (Tailwind CSS)
* JavaScript

**Backend:**

* Node.js
* Express.js

**Visualization:**

* Chart.js / D3.js

---

## 📂 Project Structure

```
project/
 ├── backend/
 │    ├── routes/
 │    ├── controllers/
 │    ├── algorithms/
 │    └── server.js
 │
 ├── frontend/
 │    ├── index.html
 │    ├── simulator.html
 │    ├── comparison.html
 │    ├── css/
 │    └── js/
 │
 ├── README.md
 └── .gitignore
```

---

## ⚙️ How to Run the Project

### 🔹 1. Clone Repository

```
git clone https://github.com/your-username/mlq-cpu-scheduling-visualizer.git
cd mlq-cpu-scheduling-visualizer
```

### 🔹 2. Setup Backend

```
cd backend
npm install
node server.js
```

### 🔹 3. Open Frontend

* Open `index.html` in browser
  OR
* Use Live Server in VS Code

---

## 📊 Input Parameters

* Process ID
* Arrival Time
* Burst Time
* Queue Number
* Time Quantum (for RR)

---

## 📈 Output

* Gantt Chart Visualization
* Process Execution Timeline
* Waiting Time & Turnaround Time
* Step-by-step explanation of scheduling

---

## ⚖️ Algorithm Comparison

The system compares all algorithms based on:

* Average Waiting Time
* Average Turnaround Time

This helps in analyzing which algorithm performs best under given conditions.

---

## 💡 Key Learning Outcomes

* Understanding CPU scheduling algorithms
* Visualization of process execution
* Performance comparison of algorithms
* Practical implementation of OS concepts

---

## 🔮 Future Enhancements

* Add Multilevel Feedback Queue (MLFQ)
* Add animation-based simulation
* Export results as PDF
* Deploy as live web application

---

## 👨‍💻 Author

**Sarvesh Dixit**


---

## ⭐ Acknowledgment

This project is developed as part of academic learning to understand **Operating System scheduling algorithms** and their real-world applications.

---

## 📬 Contact

Feel free to connect for collaboration or feedback.
