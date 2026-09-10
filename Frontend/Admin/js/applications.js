document.addEventListener("DOMContentLoaded", async () => {
  await checkAdminAuth();

  const tableBody = document.getElementById("applicationsTableBody");
  const logoutBtn = document.getElementById("logout");

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "../Auth/login.html";
  });

  async function loadApplications() {
    try {
      const res = await fetchWithAuth("/admin/applications");
      if (!res || !res.ok) {
        console.error("Failed to fetch applications:", res ? res.status : "No response");
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Failed to load applications</td></tr>';
        return;
      }

      const applications = await res.json();

      if (!applications || applications.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No applications found</td></tr>';
        return;
      }

      tableBody.innerHTML = applications.map(app => `
        <tr>
          <td>${parseInt(app.id)}</td>
          <td>${escapeHTML(app.name)}</td>
          <td>${escapeHTML(app.email)}</td>
          <td>${escapeHTML(app.job)}</td>
          <td>${escapeHTML(app.company)}</td>
          <td>
            ${app.resume_path
              ? `<a href="/uploads/${escapeHTML(app.resume_path.split(/[\\\\/]/).pop())}" target="_blank" class="btn btn-small">View Resume</a>`
              : 'No resume'}
          </td>
          <td><span class="status-${escapeHTML(app.status)}">${escapeHTML(app.status)}</span></td>
        </tr>
      `).join("");
    } catch (err) {
      console.error("Error loading applications:", err);
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Error loading applications</td></tr>';
    }
  }

  loadApplications();
});