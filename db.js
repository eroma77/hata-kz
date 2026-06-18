// Hata.kz Client Database Layer - REST API Bridge
// Communicates with Express Monolithic backend endpoints instead of direct storage access

class HataDatabase {
    constructor() {
        this.supabaseClient = null;
        this.listingsCache = [];
        this.userListingsCache = [];
        this.init();
    }

    init() {
        this.initSupabase();
        this.fetchListingsFromServer();
    }

    initSupabase() {
        const config = HataConfig; // Loaded from config.js
        if (typeof supabase !== 'undefined' && config.supabaseUrl && config.supabaseUrl.startsWith('https://') && config.supabaseUrl !== 'https://your-project.supabase.co') {
            try {
                this.supabaseClient = supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
                console.log("Supabase client initialized successfully.");
                this.setupSupabaseAuthListener();
            } catch (e) {
                console.warn("Failed to initialize Supabase client:", e);
            }
        }
    }

    setupSupabaseAuthListener() {
        if (!this.supabaseClient) return;
        this.supabaseClient.auth.onAuthStateChange((event, session) => {
            if (session && session.user) {
                const config = HataConfig;
                const user = {
                    id: session.user.id,
                    name: session.user.user_metadata.full_name || session.user.email,
                    email: session.user.email,
                    avatar: session.user.user_metadata.avatar_url || '',
                    isAdmin: config.adminEmail ? session.user.email === config.adminEmail : session.user.email === 'admin@hata.kz'
                };
                localStorage.setItem('hata_current_user', JSON.stringify(user));
                this.fetchUserListingsFromServer();
            } else {
                localStorage.removeItem('hata_current_user');
                sessionStorage.removeItem('hata_current_user');
                this.userListingsCache = [];
            }
            window.dispatchEvent(new Event('hata_auth_changed'));
            this.fetchListingsFromServer();
        });
    }

    getAccessToken() {
        const currentUser = this.getCurrentUser();
        // Check for Puppeteer simulated token
        if (currentUser && currentUser.id === 'simulated-user-123') {
            return 'simulated-token-123';
        }
        if (this.supabaseClient) {
            const session = this.supabaseClient.auth.session ? this.supabaseClient.auth.session() : null;
            if (session && session.access_token) return session.access_token;
            
            // Directly look up GoTrue session token from local storage
            const project = HataConfig.supabaseUrl ? new URL(HataConfig.supabaseUrl).hostname.split('.')[0] : '';
            const sessionStr = localStorage.getItem(`sb-${project}-auth-token`);
            if (sessionStr) {
                try {
                    return JSON.parse(sessionStr).access_token;
                } catch (e) {}
            }
        }
        return null;
    }

    async fetchListingsFromServer() {
        try {
            const response = await fetch('/api/listings');
            if (response.ok) {
                this.listingsCache = await response.json();
                window.dispatchEvent(new Event('hata_listings_changed'));
            }
        } catch (e) {
            console.warn("Failed to fetch listings from server:", e.message);
        }
    }

    async fetchUserListingsFromServer() {
        const token = this.getAccessToken();
        if (!token) return;
        try {
            const response = await fetch('/api/listings/user', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                this.userListingsCache = await response.json();
                window.dispatchEvent(new Event('hata_listings_changed'));
            }
        } catch (e) {
            console.warn("Failed to fetch user listings from server:", e.message);
        }
    }

    getCurrentUser() {
        const user = sessionStorage.getItem('hata_current_user') || localStorage.getItem('hata_current_user');
        return user ? JSON.parse(user) : null;
    }

    logout() {
        localStorage.removeItem('hata_current_user');
        sessionStorage.removeItem('hata_current_user');
        this.userListingsCache = [];
        window.dispatchEvent(new Event('hata_auth_changed'));
    }

    getListings() {
        return this.listingsCache.filter(item => item.status === 'active');
    }

    getUserListings(userId) {
        return this.userListingsCache;
    }

    getListingById(id) {
        return this.listingsCache.find(item => item.id === id) || this.userListingsCache.find(item => item.id === id);
    }

    // ADD Listing (async REST wrapper)
    async addListing(listing) {
        const token = this.getAccessToken();
        if (!token) throw new Error("Требуется авторизация");

        const response = await fetch('/api/listings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(listing)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Ошибка сохранения объявления");
        }

        const saved = await response.json();
        
        // Save autofill locally
        const user = this.getCurrentUser();
        if (user) {
            this.saveAutoFillSuggestions(user.id, {
                whatsapp: listing.whatsapp,
                gender: listing.gender,
                occupation: listing.occupation,
                address: listing.address || ""
            });
        }

        await this.fetchListingsFromServer();
        await this.fetchUserListingsFromServer();
        return saved;
    }

    // UPDATE Listing (async REST wrapper)
    async updateListing(id, updatedFields) {
        const token = this.getAccessToken();
        if (!token) throw new Error("Требуется авторизация");

        const response = await fetch(`/api/listings/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedFields)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Ошибка обновления объявления");
        }

        const updated = await response.json();
        await this.fetchListingsFromServer();
        await this.fetchUserListingsFromServer();
        return updated;
    }

    // DELETE Listing (async REST wrapper)
    async deleteListing(id) {
        const token = this.getAccessToken();
        if (!token) throw new Error("Требуется авторизация");

        const response = await fetch(`/api/listings/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Ошибка удаления объявления");
        }

        await this.fetchListingsFromServer();
        await this.fetchUserListingsFromServer();
        return true;
    }

    // ARCHIVE Listing (async REST wrapper)
    async archiveListing(id) {
        const token = this.getAccessToken();
        if (!token) throw new Error("Требуется авторизация");

        const response = await fetch(`/api/listings/${id}/archive`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Ошибка архивации объявления");
        }

        await this.fetchListingsFromServer();
        await this.fetchUserListingsFromServer();
        return true;
    }

    // REACTIVATE Listing (async REST wrapper)
    async reactivateListing(id) {
        const token = this.getAccessToken();
        if (!token) throw new Error("Требуется авторизация");

        const response = await fetch(`/api/listings/${id}/reactivate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Ошибка активации объявления");
        }

        await this.fetchListingsFromServer();
        await this.fetchUserListingsFromServer();
        return true;
    }

    // Local Favorites & Autofill (Client only features)
    toggleFavorite(userId, listingId) {
        if (!userId) return false;
        const key = `hata_favorites_${userId}`;
        let favorites = JSON.parse(localStorage.getItem(key) || '[]');
        const index = favorites.indexOf(listingId);
        let isFavorite = false;
        
        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(listingId);
            isFavorite = true;
        }
        
        localStorage.setItem(key, JSON.stringify(favorites));
        window.dispatchEvent(new Event('hata_listings_changed'));
        return isFavorite;
    }

    getFavorites(userId) {
        if (!userId) return [];
        return JSON.parse(localStorage.getItem(`hata_favorites_${userId}`) || '[]');
    }

    getAutoFillSuggestions(userId) {
        const suggestions = localStorage.getItem(`hata_autofill_${userId}`);
        return suggestions ? JSON.parse(suggestions) : {};
    }

    saveAutoFillSuggestions(userId, fields) {
        const current = this.getAutoFillSuggestions(userId);
        const updated = { ...current, ...fields };
        localStorage.setItem(`hata_autofill_${userId}`, JSON.stringify(updated));
    }
}

const db = new HataDatabase();
window.db = db;
