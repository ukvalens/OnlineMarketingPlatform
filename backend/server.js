require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const servicesRoutes = require('./routes/client/services');
const ordersRoutes = require('./routes/client/orders');
const messagesRoutes = require('./routes/client/messages');
const invoicesRoutes = require('./routes/client/invoices');
const profileRoutes = require('./routes/client/profile');
const portfolioRoutes = require('./routes/client/portfolio');
const blogRoutes = require('./routes/client/blog');
const contactRoutes = require('./routes/client/contact');
const adminRoutes = require('./routes/admin');

const app = express();

// Security & parsing
app.use(helmet());
const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:3000', 'http://localhost:3001'];
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rate limiting
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many requests' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/orders/:orderId/messages', messagesRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// 404
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`));

module.exports = app;
