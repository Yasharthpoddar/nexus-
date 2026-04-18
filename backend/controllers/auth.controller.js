const supabase = require('../db/config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
    
    if (error || !users || users.length === 0) {
      if (error) console.error('Supabase fetch error:', error);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.is_blocked) {
      return res.status(403).json({ message: 'Account suspended. Contact administration.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role, sub_role: user.sub_role },
      process.env.JWT_SECRET || 'fallback_nexus_jwt_secret_override_me',
      { expiresIn: '24h' }
    );

    // Strip password before returning user payload to frontend
    delete user.password;

    res.status(200).json({
      success: true,
      token,
      user
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const getMe = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id);
    
    if (error || !users || users.length === 0) {
      return res.status(404).json({ message: 'User reference lost.' });
    }

    const user = users[0];
    delete user.password;

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const register = async (req, res) => {
  const { name, email, password, role, branch, batch, rollNo } = req.body;
  if (!name || !email || !password || !role) {
     return res.status(400).json({ message: 'Missing required registration parameters.' });
  }

  // DB check constraint allows: 'student' | 'admin' | 'hod' | 'principal' | 'lab-incharge'
  // For authorities, the role payload IS already the valid DB role value.
  // sub_role mirrors role for use in JWT and ProtectedRoute matching.
  const dbRole = role;  // 'student', 'hod', 'principal', 'lab-incharge', 'admin'
  const dbSubRole = role; // same — ProtectedRoute checks sub_role

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from('users').insert([{
      name,
      email,
      password: hashedPassword,
      role: dbRole,
      branch: branch || null,
      batch: batch || null,
      roll_number: rollNo || null,
      sub_role: dbSubRole,
      is_blocked: false
    }]).select('*');

    if (error || !data) {
      console.error('Register DB error:', error);
      return res.status(400).json({ message: 'Registration failed. Email may already exist.', details: error?.message });
    }

    // Automatically create Application row if Student is registered
    if (role === 'student') {
      await supabase.from('applications').insert([{
        user_id: data[0].id,
        status: 'submitted',
        current_stage: 'library',
        cert_status: 'Not Ready'
      }]);
    }

    const user = data[0];
    delete user.password;
    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Internal Server Sync Failure during Registration.' });
  }
};

module.exports = {
  login,
  getMe,
  register
};
