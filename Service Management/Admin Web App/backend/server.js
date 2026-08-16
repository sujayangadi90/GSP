const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // For development
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dealers', require('./routes/dealerRoutes'));
app.use('/api/technicians', require('./routes/technicianRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/appliances', require('./routes/applianceRoutes'));
app.use('/api/brands', require('./routes/brandRoutes'));
app.use('/api/followups', require('./routes/followUpRoutes'));
app.use('/api/cities', require('./routes/cityRoutes'));
app.use('/api/admins', require('./routes/adminRoutes'));

// Fallback base route
app.get('/', (req, res) => {
  res.json({ message: 'GSP Service Management API is running...' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
});
