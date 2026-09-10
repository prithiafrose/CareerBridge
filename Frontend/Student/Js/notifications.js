const NOTIF_API = "/api/student/notifications";

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString();
}

document.addEventListener('DOMContentLoaded', () => {
  const notifBtn = document.getElementById('notifBtn');
  const notifCount = document.getElementById('notifCount');
  const notifList = document.getElementById('notifList');
  const notifDropdown = document.getElementById('notifDropdown');

  if (!notifBtn || !notifCount || !notifList || !notifDropdown) return;
  if (!localStorage.getItem('token')) return;

  const dropdownOpen = () => notifDropdown.style.display === 'block';

  function setBadge(count) {
    notifCount.textContent = count > 0 ? (count > 99 ? '99+' : count) : '';
    notifCount.style.display = count > 0 ? 'inline-block' : 'none';
  }

  async function refreshUnreadCount() {
    try {
      const res = await fetch(`${NOTIF_API}/unread-count`, { headers: getAuthHeaders() });
      const data = await res.json();
      setBadge(data.count || 0);
    } catch (err) {
      console.error('Failed to load notification count:', err);
    }
  }

  async function renderNotifications() {
    notifList.innerHTML = '<li>Loading...</li>';

    try {
      const res = await fetch(NOTIF_API, { headers: getAuthHeaders() });
      const notifications = await res.json();

      if (!Array.isArray(notifications) || notifications.length === 0) {
        notifList.innerHTML = '<li>No notifications</li>';
        return;
      }

      notifList.innerHTML = notifications.map(n => `
        <li style="${n.read ? 'opacity:0.6;' : 'font-weight:bold;'}">
          <div>${escapeHTML(n.title)}</div>
          <div style="font-weight:normal;font-size:12px;color:#a0b0c9;margin-top:3px;">${escapeHTML(n.message)}</div>
          <div style="font-weight:normal;font-size:11px;color:#4f46e5;margin-top:3px;">${escapeHTML(formatTime(n.created_at))}</div>
        </li>
      `).join('');
    } catch (err) {
      console.error('Failed to load notifications:', err);
      notifList.innerHTML = '<li>Failed to load notifications</li>';
    }
  }

  async function markAllRead() {
    try {
      await fetch(`${NOTIF_API}/read`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      setBadge(0);
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  }

  notifBtn.addEventListener('click', async () => {
    notifDropdown.style.display = dropdownOpen() ? 'none' : 'block';

    if (!dropdownOpen()) return;

    await renderNotifications();

    if (notifCount.textContent && notifCount.textContent !== '0') {
      await markAllRead();
    }
  });

  document.addEventListener('click', (e) => {
    const wrapper = document.querySelector('.notification-wrapper');
    if (wrapper && !wrapper.contains(e.target) && dropdownOpen()) {
      notifDropdown.style.display = 'none';
    }
  });

  refreshUnreadCount();
});