const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const User = require('./models/User');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB().then(() => {
  // Seed default admin user once database connects
  seedAdminUser();
});

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Security headers
app.use(helmet());

// Enable CORS for all routes (configured to be friendly to standard React dev servers)
app.use(cors({
  origin: '*', // In production, replace with specific origins for security
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// HTTP Request logging in development mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Attendance System API is running smoothly',
    timestamp: new Date(),
  });
});

// Mount Routers
app.use('/auth', require('./routes/authRoutes'));
app.use('/workers', require('./routes/workerRoutes'));
app.use('/attendance', require('./routes/attendanceRoutes'));
app.use('/users', require('./routes/userRoutes'));

// Global Error Handler Middleware (must be registered last)
app.use(errorHandler);

// Seed function for default system accounts (Admin & Gerant)
async function seedAdminUser() {
  try {
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@company.com';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'AdminSecurePassword123!';
    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      admin = await User.create({
        name: process.env.DEFAULT_ADMIN_NAME || 'System Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      });
      console.log('✔ Default Admin account created:', admin.email);
    }

    const gerantEmail = 'verify.gerant@company.com';
    let gerant = await User.findOne({ email: gerantEmail });
    if (!gerant) {
      gerant = await User.create({
        name: 'Site Manager',
        email: gerantEmail,
        password: 'GerantVerifyPassword123!',
        role: 'gerant',
      });
      console.log('✔ Default Gerant account created:', gerant.email);
    }
  } catch (error) {
    console.error('CRITICAL: Failed to seed default accounts:', error.message);
  }
}

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
