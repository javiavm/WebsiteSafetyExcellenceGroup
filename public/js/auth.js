/**
 * Frontend Auth Module
 * Phase 3: Subscription Infrastructure
 */

const Auth = {
    TOKEN_KEY: 'seg_auth_token',
    USER_KEY: 'seg_user',

    // Get stored token
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    // Get stored user
    getUser() {
        const data = localStorage.getItem(this.USER_KEY);
        return data ? JSON.parse(data) : null;
    },

    // Check if logged in
    isLoggedIn() {
        return !!this.getToken();
    },

    // Get user tier
    getTier() {
        const user = this.getUser();
        return user?.tier || 'free';
    },

    // Register new user
    async register(email, password, name, company) {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name, company })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem(this.TOKEN_KEY, data.token);
            localStorage.setItem(this.USER_KEY, JSON.stringify({
                id: data.userId, email, name, tier: 'free'
            }));
        }
        return data;
    },

    // Login
    async login(email, password) {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem(this.TOKEN_KEY, data.token);
            localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
        }
        return data;
    },

    // Logout
    async logout() {
        const token = this.getToken();
        if (token) {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        }
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    },

    // Refresh user data from server
    async refreshUser() {
        const token = this.getToken();
        if (!token) return null;

        const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
            return data.user;
        }
        this.logout();
        return null;
    },

    // Start checkout for upgrade
    async startCheckout(tier) {
        const token = this.getToken();
        if (!token) return { error: 'Please login first' };

        const res = await fetch('/api/billing/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ tier })
        });
        return res.json();
    },

    // Auth header for API calls
    getAuthHeader() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }
};

// Export for module systems
if (typeof module !== 'undefined') module.exports = Auth;
