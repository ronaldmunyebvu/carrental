// ============================================
// DriveShare - App State & Helper Functions
// ============================================

const APP = {
  currentUser: null,
  favorites: [],
};

// ---------- Helper Functions ----------

function formatPrice(price) {
  return '$' + price.toLocaleString();
}

function formatDate(dateStr) {
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(dateStr).toLocaleDateString('en-US', options);
}

function getStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function calculateTotal(dailyPrice, startDate, endDate) {
  if (!startDate || !endDate) return { days: 0, subtotal: 0, total: 0 };
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  const subtotal = dailyPrice * days;
  return { days, subtotal, total: subtotal };
}
