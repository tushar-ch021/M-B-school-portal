const path = require('path');
const fs = require('fs');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Resolve the React production build directory (supports both server/dist and client/dist)
const serverDistPath = path.join(__dirname, 'dist');
const clientDistPath = path.join(__dirname, '../client/dist');
const clientBuildPath = fs.existsSync(serverDistPath)
  ? serverDistPath
  : fs.existsSync(clientDistPath)
  ? clientDistPath
  : serverDistPath;

// Validate critical security environment variables immediately on load
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  console.error('CRITICAL SECURITY ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be configured in environment variables.');
  process.exit(1);
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('CRITICAL SECURITY ERROR: JWT_SECRET must be configured and contain at least 32 characters.');
  process.exit(1);
}

const app = express();

// Connect to MongoDB Database
connectDB().then(() => {
  // Seed first admin if database is empty
  const Admin = require('./models/Admin');
  const bcrypt = require('bcryptjs');
  
  Admin.find()
    .then(async (admins) => {
      const targetEmail = (process.env.ADMIN_EMAIL || 'admin@mbps.com').toLowerCase().trim();
      const targetPassword = (process.env.ADMIN_PASSWORD || 'admin123').trim();
      const hashedPassword = await bcrypt.hash(targetPassword, 12);

      if (admins.length === 0) {
        console.log('No administrator found. Seeding admin account...');
        await Admin.create({
          name: 'School Administrator',
          email: targetEmail,
          password: hashedPassword,
          role: 'Super Admin'
        });
        console.log(`Admin account created with email: ${targetEmail}`);
      } else {
        let targetAdmin = admins.find(a => a.email.toLowerCase().trim() === targetEmail);
        if (!targetAdmin) {
          console.log(`Primary admin email ${targetEmail} not found. Creating dedicated primary admin account...`);
          await Admin.create({
            name: 'School Administrator',
            email: targetEmail,
            password: hashedPassword,
            role: 'Super Admin'
          });
          console.log(`Primary admin account created with email ${targetEmail}.`);
        } else {
          const isMatch = await bcrypt.compare(targetPassword, targetAdmin.password);
          if (!isMatch) {
            targetAdmin.password = hashedPassword;
            await targetAdmin.save();
            console.log(`Admin password synced with ADMIN_PASSWORD for ${targetEmail}.`);
          }
        }
      }
    })
    .catch((err) => {
      console.error('Failed to query or seed Administrator data:', err);
    });
}).catch((err) => {
  console.error('Failed to connect to MongoDB database:', err);
  process.exit(1);
});

// Configure Security Middleware with customized Content Security Policy (CSP)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "https://api.cloudinary.com"]
    }
  }
}));
const compression = require('compression');
app.use(compression());
app.use(mongoSanitize());

const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.trim().replace(/\/$/, '') : '';
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    if ((clientUrl && origin === clientUrl) || origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Express request parser setup
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Set up general API request rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // High threshold so rapid section switching in SPA is never throttled
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api/', apiLimiter);

// Serve React production static assets (CSS, JS, images, fonts, etc.) with strict MIME type headers
app.use(express.static(clientBuildPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=UTF-8');
    }
  }
}));

// Define API Route handlers
app.use('/api/config', require('./routes/configRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/tc', require('./routes/tcRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));

// Root endpoint ping check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// SPA catch-all: For any GET request that doesn't match an API route or static file,
// serve the React index.html so client-side routing can handle the URL.
// This prevents 404 errors when users reload the page on routes like /students, /fees, etc.
app.get('*', (req, res, next) => {
  const indexPath = path.join(clientBuildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    next();
  }
});

// Centralized error handling middleware (must be registered last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
