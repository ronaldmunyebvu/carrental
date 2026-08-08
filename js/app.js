// ============================================
// DriveShare - Shared JavaScript
// ============================================

// ---------- Auth State (H2 Backend) ----------
async function signup(name, email, password) {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();
  return data;
}

async function login(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.success) {
    APP.currentUser = data.user;
    localStorage.setItem('driveshare_user', JSON.stringify(data.user));
    updateNav();
    return true;
  }
  return false;
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  APP.currentUser = null;
    localStorage.removeItem('driveshare_user');
    updateNav();
    window.location.href = '/';
}

async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.loggedIn) {
      APP.currentUser = data.user;
      localStorage.setItem('driveshare_user', JSON.stringify(data.user));
    } else {
      APP.currentUser = null;
      localStorage.removeItem('driveshare_user');
    }
  } catch {
    const stored = localStorage.getItem('driveshare_user');
    if (stored) APP.currentUser = JSON.parse(stored);
  }
  updateNav();
}

// ---------- Cars API ----------
async function fetchCars(params) {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v); });
  }
  const url = '/api/cars' + (query.toString() ? '?' + query.toString() : '');
  const res = await fetch(url);
  return await res.json();
}

async function fetchCar(id) {
  const res = await fetch('/api/cars/' + id);
  if (!res.ok) return null;
  return await res.json();
}

async function createCar(carData) {
  const res = await fetch('/api/cars', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(carData)
  });
  return await res.json();
}

async function updateCar(id, carData) {
  const res = await fetch('/api/cars/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(carData)
  });
  return await res.json();
}

async function deleteCar(id) {
  const res = await fetch('/api/cars/' + id, { method: 'DELETE' });
  return await res.json();
}

async function fetchMyCars() {
  const res = await fetch('/api/cars/mine');
  if (!res.ok) return [];
  return await res.json();
}

// ---------- Navigation ----------
function updateNav() {
  const authNav = document.getElementById('nav-auth');
  const userNav = document.getElementById('nav-user');
  if (!authNav || !userNav) return;

  if (APP.currentUser) {
    authNav.classList.add('hidden');
    userNav.classList.remove('hidden');
    const avatarEl = userNav.querySelector('.nav-avatar');
    if (avatarEl) avatarEl.textContent = APP.currentUser.avatar;
  } else {
    authNav.classList.remove('hidden');
    userNav.classList.add('hidden');
  }
  updateMobileAuth();
}

function updateMobileAuth() {
  var inPages = window.location.pathname.indexOf('/pages/') !== -1;
  var pre = inPages ? '' : 'pages/';
  document.querySelectorAll('.nav-links').forEach(function (navLinks) {
    var existing = navLinks.querySelector('.mobile-auth-links');
    if (existing) existing.remove();
    var div = document.createElement('div');
    div.className = 'mobile-auth-links';
    if (APP.currentUser) {
      div.innerHTML = '<a href="' + pre + 'dashboard.html">Dashboard</a>' +
        '<a href="javascript:void(0)" onclick="logout()">Log Out</a>';
    } else {
      div.innerHTML = '<a href="' + pre + 'login.html" style="color:var(--gray-700);">Log In</a>' +
        '<a href="' + pre + 'signup.html" class="btn btn-primary btn-block" style="text-align:center;">Sign Up</a>';
    }
    navLinks.appendChild(div);
  });
}

function toggleDropdown() {
  const dd = document.getElementById('user-dropdown');
  if (dd) dd.classList.toggle('hidden');
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  const dd = document.getElementById('user-dropdown');
  const av = document.querySelector('.nav-avatar');
  if (dd && av && !dd.contains(e.target) && !av.contains(e.target)) {
    dd.classList.add('hidden');
  }
});

// ---------- Favorites ----------
function toggleFavorite(carId, btn) {
  const idx = APP.favorites.indexOf(carId);
  if (idx > -1) {
    APP.favorites.splice(idx, 1);
    btn.classList.remove('active');
    btn.innerHTML = '♡';
  } else {
    APP.favorites.push(carId);
    btn.classList.add('active');
    btn.innerHTML = '♥';
  }
}

// ---------- Toast ----------
function showToast(message, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = 'toast ' + type;
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ---------- Scroll to Top ----------
function initScrollTop() {
  const btn = document.getElementById('scroll-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 400);
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ---------- Mobile Menu ----------
function toggleMobileMenu() {
  const links = document.querySelector('.nav-links');
  if (links) links.classList.toggle('show');
}

// ---------- Render Car Cards ----------
function renderCarCard(car) {
  var hasImages = car.imagePaths && car.imagePaths.length > 0;
  var imgHtml = hasImages
    ? '<img src="' + car.imagePaths[0] + '" alt="' + car.year + ' ' + car.make + ' ' + car.model + '" style="width:100%;height:100%;object-fit:cover;">'
    : '<div class="placeholder-img"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 17m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M17 17m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M5 17H3v-6l2-5h9l4 5h3v6h-2M5 17h14M9 17v2M15 17v2"/></svg></div>';
  return `
    <div class="car-card" data-car-id="${car.id}">
      <div class="car-card-img">
        ${imgHtml}
        ${car.instantBook ? '<span class="badge">Instant Book</span>' : ''}
        <button class="fav-btn" onclick="event.stopPropagation(); toggleFavorite('${car.id}', this)">♡</button>
      </div>
      <a href="pages/car-detail.html?id=${car.id}">
        <div class="car-card-body">
          <div class="car-card-header">
            <div class="car-card-title">${car.year} ${car.make} ${car.model}</div>
            <div class="car-card-price">${formatPrice(car.dailyPrice)}<span>/day</span></div>
          </div>
          <div class="car-card-meta">
            <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${car.location}</span>
            <span>${car.seats} seats</span>
            <span>${car.fuel}</span>
          </div>
          <div class="car-card-rating">
            <span class="stars">${getStars(car.rating)}</span>
            <span>${car.rating}</span>
            <span>(${car.reviewCount} reviews)</span>
          </div>
          <div class="car-card-footer">
            <div class="car-card-owner">
              <div class="car-card-owner-avatar">${car.hostAvatar}</div>
              ${car.hostName}
            </div>
            <span class="tag">${car.type}</span>
          </div>
        </div>
      </a>
    </div>
  `;
}

// ---------- Navbar HTML ----------
function getUserDisplayName() {
  if (!APP.currentUser) return '';
  return APP.currentUser.full_name || APP.currentUser.name || '';
}

function getNavbarHTML(activePage = '') {
  return `
  <nav class="navbar">
    <div class="navbar-inner">
      <a href="../index.html" class="logo">
        <svg viewBox="0 0 32 32" fill="currentColor"><path d="M5 16c0-1.5.8-3 2-4l4-2c1-.5 2-1.5 2.5-2.5L15 5h2l1.5 2.5c.5 1 1.5 2 2.5 2.5l4 2c1.2 1 2 2.5 2 4v8c0 1.1-.9 2-2 2h-2c-1.1 0-2-.9-2-2v-2h-4v2c0 1.1-.9 2-2 2H9c-1.1 0-2-.9-2-2v-8z"/><circle cx="11" cy="17" r="1.5"/><circle cx="21" cy="17" r="1.5"/></svg>
        DriveShare
      </a>
      <div class="nav-links">
        <a href="../index.html" class="${activePage === 'home' ? 'active' : ''}">Home</a>
        <a href="search.html" class="${activePage === 'search' ? 'active' : ''}">Browse Cars</a>
        <a href="list-car.html" class="${activePage === 'list' ? 'active' : ''}">List Your Car</a>
      </div>
      <div class="nav-actions">
        <div id="nav-auth" class="nav-actions">
          <a href="login.html" class="btn btn-ghost">Log In</a>
          <a href="signup.html" class="btn btn-primary btn-sm">Sign Up</a>
        </div>
        <div id="nav-user" class="nav-actions hidden">
          <a href="dashboard.html" class="btn btn-ghost btn-sm">Dashboard</a>
          <div class="nav-avatar" onclick="toggleDropdown()">SJ</div>
          <div id="user-dropdown" class="nav-dropdown hidden">
            <a href="profile.html">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              My Profile
            </a>
            <a href="dashboard.html">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              Dashboard
            </a>
            <a href="list-car.html">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              List a Car
            </a>
            <hr>
            <button onclick="logout()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Log Out
            </button>
          </div>
        </div>
        <div class="hamburger" onclick="toggleMobileMenu()">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  </nav>`;
}

// ---------- Footer HTML ----------
function getFooterHTML() {
  return `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="../index.html" class="logo" style="color: var(--primary);">
            <svg viewBox="0 0 32 32" fill="currentColor" width="28" height="28"><path d="M5 16c0-1.5.8-3 2-4l4-2c1-.5 2-1.5 2.5-2.5L15 5h2l1.5 2.5c.5 1 1.5 2 2.5 2.5l4 2c1.2 1 2 2.5 2 4v8c0 1.1-.9 2-2 2h-2c-1.1 0-2-.9-2-2v-2h-4v2c0 1.1-.9 2-2 2H9c-1.1 0-2-.9-2-2v-8z"/><circle cx="11" cy="17" r="1.5"/><circle cx="21" cy="17" r="1.5"/></svg>
            DriveShare
          </a>
          <p>The trusted peer-to-peer car rental marketplace. Rent unique cars or earn money sharing yours.</p>
        </div>
        <div>
          <h4>Company</h4>
          <ul>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Press</a></li>
            <li><a href="#">Blog</a></li>
          </ul>
        </div>
        <div>
          <h4>Support</h4>
          <ul>
            <li><a href="#">Help Center</a></li>
            <li><a href="#">Safety</a></li>
            <li><a href="#">Insurance</a></li>
            <li><a href="#">Contact Us</a></li>
          </ul>
        </div>
        <div>
          <h4>Legal</h4>
          <ul>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Cookie Policy</a></li>
            <li><a href="#">Licenses</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; 2025 DriveShare. All rights reserved.</span>
        <div class="footer-social">
          <a href="#" aria-label="Facebook"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
          <a href="#" aria-label="Twitter"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5 0-.28-.03-.56-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg></a>
          <a href="#" aria-label="Instagram"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg></a>
        </div>
      </div>
    </div>
  </footer>`;
}

// ---------- Scroll Top HTML ----------
function getScrollTopHTML() {
  return `<button id="scroll-top" class="scroll-top" aria-label="Scroll to top">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18,15 12,9 6,15"/></svg>
  </button>`;
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  initScrollTop();
});
