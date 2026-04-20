require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const labRoutes = require('./routes/lab.routes');
const hodRoutes = require('./routes/hod.routes');
const principalRoutes = require('./routes/principal.routes');
const adminRoutes        = require('./routes/admin.routes');
const documentsRoutes    = require('./routes/documents.routes');
const applicationsRoutes = require('./routes/applications.routes');
const certificatesRoutes = require('./routes/certificates.js');
const duesRoutes         = require('./routes/dues.js');
const paymentRoutes      = require('./routes/payment.routes.js');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Route Bindings
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/principal', principalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/documents',    documentsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/certificates', certificatesRoutes);
app.use('/api/dues', duesRoutes);
app.use('/api/payment', paymentRoutes);

// Healthcheck Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Nexus Control Server is active.' });
});

const { initCronJobs } = require('./services/cronJobs');
const { verifyEmailConnection } = require('./services/emailService');

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`[BOOT] System Initialize. Nexus Backend listening internally on port ${PORT}`);
  await verifyEmailConnection();
  initCronJobs();
});
