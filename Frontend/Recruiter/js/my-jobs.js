const API = "/api";

// Get auth token
function getAuthToken() {
  return localStorage.getItem('token');
}

// Common fetch options with auth
function authFetchOptions(options = {}) {
  return {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
      ...options.headers
    }
  };
}

// Load My Jobs
if (document.getElementById("jobList")) {
  fetch(API + "/recruiter/jobs", authFetchOptions())
    .then(r => {
      if (r.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '../Auth/Login.html';
      }
      if (!r.ok) throw new Error('Failed to fetch jobs');
      return r.json();
    })
    .then(data => {
      const jobList = document.getElementById("jobList");
      if (data.error) {
        jobList.innerHTML = `<p style="color: red;">Error: ${data.error}</p>`;
        return;
      }
      if (data.length === 0) {
        jobList.innerHTML = '<p>No jobs posted yet. <a href="add-job.html">Post your first job</a></p>';
        return;
      }

      jobList.innerHTML = data.map(job => {
        const type = (job.type || '').toLowerCase();
        const typeClass = ['full-time', 'part-time', 'internship', 'contract'].includes(type) ? type : 'default';
        const pin = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>';
        const cash = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>';
        return `
        <div class="job-card">
          <div class="jc-top">
            <div class="jc-avatar">${escapeHTML((job.company || 'H')[0].toUpperCase())}</div>
            <div class="jc-id">
              <div class="jc-title">${escapeHTML(job.title)}</div>
              <div class="jc-company">${escapeHTML(job.company)}</div>
            </div>
            <span class="jb jb-${typeClass}">${escapeHTML(job.type) || 'Job'}</span>
          </div>
          <div class="jc-meta">
            <span class="jm">${pin}${escapeHTML(job.location) || 'Not specified'}</span>
            <span class="jm">${cash}${job.salary ? '$' + escapeHTML(job.salary) : 'Not specified'}</span>
          </div>
          <p class="jc-desc">${escapeHTML(job.description) || 'No description provided.'}</p>
          <div class="jc-foot job-actions">
            <button class="btn btn-edit" onclick="editJob(${parseInt(job.id)})">Edit</button>
            <button class="btn btn-delete" onclick="deleteJob(${parseInt(job.id)})">Delete</button>
            <button class="btn btn-view" onclick="viewApplicants(${parseInt(job.id)})">View Applicants</button>
          </div>
        </div>
      `;
      }).join("");
    })
    .catch(err => {
      console.error('Error loading jobs:', err);
      const jobList = document.getElementById("jobList");
      jobList.innerHTML = `<p style="color: red;">Error loading jobs: ${err.message}</p>`;
    });
}

// Job management functions
window.editJob = function(jobId) {
  // For now, redirect to add-job with edit parameter
  window.location.href = `add-job.html?edit=${jobId}`;
};

window.deleteJob = function(jobId) {
  if (confirm('Are you sure you want to delete this job?')) {
    fetch(`${API}/recruiter/jobs/${jobId}`, {
      ...authFetchOptions(),
      method: 'DELETE'
    })
    .then(r => {
      if (r.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '../Auth/Login.html';
      }
      if (!r.ok) throw new Error('Failed to delete job');
      return r.json();
    })
    .then(() => {
      alert('Job deleted successfully');
      location.reload();
    })
    .catch(err => {
      console.error('Error deleting job:', err);
      alert('Failed to delete job');
    });
  }
};

window.viewApplicants = function(jobId) {
  window.location.href = `applicants.html?jobId=${jobId}`;
};

// Logout function
window.logout = function() {
  if (confirm('Are you sure you want to logout?')) {
    fetch(`${API}/auth/logout`, {
      ...authFetchOptions(),
      method: 'POST'
    })
    .then(r => {
      if (!r.ok) throw new Error('Logout failed');
      return r.json();
    })
    .then(() => {
      // Remove token from localStorage
      localStorage.removeItem('token');
      // Redirect to login page
      window.location.href = '../Auth/Login.html';
    })
    .catch(err => {
      console.error('Error during logout:', err);
      // Even if API call fails, remove token and redirect
      localStorage.removeItem('token');
      window.location.href = '../Auth/Login.html';
    });
  }
};

// Check authentication on page load
function checkAuth() {
  const token = getAuthToken();
  if (!token) {
    window.location.href = '../Auth/Login.html';
    return;
  }

  // Verify token is valid by checking user info
  fetch(`${API}/auth/me`, authFetchOptions())
    .then(r => {
      if (!r.ok) {
        throw new Error('Invalid token');
      }
      return r.json();
    })
    .then(data => {
      if (data.user.role !== 'recruiter') {
        alert('Access denied. Recruiter role required.');
        localStorage.removeItem('token');
        window.location.href = '../Auth/Login.html';
      }
    })
    .catch(err => {
      console.error('Auth check failed:', err);
      localStorage.removeItem('token');
      window.location.href = '../Auth/Login.html';
    });
}

// Run auth check when page loads
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
});