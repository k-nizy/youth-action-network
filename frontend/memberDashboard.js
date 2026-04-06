/* ===================================================
   memberDashboard.js
   Navigation, data loading, admin redirect
   =================================================== */

const memberDashboard = (function () {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  /* ---------- AUTH + ADMIN REDIRECT ---------- */
  async function checkAuth() {
    if (typeof api === 'undefined') return null;
    try {
      const user = await api.getMe();
      if (!user) return null;

      // Admin redirect: admins should go to admin.html, not member dashboard
      if (user.role === 'admin') {
        const params = new URLSearchParams(window.location.search);
        const view = params.get('view');
        const target = view ? `admin.html?view=${view}` : 'admin.html';
        window.location.href = target;
        return null;
      }
      if (user.role === 'applicant') {
        window.location.href = 'applicant.html';
        return null;
      }
      return user;
    } catch (err) {
      console.error('Auth check failed:', err);
      return null;
    }
  }

  /* ---------- LOAD DASHBOARD METRICS ---------- */
  async function loadMetrics(user) {
    try {
      const enrollments = await api.getMyEnrollments();
      const allCourses = await api.getCourses().catch(() => []);
      let events = [];
      try { events = await api.getEvents(); } catch (e) { /* events endpoint may not exist */ }

      if ($('#statModules')) $('#statModules').textContent = enrollments.length || 0;
      if ($('#statAssignments')) {
        const pending = enrollments.filter(e => e.status === 'pending' || e.status === 'in-progress').length;
        $('#statAssignments').textContent = pending;
      }
      if ($('#statEvents')) $('#statEvents').textContent = events.length || 0;
      if ($('#statCertificates')) $('#statCertificates').textContent = user.certificates?.length || 0;

      // Dashboard course preview
      loadCoursePreview(enrollments);
      // Profile view course list
      loadCourseList(enrollments);

      // Capacity Building Integration
      renderCapacityBuilding(allCourses, enrollments);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
  }

  /* ---------- DASHBOARD COURSE PREVIEW ---------- */
  function loadCoursePreview(enrollments) {
    const container = $('#dashCoursePreview');
    if (!container) return;

    if (!enrollments || enrollments.length === 0) {
      container.innerHTML = '<p style="color:var(--text-secondary); padding:1rem;">No courses enrolled yet. Browse our <a href="index.html#capacity" style="color:var(--primary-color);">Capacity Building</a> modules.</p>';
      return;
    }

    container.innerHTML = enrollments.slice(0, 4).map(e => {
      const course = e.course;
      if (!course) return '';
      const total = course.lessons?.length || 0;
      const done = e.completedLessons?.length || 0;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 0; border-bottom:1px solid #eee;">
          <div>
            <div style="font-weight:600;">${course.title}</div>
            <div style="font-size:0.8rem; color:var(--text-secondary);">${done}/${total} lessons</div>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:80px; height:6px; background:#eee; border-radius:4px; overflow:hidden;">
              <div style="width:${pct}%; height:100%; background:linear-gradient(90deg,#00BCD4,#0D47A1);"></div>
            </div>
            <span style="font-size:0.8rem; font-weight:600; color:var(--secondary-color);">${pct}%</span>
          </div>
        </div>`;
    }).join('');
  }

  /* ---------- PROFILE COURSE LIST ---------- */
  function loadCourseList(enrollments) {
    const container = $('#courseList');
    if (!container) return;

    if (!enrollments || enrollments.length === 0) {
      container.innerHTML = '<p style="color:var(--text-secondary);">No courses enrolled yet.</p>';
      return;
    }

    container.innerHTML = enrollments.map(e => {
      const course = e.course;
      if (!course) return '';
      const total = course.lessons?.length || 0;
      const done = e.completedLessons?.length || 0;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return `
        <div class="mdModuleCard" style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; padding: 15px; border-radius: 12px; border: 1px solid #eee;">
          <div>
            <div style="font-weight: 700; color: var(--secondary);">${course.title}</div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">${course.category || 'Module'} • ${total} lessons</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 800; color: #00B4D8;">${pct}% Done</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${done}/${total} completed</div>
          </div>
        </div>`;
    }).join('');
  }

  /* ---------- CAPACITY BUILDING MODULES ---------- */
  let cbState = {
    selectedQuarter: 'Q1',
    courses: [],
    enrollments: []
  };

  function renderCapacityBuilding(allCourses, enrollments) {
    cbState.courses = allCourses.filter(c => c.quarter); // Filter out generic courses if any
    if (cbState.courses.length === 0) {
      const list = $('#moduleList');
      if (list) list.innerHTML = `<div class="mdEmptyCard">No capacity building modules found. Ensure the seeding script was run by Admin.</div>`;
      return; // No capacity courses yet
    }
    
    cbState.enrollments = enrollments;

    bindQuarterTabs();
    bindViewerUI();
    
    // Default to the first quarter or currently selected
    renderQuarter(cbState.selectedQuarter);

    // Initial Dropdown
    populateSubmissionModuleDropdown(cbState.selectedQuarter);
    
    // Load Submission History
    loadSubmissionHistory();
    
    // Bind Submission Logic if not bound
    if (!cbState.submissionBound) {
        bindSubmissionLogic();
        cbState.submissionBound = true;
    }
  }

  function renderQuarter(q) {
    if ($('#quarterName')) {
        $('#quarterName').textContent = 'All Modules';
    }
    
    $$('.mdQuarterTab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.quarter === q);
    });

    const list = $('#moduleList');
    if (!list) return;
    list.innerHTML = '';

    const quarterCourses = cbState.courses;
    
    if (quarterCourses.length === 0) {
      list.innerHTML = `<div class="mdEmptyCard">No capability building modules yet for ${q}.</div>`;
      return;
    }

    quarterCourses.forEach(course => {
      const enrolled = cbState.enrollments.find(e => e.course && e.course._id === course._id);
      const total = course.lessons?.length || 1;
      const done = enrolled?.completedLessons?.length || 0;
      const pct = Math.round((done / total) * 100);
      const completed = pct === 100;

      let videoUrl = '';
      let lessonId = '';
      if (course.lessons && course.lessons.length > 0) {
        videoUrl = course.lessons[0].videoUrl || '';
        lessonId = course.lessons[0]._id || '';
      }

      const card = document.createElement("div");
      card.className = `mdModuleCard`;
      card.innerHTML = `
        <div class="mdModuleTop">
          <div>
            <div class="mdModuleTitle">${course.title}</div>
            <div class="mdModuleDesc">${course.description}</div>
          </div>
          <div class="mdModuleBadge ${completed ? "completed" : "not-started"}">
            ${completed ? "Completed" : "Not started"}
          </div>
        </div>
        <div class="mdModuleProgress">
          <div class="mdModuleProgressRow">
            <span>Progress</span>
            <span>${pct}%</span>
          </div>
          <div class="mdMiniBar">
            <div class="mdMiniFill" style="width:${pct}%"></div>
          </div>
        </div>
        <div class="mdModuleActions">
          <button class="btn btn-outline btn-small view-module-btn" data-course-id="${course._id || course.id}" data-lesson-id="${lessonId}">
            View module
          </button>
          <button class="btn btn-primary btn-small complete-module-btn" data-course-id="${course._id || course.id}" data-lesson-id="${lessonId}" ${completed ? "disabled" : ""}>
            Mark complete
          </button>
        </div>
      `;
      list.appendChild(card);
    });

    list.querySelectorAll('.view-module-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const btnEl = e.currentTarget;
        console.log('[LMS] View Module click:', btnEl.dataset.courseId, btnEl.dataset.lessonId);
        openModuleViewer(btnEl.dataset.courseId, btnEl.dataset.lessonId);
      });
    });

    list.querySelectorAll('.complete-module-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const btnEl = e.currentTarget;
        console.log('[LMS] Mark Complete click:', btnEl.dataset.courseId, btnEl.dataset.lessonId);
        btnEl.disabled = true;
        btnEl.textContent = "Marking...";
        await markLessonComplete(btnEl.dataset.courseId, btnEl.dataset.lessonId);
        btnEl.textContent = "Mark complete";
      });
    });
  }

  function bindQuarterTabs() {
    $$('.mdQuarterTab').forEach(btn => {
      // Prevent multiple binding if called twice
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener('click', () => {
        cbState.selectedQuarter = newBtn.dataset.quarter;
        renderQuarter(cbState.selectedQuarter);
        populateSubmissionModuleDropdown(cbState.selectedQuarter);
      });
    });
  }

  function populateSubmissionModuleDropdown(q) {
    const select = $('#submissionModule');
    if (!select) return;
    
    // Attempting to maintain previously selected option if valid
    const prev = select.value;
    select.innerHTML = '<option value="">Select module…</option>';
    cbState.courses.forEach(course => {
      const opt = document.createElement('option');
      opt.value = course._id;
      opt.textContent = course.title;
      select.appendChild(opt);
    });
    
    if ([...select.options].some(o => o.value === prev)) select.value = prev;
    
    // Trigger validation
    validateSubmissionForm();
  }

  function openModuleViewer(courseId, lessonId) {
    console.log('[LMS] openModuleViewer called with target:', courseId, lessonId);
    console.log('[LMS] Available courses:', cbState.courses.map(c => c._id || c.id));
    
    const course = cbState.courses.find(c => String(c._id || c.id) === String(courseId));
    if (!course) {
        console.error("[LMS] Course not found in cbState", courseId, cbState.courses);
        return;
    }

    const lesson = course.lessons?.find(l => String(l._id || l.id) === String(lessonId)) || course.lessons?.[0];
    const title = course.title;
    const url = lesson?.videoUrl || '';
    const content = lesson?.content || '';
    const resources = lesson?.resources || [];

    if ($('#viewerTitle')) $('#viewerTitle').textContent = title;
    
    const iframe = $('#moduleViewerFrame');
    const extCard = $('#moduleExternalCard');
    const extBtn = $('#externalCardLaunchBtn');
    const newTabBtn = $('#openInNewTabBtn');
    
    // Check if it's a Canva or blocked iframe source
    const isExternalOnly = lesson?.videoUrl && (
      lesson.videoUrl.includes('canva.com') || 
      lesson.videoUrl.includes('slideshare')
    );

    let hasMedia = false;

    if (lesson?.videoUrl) {
      if (isExternalOnly) {
        iframe.style.display = 'none';
        newTabBtn.style.display = 'none'; // Replaced by the big card button
        extCard.style.display = 'flex';
        extBtn.href = lesson.videoUrl;
      } else {
        extCard.style.display = 'none';
        newTabBtn.style.display = 'block';
        iframe.style.display = 'block';
        iframe.src = encodeURI(lesson.videoUrl);
        newTabBtn.onclick = () => window.open(lesson.videoUrl, '_blank');
      }
      hasMedia = true;
    } else {
      iframe.style.display = 'none';
      extCard.style.display = 'none';
      newTabBtn.style.display = 'none';
    }

    const contentArea = $('#moduleContentArea');
    const emptyState = $('#moduleEmptyState');

    // Handle Text Content & Resources
    if ((content && content.trim() !== '') || resources.length > 0) {
        if (contentArea) contentArea.style.display = 'block';
        
        const textBox = $('#moduleTextContent');
        if (textBox) textBox.innerHTML = content || '';

        const resWrapper = $('#moduleResourcesWrapper');
        const resList = $('#moduleResourcesList');
        if (resWrapper && resList) {
            if (resources.length > 0) {
                resWrapper.style.display = 'block';
                resList.innerHTML = resources.map((r, index) => {
                    const url = typeof r === 'string' ? r : r?.url;
                    const title = typeof r === 'string' ? `Resource Link ${index + 1}` : r?.title || `Resource Link ${index + 1}`;
                    return `<li><a href="${url}" target="_blank" style="color:#007bff; text-decoration:none; display:flex; align-items:center; gap:5px;">
                        <i class="fas fa-file-lines" aria-hidden="true"></i> ${title}
                    </a></li>`;
                }).join('');
            } else {
                resWrapper.style.display = 'none';
                resList.innerHTML = '';
            }
        }
        hasMedia = true;
    } else {
        if (contentArea) contentArea.style.display = 'none';
    }

    // Handle completely empty State
    if (!hasMedia) {
        if (emptyState) emptyState.style.display = 'flex';
    } else {
        if (emptyState) emptyState.style.display = 'none';
    }
    
    const completeBtn = $('#markCompleteBtn');
    if (completeBtn) {
      completeBtn.dataset.courseId = courseId;
      completeBtn.dataset.lessonId = lessonId || '';
      
      const enrolled = cbState.enrollments.find(e => e.course && e.course._id === courseId);
      const isDone = enrolled?.completedLessons?.includes(lessonId);
      completeBtn.disabled = !!isDone;
    }
    
    $('#moduleViewerModal')?.classList.add('active');
  }

  async function markLessonComplete(courseId, lessonId) {
    if (!courseId || !lessonId) return;
    
    let enrolled = cbState.enrollments.find(e => e.course && (String(e.course._id) === String(courseId) || String(e.course.id) === String(courseId)));
    if (!enrolled) {
      await api.enrollInCourse(courseId).catch(console.error);
    }
    
    try {
      await api.updateLessonProgress(courseId, lessonId);
      cbState.enrollments = await api.getMyEnrollments();
      renderQuarter(cbState.selectedQuarter);
      $('#moduleViewerModal')?.classList.remove('active');
    } catch (err) {
      console.error('Failed to mark complete', err);
    }
  }

  function bindViewerUI() {
    const completeBtn = $('#markCompleteBtn');
    if (completeBtn) {
        // Cloning prevents multi-bindings
        const newBtn = completeBtn.cloneNode(true);
        completeBtn.parentNode.replaceChild(newBtn, completeBtn);
        newBtn.addEventListener('click', (e) => {
            const btnEl = e.target;
            btnEl.disabled = true;
            btnEl.textContent = 'Marking...';
            markLessonComplete(btnEl.dataset.courseId, btnEl.dataset.lessonId);
            btnEl.textContent = "Mark As Complete";
        });
    }
    
    const openBtn = $('#openInNewTabBtn');
    if (openBtn) {
        const newBtn = openBtn.cloneNode(true);
        openBtn.parentNode.replaceChild(newBtn, openBtn);
        newBtn.addEventListener('click', (e) => {
            const url = e.target.dataset.url || $('#moduleViewerFrame')?.src;
            if (url && url !== window.location.href && !url.endsWith('profile.html')) {
                window.open(url, '_blank');
            }
        });
    }

    $$('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        if(btn.dataset.close === "moduleViewerModal") {
            // Stop iframe video by removing src
            if ($('#moduleViewerFrame')) $('#moduleViewerFrame').src = '';
        }
        const target = $('#' + btn.dataset.close);
        if (target) target.classList.remove('active');
      });
    });
  }

  /* ---------- LOAD APPLICATIONS ---------- */
  async function loadApplications() {
    const container = $('#applicationsList');
    if (!container) return;

    container.innerHTML = '<p style="padding:1rem; color:var(--text-secondary);">Loading applications...</p>';
    try {
      const res = await api.request('/applications/mine', { method: 'GET' });
      const apps = res.data || res || [];

      if (!Array.isArray(apps) || apps.length === 0) {
        container.innerHTML = `
          <div style="text-align:center; padding:2rem;">
            <div style="font-size:2.5rem; margin-bottom:0.5rem;"><i class="fas fa-clipboard-list" aria-hidden="true"></i></div>
            <p style="color:var(--text-secondary);">You haven't submitted any applications yet.</p>
            <a href="application-form.html" class="btn btn-primary" style="margin-top:1rem; display:inline-block;">Submit Application</a>
          </div>`;
        return;
      }

      container.innerHTML = `
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr style="text-align:left; border-bottom:2px solid #eee;">
              <th style="padding:10px;">Organization</th>
              <th style="padding:10px;">Status</th>
              <th style="padding:10px;">Date</th>
            </tr>
          </thead>
          <tbody>
            ${apps.map(a => {
              const orgName = a.submissionData?.organization?.name || a.organizationName || 'N/A';
              const status = a.status || 'pending';
              const date = a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'N/A';
              const statusColor = status === 'approved' ? '#10b981' : status === 'rejected' ? '#ef4444' : '#f59e0b';
              return `
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="padding:12px; font-weight:500;">${orgName}</td>
                  <td style="padding:12px;">
                    <span style="background:${statusColor}15; color:${statusColor}; padding:4px 10px; border-radius:12px; font-size:0.8rem; font-weight:600;">
                      ${status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </td>
                  <td style="padding:12px; color:var(--text-secondary);">${date}</td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>`;
    } catch (err) {
      console.error('Failed to load applications:', err);
      container.innerHTML = `
        <div style="text-align:center; padding:2rem;">
          <div style="font-size:2.5rem; margin-bottom:0.5rem;"><i class="fas fa-clipboard-list" aria-hidden="true"></i></div>
          <p style="color:var(--text-secondary);">No applications found or unable to load.</p>
          <a href="application-form.html" class="btn btn-primary" style="margin-top:1rem; display:inline-block;">Submit Application</a>
        </div>`;
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

    // Topbar buttons bridge
    const topbarAppsBtn = $('#topbarAppsBtn');
    if (topbarAppsBtn) {
      topbarAppsBtn.addEventListener('click', () => {
        const appsBtn = document.querySelector('[data-view="applications"]');
        if (appsBtn) appsBtn.click();
      });
    }

    navItems.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.dataset.view;

        // Submit Application -> redirect immediately
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

        // Update topbar title from data-title attribute
        if ($('#dashboardTitle')) {
          $('#dashboardTitle').textContent = btn.dataset.title || 'Member Dashboard';
        }

        // Lazy-load data for specific sections
        if (targetView === 'applications') {
          loadApplications();
        }
      });
    });
  }

  /* ---------- URL ROUTING ---------- */
  function checkInitialView() {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (view === 'profile') {
      const profileBtn = document.querySelector('[data-view="profile"]');
      if (profileBtn) profileBtn.click();
    }
  }

  /* ---------- MODAL ---------- */
  function initModal() {
    const editBtn = $('#editProfileBtn');
    const modal = $('#editProfileModal');
    const closeBtn = $('#closeProfileModal');
    const cancelBtn = $('#cancelEdit');
    const overlay = $('#modalOverlay');

    if (!editBtn || !modal) return;

    editBtn.addEventListener('click', () => modal.classList.add('active'));
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    if (cancelBtn) cancelBtn.addEventListener('click', () => modal.classList.remove('active'));
    if (overlay) overlay.addEventListener('click', () => modal.classList.remove('active'));

    // Form Submission
    const form = $('#editProfileForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = form.querySelector('button[type="submit"]');
        const errBox = $('#editProfileError');
        const errText = $('#editProfileErrorText');

        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        if (errBox) errBox.style.display = 'none';

        try {
          const name = $('#editName').value;
          const bio = $('#editBio').value;

          await api.updateDetails(name, undefined, undefined, bio);
          
          // Successful update — simple page reload to refresh all data or update DOM
          window.location.reload(); 
        } catch (err) {
          console.error('Update failed:', err);
          if (errBox && errText) {
            errText.textContent = err.message || 'Update failed. Please try again.';
            errBox.style.display = 'block';
          }
        } finally {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save Changes';
        }
      });
    }
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
    initModal();
    initSidebarToggle();

    const user = await checkAuth();
    if (!user) return; // If not authed or admin-redirected, stop here

    // Populate user data into profile section
    if ($('#dispName')) $('#dispName').textContent = user.name;
    if ($('#dispEmail')) $('#dispEmail').textContent = user.email;
    if ($('#dispRole')) $('#dispRole').textContent = (user.role || 'member').charAt(0).toUpperCase() + (user.role || 'member').slice(1);
    
    if ($('#editName')) $('#editName').value = user.name || '';
    if ($('#editBio')) $('#editBio').value = user.bio || '';

    // If bio exists, maybe display it (optional: adding a bio display row if you want)
    if (user.bio) {
        // Just for reference, we can add more fields to the grid if needed
    }

    // Organization data
    if (user.organization) {
      const orgRow = $('#orgRow');
      const dispOrg = $('#dispOrg');
      if (orgRow) orgRow.style.display = 'flex';
      if (dispOrg) dispOrg.textContent = user.organization.name || user.organization;
    }

    // Load dashboard metrics
    loadMetrics(user);

    // Sidebar role population
    const roleText = (user.role || 'member').toUpperCase();
    if ($('#sidebarRole')) $('#sidebarRole').textContent = roleText;
    if ($('#sidebarSubRole')) {
        $('#sidebarSubRole').textContent = user.role === 'applicant' ? 'Dashboard' : 'Learning Workspace';
    }

    // Initial view routing
    checkInitialView();
  }

  /* ---------- ASSIGNMENT SUBMISSION LOGIC ---------- */
  let currentFile = null;

  function bindSubmissionLogic() {
    const dropzone = $('#dropzone');
    const fileInput = $('#fileInput');
    const submitBtn = $('#submitAssignmentBtn');
    const quarterSelect = $('#submissionQuarter');
    const moduleSelect = $('#submissionModule');

    if (!dropzone || !fileInput || !submitBtn) return;

    // Trigger file select on click
    dropzone.addEventListener('click', () => fileInput.click());

    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evtName => {
      dropzone.addEventListener(evtName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    });

    ['dragenter', 'dragover'].forEach(evtName => {
      dropzone.addEventListener(evtName, () => dropzone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(evtName => {
      dropzone.addEventListener(evtName, () => dropzone.classList.remove('dragover'), false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length) handleFileSelect(files[0]);
    });

    fileInput.addEventListener('change', function() {
      if (this.files.length) handleFileSelect(this.files[0]);
    });

    // Validations on select change
    quarterSelect.addEventListener('change', () => {
      populateSubmissionModuleDropdown(quarterSelect.value);
    });
    
    moduleSelect.addEventListener('change', validateSubmissionForm);

    // Submit handler
    submitBtn.addEventListener('click', handleAssignmentSubmit);
  }

  function handleFileSelect(file) {
    if (!file) return;
    
    const maxMb = 50;
    if (file.size > maxMb * 1024 * 1024) {
      showSubmissionAlert(`File too large. Maximum size is ${maxMb}MB.`, 'error');
      return;
    }

    currentFile = file;
    const preview = $('#filePreview');
    if (preview) {
      preview.innerHTML = `
        <div style="background:#f0f9ff; border:1px solid #b6e3ff; padding:10px; border-radius:8px; margin-top:10px; display:flex; justify-content:space-between; align-items:center;">
          <div><span style="font-size:1.2rem; margin-right:8px;"><i class="fas fa-file-arrow-up" aria-hidden="true"></i></span> <strong>${file.name}</strong> (${Math.round(file.size / 1024)} KB)</div>
          <button id="removeFileBtn" style="background:none; border:none; cursor:pointer; color:#ef4444; font-weight:bold;">×</button>
        </div>
      `;
      $('#removeFileBtn').addEventListener('click', () => {
        currentFile = null;
        $('#fileInput').value = '';
        preview.innerHTML = '';
        validateSubmissionForm();
      });
    }
    
    validateSubmissionForm();
    showSubmissionAlert('', ''); // Clear errors
  }

  function validateSubmissionForm() {
    const moduleSelect = $('#submissionModule');
    const submitBtn = $('#submitAssignmentBtn');
    if (!moduleSelect || !submitBtn) return;

    if (moduleSelect.value && currentFile) {
      submitBtn.disabled = false;
    } else {
      submitBtn.disabled = true;
    }
  }

  function showSubmissionAlert(msg, type) {
    const alertEl = $('#submissionAlert');
    if (!alertEl) return;
    if (!msg) {
      alertEl.className = 'mdAlert hidden';
      alertEl.textContent = '';
      return;
    }
    alertEl.textContent = msg;
    alertEl.className = `mdAlert ${type}`;
  }

  async function handleAssignmentSubmit() {
    const moduleSelect = $('#submissionModule');
    const quarterSelect = $('#submissionQuarter');
    const submitBtn = $('#submitAssignmentBtn');

    if (!currentFile || !moduleSelect.value) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading...';
    showSubmissionAlert('', '');

    try {
      // 1. Upload to Cloudinary
      const uploadResult = await api.uploadFile(currentFile);
      
      // 2. Submit Assignment Record
      submitBtn.textContent = 'Submitting...';
      const submissionData = {
        courseId: moduleSelect.value,
        quarter: quarterSelect.value,
        fileUrl: uploadResult.url,
        fileName: currentFile.name,
        fileFormat: uploadResult.format || currentFile.name.split('.').pop()
      };

      await api.submitAssignmentToCourse(submissionData);
      
      showSubmissionAlert('Assignment submitted successfully!', 'success');
      
      // Reset form
      currentFile = null;
      $('#fileInput').value = '';
      if ($('#filePreview')) $('#filePreview').innerHTML = '';
      validateSubmissionForm();
      
      // Refresh history
      loadSubmissionHistory();
      
      setTimeout(() => showSubmissionAlert('', ''), 5000);
    } catch (err) {
      console.error('Submission failed:', err);
      showSubmissionAlert(err.message || 'Failed to submit assignment. Please try again.', 'error');
    } finally {
      submitBtn.textContent = 'Submit';
      validateSubmissionForm();
    }
  }

  async function loadSubmissionHistory() {
    const historyContainer = $('#submissionHistory');
    if (!historyContainer) return;

    try {
      const submissions = await api.getMySubmissions();
      
      if (!submissions || submissions.length === 0) {
        historyContainer.innerHTML = '<p style="color:var(--text-secondary); font-size:0.9rem;">No recent submissions.</p>';
        return;
      }

      historyContainer.innerHTML = submissions.slice(0, 5).map(sub => {
        const date = new Date(sub.createdAt).toLocaleDateString();
        const statusColor = sub.status === 'graded' ? '#10b981' : sub.status === 'reviewed' ? '#3b82f6' : '#f59e0b';
        return `
          <div style="padding:10px 0; border-bottom:1px solid #eee; font-size:0.9rem;">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <strong style="color:var(--secondary-color); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width:60%;" title="${sub.course?.title || 'Unknown Course'}">${sub.course?.title || 'Unknown Course'}</strong>
              <span style="color:${statusColor}; font-weight:600; font-size:0.8rem; text-transform:uppercase;">${sub.status}</span>
            </div>
            <div style="display:flex; justify-content:space-between; color:var(--text-secondary); font-size:0.8rem;">
              <span style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width:70%;" title="${sub.fileName}"><i class="fas fa-paperclip" aria-hidden="true"></i> ${sub.fileName}</span>
              <span>${date}</span>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }

    const reportBtn = $('#generateReportBtn');
    if (reportBtn) {
      reportBtn.addEventListener('click', async () => {
        const period = $('#reportPeriiod')?.value || 'all';
        const preview = $('#reportPreview');

        // Visual loading state
        reportBtn.disabled = true;
        reportBtn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:6px;"><i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Generating...</span>';
        if (preview) preview.innerHTML = '';

        try {
          const [submissions, enrollments] = await Promise.all([
            api.getMySubmissions().catch(() => []),
            api.getMyEnrollments().catch(() => [])
          ]);

          // Filter by quarter
          const filtSubs = period === 'all' ? submissions : submissions.filter(s => s.quarter === period);
          const filtEnr  = period === 'all' ? enrollments : enrollments.filter(e => {
            const q = e.course?.quarter;
            return !q || q === period;
          });

          const periodLabel = period === 'all' ? 'All Quarters' : `Quarter ${period.replace('Q','')}`;
          const now = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });

          // Helper to style status
          const statusChip = (s) => {
            if (s === 'graded')   return `<span style="background:#06d6a020;color:#059669;padding:2px 8px;border-radius:10px;font-size:0.78rem;font-weight:700;">GRADED</span>`;
            if (s === 'reviewed') return `<span style="background:#3b82f620;color:#2563eb;padding:2px 8px;border-radius:10px;font-size:0.78rem;font-weight:700;">REVIEWED</span>`;
            return `<span style="background:#f59e0b20;color:#d97706;padding:2px 8px;border-radius:10px;font-size:0.78rem;font-weight:700;">PENDING</span>`;
          };

          // Build report rows
          const rows = filtSubs.map(sub => {
            const enr = filtEnr.find(e => e.course && String(e.course._id) === String(sub.course?._id));
            const total = enr?.course?.lessons?.length || 0;
            const done  = enr?.completedLessons?.length || 0;
            const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
            return { sub, pct };
          });

          // Also include enrolled courses with no submission
          const unsubmittedEnr = filtEnr.filter(e => {
            if (!e.course) return false;
            return !filtSubs.some(s => String(s.course?._id) === String(e.course._id));
          });

          // Render HTML report
          let reportHTML = `
            <div style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;margin-top:12px;">
              <!-- Header -->
              <div style="background:linear-gradient(135deg,#0e2954 0%,#00B4D8 100%);color:#fff;padding:18px 20px;">
                <div style="font-weight:800;font-size:1.1rem;"><i class="fas fa-chart-column" aria-hidden="true"></i> Progress Report · ${periodLabel}</div>
                <div style="font-size:0.8rem;opacity:0.8;margin-top:2px;">Generated ${now}</div>
              </div>

              <!-- Summary Strip -->
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-bottom:1px solid #e2e8f0;">
                <div style="padding:12px 16px;text-align:center;border-right:1px solid #e2e8f0;">
                  <div style="font-size:1.5rem;font-weight:800;color:#0e2954;">${filtSubs.length}</div>
                  <div style="font-size:0.75rem;color:#64748b;margin-top:2px;">Submissions</div>
                </div>
                <div style="padding:12px 16px;text-align:center;border-right:1px solid #e2e8f0;">
                  <div style="font-size:1.5rem;font-weight:800;color:#059669;">${filtSubs.filter(s=>s.status==='graded').length}</div>
                  <div style="font-size:0.75rem;color:#64748b;margin-top:2px;">Graded</div>
                </div>
                <div style="padding:12px 16px;text-align:center;">
                  <div style="font-size:1.5rem;font-weight:800;color:#2563eb;">${filtEnr.length}</div>
                  <div style="font-size:0.75rem;color:#64748b;margin-top:2px;">Active Modules</div>
                </div>
              </div>`;

          if (rows.length > 0) {
            reportHTML += `
              <!-- Submissions Table -->
              <div style="padding:14px 16px;border-bottom:1px solid #e2e8f0;background:#f8fafc;">
                <strong style="font-size:0.85rem;color:#0e2954;">Assignment Submissions</strong>
              </div>
              <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
                  <thead>
                    <tr style="background:#f1f5f9;color:#475569;font-weight:700;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.04em;">
                      <th style="padding:8px 14px;text-align:left;">Course</th>
                      <th style="padding:8px 14px;text-align:center;">Quarter</th>
                      <th style="padding:8px 14px;text-align:center;">Progress</th>
                      <th style="padding:8px 14px;text-align:center;">Status</th>
                      <th style="padding:8px 14px;text-align:center;">Grade</th>
                      <th style="padding:8px 14px;text-align:left;">Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rows.map(({ sub, pct }, i) => `
                      <tr style="border-bottom:1px solid #f1f5f9;${i%2===1 ? 'background:#f8fafc;' : ''}">
                        <td style="padding:10px 14px;font-weight:600;color:#1e293b;">${sub.course?.title || 'Unknown'}</td>
                        <td style="padding:10px 14px;text-align:center;color:#64748b;">${sub.quarter || '-'}</td>
                        <td style="padding:10px 14px;text-align:center;">
                          <div style="display:flex;align-items:center;gap:6px;justify-content:center;">
                            <div style="width:56px;height:6px;background:#e2e8f0;border-radius:4px;overflow:hidden;">
                              <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#00B4D8,#0D47A1);border-radius:4px;"></div>
                            </div>
                            <span style="font-size:0.76rem;font-weight:700;color:#475569;">${pct}%</span>
                          </div>
                        </td>
                        <td style="padding:10px 14px;text-align:center;">${statusChip(sub.status)}</td>
                        <td style="padding:10px 14px;text-align:center;font-weight:700;color:${sub.grade != null ? '#059669' : '#94a3b8'};">${sub.grade != null ? sub.grade+'/100' : '–'}</td>
                        <td style="padding:10px 14px;color:#64748b;font-size:0.78rem;">${sub.feedback || '<em>No feedback yet</em>'}</td>
                      </tr>`).join('')}
                  </tbody>
                </table>
              </div>`;
          }

          if (unsubmittedEnr.length > 0) {
            reportHTML += `
              <!-- In-Progress Modules -->
              <div style="padding:14px 16px;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;background:#f8fafc;">
                <strong style="font-size:0.85rem;color:#0e2954;">In Progress (No Submission Yet)</strong>
              </div>
              ${unsubmittedEnr.map((e, i) => {
                const total = e.course?.lessons?.length || 0;
                const done  = e.completedLessons?.length || 0;
                const pct   = total > 0 ? Math.round((done/total)*100) : 0;
                return `<div style="padding:10px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f1f5f9;font-size:0.84rem;">
                  <span style="font-weight:600;color:#1e293b;">${e.course?.title || 'Unknown'}</span>
                  <span style="color:#64748b;">${e.course?.quarter || ''}</span>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:60px;height:6px;background:#e2e8f0;border-radius:4px;overflow:hidden;">
                      <div style="width:${pct}%;height:100%;background:#00B4D8;border-radius:4px;"></div>
                    </div>
                    <span style="font-size:0.76rem;font-weight:700;color:#475569;">${pct}%</span>
                  </div>
                </div>`;
              }).join('')}`;
          }

          if (rows.length === 0 && unsubmittedEnr.length === 0) {
            reportHTML += `<div style="padding:30px;text-align:center;color:#94a3b8;font-size:0.88rem;">No data found for ${periodLabel}.</div>`;
          }

          // Download button
          reportHTML += `
              <div style="padding:12px 16px;display:flex;justify-content:flex-end;gap:8px;border-top:1px solid #e2e8f0;background:#f8fafc;border-radius:0 0 12px 12px;">
                <button id="downloadReportCsvBtn" style="padding:7px 16px;border-radius:8px;border:1.5px solid #00B4D8;background:#fff;color:#00B4D8;font-weight:700;font-size:0.82rem;cursor:pointer;">⬇ Download CSV</button>
              </div>
            </div>`;

          if (preview) preview.innerHTML = reportHTML;

          // Wire up CSV download
          const csvBtn = document.getElementById('downloadReportCsvBtn');
          if (csvBtn) {
            csvBtn.addEventListener('click', () => {
              const headers = ['Course','Quarter','Module Progress %','Submission Status','Grade /100','Feedback'];
              const csvRows = rows.map(({ sub, pct }) => [
                `"${(sub.course?.title||'').replace(/"/g,'""')}"`,
                sub.quarter || '',
                pct,
                sub.status || 'pending',
                sub.grade ?? '',
                `"${(sub.feedback||'').replace(/"/g,'""')}"`
              ]);
              unsubmittedEnr.forEach(e => {
                const total = e.course?.lessons?.length || 0;
                const done  = e.completedLessons?.length || 0;
                const pct   = total > 0 ? Math.round((done/total)*100) : 0;
                csvRows.push([
                  `"${(e.course?.title||'').replace(/"/g,'""')}"`,
                  e.course?.quarter || '',
                  pct,
                  'not submitted',
                  '',
                  ''
                ]);
              });

              const csvContent = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `YAN_Progress_Report_${period}_${new Date().toISOString().split('T')[0]}.csv`;
              link.click();
              URL.revokeObjectURL(url);
            });
          }

          reportBtn.innerHTML = 'Generate Report';
          reportBtn.disabled = false;
          showSubmissionAlert('Report generated successfully!', 'success');
          setTimeout(() => showSubmissionAlert('', ''), 4000);

        } catch (err) {
          console.error('Report generation failed:', err);
          reportBtn.innerHTML = 'Generate Report';
          reportBtn.disabled = false;
          showSubmissionAlert('Failed to generate report. Please try again.', 'error');
        }
      });
    }


  return { init };
})();

document.addEventListener('DOMContentLoaded', memberDashboard.init);
