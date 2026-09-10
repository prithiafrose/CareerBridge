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

  const TYPE_PILL = {
    'full-time': 'bg-emerald-50 text-emerald-600',
    'part-time': 'bg-amber-50 text-amber-600',
    'internship': 'bg-sky-50 text-sky-600',
    'contract': 'bg-violet-50 text-violet-600',
    'default': 'bg-gray-100 text-gray-600'
  };

  const PIN_ICON = '<svg class="w-3.5 h-3.5 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>';
  const CASH_ICON = '<svg class="w-3.5 h-3.5 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>';

  function typePill(type) {
    const t = (type || '').toLowerCase();
    return TYPE_PILL[t] || TYPE_PILL.default;
  }

  function updateStats() {
    const total = jobsData.length;
    const companies = new Set(jobsData.map(j => (j.company || '').trim()).filter(Boolean)).size;
    const types = new Set(jobsData.map(j => (j.type || '').trim()).filter(Boolean)).size;

    const statJobs = document.getElementById('statJobs');
    const statCompanies = document.getElementById('statCompanies');
    const statTypes = document.getElementById('statTypes');
    const liveBadge = document.getElementById('liveBadge');

    if (statJobs) statJobs.textContent = total.toLocaleString();
    if (statCompanies) statCompanies.textContent = companies.toLocaleString();
    if (statTypes) statTypes.textContent = types.toLocaleString();
    if (liveBadge) liveBadge.textContent = `${total.toLocaleString()} live openings right now`;

    const card = document.getElementById('heroFloatingCard');
    const latest = jobsData[0];
    if (card && latest) {
      const title = document.getElementById('heroJobTitle');
      const company = document.getElementById('heroJobCompany');
      const avatar = document.getElementById('heroJobAvatar');
      if (title) title.textContent = latest.title;
      if (company) company.textContent = `â— New Â· ${latest.company}`;
      if (avatar) avatar.textContent = (latest.company || 'H')[0].toUpperCase();
      card.classList.remove('hidden');
    }
  }

  async function fetchJobs() {
    try {
      const res = await fetch('/api/jobs?limit=10000');
      if (!res.ok) throw new Error('Failed to fetch jobs');

      const data = await res.json();
      jobsData = Array.isArray(data.jobs) ? data.jobs : [];

      updateStats();
      renderJobs();
    } catch (err) {
      console.error("Error fetching jobs:", err);
      jobListEl.innerHTML = "<p class='text-center text-gray-600 bg-white rounded-xl py-12'>Error loading jobs</p>";
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
      ? "<p class='text-center text-gray-600 col-span-full bg-white rounded-xl py-12 border border-dashed border-gray-200'>No matching jobs found</p>"
      : filteredJobs.map(job => `
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-indigo-100 transition-all duration-200 p-6 flex flex-col relative overflow-hidden">
            <span class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-sky-400"></span>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-400 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow">${escapeHTML((job.company || 'H')[0].toUpperCase())}</div>
              <div class="min-w-0">
                <h3 class="text-lg font-bold text-gray-900 truncate">${escapeHTML(job.title)}</h3>
                <p class="text-sm text-gray-500 truncate">${escapeHTML(job.company)}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 flex-wrap mb-3">
              <span class="${typePill(job.type)} text-xs font-semibold px-3 py-1 rounded-full">${escapeHTML(job.type) || 'Job'}</span>
              <span class="bg-gray-50 border border-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full inline-flex items-center gap-1">${PIN_ICON} ${escapeHTML(job.location) || 'Anywhere'}</span>
              <span class="bg-gray-50 border border-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full inline-flex items-center gap-1">${CASH_ICON} ${escapeHTML(job.salary) ? '$' + escapeHTML(job.salary) : 'On request'}</span>
            </div>
            <p class="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-5 flex-1">${escapeHTML(job.description) || 'No description provided.'}</p>
            <button onclick="applyJob(${parseInt(job.id)})" class="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 hover:shadow-lg transition">
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