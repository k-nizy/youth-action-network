// ================================
// YAN RWANDA - MAIN JAVASCRIPT
// ================================

// ================================
// DATA STORES
// ================================

let organizationsData = [];

let modulesData = [];
let enrollmentsData = [];

let opportunitiesData = [];
let eventsData = [];

let galleryData = [];

// Removed LOCAL_ORGANIZATIONS and LOCAL_EVENTS — now fetching from API

// Reusing existing Global IntersectionObserver for robust animations that works with dynamic elements
const globalObserverOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const globalRevealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // Optional: stop observing once visible
        }
    });
}, globalObserverOptions);

const globalStatObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
            entry.target.classList.add('counted');
            if (entry.target.classList.contains('impact-number')) {
                animateImpactCounter(entry.target);
            } else {
                animateCounter(entry.target);
            }
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

// ================================
// STATE MANAGEMENT
// ================================

let currentRole = 'public';
let currentUser = null;
let currentModule = null;
let currentGalleryIndex = 0;

// Helper to get current quarter
function getCurrentQuarter() {
    const month = new Date().getMonth();
    if (month < 3) return 'Q1';
    if (month < 6) return 'Q2';
    if (month < 9) return 'Q3';
    return 'Q4';
}

let userProgressCache = {}; // Cache for backend progress data

async function getModuleProgress(moduleId) {
    if (userProgressCache[moduleId]) return userProgressCache[moduleId];

    // Fallback to local if not logged in or fetch hasn't happened
    const progress = localStorage.getItem(`module_${moduleId}_progress`);
    return progress ? JSON.parse(progress) : {
        status: 'not-started',
        progress: 0,
        assignmentSubmitted: false
    };
}

async function saveModuleProgress(moduleId, progress) {
    // Save to local as backup
    localStorage.setItem(`module_${moduleId}_progress`, JSON.stringify(progress));

    // Sync with backend if possible - this will be handled by LMS specific calls 
    // like markLessonComplete which already use api.updateLessonProgress
    updateDashboardMetrics();
}

// ================================
// GLOBAL AUTH FAILURE HANDLER
// ================================
// Called by apiClient.js when refresh token fails
window._onAuthFailure = function () {
    currentUser = null;
    currentRole = 'public';
    updateRoleDisplay('public');

    // Hide profile, show login button
    document.getElementById('loginBtn').style.display = '';
    document.getElementById('profileDropdown').style.display = 'none';
    const roleBadge = document.getElementById('roleBadgeNav');
    if (roleBadge) roleBadge.style.display = 'none';

    hideDashboard();
    showNotification('Session expired. Please login again.');
};

// ================================
// INITIALIZATION
// ================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Initialize role display (public by default)
    updateRoleDisplay(currentRole);

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'true') {
        setTimeout(() => showNotification('Email verified successfully! You can now log in.', 'success'), 500);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Fetch dynamic content
    try {
        const [gallery, impact] = await Promise.all([
            api.getGallery(),
            api.getImpactRatings()
        ]);
        galleryData = gallery || [];
        impactRatingsData = impact || [];
    } catch (e) {
        // failed to load content
    }

    // Initialize navigation
    initializeNavigation();

    // Initialize sections
    initializeOrganizations();
    initializeCapacityBuilding();
    initializeOpportunities();
    initializeEvents();
    initializeGallery();
    initializeContact();

    // Initialize scroll effects
    initializeScrollEffects();

    // Initialize animations
    initializeAnimations();

    // Initialize new sections
    initializeTestimonialsCarousel();
    initializeHeroStats();

    // Phase 6.1: Stability & UX
    initializeOfflineDetection();
    initializeScrollProgress();
    initializeRippleEffect();
    initMemberSidebarToggle();

    // UI HINT: If we were previously logged in, show the profile dropdown shell immediately
    if (localStorage.getItem('yan_auth_hint') === 'true') {
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('profileDropdown').style.display = 'flex';
        // Profile name/avatar will be "YL" (placeholder) until api.getMe() returns
    }

    // SESSION RESTORE: Try to restore session from refresh token cookie
    try {
        const user = await api.getMe();
        if (user) {
            currentUser = user;
            currentUser.initials = getInitials(user.name);
            currentRole = user.role || 'member';
            showLoggedInState();
            initializeDashboard();
        }
    } catch (e) {
        // No valid session
    }
}

function getInitials(name) {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ================================
// NAVIGATION
// ================================

function initializeNavigation() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile Dashboard toggle
    function initMemberSidebarToggle() {
        const sidebar = document.getElementById('memberSidebar');
        const overlay = document.getElementById('dashboardSidebarOverlay');
        const menuBtn = document.getElementById('memberMenuBtn');
        if (!sidebar || !overlay || !menuBtn) return;
        
        function open() { sidebar.classList.add('open'); overlay.classList.add('active'); }
        function close() { sidebar.classList.remove('open'); overlay.classList.remove('active'); }
        
        menuBtn.addEventListener('click', open);
        overlay.addEventListener('click', close);
        document.querySelectorAll('.dashboard-nav-item').forEach(btn => btn.addEventListener('click', close));
    }
    window.initMemberSidebarToggle = initMemberSidebarToggle;

    // Hamburger menu
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Active link highlighting
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Close mobile menu
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Login button — opens login modal
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.addEventListener('click', () => {
        showLoginModal();
    });

    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            await handleLogin(email, password);
        });
    }

    // Login modal close button
    const loginModalClose = document.querySelector('#loginModal .modal-close');
    if (loginModalClose) {
        loginModalClose.addEventListener('click', () => {
            hideLoginModal();
        });
    }

    // Signup modal close button
    const signupModalClose = document.querySelector('#signupModal .modal-close');
    if (signupModalClose) {
        signupModalClose.addEventListener('click', () => {
            hideSignupModal();
        });
    }

    // Switch from Login to Signup
    const openSignupLink = document.getElementById('openSignupLink');
    if (openSignupLink) {
        openSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            hideLoginModal();
            showSignupModal();
        });
    }

    // Switch from Signup to Login
    const openLoginLink = document.getElementById('openLoginLink');
    if (openLoginLink) {
        openLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            hideSignupModal();
            showLoginModal();
        });
    }

    // Switch from Login to Forgot Password
    const openForgotLink = document.getElementById('openForgotLink');
    if (openForgotLink) {
        openForgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            hideLoginModal();
            const forgotModal = document.getElementById('forgotPasswordModal');
            if (forgotModal) forgotModal.classList.add('active');
        });
    }

    // Switch from Forgot Password to Login
    const backToLoginLink = document.getElementById('backToLoginLink');
    if (backToLoginLink) {
        backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            const forgotModal = document.getElementById('forgotPasswordModal');
            if (forgotModal) forgotModal.classList.remove('active');
            showLoginModal();
        });
    }

    // Close Forgot Password Modal
    const forgotModalClose = document.getElementById('forgotModalClose');
    if (forgotModalClose) {
        forgotModalClose.addEventListener('click', () => {
            const forgotModal = document.getElementById('forgotPasswordModal');
            if (forgotModal) forgotModal.classList.remove('active');
        });
    }

    // Forgot Password Submit
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgotEmail').value.trim();
            const submitBtn = document.getElementById('forgotSubmitBtn');
            const errorDiv = document.getElementById('forgotError');
            const errorText = document.getElementById('forgotErrorText');
            const successDiv = document.getElementById('forgotSuccess');

            submitBtn.disabled = true;
            submitBtn.querySelector('.forgot-btn-text').textContent = 'Sending...';
            errorDiv.style.display = 'none';
            successDiv.style.display = 'none';

            try {
                const response = await fetch(`${YAN_CONFIG.API_BASE_URL}/auth/forgotpassword`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await response.json();

                if (response.ok) {
                    successDiv.style.display = 'block';
                    forgotPasswordForm.reset();
                } else {
                    throw new Error(data.message || 'Failed to send reset link');
                }
            } catch (error) {
                errorText.textContent = error.message;
                errorDiv.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.querySelector('.forgot-btn-text').textContent = 'Send Reset Link';
            }
        });
    }

    // Signup form submission
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signupName').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const password = document.getElementById('signupPassword').value;
            const organization = document.getElementById('signupOrganization').value.trim();
            await handleSignup(name, email, password, organization);
        });
    }

    // Profile dropdown
    const profileBtn = document.getElementById('profileBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');

    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('active');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        if (dropdownMenu) {
            dropdownMenu.classList.remove('active');
        }
    });

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // Dashboard navigation
    const dashboardLink = document.querySelector('a[href="#dashboard"]');
    if (dashboardLink) {
        dashboardLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentRole === 'admin') {
                showAdminDashboard();
            } else {
                showDashboard();
            }
        });
    }

    const backToSiteBtn = document.getElementById('backToSite');
    if (backToSiteBtn) {
        backToSiteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            hideDashboard();
        });
    }

    // Scroll to top button
    const scrollTopBtn = document.getElementById('scrollTop');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Join Network button
    const heroJoinBtn = document.getElementById('heroJoinBtn');
    if (heroJoinBtn) {
        heroJoinBtn.addEventListener('click', () => {
            if (!currentUser) {
                showNotification('Please login or signup first to apply.');
                showLoginModal();
            } else if (currentRole === 'member' || currentRole === 'admin') {
                showNotification('You are already a member of the network!');
            } else {
                window.location.href = 'application-form.html';
            }
        });
    }

    // Course Search & Filter
    const courseSearch = document.getElementById('courseSearch');
    if (courseSearch) {
        courseSearch.addEventListener('input', () => {
            applyModuleFilters();
        });
    }

    const courseCategoryFilter = document.getElementById('courseCategoryFilter');
    if (courseCategoryFilter) {
        courseCategoryFilter.addEventListener('change', () => {
            applyModuleFilters();
        });
    }
}

function updateRoleDisplay(role) {
    currentRole = role;
    // Show/hide dashboard elements based on role
    const dashboardLink = document.querySelector('a[href="#dashboard"]');
    const roleBadgeNav = document.getElementById('roleBadgeNav');
    const adminRoleBadge = document.getElementById('adminRoleBadge');

    if (dashboardLink) dashboardLink.style.display = 'block';

    if (roleBadgeNav) {
        roleBadgeNav.textContent = currentRole.charAt(0).toUpperCase() + currentRole.slice(1);
        roleBadgeNav.className = `role-badge-nav role-${currentRole}`;
        roleBadgeNav.style.display = 'inline-block';
    }

    if (adminRoleBadge) {
        adminRoleBadge.textContent = currentRole.charAt(0).toUpperCase() + currentRole.slice(1);
        adminRoleBadge.className = `role-badge role-${currentRole}`;
    }

    // Initialize appropriate dashboard view
    if (currentRole === 'admin') {
        const adminSection = document.getElementById('admin');
        if (adminSection) {
            setupAdminDashboardLinks();
        }
    }

    // Role specific UI adjustments (existing data-role attribute system)
    const roleElements = document.querySelectorAll('[data-role]');
    roleElements.forEach(el => {
        const allowedRoles = el.dataset.role.split(',');
        if (allowedRoles.includes(role)) {
            el.style.display = '';
        } else {
            el.style.display = 'none';
        }
    });

    // Update capacity building view
    updateCapacityBuildingView();
}

// ================================
// LOGIN MODAL
// ================================

function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('active');
        // Reset form state
        document.getElementById('loginForm').reset();
        document.getElementById('loginError').style.display = 'none';
        document.getElementById('loginSubmitBtn').disabled = false;
        document.querySelector('.login-btn-text').style.display = '';
        document.querySelector('.login-btn-loading').style.display = 'none';
    }
}

function hideLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function showSignupModal() {
    const modal = document.getElementById('signupModal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('signupForm').reset();
        document.getElementById('signupError').style.display = 'none';
        document.getElementById('signupSubmitBtn').disabled = false;
        document.querySelector('.signup-btn-text').style.display = '';
        document.querySelector('.signup-btn-loading').style.display = 'none';
    }
}

function hideSignupModal() {
    const modal = document.getElementById('signupModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

async function handleSignup(name, email, password, organization) {
    const submitBtn = document.getElementById('signupSubmitBtn');
    const btnText = document.querySelector('.signup-btn-text');
    const btnLoading = document.querySelector('.signup-btn-loading');
    const errorDiv = document.getElementById('signupError');
    const errorText = document.getElementById('signupErrorText');

    if (submitBtn.disabled) return;

    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = '';
    errorDiv.style.display = 'none';

    try {
        const user = await api.register(name, email, password, 'applicant', organization);

        currentUser = user;
        currentUser.initials = getInitials(user.name);
        currentRole = user.role || 'applicant';

        showLoggedInState();
        hideSignupModal();
        initializeDashboard();

        showNotification('Account created! Welcome, ' + user.name + '!');
    } catch (error) {
        errorText.textContent = error.message || 'Registration failed. Please try again.';
        errorDiv.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        btnText.style.display = '';
        btnLoading.style.display = 'none';
    }
}

async function handleLogin(email, password) {
    const submitBtn = document.getElementById('loginSubmitBtn');
    const btnText = document.querySelector('.login-btn-text');
    const btnLoading = document.querySelector('.login-btn-loading');
    const errorDiv = document.getElementById('loginError');
    const errorText = document.getElementById('loginErrorText');

    // Prevent double submit
    if (submitBtn.disabled) return;

    // Show loading state
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = '';
    errorDiv.style.display = 'none';

    try {
        const user = await api.login(email, password);

        // Set app state from backend response
        currentUser = user;
        currentUser.initials = getInitials(user.name);
        currentRole = user.role || 'member';

        // Update UI
        showLoggedInState();
        hideLoginModal();

        if (currentRole === 'admin') {
            showNotification('Welcome back, Admin! Redirecting to dashboard...');
            setTimeout(() => window.location.href = 'admin.html', 1500);
        } else {
            initializeDashboard();
            showNotification('Welcome back, ' + user.name + '!');
        }
    } catch (error) {
        // Show backend error message
        errorText.textContent = error.message || 'Login failed. Please try again.';
        errorDiv.style.display = 'block';
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        btnText.style.display = '';
        btnLoading.style.display = 'none';
    }
}

async function logout() {
    // Call backend logout (clears refresh token cookie + DB hash)
    await api.logout();

    // Clear local state
    currentUser = null;
    currentRole = 'public';

    // Hide profile, show login button
    document.getElementById('loginBtn').style.display = '';
    document.getElementById('profileDropdown').style.display = 'none';
    const roleBadge = document.getElementById('roleBadgeNav');
    if (roleBadge) roleBadge.style.display = 'none';

    // Return to public role
    updateRoleDisplay('public');

    // Hide dashboard
    hideDashboard();

    // Show notification
    showNotification('You have been logged out.');
}

function showLoggedInState() {
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('profileDropdown').style.display = 'flex';

    // Update profile info from backend user data
    const profileName = document.querySelector('.profile-name');
    const profileAvatar = document.querySelector('.profile-avatar');
    const dashboardAvatar = document.querySelector('.dashboard-avatar');
    const dashboardName = document.querySelector('.dashboard-sidebar h3');

    if (profileName) profileName.textContent = currentUser.name;
    if (profileAvatar) profileAvatar.textContent = currentUser.initials || getInitials(currentUser.name);
    if (dashboardAvatar) dashboardAvatar.textContent = currentUser.initials || getInitials(currentUser.name);
    if (dashboardName) dashboardName.textContent = currentUser.name;

    // Set role from backend
    updateRoleDisplay(currentRole);
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ================================
// SCROLL EFFECTS
// ================================

function initializeScrollEffects() {
    // Moved to global observer definitions
    document.querySelectorAll('.reveal').forEach(el => globalRevealObserver.observe(el));
    document.querySelectorAll('.stat-item').forEach(el => globalRevealObserver.observe(el));
}

function initializeAnimations() {
    // Use the robust global observer
    const animatedElements = document.querySelectorAll('.org-card, .module-card, .opportunity-card, .event-card, .reveal');
    animatedElements.forEach(el => {
        el.classList.add('reveal');
        globalRevealObserver.observe(el);
    });

    document.querySelectorAll('.stat-number').forEach(el => globalStatObserver.observe(el));
    document.querySelectorAll('.impact-number').forEach(el => globalStatObserver.observe(el));
}

function animateCounter(element) {
    const target = parseInt(element.dataset.target);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

function animateImpactCounter(element) {
    const target = parseInt(element.dataset.target);
    const suffix = element.dataset.suffix || '';
    const duration = 2000;
    const startTime = performance.now();

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);
        const current = Math.floor(easedProgress * target);

        element.textContent = current.toLocaleString() + suffix;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// ================================
// TESTIMONIALS CAROUSEL
// ================================

function initializeTestimonialsCarousel() {
    const track = document.getElementById('testimonialsTrack');
    const dotsContainer = document.getElementById('testimonialDots');
    const prevBtn = document.getElementById('testimonialPrev');
    const nextBtn = document.getElementById('testimonialNext');

    if (!track || !dotsContainer) return;

    const cards = track.querySelectorAll('.testimonial-card');
    const totalSlides = cards.length;
    let currentSlide = 0;
    let autoplayTimer;

    // Create dots
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    }

    function goToSlide(index) {
        currentSlide = index;
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
        const dots = dotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
        resetAutoplay();
    }

    function nextSlide() {
        goToSlide((currentSlide + 1) % totalSlides);
    }

    function prevSlide() {
        goToSlide((currentSlide - 1 + totalSlides) % totalSlides);
    }

    function resetAutoplay() {
        clearInterval(autoplayTimer);
        autoplayTimer = setInterval(nextSlide, 6000);
    }

    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);

    // Start autoplay
    autoplayTimer = setInterval(nextSlide, 6000);

    // Pause on hover
    const carousel = document.getElementById('testimonialsCarousel');
    if (carousel) {
        carousel.addEventListener('mouseenter', () => clearInterval(autoplayTimer));
        carousel.addEventListener('mouseleave', () => {
            autoplayTimer = setInterval(nextSlide, 6000);
        });
    }
}

// ================================
// HERO STATS ANIMATION
// ================================

function initializeHeroStats() {
    const heroStatNums = document.querySelectorAll('.hero-stat-num');
    heroStatNums.forEach(el => {
        const target = parseInt(el.dataset.target);
        if (isNaN(target)) return;

        const duration = 1500;
        const startTime = performance.now();

        function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(easeOut(progress) * target);
            el.textContent = current;
            if (progress < 1) requestAnimationFrame(update);
        }

        // Delay slightly to let stagger animation start first
        setTimeout(() => requestAnimationFrame(update), 800);
    });
}

// ================================
// ORGANIZATIONS SECTION
// ================================

const organizationSectorOrder = ["HEALTH", "EDUCATION", "CHILD PROTECTION", "YOUTH EMPOWERMENT", "AGRICULTURE", "ARTS & MEDIA"];

let impactRatingsData = [
    {
        organization: "CARE AND HELP CHILD ORGANIZATION",
        rating: "PLATINUM",
        evidence: "Successfully reached 574+ vulnerable children in providing safety, fostering mental well-being across Rwanda."
    },
    {
        organization: "WHAT IF-RWANDA",
        rating: "GOLD",
        evidence: "Installed water filtration systems and providing consistent mentorship for children at Iramiro Center."
    },
    {
        organization: "ASPIRE DEBATE RWANDA",
        rating: "GOLD",
        evidence: "Unleashing the power of the youth voice through transformative debate education since 2014."
    },
    {
        organization: "Digital Rwanda",
        rating: "GOLD",
        evidence: "Equipped 200 students with digital literacy skills and provided 50 internships in tech startups."
    },
    {
        organization: "INFORMED FUTURE GENERATIONS",
        rating: "PLATINUM",
        evidence: "Challenging harmful social norms through the 'Like Your Sister' program in Eastern Province."
    },
    {
        organization: "Green Action Network",
        rating: "BRONZE",
        evidence: "Planted 10,000 trees and reached 5,000 community members with environmental awareness campaigns."
    }
];

async function initializeOrganizations() {
    const featuredContainer = document.getElementById('featuredOrgContainer');
    if (!featuredContainer) return;

    try {
        organizationsData = await api.getOrganizations();
    } catch (error) {
        console.error('API fetch failed:', error);
        organizationsData = [];
    }

    featuredContainer.innerHTML = '';

    if (organizationsData && organizationsData.length > 0) {
        // Show ONLY one organization for the spotlight as requested
        const maxFeatured = 1;
        
        // Apply grid styling to container to hold multiple cards
        featuredContainer.style.display = 'grid';
        featuredContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
        featuredContainer.style.gap = '2rem';
        
        for (let i = 0; i < maxFeatured; i++) {
            const org = organizationsData[i];
            const card = createFeaturedOrganizationCard(org);
            featuredContainer.appendChild(card);
            
            // Add reveal effect
            if (typeof globalRevealObserver !== 'undefined') {
                globalRevealObserver.observe(card);
            }
            setTimeout(() => card.classList.add('visible'), i * 150);
        }
    } else {
        featuredContainer.innerHTML = `
            <div class="empty-state-card" style="text-align: center; padding: 3rem;">
                <div class="empty-icon" style="font-size: 3rem; margin-bottom: 1rem;">✨</div>
                <h4>Community Spotlight</h4>
                <p>Organizations will be featured here as they join our growing network.</p>
            </div>`;
    }

    // Impact ratings block
    renderImpactRatings();
}

function createFeaturedOrganizationCard(org) {
    const card = document.createElement('article');
    card.className = 'featured-org-card reveal';
    const orgId = org._id || org.id;
    
    card.innerHTML = `
        <div class="featured-org-image-wrapper">
            <img src="${org.image || 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800'}" alt="${org.name}" class="featured-org-image">
            <div class="featured-org-overlay"></div>
            <div class="featured-org-badge">Spotlight Organization</div>
        </div>
        <div class="featured-org-content">
            <div class="featured-org-meta">
                <span class="featured-org-sector">${org.focusArea || 'COMMUNITY IMPACT'}</span>
                <span class="impact-indicator">
                    <span class="indicator-dot pulse"></span>
                    Verified Partner
                </span>
            </div>
            <h3 class="featured-org-name">${org.name}</h3>
            <p class="featured-org-description">${org.description}</p>
            <div class="featured-org-impact-glow">
                <div class="impact-glow-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                </div>
                <div class="impact-glow-text">
                    <strong>The Impact:</strong> ${org.impactData || 'Driving systemic change through youth-led advocacy and professional capacity building.'}
                </div>
            </div>
            <div class="featured-org-actions" style="display: none;">
                <!-- Explore Impact Story Button Deleted as requested -->
            </div>
        </div>
    `;

    // Attach click listener for the specific Learn More button
    const link = card.querySelector('.org-link');
    if (link) {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openOrganizationModal(orgId);
        });
    }

    return card;
}

function renderImpactRatings() {
    const grid = document.getElementById('impactRatingGrid');
    if (!grid) return;

    grid.innerHTML = '';
    const fragment = document.createDocumentFragment();
    impactRatingsData.forEach(item => {
        const card = document.createElement('article');
        const ratingClass = getRatingClass(item.rating);
        card.className = `impact-card ${ratingClass} reveal`;
        card.innerHTML = `
            <div class="impact-card-header">
                <h3 class="impact-org-name">${item.organization}</h3>
                <span class="rating-badge ${ratingClass}">${item.rating}</span>
            </div>
            <p class="impact-evidence">${item.evidence}</p>
        `;
        fragment.appendChild(card);
        globalRevealObserver.observe(card);
    });
    grid.appendChild(fragment);
}

function getRatingClass(rating) {
    if (rating === 'PLATINUM') return 'rating-platinum';
    if (rating === 'GOLD') return 'rating-gold';
    return 'rating-bronze';
}

function renderSkeletonCards(container, count) {
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-card';
        skeleton.innerHTML = `
            <div class="skeleton-image"></div>
            <div class="skeleton-content">
                <div class="skeleton-line medium"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
            </div>
        `;
        container.appendChild(skeleton);
    }
}

function renderOrganizationError(container, message) {
    container.innerHTML = `
        <div class="error-state-card" style="grid-column: 1/-1; text-align: center; padding: 3rem; background: var(--bg-secondary); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
            <div class="error-icon" style="font-size: 3rem; margin-bottom: 1rem;">📡</div>
            <h4 style="margin-bottom: 0.5rem; color: var(--text-color);">Connection Issue</h4>
            <p style="color: var(--text-secondary); margin-bottom: 1.5rem; max-width: 300px; margin-left: auto; margin-right: auto;">${message}</p>
            <button class="btn btn-outline retry-btn" onclick="initializeOrganizations()" style="margin: 0 auto;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="margin-right: 8px;">
                    <path d="M23 4V10H17M1 20V14H7M3.51 9C4.51703 7.1554 6.07548 5.65997 7.97034 4.71761C9.86521 3.77524 11.9961 3.43734 14.07 3.74955C16.1438 4.06175 18.0494 5.00693 19.5312 6.45785C21.013 7.90876 21.9881 9.78918 22.32 11.84M20.49 15C19.483 16.8446 17.9245 18.34 16.0297 19.2824C14.1348 20.2248 12.0039 20.5627 9.93001 20.2504C7.85618 19.9382 5.95062 18.9931 4.46879 17.5422C2.98695 16.0912 2.01186 14.2108 1.68 12.16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Retry Connection</span>
            </button>
        </div>
    `;
}

function createOrganizationCard(org) {
    const card = document.createElement('div');
    card.className = 'org-card reveal';
    const orgId = org._id || org.id;
    card.innerHTML = `
        <img src="${org.image || 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=400'}" alt="${org.name}" class="org-image">
        <div class="org-content">
            <h3 class="org-name">${org.name}</h3>
            <p class="org-description">${org.description}</p>
            <a href="#" class="org-link" data-org-id="${orgId}">
                Learn More
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </a>
        </div>
    `;
    return card;
}

function openOrganizationModal(orgId) {
    const org = organizationsData.find(item => (item._id || item.id).toString() === orgId.toString());
    if (!org) {
        return;
    }

    const title = document.getElementById('orgModalTitle');
    const body = document.getElementById('orgModalBody');
    const image = document.getElementById('orgModalImage');

    if (title) {
        title.textContent = org.name;
    }
    if (body) {
        let html = `<p>${org.description}</p>`;

        if (org.focusArea) {
            html += `<div style="margin-top: 1rem;"><strong>Focus Area:</strong> ${org.focusArea}</div>`;
        }

        if (org.impactData) {
            html += `<div style="margin-top: 1rem; padding: 1rem; background: var(--bg-primary); border-radius: 8px;">
                <strong>2024 Impact:</strong> ${org.impactData}
            </div>`;
        }

        if (org.details) {
            html += `<div style="margin-top: 1.5rem; line-height: 1.8;">${org.details}</div>`;
        }

        body.innerHTML = html;
    }
    if (image) {
        image.src = org.image || 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=400';
        image.alt = org.name;
    }

    openModal('orgDetailsModal');
}

async function addOrganization() {
    const name = document.getElementById('orgName').value;
    const description = document.getElementById('orgDescription').value;
    const image = document.getElementById('orgImage').value;

    const newOrg = {
        name,
        description,
        image: image || undefined,
        type: 'ngo',
        status: 'active' // For demo purposes, we automatically set it to active
    };

    try {
        const response = await api.request('/organizations', {
            method: 'POST',
            body: newOrg
        });

        // The endpoint returns { success: true, data: {...} }
        const createdOrg = response.data;
        organizationsData.push(createdOrg);

        const grid = document.getElementById('organizationsGrid');
        if (grid) {
            // Remove empty state if it's the only child
            if (grid.querySelector('.empty-state')) {
                grid.innerHTML = '';
            }
            const card = createOrganizationCard(createdOrg);
            grid.appendChild(card);
        }

        closeModal('addOrgModal');
        document.getElementById('addOrgForm').reset();
        showNotification('Organization added successfully!');
    } catch (error) {
        showNotification('Authorization failed: ' + error.message);
    }
}

// ================================
// CAPACITY BUILDING SECTION
// ================================

function initializeCapacityBuilding() {
    // Role-based visibility for search and filters
    const filterContainer = document.querySelector('.capacity-controls');
    if (filterContainer) {
        if (currentRole === 'member' || currentRole === 'admin') {
            filterContainer.style.display = 'flex';
        } else {
            filterContainer.style.display = 'none';
        }
    }

    updateCapacityBuildingView();

    // Back to modules button
    const backBtn = document.getElementById('backToModules');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            document.getElementById('lmsSection').style.display = 'none';
            document.getElementById('capacity').style.display = 'block';
            document.getElementById('capacity').scrollIntoView({ behavior: 'smooth' });
        });
    }
}

async function updateCapacityBuildingView() {
    const publicView = document.getElementById('capacityPublicView');
    const memberView = document.getElementById('capacityMemberView');
    const isAuthorized = currentRole === 'member' || currentRole === 'admin';

    if (isAuthorized) {
        if (publicView) publicView.style.display = 'none';
        if (memberView) memberView.style.display = 'block';
    } else {
        if (publicView) publicView.style.display = 'block';
        if (memberView) memberView.style.display = 'none';
    }

    // Show search/filter controls only for members and admins
    const filterContainer = document.querySelector('.capacity-controls');
    if (filterContainer) {
        filterContainer.style.display = isAuthorized ? 'flex' : 'none';
    }

    if (isAuthorized) {
        await renderModules();
    }
}

async function renderModules() {
    const grid = document.getElementById('modulesGrid');
    if (!grid) return;

    grid.innerHTML = '';
    renderSkeletonCards(grid, 6);

    try {
        let courses = [];
        let enrollments = [];

        // Courses are public, enrollments require auth
        courses = await api.getCourses();

        if (currentRole !== 'public' && api.isAuthenticated()) {
            try {
                enrollments = await api.getMyEnrollments();
            } catch (e) {
                console.log('Could not fetch enrollments:', e.message);
                enrollments = [];
            }
        }

        modulesData = courses || [];
        enrollmentsData = enrollments || [];

        if (modulesData.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-light); padding: 3rem;">No courses available yet. Check back soon!</div>';
            return;
        }

        applyModuleFilters();
    } catch (error) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: red; padding: 2rem;">Failed to load modules. Please check your connection.</div>';
        console.error('renderModules error:', error);
    }
}

function applyModuleFilters() {
    const grid = document.getElementById('modulesGrid');
    const searchTerm = document.getElementById('courseSearch')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('courseCategoryFilter')?.value || 'all';

    if (!grid) return;
    grid.innerHTML = '';

    console.log('[LMS] Total modules:', modulesData.length, 'Filter:', categoryFilter);

    const filtered = modulesData.filter(module => {
        const matchesSearch = (module.title || '').toLowerCase().includes(searchTerm) ||
            (module.description || '').toLowerCase().includes(searchTerm);
        const matchesCategory = categoryFilter === 'all' ||
            (module.category && module.category.toLowerCase() === categoryFilter.toLowerCase());
        return matchesSearch && matchesCategory;
    });

    console.log('[LMS] Filtered modules:', filtered.length);

    if (filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-light); padding: 3rem;">No modules match your search.</div>';
        return;
    }

    const fragment = document.createDocumentFragment();

    filtered.forEach((module, i) => {
        const enrollment = enrollmentsData.find(e =>
            (e.course && (e.course._id === module._id || e.course === module._id))
        );

        const progress = {
            status: enrollment ? enrollment.status : 'not-started',
            progress: enrollment ? enrollment.progress : 0
        };

        const card = createModuleCard(module, progress, !!enrollment);
        fragment.appendChild(card);
    });
    
    grid.appendChild(fragment);
}

async function handleEnroll(courseId) {
    try {
        await api.enrollInCourse(courseId);
        showNotification('Successfully enrolled in the module!');
        await renderModules();
    } catch (error) {
        showNotification('Enrollment failed: ' + error.message);
    }
}

function createModuleCard(module, progress, isEnrolled) {
    const card = document.createElement('div');
    card.className = 'module-card';

    const statusClass = progress.status;
    const statusText = progress.status === 'not-started' ? 'Not Started' :
        progress.status === 'in-progress' ? 'In Progress' : 'Completed';

    const currentQuarter = getCurrentQuarter();
    // UNLOCK ALL courses for better UX as requested
    const isLocked = false;

    if (isLocked) {
        card.classList.add('locked');
    }

    let actionButton = '';
    if (isEnrolled) {
        if (isLocked) {
            actionButton = `
                <button class="enter-module-btn" disabled title="This course is locked for ${module.quarter} (Current: ${currentQuarter})">
                    Assignments Locked
                </button>
            `;
        } else {
            actionButton = `
                <button class="enter-module-btn" onclick="openModule('${module._id}')">
                    Enter Module
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            `;
        }
    } else {
        if (isLocked) {
            actionButton = `
                <button class="enter-module-btn" disabled title="Enrollment opens in ${module.quarter} (Current: ${currentQuarter})">
                    Entry Locked
                </button>
            `;
        } else {
            actionButton = `
                <button class="enter-module-btn" onclick="handleEnroll('${module._id}')" style="background: var(--primary-color); color: white;">
                    Enroll Now
                </button>
            `;
        }
    }

    card.innerHTML = `
        <div class="module-header">
            <span class="module-quarter-badge">${module.quarter || 'Q1'}</span>
            <span class="module-status ${statusClass}">${statusText}</span>
        </div>
        <h3 class="module-title">${module.title}</h3>
        <p class="module-description">${module.description}</p>
        <div class="module-progress-section">
            <div class="progress-label">
                <span>Progress</span>
                <span>${progress.progress}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress.progress}%"></div>
            </div>
        </div>
        <div class="module-footer">
            ${actionButton}
            ${currentRole === 'admin' || currentRole === 'partner' ? `
                <button class="btn btn-outline" style="margin-top: 0.5rem; width: 100%; border-color: var(--border-color);" onclick="editCourse('${module._id}')">
                    Edit Configuration
                </button>
            ` : ''}
        </div>
        `;

    return card;
}

// ================================
// EDIT COURSE (Inline modal on homepage)
// ================================

// Inject the edit course modal into the DOM (once)
function ensureEditCourseModal() {
    if (document.getElementById('editCourseModal')) return;

    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal" id="editCourseModal">
            <div class="modal-content" style="max-width:560px;">
                <button class="modal-close" id="editCourseCloseBtn">&times;</button>
                <div class="modal-header">
                    <h3>✏️ Edit Course Configuration</h3>
                    <p>Update course details for the Capacity Building module</p>
                </div>
                <form class="modal-form" id="editCourseForm" onsubmit="return false;">
                    <input type="hidden" id="ecId">

                    <div class="form-group">
                        <label>Course Title</label>
                        <input type="text" id="ecTitle" placeholder="Enter course title" required>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label>Quarter</label>
                            <select id="ecQuarter" style="width:100%;padding:0.85rem 1rem;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;color:#fff;font-size:0.95rem;outline:none;">
                                <option value="Q1">Q1</option>
                                <option value="Q2">Q2</option>
                                <option value="Q3">Q3</option>
                                <option value="Q4">Q4</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Difficulty</label>
                            <select id="ecDifficulty" style="width:100%;padding:0.85rem 1rem;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;color:#fff;font-size:0.95rem;outline:none;">
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label>Status</label>
                            <select id="ecStatus" style="width:100%;padding:0.85rem 1rem;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;color:#fff;font-size:0.95rem;outline:none;">
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Duration</label>
                            <input type="text" id="ecDuration" placeholder="e.g. 2 Weeks">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="ecDesc" rows="3" placeholder="Short course description…"
                            style="width:100%;padding:0.85rem 1rem;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;color:#fff;font-size:0.95rem;outline:none;resize:vertical;font-family:inherit;"></textarea>
                    </div>

                    <p id="ecAlert" style="display:none;padding:0.75rem 1rem;border-radius:10px;font-size:0.85rem;margin-bottom:1rem;"></p>

                    <div style="display:flex;gap:0.75rem;">
                        <button type="button" id="ecSaveBtn" class="btn-primary btn-full"
                            style="flex:1;padding:0.9rem;font-size:1rem;font-weight:700;border-radius:10px;background:linear-gradient(135deg,#00b4d8,#0077b6);border:none;color:#fff;cursor:pointer;transition:all 0.3s ease;box-shadow:0 4px 15px rgba(0,180,216,0.3);">
                            Save Changes
                        </button>
                        <button type="button" id="ecCancelBtn"
                            style="padding:0.9rem 1.5rem;font-size:1rem;font-weight:600;border-radius:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.7);cursor:pointer;transition:all 0.3s ease;">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `);

    // Event listeners
    document.getElementById('editCourseCloseBtn').addEventListener('click', closeEditCourseModal);
    document.getElementById('ecCancelBtn').addEventListener('click', closeEditCourseModal);
    document.getElementById('ecSaveBtn').addEventListener('click', saveEditedCourse);

    // Close on backdrop click
    document.getElementById('editCourseModal').addEventListener('click', (e) => {
        if (e.target.id === 'editCourseModal') closeEditCourseModal();
    });
}

function closeEditCourseModal() {
    const modal = document.getElementById('editCourseModal');
    if (modal) modal.classList.remove('active');
}

async function editCourse(courseId) {
    if (!courseId) return;

    ensureEditCourseModal();

    const alertEl = document.getElementById('ecAlert');
    alertEl.style.display = 'none';

    try {
        const course = await api.getCourse(courseId);
        if (!course) {
            showNotification('Course not found.');
            return;
        }

        document.getElementById('ecId').value = course._id || course.id;
        document.getElementById('ecTitle').value = course.title || '';
        document.getElementById('ecQuarter').value = course.quarter || 'Q1';
        document.getElementById('ecDifficulty').value = course.difficulty || 'beginner';
        document.getElementById('ecStatus').value = course.status || 'published';
        document.getElementById('ecDuration').value = course.duration || '';
        document.getElementById('ecDesc').value = course.description || '';

        document.getElementById('editCourseModal').classList.add('active');

    } catch (err) {
        console.error('Failed to load course for editing:', err);
        showNotification('Failed to load course: ' + err.message);
    }
}

async function saveEditedCourse() {
    const id = document.getElementById('ecId').value;
    const alertEl = document.getElementById('ecAlert');
    const saveBtn = document.getElementById('ecSaveBtn');

    const data = {
        title: document.getElementById('ecTitle').value.trim(),
        quarter: document.getElementById('ecQuarter').value,
        difficulty: document.getElementById('ecDifficulty').value,
        status: document.getElementById('ecStatus').value,
        duration: document.getElementById('ecDuration').value.trim(),
        description: document.getElementById('ecDesc').value.trim(),
    };

    if (!data.title) {
        alertEl.textContent = 'Course title is required.';
        alertEl.style.cssText = 'display:block;background:rgba(239,68,68,0.15);color:#fca5a5;padding:0.75rem 1rem;border-radius:10px;font-size:0.85rem;margin-bottom:1rem;';
        return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';
    alertEl.style.display = 'none';

    try {
        await api.request(`/courses/${id}`, { method: 'PUT', body: data });

        alertEl.textContent = '✅ Course updated successfully!';
        alertEl.style.cssText = 'display:block;background:rgba(16,185,129,0.15);color:#6ee7b7;padding:0.75rem 1rem;border-radius:10px;font-size:0.85rem;margin-bottom:1rem;';

        // Refresh the modules grid after a brief moment
        setTimeout(async () => {
            closeEditCourseModal();
            await renderModules();
        }, 800);

    } catch (err) {
        alertEl.textContent = 'Save failed: ' + (err.message || 'Unknown error');
        alertEl.style.cssText = 'display:block;background:rgba(239,68,68,0.15);color:#fca5a5;padding:0.75rem 1rem;border-radius:10px;font-size:0.85rem;margin-bottom:1rem;';
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
    }
}

// ================================
// LMS SYSTEM
// ================================

let currentProgress = null;

async function openModule(moduleId) {
    try {
        currentModule = await api.getCourse(moduleId);
        if (!currentModule) return;

        // Fetch user progress
        currentProgress = await api.getCourseProgress(moduleId);
        if (!currentProgress) {
            currentProgress = { progress: 0, completedLessons: [] };
        }

        // Hide capacity section, show LMS
        document.getElementById('capacity').style.display = 'none';
        const lmsSection = document.getElementById('lmsSection');
        lmsSection.style.display = 'block';

        // Update module info
        document.getElementById('moduleTitle').textContent = currentModule.title;
        document.getElementById('moduleQuarter').textContent = currentModule.quarter || 'Q1';

        // Render Nav
        renderLMSNav();

        // Update progress
        document.getElementById('progressPercent').textContent = (currentProgress.progress || 0) + '%';
        document.getElementById('progressFill').style.width = (currentProgress.progress || 0) + '%';

        // Load overview section by default
        switchLMSSection('overview');

        // Scroll gracefully to the LMS section
        lmsSection.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        showNotification('Failed to load course details.');
        console.error(error);
    }
}

function renderLMSNav() {
    const nav = document.getElementById('lmsNav');

    let html = `
        <button class="lms-nav-item" data-section="overview">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 7L10 2L17 7V16C17 16.5304 16.7893 17.0391 16.4142 17.4142C16.0391 17.7893 15.5304 18 15 18H5C4.46957 18 3.96086 17.7893 3.58579 17.4142C3.21071 17.0391 3 16.5304 3 16V7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span>Overview</span>
        </button>
    `;

    if (currentModule && currentModule.lessons) {
        currentModule.lessons.forEach((lesson, index) => {
            const isCompleted = currentProgress.completedLessons.includes(lesson._id);
            const checkIcon = isCompleted ? `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="margin-left: auto; color: #10B981;">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            ` : '';

            html += `
                <button class="lms-nav-item" data-section="lesson_${lesson._id}">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V16C4 16.5304 4.21071 17.0391 4.58579 17.4142C4.96086 17.7893 5.46957 18 6 18H14C14.5304 18 15.0391 17.7893 15.4142 17.4142C15.7893 17.0391 16 16.5304 16 16V7L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>Lesson ${index + 1}: ${lesson.title}</span>
                    ${checkIcon}
                </button>
            `;
        });
    }

    if (currentProgress.progress === 100) {
        html += `
            <button class="lms-nav-item" data-section="certificate">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 12C12.2091 12 14 10.2091 14 8C14 5.79086 12.2091 4 10 4C7.79086 4 6 5.79086 6 8C6 10.2091 7.79086 12 10 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M8.21 13.89L7 18L10 16L13 18L11.79 13.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Certificate</span>
            </button>
        `;
    }

    nav.innerHTML = html;

    // Attach events
    const navItems = nav.querySelectorAll('.lms-nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            switchLMSSection(item.dataset.section);
        });
    });
}

function switchLMSSection(sectionName) {
    // Update navigation
    document.querySelectorAll('.lms-nav-item').forEach(item => {
        if (item.dataset.section === sectionName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Render content
    const content = document.getElementById('lmsContent');

    if (sectionName === 'overview') {
        renderOverview(content);
    } else if (sectionName.startsWith('lesson_')) {
        const lessonId = sectionName.replace('lesson_', '');
        renderLesson(content, lessonId);
    } else if (sectionName === 'certificate') {
        renderCertificate(content);
    }
}

function renderOverview(container) {
    container.innerHTML = `
        <div class="content-section active">
            <h2>${currentModule.title}</h2>
            <p>${currentModule.description}</p>
            
            <div style="margin-top: 2rem;">
                <h3>Lessons (${currentModule.lessons ? currentModule.lessons.length : 0})</h3>
                <ul class="learning-objectives" style="margin-top: 1rem;">
                    ${currentModule.lessons && currentModule.lessons.length > 0 ?
            currentModule.lessons.map(l => `<li>${l.title}</li>`).join('')
            : '<li>No lessons available yet.</li>'}
                </ul>
            </div>
            
            <p style="margin-top: 2rem; color: var(--text-secondary);">
                <strong>Duration:</strong> ${currentModule.duration || 'Estimated 2-3 weeks'}<br>
                <strong>Difficulty:</strong> ${currentModule.difficulty || 'All levels'}
            </p>
        </div>
    `;
}

async function markLessonComplete(lessonId) {
    try {
        await api.updateLessonProgress(currentModule._id, lessonId);
        showNotification('Lesson marked as complete!');

        // Refresh progress
        currentProgress = await api.getCourseProgress(currentModule._id);

        // Rerender progress bar
        document.getElementById('progressPercent').textContent = (currentProgress.progress || 0) + '%';
        document.getElementById('progressFill').style.width = (currentProgress.progress || 0) + '%';

        // Rerender Nav to show checkmarks
        renderLMSNav();

        // Stay on current section
        switchLMSSection('lesson_' + lessonId);

    } catch (error) {
        showNotification('Failed to update progress: ' + error.message);
    }
}

function renderLesson(container, lessonId) {
    const lesson = currentModule.lessons.find(l => l._id === lessonId);
    if (!lesson) {
        container.innerHTML = '<p>Lesson not found.</p>';
        return;
    }

    const isCompleted = currentProgress.completedLessons.includes(lesson._id);

    if (lesson.resourceLinks && lesson.resourceLinks.length > 0) {
        resourcesHtml = `
            <h3 style="margin-top: 2rem;">Resources</h3>
            <ul style="margin-top: 1rem; list-style: none; padding-left: 0;">
                ${lesson.resourceLinks.map(link => `
                    <li style="margin-bottom: 0.5rem;">
                        <a href="${link}" target="_blank" style="color: var(--primary-color); text-decoration: none;">
                            📎 ${link}
                        </a>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    container.innerHTML = `
        <div class="content-section active">
            <h2>${lesson.title}</h2>
            
            ${lesson.videoUrl ? `
                <div style="margin: 2rem 0; width: 100%; aspect-ratio: 16/9; background: #f1f5f9; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    <iframe width="100%" height="100%" src="${lesson.videoUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
            ` : ''}

            <div style="margin-top: 2rem; line-height: 1.8;">
                ${lesson.content || 'Content coming soon.'}
            </div>
            
            ${resourcesHtml}

            <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                ${isCompleted ? `
                    <div style="color: #10B981; font-weight: 500; display: flex; align-items: center; gap: 0.5rem;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Completed
                    </div>
                ` : `
                    <button class="btn btn-primary" onclick="markLessonComplete('${lesson._id}')">
                        Mark as Complete
                    </button>
                `}
            </div>
        </div>
    `;
}

function renderCertificate(container) {
    const canDownload = currentProgress && currentProgress.progress === 100;

    container.innerHTML = `
        <div class="content-section active">
            <h2>Certificate</h2>
            
            <div class="certificate-box">
                <div class="certificate-icon ${!canDownload ? 'certificate-locked' : ''}">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                        <path d="M12 15C15.3137 15 18 12.3137 18 9C18 5.68629 15.3137 3 12 3C8.68629 3 6 5.68629 6 9C6 12.3137 8.68629 15 12 15Z" stroke="currentColor" stroke-width="2"/>
                        <path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </div>
                
                <h3>${canDownload ? 'Certificate Available!' : 'Certificate Locked'}</h3>
                
                ${canDownload ? `
                    <p style="color: var(--text-secondary); margin: 1rem 0 2rem;">
                        Congratulations! You've successfully completed this module. Download your certificate below.
                    </p>
                    <button class="download-certificate-btn" onclick="downloadCertificate()">
                        Download Certificate
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M3 13L3 14C3 15.1046 3.89543 16 5 16L15 16C16.1046 16 17 15.1046 17 14L17 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M10 3L10 12M10 12L7 9M10 12L13 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                ` : `
                    <p style="color: var(--text-secondary); margin: 1rem 0;">
                        Complete all lessons in this course to unlock your certificate.
                    </p>
                    <button class="download-certificate-btn" disabled>
                        Certificate Locked
                    </button>
                    
                    <div style="margin-top: 2rem; padding: 1.5rem; background: var(--bg-primary); border-radius: 0.75rem;">
                        <h4 style="margin-bottom: 0.5rem;">Requirements:</h4>
                        <ul style="list-style: none; padding: 0;">
                            <li style="padding: 0.5rem 0; color: ${currentProgress && currentProgress.progress === 100 ? '#22c55e' : 'var(--text-secondary)'};">
                                ${currentProgress && currentProgress.progress === 100 ? '✓' : '○'} Complete 100% of lessons
                            </li>
                        </ul>
                    </div>
                `}
            </div>
        </div>
    `;
}

// Removed redundant HTML-print downloadCertificate in favor of the production-grade PDF version below

function uploadMaterial() {
    showNotification('Material upload functionality - would integrate with file storage in production.');
}

// ================================
// OPPORTUNITIES SECTION
// ================================

async function initializeOpportunities() {
    const grid = document.getElementById('opportunitiesGrid');
    if (grid) {
        grid.innerHTML = '';
        renderSkeletonCards(grid, 3);
    }

    try {
        const fetched = await api.getOpportunities();
        opportunitiesData = fetched && fetched.length > 0 ? fetched : [
            {
                id: 'demo-opp-1',
                title: 'Youth Advocacy Fellowship 2026',
                type: 'training',
                provider: 'YAN Rwanda',
                description: 'A 6-month intensive fellowship for emerging youth leaders focused on child rights advocacy.',
                deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
                duration: '6 Months'
            },
            {
                id: 'demo-opp-2',
                title: 'Community Innovation Grant',
                type: 'funding',
                provider: 'UNICEF Rwanda',
                description: 'Micro-grants for youth-led organizations implementing innovative solutions in education.',
                deadline: new Date(Date.now() + 15 * 86400000).toISOString(),
                amount: '$2,000 - $5,000'
            },
            {
                id: 'demo-opp-3',
                title: 'Digital Literacy Partnership',
                type: 'partnership',
                provider: 'RWANDA ICT',
                description: 'Collaboration opportunity for tech-focused NGOs to scale digital skills programs.',
                deadline: new Date(Date.now() + 45 * 86400000).toISOString(),
                duration: 'Ongoing'
            }
        ];
    } catch (error) {
        if (grid) {
            grid.innerHTML = `<div class="error-banner" style = "color:red; text-align:center; padding: 2rem; width: 100%;" > Failed to load opportunities: ${error.message}</div> `;
        }
        return;
    }

    renderOpportunities('all');

    // Filter tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const filter = tab.dataset.filter;
            renderOpportunities(filter);
        });
    });
}

function renderOpportunities(filter) {
    const grid = document.getElementById('opportunitiesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = filter === 'all' ?
        opportunitiesData :
        opportunitiesData.filter(opp => opp.type === filter);

    if (!filtered || filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state" style="text-align:center; padding: 2rem; width: 100%;">No active opportunities found for this category.</div>';
        return;
    }

    const fragment = document.createDocumentFragment();

    filtered.forEach(opp => {
        const card = createOpportunityCard(opp);
        fragment.appendChild(card);
        // Apply Reveal Animation
        globalRevealObserver.observe(card);
        setTimeout(() => card.classList.add('visible'), 50);
    });
    
    grid.appendChild(fragment);
}

function createOpportunityCard(opp) {
    const card = document.createElement('div');
    card.className = 'opportunity-card reveal';

    const oppType = opp.type || 'general';
    const badgeClass = `badge-${oppType}`;
    const typeName = oppType.charAt(0).toUpperCase() + oppType.slice(1);

    // Safety for missing fields in new endpoints
    const deadlineStr = opp.deadline ? new Date(opp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD';

    card.innerHTML = `
        <span class="opportunity-badge ${badgeClass}">${typeName}</span>
        <h3 class="opportunity-title">${opp.title || opp.name || 'Opportunity'}</h3>
        ${opp.provider ? `<div class="opportunity-provider">by ${opp.provider}</div>` : ''}
        <p class="opportunity-description">${opp.description}</p>
        <div class="opportunity-meta">
            <div class="meta-item">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13 2H3C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V3C14 2.44772 13.5523 2 13 2Z" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M11 1V3M5 1V3M2 5H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                ${deadlineStr}
            </div>
            ${opp.amount ? `
                <div class="meta-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 1V15M11 3H6.5C5.57174 3 4.6815 3.36875 4.02513 4.02513C3.36875 4.6815 3 5.57174 3 6.5C3 7.42826 3.36875 8.3185 4.02513 8.97487C4.6815 9.63125 5.57174 10 6.5 10H9.5C10.4283 10 11.3185 10.3687 11.9749 11.0251C12.6313 11.6815 13 12.5717 13 13.5C13 14.4283 12.6313 15.3185 11.9749 15.9749C11.3185 16.6313 10.4283 17 9.5 17H3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    ${opp.amount}
                </div>
            ` : ''}
            ${opp.duration ? `
                <div class="meta-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M8 4V8L11 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    ${opp.duration}
                </div>
            ` : ''}
        </div>
        <div class="opportunity-actions">
            <button class="register-btn" onclick="registerOpportunity('${opp._id || opp.id}')">
                Register Interest
            </button>
        </div>
`;

    return card;
}

function registerOpportunity(id) {
    showNotification('Registration submitted! We\'ll contact you with more details.');
}

// ================================
// EVENTS SECTION
// ================================

async function initializeEvents() {
    const grid = document.getElementById('eventsGrid');
    if (!grid) return;

    grid.innerHTML = '';
    renderSkeletonCards(grid, 3);

    // Restore API dependency to fetch from MongoDB
    try {
        const fetched = await api.getEvents();
        eventsData = fetched && fetched.length > 0 ? fetched : [
            {
                id: 'demo-event-1',
                title: 'Kigali Youth Action Summit',
                date: new Date(Date.now() + 7 * 86400000).toISOString(),
                time: '09:00 AM - 04:00 PM',
                location: 'Kigali Convention Center',
                description: 'The largest gathering of youth advocates in Rwanda.'
            },
            {
                id: 'demo-event-2',
                title: 'Advocacy Guide Training',
                date: new Date(Date.now() + 14 * 86400000).toISOString(),
                time: '10:00 AM - 01:00 PM',
                location: 'Online Webinar',
                description: 'Learn the core principles of the Youth Advocacy Guide.'
            },
            {
                id: 'demo-event-3',
                title: 'Community Impact Workshop',
                date: new Date(Date.now() + 21 * 86400000).toISOString(),
                time: '02:00 PM - 05:00 PM',
                location: 'Youth Center, Muhanga',
                description: 'Measuring and reporting impact for grassroots organizations.'
            }
        ];
    } catch (error) {
        console.error('Events API fetch failed:', error);
        eventsData = [];
    }

    grid.innerHTML = '';

    if (eventsData && eventsData.length > 0) {
        const fragment = document.createDocumentFragment();
        eventsData.forEach(event => {
            const card = createEventCard(event);
            fragment.appendChild(card);
            // Re-apply array IntersectionObserver so they animate properly
            globalRevealObserver.observe(card);
            setTimeout(() => card.classList.add('visible'), 50);
        });
        grid.appendChild(fragment);
    } else {
        grid.innerHTML = '<div class="empty-state" style="text-align:center; padding: 2rem; width: 100%;">No upcoming events found.</div>';
    }
}

function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card reveal';

    let day = '--';
    let month = '---';
    if (event.date) {
        const dateObj = new Date(event.date);
        if (!isNaN(dateObj)) {
            day = dateObj.getDate();
            month = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        }
    }

    card.innerHTML = `
    <div class="event-date" >
            <div class="event-day">${day}</div>
            <div class="event-month">${month}</div>
        </div>
    <div class="event-content">
        <h3 class="event-title">${event.title || event.name || 'Event'}</h3>
        <div class="event-details">
            <div class="event-detail">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" />
                    <path d="M8 4V8L11 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                </svg>
                ${event.time || 'TBD'}
            </div>
            <div class="event-detail">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M14 6.5C14 11 8 15 8 15C8 15 2 11 2 6.5C2 5 2.63 3.58 3.75 2.54C4.87 1.5 6.39 1 8 1C9.61 1 11.13 1.5 12.25 2.54C13.37 3.58 14 5 14 6.5Z" stroke="currentColor" stroke-width="1.5" />
                    <circle cx="8" cy="6.5" r="2" stroke="currentColor" stroke-width="1.5" />
                </svg>
                ${event.location || 'TBA'}
            </div>
        </div>
        <p class="event-description">${event.description || ''}</p>
        <div class="event-actions">
            <button class="add-calendar-btn" onclick="addToCalendar('${event._id || event.id}')">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="3" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.5" />
                    <path d="M11 1V3M5 1V3M2 6H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                </svg>
                Add to Calendar
            </button>
        </div>
    </div>
`;

    return card;
}

function addToCalendar(id) {
    showNotification('Calendar invite sent to your email!');
}

// ================================
// GALLERY SECTION
// ================================

function initializeGallery() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    // Render gallery items with structured data
    galleryData.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'gallery-item reveal';
        el.dataset.category = item.category;
        el.innerHTML = `
            <img src="${item.src}" alt="${item.title}" class="gallery-image" loading="lazy">
            <div class="gallery-overlay">
                <span class="gallery-caption">${item.title}</span>
                <span class="gallery-caption-location">📍 ${item.location}</span>
            </div>
        `;
        el.addEventListener('click', () => openGalleryModal(index));
        grid.appendChild(el);
    });

    // Category filter tabs
    const tabsContainer = document.getElementById('galleryFilterTabs');
    if (tabsContainer) {
        tabsContainer.addEventListener('click', (e) => {
            const tab = e.target.closest('.gallery-tab');
            if (!tab) return;

            // Update active tab
            tabsContainer.querySelectorAll('.gallery-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const filter = tab.dataset.filter;
            const items = grid.querySelectorAll('.gallery-item');
            items.forEach(item => {
                if (filter === 'all' || item.dataset.category === filter) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    }
}

function openGalleryModal(index) {
    currentGalleryIndex = index;
    const modal = document.getElementById('galleryModal');
    const img = document.getElementById('galleryModalImage');
    const captionTitle = document.getElementById('galleryCaptionTitle');
    const captionDesc = document.getElementById('galleryCaptionDesc');

    function updateSlide(idx) {
        const item = galleryData[idx];
        img.src = item.src;
        if (captionTitle) captionTitle.textContent = item.title;
        if (captionDesc) captionDesc.textContent = `${item.location} — ${item.description} `;
    }

    updateSlide(index);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Scroll lock

    // Navigation
    document.getElementById('galleryPrev').onclick = () => {
        currentGalleryIndex = (currentGalleryIndex - 1 + galleryData.length) % galleryData.length;
        updateSlide(currentGalleryIndex);
    };

    document.getElementById('galleryNext').onclick = () => {
        currentGalleryIndex = (currentGalleryIndex + 1) % galleryData.length;
        updateSlide(currentGalleryIndex);
    };

    // ESC to close
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeGalleryModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

function closeGalleryModal() {
    const modal = document.getElementById('galleryModal');
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Unlock scroll
}

// ================================
// CONTACT SECTION
// ================================

function initializeContact() {
    const form = document.getElementById('contactForm');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleContactSubmit();
    });
}

function handleContactSubmit() {
    const form = document.getElementById('contactForm');
    const success = document.getElementById('formSuccess');

    // Simulate form submission
    setTimeout(() => {
        form.reset();
        success.style.display = 'flex';

        setTimeout(() => {
            success.style.display = 'none';
        }, 5000);
    }, 500);
}

// ================================
// DASHBOARD
// ================================

function initializeDashboard() {
    updateDashboardMetrics();
    renderDashboardCourses();
}

async function updateDashboardMetrics() {
    try {
        const enrollments = await api.getMyEnrollments();
        const events = await api.getEvents();

        let completedModules = 0;
        let certificatesEarned = 0;

        for (const enrollment of enrollments) {
            if (enrollment.status === 'completed') {
                completedModules++;
                certificatesEarned++;
            }
        }

        document.getElementById('completedModules').textContent = completedModules;
        document.getElementById('pendingAssignments').textContent = enrollments.length - completedModules;
        document.getElementById('upcomingEvents').textContent = events.length;
        document.getElementById('certificatesEarned').textContent = certificatesEarned;

        // Update dashboard role badge
        const dashboardRole = document.getElementById('dashboardRole');
        if (dashboardRole) {
            dashboardRole.textContent = currentRole.charAt(0).toUpperCase() + currentRole.slice(1);
        }
    } catch (error) {
        console.error('Error updating metrics:', error);
    }
}

async function renderDashboardCourses() {
    const container = document.getElementById('dashboardCourseList');
    if (!container) return;

    try {
        const enrollments = await api.getMyEnrollments();

        if (enrollments.length === 0) {
            container.innerHTML = `
    <div class="empty-state" style = "text-align: center; padding: 2rem;" >
                    <p style="color: var(--text-light); margin-bottom: 1rem;">You haven't enrolled in any courses yet.</p>
                    <a href="#capacity" class="btn btn-primary btn-sm">Start Learning</a>
                </div>
    `;
            return;
        }

        container.innerHTML = enrollments.slice(0, 3).map(enrollment => {
            const progress = enrollment.progress || 0;
            return `
    <div class="course-progress-item" style = "margin-bottom: 1.5rem;" >
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="font-weight: 600; font-size: 0.9rem;">${enrollment.course.title}</span>
                        <span style="color: var(--primary); font-weight: 700; font-size: 0.875rem;">${progress}%</span>
                    </div>
                    <div class="progress-bar-bg" style="height: 8px; background: #f0f4f8; border-radius: 4px; overflow: hidden;">
                        <div class="progress-bar-fill" style="width: ${progress}%; height: 100%; background: var(--gradient-primary); transition: width 1s ease-out;"></div>
                    </div>
                </div>
    `;
        }).join('');

    } catch (error) {
        container.innerHTML = '<p style="color: #ef4444;">Failed to load courses.</p>';
    }
}

function showDashboard() {
    if (currentRole === 'admin') {
        showAdminDashboard();
        return;
    }

    if (currentRole === 'applicant') {
        window.location.href = 'applicant.html';
        return;
    }

    // Redirect members to the standalone member dashboard
    window.location.href = 'profile.html';
}

function setupMemberDashboardLinks() {
    const memberNavItems = document.querySelectorAll('#dashboard .dashboard-nav-item');

    memberNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const href = item.getAttribute('href');
            if (href === '#') return; // Back to site handled separately

            // Overview just stays here
            if (href === '#dashboard-overview') {
                e.preventDefault();
                memberNavItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                return;
            }

            // Other links navigate out of dashboard
            if (href === '#dashboard-modules') {
                e.preventDefault();
                hideDashboard();
                setTimeout(() => {
                    document.getElementById('capacity').scrollIntoView({ behavior: 'smooth' });
                }, 100);
            } else if (href === '#dashboard-events') {
                e.preventDefault();
                hideDashboard();
                setTimeout(() => {
                    document.getElementById('events').scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        });
    });
}

function hideDashboard() {
    document.getElementById('dashboard').style.display = 'none';
    // applicant-dashboard doesn't have a separate ID in the HTML usually, it might use the same #dashboard container
    const applicantDash = document.getElementById('applicant-dashboard');
    if (applicantDash) applicantDash.style.display = 'none';

    document.querySelectorAll('section:not(#dashboard):not(.admin-view):not(#applicant-dashboard)').forEach(section => {
        section.style.display = '';
    });
    document.getElementById('navbar').style.display = 'flex';
    document.querySelector('.footer').style.display = 'block';

    // Hide LMS and Admin
    const adminPanel = document.getElementById('admin');
    if (adminPanel) adminPanel.style.display = 'none';
    document.getElementById('lmsSection').style.display = 'none';

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================================
// ADMIN DASHBOARD
// ================================

function showAdminDashboard() {
    // Redirect to the standalone admin dashboard page
    window.location.href = 'admin.html';
}

function setupAdminDashboardLinks() {
    const adminNavItems = document.querySelectorAll('.admin-section .dashboard-nav-item');

    adminNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const href = item.getAttribute('href');
            if (href === '#') {
                e.preventDefault();
                hideDashboard(); // Go back to original site
                return;
            }

            e.preventDefault();

            // Remove active class from all
            adminNavItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Switch panels
            const panels = document.querySelectorAll('.admin-panel');
            panels.forEach(p => p.style.display = 'none');

            if (href === '#admin-overview') {
                document.getElementById('admin-users-panel').style.display = 'block';
                document.getElementById('admin-orgs-panel').style.display = 'block';
            } else if (href === '#admin-users') {
                document.getElementById('admin-users-panel').style.display = 'block';
            } else if (href === '#admin-organizations') {
                document.getElementById('admin-orgs-panel').style.display = 'block';
            } else if (href === '#admin-lms') {
                document.getElementById('admin-lms-panel').style.display = 'block';
                loadAdminLmsAnalytics();
            } else if (href === '#admin-applications') {
                document.getElementById('admin-applications-panel').style.display = 'block';
                loadAdminApplications();
            }
        });
    });
}

async function loadAdminSystemStats() {
    const grid = document.getElementById('adminStatsGrid');
    if (!grid) return;

    try {
        const stats = await api.getAdminSystemStats();

        grid.innerHTML = `
            <div class="metric-card">
                <div class="metric-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <img src="assets/icons/users.png" alt="Users" style="width: 32px; height: 32px; object-fit: contain;">
                </div>
                <div class="metric-content">
                    <div class="metric-value">${stats.users.total}</div>
                    <div class="metric-label">Total Users</div>
                    <div style="font-size: 0.75rem; color: #10b981; font-weight: 600;">+${stats.users.newLast30Days} this month</div>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                    <img src="assets/icons/organizations.png" alt="Organizations" style="width: 32px; height: 32px; object-fit: contain;">
                </div>
                <div class="metric-content">
                    <div class="metric-value">${stats.organizations.total}</div>
                    <div class="metric-label">Organizations</div>
                    <div style="font-size: 0.75rem; color: var(--text-light);">${stats.organizations.active} Active</div>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                    <img src="assets/icons/applications.png" alt="Applications" style="width: 32px; height: 32px; object-fit: contain;">
                </div>
                <div class="metric-content">
                    <div class="metric-value">${stats.pendingApplications || 0}</div>
                    <div class="metric-label">Pending Applications</div>
                    <div style="font-size:0.75rem; color:#f59e0b; font-weight:600;">Action Required</div>
                </div>
            </div>
        `;
    } catch (err) {
        grid.innerHTML = `<div class="error-banner" style="color:red;">Failed to load stats: ${err.message}</div>`;
    }
}

async function loadAdminApplications() {
    const tbody = document.getElementById('adminApplicationsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">Loading applications...</td></tr>';

    try {
        const applications = await api.getAdminRecentApplications();

        if (applications.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">No pending applications found.</td></tr>';
            return;
        }

        tbody.innerHTML = applications.map(app => {
            const orgName = app.submissionData?.organization?.name || 'N/A';
            const date = new Date(app.createdAt).toLocaleDateString();

            return `
                <tr>
                    <td style="padding: 1rem;">
                        <div style="font-weight: 600;">${app.applicant.name}</div>
                        <div style="font-size: 0.8rem; color: var(--text-light);">${app.applicant.email}</div>
                    </td>
                    <td style="padding: 1rem;">${orgName}</td>
                    <td style="padding: 1rem;">${date}</td>
                    <td style="padding: 1rem;">
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-text btn-sm" onclick="openApplicationModal('${app._id}')">View</button>
                            <button class="btn btn-primary btn-sm" onclick="handleApplicationAction('${app._id}', 'approved')" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Approve</button>
                            <button class="btn btn-secondary btn-sm" onclick="handleApplicationAction('${app._id}', 'rejected')" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; color: #ef4444; border-color: #ef4444;">Reject</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: #ef4444; padding: 2rem;">Failed to load applications.</td></tr>`;
    }
}

async function openApplicationModal(appId) {
    const modal = document.getElementById('applicationDetailsModal');
    const body = document.getElementById('applicationModalBody');
    const actions = document.getElementById('applicationModalActions');
    if (!modal || !body) return;

    body.innerHTML = '<div style="text-align:center; padding: 2rem;">Loading details...</div>';
    openModal('applicationDetailsModal');

    try {
        const applications = await api.getAdminRecentApplications();
        const app = applications.find(a => a._id === appId);

        if (!app) throw new Error('Application not found');

        const data = app.submissionData || {};
        const org = data.organization || {};
        const rep = data.representative || {};

        body.innerHTML = `
            <div class="application-view">
                <section style="margin-bottom: 2rem;">
                    <h4 style="color: var(--primary); border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1rem;">Organization Details</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div><strong>Name:</strong> ${org.name || 'N/A'}</div>
                        <div><strong>Type:</strong> ${org.type || 'N/A'}</div>
                        <div><strong>Category:</strong> ${org.category || 'N/A'}</div>
                        <div><strong>Website:</strong> ${org.website || 'N/A'}</div>
                    </div>
                    <div style="margin-top: 1rem;">
                        <strong>Vision:</strong>
                        <p style="margin-top: 0.5rem; background: var(--bg-primary); padding: 1rem; border-radius: 0.5rem;">${org.vision || 'N/A'}</p>
                    </div>
                </section>

                <section>
                    <h4 style="color: var(--primary); border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1rem;">Representative Information</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div><strong>Name:</strong> ${rep.name || 'N/A'}</div>
                        <div><strong>Position:</strong> ${rep.position || 'N/A'}</div>
                        <div><strong>Email:</strong> ${rep.email || 'N/A'}</div>
                        <div><strong>Phone:</strong> ${rep.phone || 'N/A'}</div>
                    </div>
                </section>
            </div>
        `;

        actions.innerHTML = `
            <button class="btn btn-primary" onclick="handleApplicationAction('${app._id}', 'approved')">Approve Member</button>
            <button class="btn btn-secondary" onclick="handleApplicationAction('${app._id}', 'rejected')" style="color: #ef4444; border-color: #ef4444;">Reject</button>
        `;
    } catch (error) {
        body.innerHTML = `<div style="color: #ef4444; padding: 2rem;">Error: ${error.message}</div>`;
    }
}

async function handleApplicationAction(appId, status) {
    if (!confirm(`Are you sure you want to ${status} this application?`)) return;

    try {
        await api.request(`/applications/${appId}/status`, {
            method: 'PATCH',
            body: { status }
        });
        showNotification(`Application ${status} successfully.`);
        closeModal('applicationDetailsModal');
        loadAdminApplications();
        loadAdminSystemStats();
    } catch (error) {
        showNotification('Action failed: ' + error.message, 'error');
    }
}

async function loadAdminUsers() {
    const tbody = document.getElementById('adminUsersTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">Loading users...</td></tr>';

    try {
        const users = await api.getAdminUsers();

        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">No users found.</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => `
    <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 1rem; color: var(--text-color);">${user.name}</td>
                <td style="padding: 1rem; color: var(--text-color);">${user.email}</td>
                <td style="padding: 1rem;">
                    <select class="role-select" data-user-id="${user._id}" onchange="handleRoleChange(this)" style="padding: 0.25rem; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-color);">
                        <option value="public" ${user.role === 'public' ? 'selected' : ''}>Public</option>
                        <option value="applicant" ${user.role === 'applicant' ? 'selected' : ''}>Applicant</option>
                        <option value="member" ${user.role === 'member' ? 'selected' : ''}>Member</option>
                        <option value="partner" ${user.role === 'partner' ? 'selected' : ''}>Partner</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </td>
                <td style="padding: 1rem; color: var(--text-secondary);">${new Date(user.createdAt).toLocaleDateString()}</td>
            </tr>
    `).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" style="color:red; text-align:center; padding: 2rem;">Error: ${err.message}</td></tr>`;
    }
}

async function handleRoleChange(selectElement) {
    const userId = selectElement.getAttribute('data-user-id');
    const newRole = selectElement.value;

    try {
        selectElement.disabled = true;
        await api.updateAdminUserRole(userId, newRole);
        showNotification('User role updated successfully');
    } catch (err) {
        showNotification('Failed to update role: ' + err.message);
        // Reset selection on failure - requires a reload to safely restore the old state, or tracking it
        loadAdminUsers();
    } finally {
        selectElement.disabled = false;
    }
}

async function loadAdminOrganizations() {
    const tbody = document.getElementById('adminOrgsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">Loading organizations...</td></tr>';

    try {
        const orgs = await api.getOrganizations(); // Use existing fetching

        if (!orgs || orgs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">No organizations found.</td></tr>';
            return;
        }

        tbody.innerHTML = orgs.map(org => `
    <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 1rem; color: var(--text-color);">${org.name}</td>
                <td style="padding: 1rem;">
                    <select class="status-select" data-org-id="${org._id}" onchange="handleOrgStatusChange(this)" style="padding: 0.25rem; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-color);">
                        <option value="active" ${org.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${org.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="draft" ${org.status === 'draft' ? 'selected' : ''}>Draft</option>
                    </select>
                </td>
                <td style="padding: 1rem; color: var(--text-secondary);">${new Date(org.createdAt).toLocaleDateString()}</td>
                <td style="padding: 1rem;">
                    <a href="#" onclick="openOrganizationModal('${org._id}'); return false;" style="color: var(--primary-color);">View</a>
                </td>
            </tr>
    `).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" style="color:red; text-align:center; padding: 2rem;">Error: ${err.message}</td></tr>`;
    }
}

async function handleOrgStatusChange(selectElement) {
    const orgId = selectElement.getAttribute('data-org-id');
    const newStatus = selectElement.value;

    try {
        selectElement.disabled = true;
        await api.updateAdminOrganizationStatus(orgId, newStatus);
        showNotification('Organization status updated');
        // Refresh public organizations grid in background
        initializeOrganizations();
    } catch (err) {
        showNotification('Failed to update status: ' + err.message);
        loadAdminOrganizations();
    } finally {
        selectElement.disabled = false;
    }
}

async function loadAdminLmsAnalytics() {
    const grid = document.getElementById('lmsStatsGrid');
    const tbody = document.getElementById('adminLmsTableBody');
    if (!grid || !tbody) return;

    grid.innerHTML = '<div class="loading">Loading stats...</div>';
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">Loading completions...</td></tr>';

    try {
        const analytics = await api.getAdminLmsAnalytics();
        const summary = analytics.summary || {};

        grid.innerHTML = `
    <div class="metric-card" >
                <span class="metric-label">Avg. Progress</span>
                <div class="metric-value">${summary.avgProgress || 0}%</div>
            </div>
            <div class="metric-card">
                <span class="metric-label">Total Enrollments</span>
                <div class="metric-value">${summary.totalEnrollments || 0}</div>
            </div>
            <div class="metric-card">
                <span class="metric-label">Certificates Issued</span>
                <div class="metric-value">${summary.totalCertificates || 0}</div>
            </div>
`;

        if (!analytics.recentCompletions || analytics.recentCompletions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">No recent completions found.</td></tr>';
            return;
        }

        tbody.innerHTML = analytics.recentCompletions.map(enroll => `
    <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 1rem; color: var(--text-color);">${enroll.user ? enroll.user.name : 'Unknown User'}</td>
                <td style="padding: 1rem; color: var(--text-color);">${enroll.course ? enroll.course.title : 'Unknown Course'}</td>
                <td style="padding: 1rem;"><span class="badge badge-success">Completed</span></td>
                <td style="padding: 1rem; color: var(--text-secondary);">${new Date(enroll.updatedAt).toLocaleDateString()}</td>
            </tr>
    `).join('');

    } catch (err) {
        console.error('LMS Analytics error:', err);
        grid.innerHTML = `<div class="error-banner" > Error loading stats</div> `;
        tbody.innerHTML = `<tr><td colspan="4" style="color:red; text-align:center;">Error: ${err.message}</td></tr> `;
    }
}

// ================================
// MODAL UTILITIES
// ================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

// Close modal when clicking close button
document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
        const modalId = btn.dataset.modal;
        if (modalId) {
            closeModal(modalId);
        } else {
            // For gallery modal
            btn.closest('.modal').classList.remove('active');
        }
    });
});

// Close modal when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// ================================
// HERO CTA
// ================================

document.getElementById('heroJoinBtn').addEventListener('click', () => {
    if (currentUser) {
        if (currentRole === 'member' || currentRole === 'admin') {
            showNotification('You\'re already a member! Check out our opportunities.');
            document.getElementById('opportunities').scrollIntoView({ behavior: 'smooth' });
        } else if (currentRole === 'applicant') {
            window.location.href = 'application-form.html';
        } else {
            showNotification('Access your dashboard to apply for membership.');
            showDashboard();
        }
    } else {
        showNotification('Please login to join our network.');
        document.getElementById('loginBtn').click();
    }
});

function renderApplicantDashboard() {
    // Hide main sections
    document.querySelectorAll('section:not(#dashboard)').forEach(section => {
        section.style.display = 'none';
    });

    // Hide navigation and footer
    document.getElementById('navbar').style.display = 'none';
    document.querySelector('.footer').style.display = 'none';

    // Show dashboard container
    document.getElementById('dashboard').style.display = 'block';

    // Toggle applicant vs member views
    document.getElementById('applicant-dashboard').style.display = 'block';
    document.getElementById('member-metrics').style.display = 'none';
    document.getElementById('member-content').style.display = 'none';

    // Update title
    const dashTitle = document.querySelector('.dashboard-header h1');
    if (dashTitle) dashTitle.textContent = 'Applicant Portal';

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================================
// PHASE 6.1 UTILITIES
// ================================

function initializeOfflineDetection() {
    const banner = document.getElementById('offlineBanner');
    if (!banner) return;

    function updateStatus() {
        if (navigator.onLine) {
            banner.classList.remove('visible');
        } else {
            banner.classList.add('visible');
        }
    }

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    // Initial check
    updateStatus();
}

function initializeScrollProgress() {
    const bar = document.getElementById('scrollProgressBar');
    if (!bar) return;

    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        bar.style.width = scrolled + "%";
    });
}

function initializeRippleEffect() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn');
        if (!btn) return;

        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        btn.appendChild(ripple);

        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = `${size} px`;
        ripple.style.left = `${x} px`;
        ripple.style.top = `${y} px`;

        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
}

// ================================
// KEYBOARD SHORTCUTS
// ================================

document.addEventListener('keydown', (e) => {
    // ESC to close modals
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });

        // Close dropdowns
        document.querySelectorAll('.dropdown-menu.active').forEach(menu => {
            menu.classList.remove('active');
        });
    }

    // Arrow keys for gallery navigation
    const galleryModal = document.getElementById('galleryModal');
    if (galleryModal.classList.contains('active')) {
        if (e.key === 'ArrowLeft') {
            document.getElementById('galleryPrev').click();
        } else if (e.key === 'ArrowRight') {
            document.getElementById('galleryNext').click();
        }
    }
});

// ================================
// PERFORMANCE OPTIMIZATION
// ================================

// Lazy load images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// ================================
// HELPER FUNCTIONS
// ================================

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(timeString) {
    // Parse and format time string
    return timeString;
}

function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ================================
// ERROR HANDLING
// ================================

window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});

// ================================
// CERTIFICATE GENERATION
// ================================

window.downloadCertificate = async function () {
    if (!currentModule || !currentModule._id) return;

    try {
        const btn = document.querySelector('.download-certificate-btn');
        if (btn) {
            btn.innerHTML = 'Generating PDF...';
            btn.disabled = true;
        }

        const blob = await api.downloadCertificate(currentModule._id);

        // Create an object URL for the blob
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Certificate_${currentModule.title ? currentModule.title.replace(/\s+/g, '_') : 'Course'}.pdf`;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        if (btn) {
            btn.innerHTML = 'Download Certificate <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 13L3 14C3 15.1046 3.89543 16 5 16L15 16C16.1046 16 17 15.1046 17 14L17 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M10 3L10 12M10 12L7 9M10 12L13 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            btn.disabled = false;
        }
    } catch (err) {
        console.error('Error downloading certificate:', err);
        showNotification('Failed to download certificate. Please try again.', 'error');
        const btn = document.querySelector('.download-certificate-btn');
        if (btn) {
            btn.innerHTML = 'Download Certificate <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 13L3 14C3 15.1046 3.89543 16 5 16L15 16C16.1046 16 17 15.1046 17 14L17 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M10 3L10 12M10 12L7 9M10 12L13 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            btn.disabled = false;
        }
    }
}

// ================================
// INITIALIZATION COMPLETE
// ================================

console.log('%c YAN Rwanda Platform Loaded Successfully! ', 'background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: white; padding: 10px 20px; font-size: 16px; font-weight: bold;');
console.log('Auth: using backend API at', YAN_CONFIG.API_BASE_URL);
console.log('Modules:', modulesData.length);
console.log('Platform ready for deployment!');