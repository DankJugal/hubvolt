const db = require('../../config/hubvolt');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'HUBVOLT';

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const ADMIN_QUERY = `SELECT * FROM admin WHERE admin_username = ? AND admin_password = ?`;
    const [rows] = await db.promise().query(ADMIN_QUERY, [username, password]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = rows[0];
    const token = jwt.sign(
      { id: admin.id, username: admin.admin_username }, // payload
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    return res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = login;