/**
 * YAN Platform — Production-Grade API Client
 * 
 * Security Architecture:
 * - Access token persisted in sessionStorage (survives same-tab navigations)
 * - Refresh token lives in httpOnly cookie (never accessible to JS)
 * - All requests use credentials: 'include' for cookie transport
 * - 401 interceptor with request queuing and retry-once logic
 * - Infinite loop prevention via isRefreshing flag + retry guard
 */
const api = (() => {
    // ================================================================
    // PRIVATE STATE
    // ================================================================
    let _accessToken = sessionStorage.getItem('yan_access_token') || null;
    let _isRefreshing = false;
    let _failedQueue = [];

    function _setAccessToken(token) {
        _accessToken = token;
        if (token) {
            sessionStorage.setItem('yan_access_token', token);
        } else {
            sessionStorage.removeItem('yan_access_token');
        }
    }

    // Auth endpoints that should NOT trigger refresh on 401
    const AUTH_BYPASS_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

    // ================================================================
    // QUEUE MANAGEMENT
    // ================================================================

    function _processQueue(error, token) {
        _failedQueue.forEach(({ resolve, reject }) => {
            if (error) {
                reject(error);
            } else {
                resolve(token);
            }
        });
        _failedQueue = [];
    }

    // ================================================================
    // CORE REQUEST FUNCTION
    // ================================================================

    async function request(endpoint, options = {}) {
        const url = YAN_CONFIG.API_BASE_URL + endpoint;
        const isRetry = options._isRetry || false;

        // Build headers
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        // Attach access token if available
        if (_accessToken) {
            headers['Authorization'] = 'Bearer ' + _accessToken;
        }

        // Remove internal flags from options before passing to fetch
        const { _isRetry: _, ...cleanOptions } = options;

        const fetchOptions = {
            ...cleanOptions,
            headers,
            credentials: 'include' // Always send cookies
        };

        // If body is an object, stringify it
        if (fetchOptions.body && typeof fetchOptions.body === 'object') {
            fetchOptions.body = JSON.stringify(fetchOptions.body);
        }

        let response;
        try {
            response = await fetch(url, fetchOptions);
        } catch (networkError) {
            throw new Error('Network error — please check your connection.');
        }

        // ============================================================
        // 401 INTERCEPTOR
        // ============================================================
        if (response.status === 401 && !isRetry) {
            const shouldBypass = AUTH_BYPASS_ENDPOINTS.includes(endpoint);

            if (!shouldBypass) {
                if (!_isRefreshing) {
                    _isRefreshing = true;

                    try {
                        const refreshResponse = await fetch(
                            YAN_CONFIG.API_BASE_URL + '/auth/refresh',
                            {
                                method: 'POST',
                                credentials: 'include',
                                headers: { 'Content-Type': 'application/json' }
                            }
                        );

                        if (!refreshResponse.ok) {
                            throw new Error('Refresh failed');
                        }

                        const refreshData = await refreshResponse.json();
                        if (!refreshData.success || !refreshData.token) {
                            throw new Error('Refresh failed');
                        }

                        _setAccessToken(refreshData.token);
                        localStorage.setItem('yan_auth_hint', 'true');

                        // Resolve all queued requests with new token
                        _processQueue(null, _accessToken);

                        // Retry the original request ONCE
                        return request(endpoint, { ...options, _isRetry: true });

                    } catch (refreshError) {
                        _setAccessToken(null);
                        _processQueue(refreshError, null);

                        // Notify app of session expiry
                        if (typeof window._onAuthFailure === 'function') {
                            window._onAuthFailure();
                        }

                        throw new Error('Session expired. Please login again.');
                    } finally {
                        _isRefreshing = false;
                    }
                } else {
                    // Another request is already refreshing — queue this one
                    return new Promise((resolve, reject) => {
                        _failedQueue.push({
                            resolve: (newToken) => {
                                // Retry with new token
                                resolve(request(endpoint, { ...options, _isRetry: true }));
                            },
                            reject: (err) => {
                                reject(err);
                            }
                        });
                    });
                }
            }
        }

        // ============================================================
        // RESPONSE PARSING
        // ============================================================
        let data;
        try {
            if (options.responseType === 'blob') {
                data = await response.blob();
            } else {
                data = await response.json();
            }
        } catch (parseError) {
            if (!response.ok) {
                throw new Error('Request failed');
            }
            return { success: true };
        }

        if (!response.ok) {
            let errorMessage = (data && data.message) ? data.message : 'Request failed';
            if (data && data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
                errorMessage = data.errors.join('\n');
            }
            const error = new Error(errorMessage);
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data;
    }

    // ================================================================
    // AUTH METHODS
    // ================================================================

    async function login(email, password) {
        const data = await request('/auth/login', {
            method: 'POST',
            body: { email, password }
        });

        // Persist access token in sessionStorage for cross-page navigation
        _setAccessToken(data.token);
        localStorage.setItem('yan_auth_hint', 'true');
        if (data.data?.role) localStorage.setItem('yan_role', data.data.role);

        return data.data; // { id, name, email, role }
    }

    async function register(name, email, password, role, organization) {
        const body = { name, email, password };
        if (role) body.role = role;
        if (organization) body.organization = organization;

        const data = await request('/auth/register', {
            method: 'POST',
            body
        });

        // Persist access token in sessionStorage for cross-page navigation
        _setAccessToken(data.token);
        localStorage.setItem('yan_auth_hint', 'true');
        if (data.data?.role) localStorage.setItem('yan_role', data.data.role);

        return data.data; // { id, name, email, role }
    }

    async function getMe() {
        const data = await request('/auth/me', {
            method: 'GET'
        });

        if (data.data?.role) localStorage.setItem('yan_role', data.data.role);
        return data.data; // User object
    }

    async function updateDetails(name, organization, profileImage, bio) {
        const body = { name };
        if (organization !== undefined) body.organization = organization;
        if (profileImage !== undefined) body.profileImage = profileImage;
        if (bio !== undefined) body.bio = bio;

        const data = await request('/auth/updatedetails', {
            method: 'PUT',
            body
        });

        return data.data;
    }

    async function logout() {
        try {
            await request('/auth/logout', {
                method: 'POST'
            });
        } catch (e) {
            // Logout must clear local state even if server call fails
        }

        // ALWAYS clear local state regardless of server response
        _setAccessToken(null);
        localStorage.removeItem('yan_auth_hint');
        localStorage.removeItem('yan_role');
    }

    function isAuthenticated() {
        return _accessToken !== null;
    }

    // ================================================================
    // DATA FETCHING METHODS
    // ================================================================

    async function getOrganizations() {
        const response = await request('/organizations', { method: 'GET' });
        return response.data || [];
    }

    async function getOpportunities() {
        const response = await request('/opportunities', { method: 'GET' });
        return response.data || [];
    }

    async function getEvents() {
        const response = await request('/events', { method: 'GET' });
        return response.data || [];
    }

    async function getGallery() {
        const response = await request('/gallery', { method: 'GET' });
        return response.data || [];
    }

    async function getImpactRatings() {
        const response = await request('/impact', { method: 'GET' });
        return response.data || [];
    }

    // ================================================================
    // LMS ENDPOINTS
    // ================================================================

    async function getCourses() {
        const response = await request('/courses', { method: 'GET' });
        return response.data || [];
    }

    async function getCourse(id) {
        const response = await request(`/courses/${id}`, { method: 'GET' });
        return response.data || null;
    }

    async function enrollInCourse(courseId) {
        const response = await request(`/courses/${courseId}/enroll`, { method: 'POST' });
        return response.data || null;
    }

    async function getMyEnrollments() {
        const response = await request('/enrollments', { method: 'GET' });
        return response.data || [];
    }

    async function getCourseProgress(courseId) {
        const response = await request(`/progress/${courseId}/progress`, { method: 'GET' });
        return response.data || null;
    }

    async function updateLessonProgress(courseId, lessonId) {
        const response = await request(`/progress/${courseId}/lesson/${lessonId}`, { method: 'PATCH' });
        return response;
    }

    // ================================================================
    // SUBMISSION ENDPOINTS
    // ================================================================

    async function uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Use standard fetch here because we need to send FormData and not JSON
        const token = sessionStorage.getItem('yan_access_token');
        const url = YAN_CONFIG.API_BASE_URL + '/upload';
        
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'File upload failed');
        }
        
        return data.data; // { url, publicId, format }
    }

    async function submitAssignmentToCourse(submissionData) {
        const response = await request('/submissions', {
            method: 'POST',
            body: submissionData
        });
        return response.data || null;
    }

    async function getMySubmissions() {
        const response = await request('/submissions/mine', { method: 'GET' });
        return response.data || [];
    }

    async function getAllSubmissions() {
        const response = await request('/submissions', { method: 'GET' });
        return response.data || [];
    }

    async function updateSubmissionStatus(id, status, grade, feedback) {
        const body = { status };
        if (grade !== undefined && grade !== null) body.grade = grade;
        if (feedback !== undefined) body.feedback = feedback;
        const response = await request(`/submissions/${id}/review`, {
            method: 'PATCH',
            body
        });
        return response.data || null;
    }

    // ================================================================
    // CERTIFICATE ENDPOINTS
    // ================================================================

    async function downloadCertificate(courseId) {
        const blob = await request(`/certificates/${courseId}`, {
            method: 'GET',
            responseType: 'blob'
        });
        return blob;
    }

    async function verifyCertificate(certificateId) {
        const response = await request(`/certificates/verify/${certificateId}`, { method: 'GET' });
        return response;
    }

    // ================================================================
    // ADMIN ENDPOINTS
    // ================================================================

    async function getAdminUsers() {
        const response = await request('/admin/users', { method: 'GET' });
        return response.data || [];
    }

    async function updateAdminUserRole(userId, role) {
        const response = await request(`/admin/users/${userId}/role`, {
            method: 'PATCH',
            body: { role }
        });
        return response;
    }

    async function updateAdminOrganizationStatus(orgId, status) {
        const response = await request(`/admin/organizations/${orgId}/status`, {
            method: 'PATCH',
            body: { status }
        });
        return response;
    }

    async function updateApplicationStatus(id, status, reviewerNotes) {
        const response = await request(`/applications/${id}/status`, {
            method: 'PATCH',
            body: { status, reviewerNotes }
        });
        return response;
    }

    async function getAdminSystemStats() {
        const response = await request('/admin/system-stats', { method: 'GET' });
        return response.data || {};
    }

    async function getAdminLmsAnalytics() {
        const response = await request('/admin/lms-analytics', { method: 'GET' });
        return response.data || {};
    }

    async function getAdminRecentApplications() {
        const response = await request('/admin/recent-applications', { method: 'GET' });
        return response.data || [];
    }

    async function submitApplication(data) {
        const response = await request('/applications', {
            method: 'POST',
            body: data
        });
        return response.data || null;
    }

    // ================================================================
    // PUBLIC API
    // ================================================================
    return Object.freeze({
        request,
        login,
        register,
        getMe,
        updateDetails,
        logout,
        isAuthenticated,
        getOrganizations,
        getOpportunities,
        getEvents,
        getGallery,
        getImpactRatings,
        getCourses,
        getCourse,
        enrollInCourse,
        getMyEnrollments,
        getCourseProgress,
        updateLessonProgress,
        downloadCertificate,
        verifyCertificate,
        getAdminUsers,
        updateAdminUserRole,
        updateAdminOrganizationStatus,
        updateApplicationStatus,
        getAdminSystemStats,
        getAdminLmsAnalytics,
        getAdminRecentApplications,
        submitApplication,
        uploadFile,
        submitAssignmentToCourse,
        getMySubmissions,
        getAllSubmissions,
        updateSubmissionStatus
    });
})();
