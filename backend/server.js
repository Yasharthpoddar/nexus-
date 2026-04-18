require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const labRoutes = require('./routes/lab.routes');
const hodRoutes = require('./routes/hod.routes');
const principalRoutes = require('./routes/principal.routes');
const adminRoutes = require('./routes/admin.routes');
const documentsRoutes = require('./routes/documents.routes');
const applicationsRoutes = require('./routes/applications.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parses JSON incoming requests

// Route Bindings
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/principal', principalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/applications', applicationsRoutes);

// Healthcheck Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Nexus Control Server is active.' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[BOOT] System Initialize. Nexus Backend listening internally on port ${PORT}`);
});
