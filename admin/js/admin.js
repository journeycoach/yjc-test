// Shared admin utilities

const API_BASE = '/api/admin';

// Check auth on page load (call this on every protected page)
function requireAdminAuth() {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    window.location.href = '/admin/index.html';
    return null;
  }
  return token;
}

// Authenticated fetch wrapper
function adminFetch(path, options = {}) {
  const token = localStorage.getItem('admin_token');
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
}

// Show a flash message
function showFlash(message, type = 'success') {
  const existing = document.querySelector('.flash');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = `flash flash-${type}`;
  el.textContent = message;
  document.querySelector('.admin-main')?.prepend(el);
  setTimeout(() => el.remove(), 4000);
}

// Logout
function logout() {
  localStorage.removeItem('admin_token');
  window.location.href = '/admin/index.html';
}

// Format date for display
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
