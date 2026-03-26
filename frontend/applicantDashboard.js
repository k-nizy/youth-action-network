/* ===================================================
   applicantDashboard.js
   Navigation and data loading for Applicant Portal
   =================================================== */

const applicantDashboard = (function () {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  /* ---------- AUTH CHECK ---------- */
  async function checkAuth() {
    if (typeof api === 'undefined') return null;
    try {
      const user = await api.getMe();
      if (!user) {
         window.location.href = 'index.html';
         return null;
      }
      return user;
    } catch (err) {
      console.error('Auth check failed:', err);
      window.location.href = 'index.html';
      return null;
    }
  }

  /* ---------- STATUS HELPERS ---------- */
  const STATUS_CONFIG = {
    submitted:    { label: 'Submitted',    color: '#3b82f6', icon: '📨', msg: 'Your application has been received and is in the queue for review. Our team typically begins reviewing within 2–3 business days.' },
    screening:    { label: 'Screening',    color: '#8b5cf6', icon: '🔍', msg: 'Your application is currently being screened for eligibility. It will move to full review shortly.' },
    under_review: { label: 'Under Review', color: '#f59e0b', icon: '⏳', msg: 'Your application is being reviewed in detail by our membership committee. This usually takes 5-7 business days.' },
    approved:     { label: 'Approved',     color: '#10b981', icon: '✅', msg: 'Congratulations! Your application has been approved. Your account is now upgraded to Member — refresh the page to access the full member dashboard.' },
    rejected:     { label: 'Not Approved', color: '#ef4444', icon: '❌', msg: 'Unfortunately, your application was not approved at this time. Please check your email for detailed feedback from our team.' },
    appealed:     { label: 'Appealed',     color: '#0ea5e9', icon: '📤', msg: 'Your appeal has been received and is being reconsidered by the committee.' },
  };

  function getStatusConfig(status) {
    return STATUS_CONFIG[status] || { label: status || 'Pending', color: '#94a3b8', icon: '📋', msg: 'Your application is being processed.' };
  }

  /* ---------- LOAD APPLICATION STATUS ---------- */
  async function loadStatus() {
    const container = $('#applicationStatusContent');
    if (!container) return;

    try {
      const res = await api.request('/applications/mine', { method: 'GET' });
      const apps = res.data || res || [];

      if (!Array.isArray(apps) || apps.length === 0) {
        container.innerHTML = `
          <div style="text-align:center; padding:2.5rem 1rem;">
            <div style="font-size:3rem; margin-bottom:1rem;">📝</div>
            <h4 style="margin:0 0 0.5rem; color:var(--secondary);">No Application Found</h4>
            <p style="color:var(--text-secondary); margin-bottom:1.5rem; max-width:360px; margin-left:auto; margin-right:auto;">You haven't submitted a membership application yet. Join the Youth Advocates Network today!</p>
            <a href="application-form.html" style="display:inline-block; background:var(--primary); color:#fff; padding:12px 28px; border-radius:8px; font-weight:700; text-decoration:none; transition:transform .15s;">Apply Now →</a>
          </div>`;
        return;
      }

      const latest = apps[0];
      const status = latest.status || 'submitted';
      const cfg = getStatusConfig(status);
      const date = latest.submittedAt || latest.createdAt;
      const dateStr = date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
      const orgName = latest.submissionData?.organization?.name || latest.submissionData?.orgLegalName || 'Your Organization';

      container.innerHTML = `
        <div style="background: ${cfg.color}0a; border: 1px solid ${cfg.color}25; padding: 1.5rem; border-radius: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
                <div>
                    <h4 style="margin:0; font-size: 1.1rem; color: var(--secondary);">${cfg.icon} Application for ${orgName}</h4>
                    <p style="margin: 0.35rem 0 0; font-size: 0.85rem; color: var(--text-secondary);">Submitted on ${dateStr}</p>
                </div>
                <span style="background: ${cfg.color}18; color: ${cfg.color}; padding: 6px 16px; border-radius: 20px; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">
                    ${cfg.label}
                </span>
            </div>
            <p style="margin:0; font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary);">${cfg.msg}</p>
            ${latest.reviewerNotes ? `<div style="margin-top:1rem; padding:0.75rem 1rem; background:rgba(0,0,0,0.03); border-radius:8px; font-size:0.9rem;"><strong>Reviewer Notes:</strong> ${latest.reviewerNotes}</div>` : ''}
        </div>
      `;
    } catch (err) {
      console.error('Failed to load application status:', err);
      let errorMsg = 'Unable to load your application status.';
      if (err.status === 401) {
        errorMsg = 'Your session has expired. Please log in again.';
      } else if (err.message && !err.message.includes('Request failed')) {
        errorMsg = err.message;
      }
      container.innerHTML = `
        <div style="text-align:center; padding:2rem;">
          <div style="font-size:2rem; margin-bottom:0.5rem;">⚠️</div>
          <p style="color: #ef4444; margin:0;">${errorMsg}</p>
          <button onclick="location.reload()" style="margin-top:1rem; padding:8px 20px; border:1px solid #ddd; border-radius:8px; cursor:pointer; background:transparent; color:var(--secondary);">Retry</button>
        </div>`;
    }
  }

  /* ---------- LOAD UPCOMING EVENTS ---------- */
  async function loadEvents() {
      const container = $('#upcomingEventsList');
      if (!container) return;

      try {
          const events = await api.getEvents();
          if (!events || events.length === 0) {
              container.innerHTML = '<p style="color:var(--text-secondary); padding:1rem;">No upcoming public events scheduled.</p>';
              return;
          }

          container.innerHTML = events.slice(0, 3).map(ev => `
            <div style="display:flex; align-items:center; gap:1rem; padding: 12px 0; border-bottom:1px dotted #eee;">
                <div style="background:#e0f2fe; color:#0369a1; padding: 8px; border-radius: 8px; font-weight:bold; min-width: 50px; text-align:center;">
                    ${new Date(ev.date).getDate()}<br><span style="font-size:0.7rem;">${new Date(ev.date).toLocaleString('default', { month: 'short' })}</span>
                </div>
                <div>
                    <div style="font-weight:600;">${ev.title}</div>
                    <div style="font-size:0.8rem; color:var(--text-secondary);">${ev.location || 'Online'}</div>
                </div>
            </div>
          `).join('');
      } catch (err) {
          container.innerHTML = '<p style="color:var(--text-secondary); padding:1rem;">Could not load events.</p>';
      }
  }

  /* ---------- SIDEBAR NAVIGATION ---------- */
  function initNav() {
    const navItems = $$('.admin-nav button[data-view]');
    const sections = $$('.dashboard-section');

    // Logout button
    const logoutBtn = $('#logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        if (typeof api !== 'undefined') {
          await api.logout();
          window.location.href = 'index.html';
        }
      });
    }

    navItems.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.dataset.view;

        // Submit Application -> redirect
        if (targetView === 'submit') {
          window.location.href = 'application-form.html';
          return;
        }

        // Update active nav
        navItems.forEach(item => item.classList.remove('active'));
        btn.classList.add('active');

        // Switch sections
        sections.forEach(sec => {
          sec.style.display = (sec.id === targetView + 'Section') ? 'block' : 'none';
        });

        // Update topbar title
        if ($('#dashboardTitle')) {
          $('#dashboardTitle').textContent = btn.dataset.title || 'Applicant Portal';
        }

        // Lazy-load
        if (targetView === 'status') loadStatus();
      });
    });
  }

  /* ---------- SIDEBAR TOGGLE ---------- */
  function initSidebarToggle() {
    const sidebar = $('#adminSidebar');
    const overlay = $('#sidebarOverlay');
    const menuBtn = $('#menuBtn');

    if (!sidebar || !overlay || !menuBtn) return;

    function open() {
      sidebar.classList.add('open');
      overlay.classList.add('active');
    }
    function close() {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    }

    menuBtn.addEventListener('click', open);
    overlay.addEventListener('click', close);
    $$('.admin-nav button').forEach(btn => btn.addEventListener('click', close));
  }

  /* ---------- INIT ---------- */
  async function init() {
    initNav();
    initSidebarToggle();
    const user = await checkAuth();
    if (!user) return;

    // Populate user data
    if ($('#dispName')) $('#dispName').textContent = user.name;
    if ($('#dispEmail')) $('#dispEmail').textContent = user.email;

    // Sidebar role population
    const roleText = (user.role || 'applicant').toUpperCase();
    if ($('#sidebarRole')) $('#sidebarRole').textContent = roleText;
    if ($('#sidebarSubRole')) {
        $('#sidebarSubRole').textContent = 'Youth Network Portal';
    }

    loadEvents();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', applicantDashboard.init);
