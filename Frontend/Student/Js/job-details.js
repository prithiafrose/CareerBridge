const API_BASE = "/api";

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23d9d9d9'/><circle cx='50' cy='40' r='16' fill='%23a0a0a0'/><path d='M22 82c0-16 12-24 28-24s28 8 28 24' fill='%23a0a0a0'/></svg>";

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

function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `../Auth/Login.html?redirect=${returnUrl}`;
    return false;
  }
  return true;
}

function setupLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = "../Auth/Login.html";
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function loadJobDetails() {
  const container = document.getElementById('job-detail-container');
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get('id');

  if (!jobId) {
    container.innerHTML = '<p style="color:red">No job ID provided.</p>';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/jobs/${jobId}`, { headers: getAuthHeaders() });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Job not found');

    const job = data;
    const poster = job.poster || {};

    container.innerHTML = `
      <div class="card" style="max-width:800px;">
        <h2>${escapeHTML(job.title)}</h2>
        <p><strong>Company:</strong> ${escapeHTML(job.company)}</p>
        <p><strong>Location:</strong> ${escapeHTML(job.location) || 'Not specified'}</p>
        <p><strong>Type:</strong> ${escapeHTML(job.type) || 'Not specified'}</p>
        <p><strong>Salary:</strong> ${job.salary ? '$' + escapeHTML(String(job.salary)) : 'Not specified'}</p>
        <hr style="border-color:#333;margin:20px 0;">
        <p><strong>Description:</strong></p>
        <div style="white-space:pre-wrap;line-height:1.7;color:#ccc;">${escapeHTML(job.description) || 'No description provided.'}</div>
      </div>

      <div class="card" style="max-width:800px;margin-top:15px;">
        <h3>Posted By</h3>
        <p><strong>Name:</strong> ${escapeHTML(poster.username) || 'N/A'}</p>
        <p><strong>Email:</strong> ${escapeHTML(poster.email) || 'N/A'}</p>
      </div>

      <div style="max-width:800px;margin-top:20px;">
        <a href="../Apply.html?id=${parseInt(job.id)}" class="btn" style="display:inline-block;padding:12px 28px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;">Apply Now</a>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<p style="color:red">${escapeHTML(err.message)}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth()) return;

  loadJobDetails();

  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) logoutBtn.addEventListener('click', setupLogout);

  const logoutBtnSidebar = document.getElementById('logout-btn');
  if (logoutBtnSidebar) logoutBtnSidebar.addEventListener('click', setupLogout);
});
