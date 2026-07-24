const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const path = require('path');
const pool = require('./lib/db');
const { signToken, verifyToken } = require('./lib/auth');
const { sendConfirmationEmail, sendPasswordResetEmail } = require('./lib/mail');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }).any());

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getAvatar(name) {
  if (!name) return 'U';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getUserObj(u) {
  const name = (u.first_name || '') + ' ' + (u.last_name || '');
  return {
    id: u.id,
    name: name.trim(),
    full_name: name.trim(),
    email: u.email,
    role: u.role,
    avatar: getAvatar(name),
  };
}

async function requireAuth(req, res, next) {
  const cookieToken = req.cookies && req.cookies.token;
  if (!cookieToken) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded = verifyToken(cookieToken);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// ============================================================
//  AUTH ROUTES
// ============================================================

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    const existing = await pool.query('SELECT id FROM users2 WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const parts = name.trim().split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users2 (first_name, last_name, email, password_hash, role)
       VALUES ($1,$2,$3,$4,'USER') RETURNING *`,
      [firstName, lastName, email, hash]
    );
    const user = result.rows[0];

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO email_confirmation_tokens (user_id, token, expiry_date) VALUES ($1,$2,$3)',
      [user.id, token, expiry]
    );
    let emailSent = true;
    try {
      await sendConfirmationEmail({ firstName, email }, token);
    } catch (e) {
      console.error('Email send failed:', e.message || e);
      emailSent = false;
    }

    const response = { success: true, user: getUserObj(user) };
    if (!emailSent) response.warning = 'Account created but confirmation email could not be sent. Please use Resend Confirmation.';
    res.status(201).json(response);
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const result = await pool.query('SELECT * FROM users2 WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    if (!user.email_confirmed) {
      return res.status(403).json({ error: 'Please confirm your email before logging in. Check your inbox for the confirmation link.' });
    }

    const jwtToken = signToken(user);
    setAuthCookie(res, jwtToken);
    res.json({ success: true, token: jwtToken, user: getUserObj(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ success: true });
});

app.get('/api/auth/me', async (req, res) => {
  const cookieToken = req.cookies && req.cookies.token;
  if (!cookieToken) return res.json({ loggedIn: false });
  try {
    const decoded = verifyToken(cookieToken);
    const result = await pool.query('SELECT * FROM users2 WHERE id = $1', [decoded.id]);
    if (result.rows.length === 0) return res.json({ loggedIn: false });
    res.json({ loggedIn: true, user: getUserObj(result.rows[0]) });
  } catch {
    res.json({ loggedIn: false });
  }
});

app.post('/api/auth/confirm-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });
    const result = await pool.query(
      'SELECT * FROM email_confirmation_tokens WHERE token = $1 AND expiry_date > NOW()', [token]
    );
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid or expired token' });
    const record = result.rows[0];
    await pool.query('UPDATE users2 SET email_confirmed = TRUE WHERE id = $1', [record.user_id]);
    await pool.query('DELETE FROM email_confirmation_tokens WHERE id = $1', [record.id]);
    const userResult = await pool.query('SELECT * FROM users2 WHERE id = $1', [record.user_id]);
    const user = userResult.rows[0];
    const jwtToken = signToken(user);
    setAuthCookie(res, jwtToken);
    res.json({ success: true, user: getUserObj(user) });
  } catch (err) {
    console.error('Confirm error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const result = await pool.query('SELECT id, first_name FROM users2 WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.json({ success: true });
    const user = result.rows[0];
    const code = generateCode();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expiry_date, verified) VALUES ($1,$2,$3,FALSE)',
      [user.id, code, expiry]
    );
    try { await sendPasswordResetEmail({ firstName: user.first_name, email }, code); } catch (e) { console.error('Reset email failed:', e.message); }
    res.json({ success: true });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code required' });
    const userResult = await pool.query('SELECT id FROM users2 WHERE email = $1', [email]);
    if (userResult.rows.length === 0) return res.status(400).json({ error: 'Invalid code' });
    const result = await pool.query(
      'SELECT id FROM password_reset_tokens WHERE user_id = $1 AND token = $2 AND expiry_date > NOW()',
      [userResult.rows[0].id, code]
    );
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid or expired code' });
    await pool.query('UPDATE password_reset_tokens SET verified = TRUE WHERE id = $1', [result.rows[0].id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Verify code error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const userResult = await pool.query('SELECT id FROM users2 WHERE email = $1', [email]);
    if (userResult.rows.length === 0) return res.status(400).json({ error: 'Invalid request' });
    const tokenResult = await pool.query(
      'SELECT id FROM password_reset_tokens WHERE user_id = $1 AND verified = TRUE AND expiry_date > NOW() ORDER BY id DESC LIMIT 1',
      [userResult.rows[0].id]
    );
    if (tokenResult.rows.length === 0) return res.status(400).json({ error: 'Please verify your code first' });
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users2 SET password_hash = $1 WHERE id = $2', [hash, userResult.rows[0].id]);
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userResult.rows[0].id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/resend-confirmation', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const result = await pool.query('SELECT id, first_name FROM users2 WHERE email = $1 AND email_confirmed = FALSE', [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'No unconfirmed account found' });
    const user = result.rows[0];
    await pool.query('DELETE FROM email_confirmation_tokens WHERE user_id = $1', [user.id]);
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO email_confirmation_tokens (user_id, token, expiry_date) VALUES ($1,$2,$3)',
      [user.id, token, expiry]
    );
    try { await sendConfirmationEmail({ firstName: user.first_name, email }, token); } catch (e) { console.error('Resend email failed:', e.message || e); }
    res.json({ message: 'Confirmation email sent' });
  } catch (err) {
    console.error('Resend confirmation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
//  CAR ROUTES
// ============================================================

function formatCar(row) {
  const ownerName = ((row.owner_first_name || '') + ' ' + (row.owner_last_name || '')).trim();
  let imagePaths = [];
  if (row.image_data) {
    if (Array.isArray(row.image_data)) {
      imagePaths = row.image_data.filter(Boolean);
    } else if (typeof row.image_data === 'string' && row.image_data !== '[]') {
      try { imagePaths = JSON.parse(row.image_data); } catch { imagePaths = []; }
    }
  }
  return {
    id: row.id,
    ownerId: row.owner_id,
    hostName: ownerName || 'Owner',
    hostAvatar: getAvatar(ownerName),
    make: row.make,
    model: row.model,
    year: row.year,
    category: row.category,
    type: row.category ? row.category.charAt(0).toUpperCase() + row.category.slice(1) : '',
    dailyPrice: parseFloat(row.price_per_day),
    fuel: row.fuel_type || '',
    transmission: row.transmission || '',
    seats: row.seats,
    mileage: row.mileage,
    description: row.description || '',
    available: row.available,
    status: row.status,
    location: row.location || '',
    latitude: row.latitude,
    longitude: row.longitude,
    features: row.features ? row.features.split(',').map(f => f.trim()).filter(Boolean) : [],
    imagePaths: imagePaths,
    rating: parseFloat(row.rating) || 0,
    reviewCount: parseInt(row.review_count) || 0,
    trips: parseInt(row.trips) || 0,
    instantBook: row.instant_book || false,
    distance: null,
    phoneNumber: row.owner_phone || null,
  };
}

app.get('/api/cars', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.first_name AS owner_first_name, u.last_name AS owner_last_name, u.phone AS owner_phone,
        COALESCE(
          (SELECT json_agg(ci.image_data ORDER BY ci.display_order) FROM car_images ci WHERE ci.car_id = c.id),
          '[]'::json
        ) AS image_data
       FROM cars c
       JOIN users2 u ON c.owner_id = u.id
       WHERE c.status = 'ACTIVE'
       ORDER BY c.created_at DESC`
    );
    res.json(result.rows.map(formatCar));
  } catch (err) {
    console.error('List cars error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/cars/mine', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.first_name AS owner_first_name, u.last_name AS owner_last_name,
        COALESCE(
          (SELECT json_agg(ci.image_data ORDER BY ci.display_order) FROM car_images ci WHERE ci.car_id = c.id),
          '[]'::json
        ) AS image_data
       FROM cars c
       JOIN users2 u ON c.owner_id = u.id
       WHERE c.owner_id = $1
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows.map(formatCar));
  } catch (err) {
    console.error('My cars error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/cars/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.first_name AS owner_first_name, u.last_name AS owner_last_name, u.phone AS owner_phone,
        COALESCE(
          (SELECT json_agg(ci.image_data ORDER BY ci.display_order) FROM car_images ci WHERE ci.car_id = c.id),
          '[]'::json
        ) AS image_data
       FROM cars c
       JOIN users2 u ON c.owner_id = u.id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Car not found' });
    res.json(formatCar(result.rows[0]));
  } catch (err) {
    console.error('Get car error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/cars', requireAuth, async (req, res) => {
  try {
    const { make, model, year, category, dailyPrice, mileage, transmission, fuel, seats, location, description, features } = req.body;
    if (!make || !model || !year || !dailyPrice) {
      return res.status(400).json({ error: 'Make, model, year, and price are required' });
    }
    const featuresStr = Array.isArray(features) ? features.join(',') : (features || null);
    const result = await pool.query(
      `INSERT INTO cars (owner_id, make, model, year, category, price_per_day, seats, fuel_type, transmission, mileage, description, location, features, status, available)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'ACTIVE',TRUE) RETURNING id`,
      [req.user.id, make, model, parseInt(year), category || 'sedan', parseFloat(dailyPrice), parseInt(seats) || null, fuel || null, transmission || null, parseInt(mileage) || null, description || null, location || null, featuresStr]
    );
    res.status(201).json({ success: true, car: { id: result.rows[0].id } });
  } catch (err) {
    console.error('Create car error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/cars/:id', requireAuth, async (req, res) => {
  try {
    const existing = await pool.query('SELECT owner_id FROM cars WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Car not found' });
    if (existing.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const { make, model, year, category, dailyPrice, mileage, transmission, fuel, seats, location, description, features, available } = req.body;
    const featuresStr = Array.isArray(features) ? features.join(',') : (features || null);
    await pool.query(
      `UPDATE cars SET make=$1, model=$2, year=$3, category=$4, price_per_day=$5, seats=$6,
       fuel_type=$7, transmission=$8, mileage=$9, description=$10, location=$11, features=$12, available=$13 WHERE id=$14`,
      [make, model, parseInt(year), category, parseFloat(dailyPrice), parseInt(seats) || null, fuel || null, transmission || null, parseInt(mileage) || null, description || null, location || null, featuresStr, available !== false, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Update car error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/cars/:id', requireAuth, async (req, res) => {
  try {
    const existing = await pool.query('SELECT owner_id FROM cars WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Car not found' });
    if (existing.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    await pool.query('DELETE FROM cars WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete car error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
//  IMAGE ROUTES
// ============================================================

app.post('/api/images/upload/:carId', requireAuth, async (req, res) => {
  try {
    const existing = await pool.query('SELECT owner_id FROM cars WHERE id = $1', [req.params.carId]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Car not found' });
    if (existing.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const files = req.files || [];
    if (files.length === 0) return res.status(400).json({ error: 'No images provided' });

    const maxOrder = await pool.query('SELECT COALESCE(MAX(display_order), -1) + 1 AS next FROM car_images WHERE car_id = $1', [req.params.carId]);
    let order = maxOrder.rows[0].next;
    for (const file of files) {
      if (!file.buffer) continue;
      const base64 = file.buffer.toString('base64');
      const mimeType = file.mimetype || 'image/jpeg';
      await pool.query(
        'INSERT INTO car_images (car_id, image_data, display_order) VALUES ($1, $2, $3)',
        [req.params.carId, `data:${mimeType};base64,${base64}`, order++]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Upload images error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/images/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ci.id FROM car_images ci
       JOIN cars c ON ci.car_id = c.id
       WHERE ci.id = $1 AND c.owner_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Image not found' });
    await pool.query('DELETE FROM car_images WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete image error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
//  BOOKING ROUTES
// ============================================================

app.post('/api/bookings', requireAuth, async (req, res) => {
  try {
    const { carId, startDate, endDate, total } = req.body;
    if (!carId || !startDate || !endDate || !total) {
      return res.status(400).json({ error: 'carId, startDate, endDate, and total are required' });
    }
    const carResult = await pool.query('SELECT id, owner_id FROM cars WHERE id = $1 AND available = TRUE', [carId]);
    if (carResult.rows.length === 0) return res.status(404).json({ error: 'Car not available' });
    if (carResult.rows[0].owner_id === req.user.id) return res.status(400).json({ error: 'Cannot book your own car' });

    const result = await pool.query(
      `INSERT INTO bookings (car_id, user_id, pickup_date, return_date, total_price, status)
       VALUES ($1,$2,$3,$4,$5,'PENDING') RETURNING id`,
      [carId, req.user.id, startDate, endDate, parseFloat(total)]
    );
    res.status(201).json({ success: true, booking: { id: result.rows[0].id } });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/bookings/mine', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, c.make, c.model, c.year, c.location, c.phone AS car_phone,
        u.first_name AS owner_first_name, u.last_name AS owner_last_name, u.phone AS owner_phone,
        renter.first_name AS renter_first_name, renter.last_name AS renter_last_name
       FROM bookings b
       JOIN cars c ON b.car_id = c.id
       JOIN users2 u ON c.owner_id = u.id
       JOIN users2 renter ON b.user_id = renter.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows.map(row => ({
      id: row.id,
      carId: row.car_id,
      renterId: row.user_id,
      status: row.status.toLowerCase(),
      startDate: row.pickup_date,
      endDate: row.return_date,
      total: parseFloat(row.total_price),
      carTitle: row.year + ' ' + row.make + ' ' + row.model,
      phoneNumber: row.owner_phone || null,
    })));
  } catch (err) {
    console.error('My bookings error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/bookings/owner', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, c.make, c.model, c.year,
        renter.id AS renter_user_id, renter.first_name AS renter_first_name, renter.last_name AS renter_last_name
       FROM bookings b
       JOIN cars c ON b.car_id = c.id
       JOIN users2 renter ON b.user_id = renter.id
       WHERE c.owner_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows.map(row => ({
      id: row.id,
      carId: row.car_id,
      renterId: row.renter_user_id,
      status: row.status.toLowerCase(),
      startDate: row.pickup_date,
      endDate: row.return_date,
      total: parseFloat(row.total_price),
      carTitle: row.year + ' ' + row.make + ' ' + row.model,
    })));
  } catch (err) {
    console.error('Owner bookings error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/bookings/:id/approve', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE bookings SET status = 'CONFIRMED' WHERE id = $1
       AND car_id IN (SELECT id FROM cars WHERE owner_id = $2) RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Approve booking error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/bookings/:id/reject', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE bookings SET status = 'REJECTED' WHERE id = $1
       AND car_id IN (SELECT id FROM cars WHERE owner_id = $2) RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Reject booking error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
//  STATIC FILES (for local development)
// ============================================================
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(path.join(__dirname, '..')));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '..', req.path || 'index.html'));
    }
  });
}

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`DriveShare server running on http://localhost:${PORT}`));
}

module.exports = app;
