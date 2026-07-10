import axios from 'axios';

// ==============================================================================
// AXIOS INSTANCE
// Centralised HTTP client. All API calls go through here.
// Interceptors inject user context headers from localStorage (no JWT yet —
// headers carry the user's id, role, and department_id directly).
// ==============================================================================

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- Request interceptor: attach user context headers ---
apiClient.interceptors.request.use((config) => {
    try {
        const raw = localStorage.getItem('pamantasan_user');
        if (raw) {
            const user = JSON.parse(raw);
            config.headers['x-user-id']   = user.id;
            config.headers['x-user-role'] = user.role;
            config.headers['x-user-dept'] = user.department_id;
        }
    } catch (_e) {
        // Ignore parse errors — unauthenticated request will proceed without headers
    }
    return config;
});

// --- Response interceptor: surface error messages cleanly ---
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        let message = error.message || 'Unknown error';
        if (error.response?.data instanceof Blob && error.response.data.type?.includes('json')) {
            try {
                const text = await error.response.data.text();
                const json = JSON.parse(text);
                message = json.error || json.detail || message;
                console.error('[API ERROR]', json);
            } catch (_) { /* ignore parse failure */ }
        } else {
            message = error.response?.data?.error || message;
        }
        return Promise.reject(new Error(message));
    }
);
