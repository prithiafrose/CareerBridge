document.addEventListener('DOMContentLoaded', () => {
  const jobListEl = document.getElementById('job-list');
  const searchForm = document.querySelector('form');
  if (!searchForm) return;
  const jobTitleInput = searchForm.querySelector('input[placeholder="Job title or keyword"]');
  const locationInput = searchForm.querySelector('input[placeholder="Location"]');
  const typeButtons = document.querySelectorAll('.category-btn'); 

  const searchButton = searchForm.querySelector('button');

  let jobsData = [];
  let currentType = '';

  async function fetchJobs() {
    try {
      const res = await fetch('http://localhost:5001/api/jobs');
      if (!res.ok) throw new Error('Failed to fetch jobs');

      const data = await res.json();
      jobsData = Array.isArray(data.jobs) ? data.jobs : [];

      renderJobs();
    } catch (err) {
      console.error("Error fetching jobs:", err);
      jobListEl.innerHTML = "<p class='text-center text-gray-600'>Error loading jobs</p>";
    }
  }

  function renderJobs() {
    const searchTerm = jobTitleInput.value.toLowerCase();
    const locationTerm = locationInput.value.toLowerCase();

    const filteredJobs = jobsData.filter(job => {
      const titleMatch = job.title.toLowerCase().includes(searchTerm);
      const locationMatch = job.location.toLowerCase().includes(locationTerm);
      const typeMatch = currentType ? job.type === currentType : true;
      return titleMatch && locationMatch && typeMatch;
    });

    jobListEl.innerHTML = filteredJobs.length === 0
      ? "<p class='text-center text-gray-600 col-span-full'>No jobs found</p>"
      : filteredJobs.map(job => `
          <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 class="text-xl font-semibold text-gray-800 mb-2">${escapeHTML(job.title)}</h3>
            <p class="text-gray-600 mb-1"><strong>Company:</strong> ${escapeHTML(job.company)}</p>
            <p class="text-gray-600 mb-1"><strong>Salary:</strong> ${escapeHTML(job.salary) || 'N/A'}</p>
            <p class="text-gray-600 mb-1"><strong>Location:</strong> ${escapeHTML(job.location) || 'N/A'}</p>
            <p class="text-gray-600 mb-4"><strong>Type:</strong> ${escapeHTML(job.type) || 'N/A'}</p>
            <button onclick="applyJob(${parseInt(job.id)})" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors">
  Apply Now
</button>

          </div>
        `).join('');
  }

  window.applyJob = function(id) {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!token) {
        window.location.href = './Auth/Login.html?redirect=' + encodeURIComponent(`../Apply.html?id=${id}`);
        return;
    }

    if (user.role !== "student") {
        alert("Only students can apply for jobs.");
        return;
    }

    window.location.href = `./Apply.html?id=${id}`;
};


  // Navigate to job details page
  // window.viewJob = function(id) {
  //   window.location.href = `./Student/job-list.html?id=${id}`;
  // };

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    renderJobs();
  });
   typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentType = btn.dataset.category; 
      typeButtons.forEach(b => b.classList.remove('bg-indigo-600', 'text-white'));
      btn.classList.add('bg-indigo-600', 'text-white');

      renderJobs();
    });
  });

  jobTitleInput.addEventListener('input', renderJobs);
  locationInput.addEventListener('input', renderJobs);

  fetchJobs();
});