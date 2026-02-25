// EventHub Backend API Structure (Node.js + Express)
// ================================================

// 1. Main Server Setup
// ===================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const nodemailer = require('nodemailer');
const qrcode = require('qrcode');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const csv = require('csv-writer');

// 2. API Routes Structure
// ===================

// Authentication Routes (/api/auth)
// --------------------------------
POST   /api/auth/register           // User registration
POST   /api/auth/login              // User login
POST   /api/auth/logout             // User logout
POST   /api/auth/refresh            // Refresh JWT token
POST   /api/auth/forgot-password     // Forgot password
POST   /api/auth/reset-password      // Reset password
POST   /api/auth/change-password     // Change password
POST   /api/auth/verify-email        // Email verification
GET    /api/auth/me                // Get current user profile
PUT    /api/auth/profile            // Update profile
POST   /api/auth/upload-avatar      // Upload avatar

// User Management Routes (/api/users)
// ----------------------------------
GET    /api/users                  // Get all users (admin/manager)
GET    /api/users/:id              // Get user by ID
POST   /api/users                  // Create user (admin)
PUT    /api/users/:id              // Update user
DELETE /api/users/:id              // Delete user (admin)
POST   /api/users/bulk             // Bulk operations
GET    /api/users/search           // Search users
GET    /api/users/role/:role       // Get users by role
GET    /api/users/department/:dept  // Get users by department
GET    /api/users/statistics       // User statistics
GET    /api/users/export           // Export users
PATCH  /api/users/:id/activate     // Activate user
PATCH  /api/users/:id/deactivate   // Deactivate user
PATCH  /api/users/:id/role        // Change user role
GET    /api/users/:id/activity    // User activity log
DELETE /api/users/:id/sessions    // Revoke user sessions

// Event Management Routes (/api/events)
// -----------------------------------
GET    /api/events                 // Get all events
GET    /api/events/:id             // Get event by ID
POST   /api/events                 // Create event
PUT    /api/events/:id             // Update event
DELETE /api/events/:id             // Delete event
GET    /api/events/search          // Search events
GET    /api/events/featured        // Featured events
GET    /api/events/upcoming        // Upcoming events
GET    /api/events/categories      // Event categories
GET    /api/events/statistics      // Event statistics
POST   /api/events/bulk-delete     // Bulk delete
POST   /api/events/bulk-update     // Bulk update
PATCH  /api/events/:id/publish     // Publish event
PATCH  /api/events/:id/cancel      // Cancel event
POST   /api/events/:id/duplicate    // Duplicate event
GET    /api/events/:id/registrations // Get event registrations
GET    /api/events/:id/statistics  // Event statistics
GET    /api/events/:id/export      // Export event data

// Registration Management Routes (/api/registrations)
// -------------------------------------------------
GET    /api/registrations           // Get all registrations
GET    /api/registrations/:id       // Get registration by ID
POST   /api/registrations           // Create registration
PUT    /api/registrations/:id       // Update registration
DELETE /api/registrations/:id       // Delete registration
GET    /api/registrations/search    // Search registrations
GET    /api/registrations/statistics // Registration statistics
POST   /api/registrations/bulk     // Bulk create
POST   /api/registrations/bulk-update // Bulk update
POST   /api/registrations/bulk-delete // Bulk delete
PATCH  /api/registrations/:id/confirm   // Confirm registration
PATCH  /api/registrations/:id/cancel    // Cancel registration
PATCH  /api/registrations/:id/waitlist  // Add to waitlist
PATCH  /api/registrations/:id/checkin   // Check-in registration
POST   /api/registrations/bulk-checkin // Bulk check-in
PATCH  /api/registrations/:id/undo-checkin // Undo check-in
POST   /api/registrations/:id/payment   // Process payment
POST   /api/registrations/refund     // Request refund
POST   /api/registrations/:id/process-refund // Process refund
POST   /api/registrations/:id/generate-ticket // Generate QR ticket
GET    /api/registrations/:id/download-ticket // Download ticket
POST   /api/registrations/:id/email-ticket // Email ticket
POST   /api/registrations/bulk-email-tickets // Bulk email tickets
GET    /api/registrations/my-registrations // User's registrations
GET    /api/registrations/waitlist/:eventId // Event waitlist
PATCH  /api/registrations/:id/promote // Promote from waitlist

// Company Management Routes (/api/companies)
// ----------------------------------------
GET    /api/companies              // Get companies
GET    /api/companies/:id          // Get company by ID
POST   /api/companies              // Create company
PUT    /api/companies/:id          // Update company
DELETE /api/companies/:id          // Delete company
GET    /api/companies/statistics   // Company statistics

// Analytics Routes (/api/analytics)
// ---------------------------------
GET    /api/analytics/dashboard       // Dashboard analytics
GET    /api/analytics/events         // Event analytics
GET    /api/analytics/registrations // Registration analytics
GET    /api/analytics/users         // User analytics
GET    /api/analytics/revenue       // Revenue analytics
GET    /api/analytics/engagement   // User engagement
POST   /api/analytics/report        // Generate custom report

// Notification Routes (/api/notifications)
// --------------------------------------
GET    /api/notifications          // Get notifications
POST   /api/notifications          // Send notification
PUT    /api/notifications/:id      // Mark as read
DELETE /api/notifications/:id      // Delete notification
POST   /api/notifications/bulk   // Bulk operations

// File Upload Routes (/api/uploads)
// --------------------------------
POST   /api/uploads/avatar         // Upload avatar
POST   /api/uploads/event-image    // Upload event image
POST   /api/uploads/document       // Upload document
GET    /api/uploads/:filename      // Get uploaded file

// 3. Middleware Structure
// ======================

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Role-based Authorization Middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// Rate Limiting Middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

// File Upload Middleware
const upload = multer({
  storage: multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// 4. Error Handling
// =================

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  // Default error
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 5. Server Configuration
// =====================

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/events', authenticateToken, eventRoutes);
app.use('/api/registrations', authenticateToken, registrationRoutes);
app.use('/api/companies', authenticateToken, companyRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/uploads', authenticateToken, uploadRoutes);

// Error handling
app.use(errorHandler);

// 6. Database Models
// ==================

// User Model
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: String,
  avatar: String,
  role: { type: String, enum: ['admin', 'manager', 'user'], default: 'user' },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  department: String,
  jobTitle: String,
  bio: String,
  website: String,
  location: String,
  timezone: { type: String, default: 'UTC' },
  language: { type: String, default: 'en' },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    marketingEmails: { type: Boolean, default: false },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    dateFormat: { type: String, default: 'MM/DD/YYYY' },
    timeFormat: { type: String, enum: ['12h', '24h'], default: '12h' },
    currency: { type: String, default: 'USD' }
  },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Event Model
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  location: { type: String, required: true },
  maxAttendees: { type: Number, required: true },
  currentAttendees: { type: Number, default: 0 },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  imageUrl: String,
  status: { type: String, enum: ['draft', 'published', 'cancelled', 'completed'], default: 'draft' },
  isPublic: { type: Boolean, default: true },
  requiresApproval: { type: Boolean, default: false },
  tags: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Registration Model
const registrationSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  company: String,
  jobTitle: String,
  dietaryRestrictions: String,
  specialRequirements: String,
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'waitlisted'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded', 'failed'], default: 'pending' },
  paymentMethod: { type: String, enum: ['credit_card', 'paypal', 'bank_transfer', 'crypto'] },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  transactionId: String,
  qrCode: String,
  ticketNumber: { type: String, unique: true },
  checkedIn: { type: Boolean, default: false },
  checkedInAt: Date,
  checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  registeredAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 7. Environment Variables
// =====================

// .env configuration
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/eventhub
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

// 8. Server Startup
// ==================

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eventhub';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));

module.exports = app;
