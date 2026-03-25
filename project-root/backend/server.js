const express = require('express');
const cors = require('cors');
const path = require('path');
const simulateRoutes = require('./routes/simulateRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api', simulateRoutes);

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CPU Scheduling API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
