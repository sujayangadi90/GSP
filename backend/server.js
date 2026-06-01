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
  origin: '*', // For development, allow all origins
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/cms', require('./routes/cmsRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/brands', require('./routes/brandRoutes'));
app.use('/api/testimonials', require('./routes/testimonialRoutes'));
app.use('/api/inquiries', require('./routes/inquiryRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Fallback base route
app.get('/', (req, res) => {
  res.json({ message: 'Global Service Point API is running...' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
});
