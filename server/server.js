const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

// Initialize Express
const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true })); // Add CORS configuration
app.use(express.json()); // Middleware to parse JSON
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/analytics', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define a schema and model for analytics data
const analyticsSchema = new mongoose.Schema({
  metric: String,
  value: Number,
  timestamp: { type: Date, default: Date.now },
});

const Analytics = mongoose.model('Analytics', analyticsSchema);

// Endpoint to get all analytics data
app.get('/api/data', async (req, res) => {
  const data = await Analytics.find();
  res.json(data);
});

// Endpoint to add new analytics data
app.post('/api/data', async (req, res) => {
  console.log('Received new data:', req.body);
  const newData = new Analytics(req.body);
  try {
    await newData.save();
    io.emit('dataUpdated', newData);
    console.log('Emitting new data:', newData);
    res.status(201).json(newData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');

  // Send initial data
  Analytics.find().then((data) => {
    socket.emit('initialData', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start the server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
