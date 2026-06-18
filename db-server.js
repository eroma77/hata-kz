// Hata.kz Server Database Layer
// Manages server-side listings with Supabase (service_role bypass) or server_listings.json fallback

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load configurations
let HataConfig = {};
try {
    const config = require('./config');
    HataConfig = config.DEFAULT_CONFIG;
} catch (e) {
    console.warn("Failed to import config.js, using internal defaults:", e.message);
    HataConfig = {
        pricing: { postingFee: 0, promo3Days: 190, promoWeek: 490, promoMonth: 590 },
        supabaseUrl: "https://lyzbgzxmevttepsdpsor.supabase.co"
    };
}

const CACHE_FILE = path.join(__dirname, 'server_listings.json');

function mapToDB(listing) {
    if (!listing) return null;
    const dbItem = {};
    
    if (listing.id !== undefined) dbItem.id = listing.id;
    if (listing.category !== undefined) dbItem.category = listing.category;
    if (listing.ownerId !== undefined) dbItem.owner_id = listing.ownerId;
    if (listing.ownerName !== undefined) dbItem.owner_name = listing.ownerName;
    if (listing.ownerAvatar !== undefined) dbItem.owner_avatar = listing.ownerAvatar;
    
    if (listing.budgetMin !== undefined) dbItem.budget_min = listing.budgetMin;
    if (listing.budgetMax !== undefined) dbItem.budget_max = listing.budgetMax;
    if (listing.budget !== undefined) dbItem.budget = listing.budget;
    else if (listing.budgetMax !== undefined) dbItem.budget = listing.budgetMax;
    
    if (listing.age !== undefined) dbItem.age = listing.age;
    if (listing.ageMin !== undefined) dbItem.age_min = listing.ageMin;
    if (listing.ageMax !== undefined) dbItem.age_max = listing.ageMax;
    
    if (listing.city !== undefined) dbItem.city = listing.city;
    if (listing.districts !== undefined) dbItem.districts = listing.districts;
    if (listing.whatsapp !== undefined) dbItem.whatsapp = listing.whatsapp;
    if (listing.gender !== undefined) dbItem.gender = listing.gender;
    if (listing.genderPref !== undefined) dbItem.gender_pref = listing.genderPref;
    if (listing.occupation !== undefined) dbItem.occupation = listing.occupation;
    if (listing.roomCount !== undefined) dbItem.room_count = listing.roomCount;
    if (listing.roommateCount !== undefined) dbItem.roommate_count = listing.roommateCount;
    if (listing.totalResidents !== undefined) dbItem.total_residents = listing.totalResidents;
    if (listing.residentsCount !== undefined) dbItem.residents_count = listing.residentsCount;
    if (listing.description !== undefined) dbItem.description = listing.description;
    if (listing.photos !== undefined) dbItem.photos = listing.photos;
    if (listing.address !== undefined) dbItem.address = listing.address;
    if (listing.gisLink !== undefined) dbItem.gis_link = listing.gisLink;
    if (listing.hasDeposit !== undefined) dbItem.has_deposit = listing.hasDeposit;
    if (listing.hasContract !== undefined) dbItem.has_contract = listing.hasContract;
    if (listing.createdAt !== undefined) dbItem.created_at = listing.createdAt;
    if (listing.boostExpiredAt !== undefined) dbItem.boost_expired_at = listing.boostExpiredAt;
    if (listing.archivedAt !== undefined) dbItem.archived_at = listing.archivedAt;
    if (listing.status !== undefined) dbItem.status = listing.status;
    
    return dbItem;
}

function mapFromDB(dbItem) {
    if (!dbItem) return null;
    return {
        id: dbItem.id,
        category: dbItem.category,
        ownerId: dbItem.owner_id,
        ownerName: dbItem.owner_name,
        ownerAvatar: dbItem.owner_avatar || '',
        budget: parseFloat(dbItem.budget || dbItem.budget_max || 0),
        budgetMin: parseFloat(dbItem.budget_min || dbItem.budget || 0),
        budgetMax: parseFloat(dbItem.budget_max || dbItem.budget || 0),
        age: parseInt(dbItem.age || 0),
        ageMin: parseInt(dbItem.age_min || dbItem.age || 0),
        ageMax: parseInt(dbItem.age_max || dbItem.age || 0),
        city: dbItem.city,
        districts: dbItem.districts || [],
        whatsapp: dbItem.whatsapp,
        gender: dbItem.gender,
        genderPref: dbItem.gender_pref || 'any',
        occupation: dbItem.occupation,
        roomCount: dbItem.room_count,
        roommateCount: dbItem.roommate_count,
        totalResidents: dbItem.total_residents,
        residentsCount: dbItem.residents_count,
        description: dbItem.description || '',
        photos: dbItem.photos || [],
        address: dbItem.address || '',
        gisLink: dbItem.gis_link || '',
        hasDeposit: !!dbItem.has_deposit,
        hasContract: !!dbItem.has_contract,
        createdAt: dbItem.created_at,
        boostExpiredAt: dbItem.boost_expired_at,
        archivedAt: dbItem.archived_at || null,
        status: dbItem.status
    };
}

class ServerDatabase {
    constructor() {
        this.supabaseUrl = process.env.SUPABASE_URL || HataConfig.supabaseUrl;
        this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        this.supabaseClient = null;
        this.useLocalFallback = true;

        this.initSupabase();
    }

    initSupabase() {
        if (this.supabaseUrl && this.supabaseServiceKey && 
            this.supabaseUrl.startsWith('https://') && 
            this.supabaseUrl !== 'https://your-project.supabase.co' && 
            this.supabaseServiceKey !== 'your-service-role-key') {
            try {
                this.supabaseClient = createClient(this.supabaseUrl, this.supabaseServiceKey, {
                    auth: {
                        persistSession: false
                    }
                });
                this.useLocalFallback = false;
                console.log("[Server DB] Supabase Service client initialized successfully (RLS Bypassed).");
            } catch (e) {
                console.warn("[Server DB] Failed to initialize Supabase client, using local JSON fallback:", e.message);
                this.useLocalFallback = true;
            }
        } else {
            console.log("[Server DB] Missing Supabase URL or Service Key. Running in LOCAL fallback mode.");
            this.useLocalFallback = true;
        }

        if (this.useLocalFallback) {
            this.initLocalCache();
        }
    }

    initLocalCache() {
        if (!fs.existsSync(CACHE_FILE)) {
            console.log("[Server DB] Cache file not found. Generating 60 mock listings...");
            const mockListings = this.generateMockListings();
            fs.writeFileSync(CACHE_FILE, JSON.stringify(mockListings, null, 2), 'utf8');
        } else {
            // Verify if cached file is valid JSON
            try {
                const content = fs.readFileSync(CACHE_FILE, 'utf8');
                JSON.parse(content);
                console.log("[Server DB] Loaded cached listings from server_listings.json.");
            } catch (err) {
                console.warn("[Server DB] Corrupted cache file. Re-generating...");
                const mockListings = this.generateMockListings();
                fs.writeFileSync(CACHE_FILE, JSON.stringify(mockListings, null, 2), 'utf8');
            }
        }
    }

    getLocalListings() {
        try {
            const content = fs.readFileSync(CACHE_FILE, 'utf8');
            return JSON.parse(content);
        } catch (e) {
            return [];
        }
    }

    saveLocalListings(listings) {
        try {
            fs.writeFileSync(CACHE_FILE, JSON.stringify(listings, null, 2), 'utf8');
        } catch (e) {
            console.error("[Server DB] Failed to save listings cache:", e.message);
        }
    }

    // GET Listings
    async getListings(filters = {}) {
        if (!this.useLocalFallback) {
            try {
                let query = this.supabaseClient.from('listings').select('*');
                
                // Apply status = active filter by default
                query = query.eq('status', 'active');

                const { data, error } = await query;
                if (!error && data) {
                    return this.filterAndSortListings(data.map(item => mapFromDB(item)), filters);
                }
                console.warn("[Server DB] Supabase query error, falling back to local cache:", error?.message);
            } catch (e) {
                console.warn("[Server DB] Supabase fetch exception, falling back to local cache:", e.message);
            }
        }

        // Fallback
        const listings = this.getLocalListings().filter(item => item.status === 'active');
        return this.filterAndSortListings(listings, filters);
    }

    filterAndSortListings(listings, filters) {
        let result = [...listings];

        if (filters.city) {
            result = result.filter(item => item.city === filters.city);
        }
        if (filters.category) {
            result = result.filter(item => item.category === filters.category);
        }
        if (filters.gender) {
            result = result.filter(item => item.gender === filters.gender || item.gender === 'any');
        }
        if (filters.minBudget) {
            result = result.filter(item => item.budget >= parseInt(filters.minBudget));
        }
        if (filters.maxBudget) {
            result = result.filter(item => item.budget <= parseInt(filters.maxBudget));
        }
        if (filters.search) {
            const s = filters.search.toLowerCase();
            result = result.filter(item => 
                (item.description && item.description.toLowerCase().includes(s)) ||
                (item.address && item.address.toLowerCase().includes(s)) ||
                (item.ownerName && item.ownerName.toLowerCase().includes(s))
            );
        }

        // Sorting: Promoted (boosted) first, then newest
        const now = Date.now();
        result.sort((a, b) => {
            const aPromoted = a.boostExpiredAt && new Date(a.boostExpiredAt).getTime() > now;
            const bPromoted = b.boostExpiredAt && new Date(b.boostExpiredAt).getTime() > now;
            
            if (aPromoted && !bPromoted) return -1;
            if (!aPromoted && bPromoted) return 1;
            
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return result;
    }

    // GET User Listings
    async getUserListings(userId) {
        if (!this.useLocalFallback) {
            try {
                const { data, error } = await this.supabaseClient
                    .from('listings')
                    .select('*')
                    .eq('owner_id', userId);
                if (!error && data) return data.map(item => mapFromDB(item));
            } catch (e) {
                console.warn("[Server DB] User listings fetch failed:", e.message);
            }
        }
        return this.getLocalListings().filter(item => item.ownerId === userId);
    }

    // GET Single Listing
    async getListingById(id) {
        if (!this.useLocalFallback) {
            try {
                const { data, error } = await this.supabaseClient
                    .from('listings')
                    .select('*')
                    .eq('id', id)
                    .single();
                if (!error && data) return mapFromDB(data);
            } catch (e) {
                console.warn("[Server DB] Single listing fetch failed:", e.message);
            }
        }
        return this.getLocalListings().find(item => item.id === id);
    }

    // ADD Listing
    async addListing(listing) {
        if (!this.useLocalFallback) {
            try {
                const dbItem = mapToDB(listing);
                const { data, error } = await this.supabaseClient
                    .from('listings')
                    .insert([dbItem])
                    .select()
                    .single();
                if (!error && data) return mapFromDB(data);
                throw new Error(error?.message || "Unknown Supabase Insert error");
            } catch (e) {
                console.warn("[Server DB] Add listing to Supabase failed, saving locally:", e.message);
            }
        }

        // Save locally
        const listings = this.getLocalListings();
        listings.push(listing);
        this.saveLocalListings(listings);
        return listing;
    }

    // UPDATE Listing
    async updateListing(id, updatedFields) {
        if (!this.useLocalFallback) {
            try {
                const dbItem = mapToDB(updatedFields);
                const { data, error } = await this.supabaseClient
                    .from('listings')
                    .update(dbItem)
                    .eq('id', id)
                    .select()
                    .single();
                if (!error && data) return mapFromDB(data);
                throw new Error(error?.message || "Unknown Supabase Update error");
            } catch (e) {
                console.warn("[Server DB] Update listing on Supabase failed, saving locally:", e.message);
            }
        }

        // Local Update
        const listings = this.getLocalListings();
        const idx = listings.findIndex(item => item.id === id);
        if (idx === -1) throw new Error("Объявление не найдено");
        
        listings[idx] = { ...listings[idx], ...updatedFields };
        this.saveLocalListings(listings);
        return listings[idx];
    }

    // DELETE Listing
    async deleteListing(id) {
        if (!this.useLocalFallback) {
            try {
                const { error } = await this.supabaseClient
                    .from('listings')
                    .delete()
                    .eq('id', id);
                if (!error) return true;
                throw new Error(error?.message || "Unknown Supabase Delete error");
            } catch (e) {
                console.warn("[Server DB] Delete listing on Supabase failed, updating locally:", e.message);
            }
        }

        // Local Delete
        let listings = this.getLocalListings();
        const initialLen = listings.length;
        listings = listings.filter(item => item.id !== id);
        if (listings.length === initialLen) throw new Error("Объявление не найдено");
        this.saveLocalListings(listings);
        return true;
    }

    // ARCHIVE Listing
    async archiveListing(id) {
        return this.updateListing(id, { status: 'archived', archivedAt: new Date().toISOString() });
    }

    // REACTIVATE Listing
    async reactivateListing(id) {
        return this.updateListing(id, { status: 'active', createdAt: new Date().toISOString(), archivedAt: null });
    }

    // BOOST Listing
    async boostListing(id, days) {
        const boostExpiredAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        return this.updateListing(id, { boostExpiredAt, status: 'active' });
    }

    // Get Active Listing Count for User
    async getActiveCountForUser(userId) {
        const listings = await this.getUserListings(userId);
        return listings.filter(item => item.status === 'active').length;
    }

    // PRUNE / ARCHIVE cron job daemon check
    async runPruningDaemon() {
        console.log(`[${new Date().toISOString()}] Running Server Database Pruning Daemon...`);
        const now = Date.now();
        let changed = false;

        if (!this.useLocalFallback) {
            try {
                // Fetch all listings to process in batch
                const { data, error } = await this.supabaseClient.from('listings').select('*');
                if (!error && data) {
                    for (const item of data) {
                        const ageMs = now - new Date(item.created_at || item.createdAt).getTime();
                        const limitNonPromo = 20 * 24 * 60 * 60 * 1000;
                        const isPromo = item.boost_expired_at && new Date(item.boost_expired_at).getTime() > now;
                        
                        if (item.status === 'active') {
                            if (!isPromo && ageMs > limitNonPromo) {
                                // Archive non-promo older than 20 days
                                await this.archiveListing(item.id);
                                console.log(`Archived non-promoted listing: ${item.id}`);
                            } else if (isPromo) {
                                const promoExpiryMs = new Date(item.boost_expired_at).getTime();
                                const bonusGracePeriod = 5 * 24 * 60 * 60 * 1000;
                                if (now > (promoExpiryMs + bonusGracePeriod)) {
                                    // Archive promo after boost expired + 5 days grace
                                    await this.archiveListing(item.id);
                                    console.log(`Archived expired promo listing: ${item.id}`);
                                }
                            }
                        } else if (item.status === 'archived') {
                            // Check if archived for more than 3 days, delete permanently
                            const archiveAgeMs = now - new Date(item.archived_at || item.archivedAt || item.created_at || item.createdAt).getTime();
                            const deleteLimit = 3 * 24 * 60 * 60 * 1000;
                            if (archiveAgeMs > deleteLimit) {
                                await this.deleteListing(item.id);
                                console.log(`Permanently deleted archived listing: ${item.id}`);
                            }
                        }
                    }
                    return;
                }
            } catch (e) {
                console.warn("[Server DB] Supabase cron run failed, performing local check:", e.message);
            }
        }

        // Local cache check
        const listings = this.getLocalListings();
        const updatedListings = [];
        
        for (const item of listings) {
            const ageMs = now - new Date(item.createdAt).getTime();
            const limitNonPromo = 20 * 24 * 60 * 60 * 1000;
            const isPromo = item.boostExpiredAt && new Date(item.boostExpiredAt).getTime() > now;

            if (item.status === 'active') {
                if (!isPromo && ageMs > limitNonPromo) {
                    item.status = 'archived';
                    item.archivedAt = new Date().toISOString();
                    changed = true;
                    console.log(`[Cache Pruning] Archived non-promoted listing: ${item.id}`);
                    updatedListings.push(item);
                } else if (isPromo) {
                    const promoExpiryMs = new Date(item.boostExpiredAt).getTime();
                    const bonusGracePeriod = 5 * 24 * 60 * 60 * 1000;
                    if (now > (promoExpiryMs + bonusGracePeriod)) {
                        item.status = 'archived';
                        item.archivedAt = new Date().toISOString();
                        changed = true;
                        console.log(`[Cache Pruning] Archived expired promo listing: ${item.id}`);
                    }
                    updatedListings.push(item);
                } else {
                    updatedListings.push(item);
                }
            } else if (item.status === 'archived') {
                // If archived > 3 days, do not push (delete permanently)
                const deleteLimit = 3 * 24 * 60 * 60 * 1000;
                const archiveAgeMs = now - new Date(item.archivedAt || item.createdAt).getTime();
                if (archiveAgeMs > deleteLimit) {
                    changed = true;
                    console.log(`[Cache Pruning] Deleted archived listing: ${item.id}`);
                } else {
                    updatedListings.push(item);
                }
            } else {
                updatedListings.push(item);
            }
        }

        if (changed) {
            this.saveLocalListings(updatedListings);
        }
    }

    generateMockListings() {
        const listings = [];
        const maleNames = ["Данияр", "Адиль", "Санжар", "Темирлан", "Нурдаулет", "Алихан", "Арман", "Ербол", "Ануар", "Жандос"];
        const femaleNames = ["Аружан", "Камила", "Мадина", "Диана", "Асем", "Аиша", "Гульдана", "Дана", "Алия", "Фариза"];
        const roomPhotos = [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop",
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&h=400&fit=crop",
            "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&h=400&fit=crop"
        ];
        
        const citiesList = ["almaty", "astana", "shymkent", "karaganda"];
        const districtsByCity = {
            almaty: ["Бостандыкский район", "Алмалинский район", "Медеуский район"],
            astana: ["Есильский район", "Алматинский район", "Сарыаркинский район"],
            shymkent: ["Абайский район", "Каратауский район"],
            karaganda: ["Район имени Казыбек би"]
        };
 
        // Generate 30 for have_room, 30 for need_room
        for (let i = 1; i <= 30; i++) {
            const gender = i % 2 === 0 ? "male" : "female";
            const name = gender === "male" ? maleNames[i % maleNames.length] : femaleNames[i % femaleNames.length];
            const city = citiesList[i % citiesList.length];
            const districts = districtsByCity[city];
            const haveBudget = 80000 + (i * 5000);
            const needBudget = 60000 + (i * 3000);
            
            listings.push({
                id: `mock-have-${i}`,
                category: "have_room",
                ownerId: `user-gen-have-${i}`,
                ownerName: name,
                ownerAvatar: "",
                budgetMin: haveBudget - 5000,
                budgetMax: haveBudget,
                budget: haveBudget,
                age: 18 + (i % 5),
                ageMin: 18 + (i % 3),
                ageMax: 20 + (i % 6),
                city: city,
                districts: [districts[0]],
                whatsapp: "7707" + String(1000000 + i * 23145).substring(0, 7),
                gender: gender,
                occupation: i % 3 === 0 ? "student" : "student_work",
                roomCount: 2,
                roommateCount: 1,
                totalResidents: 1,
                residentsCount: 1,
                genderPref: "any",
                description: `Сдаю комнату на подселение в ${city}. Чисто и уютно.`,
                photos: [roomPhotos[i % roomPhotos.length]],
                address: `ул. Абая ${i * 4}`,
                gisLink: `https://2gis.kz/${city}/search/Абая ${i * 4}`,
                hasDeposit: i % 2 === 0,
                hasContract: true,
                createdAt: new Date().toISOString(),
                boostExpiredAt: null,
                status: "active"
            });
 
            listings.push({
                id: `mock-need-${i}`,
                category: "need_room",
                ownerId: `user-gen-need-${i}`,
                ownerName: name,
                ownerAvatar: "",
                budgetMin: needBudget - 5000,
                budgetMax: needBudget,
                budget: needBudget,
                age: 19 + (i % 4),
                ageMin: 19 + (i % 4),
                ageMax: 19 + (i % 4),
                city: city,
                districts: [districts[0]],
                whatsapp: "7777" + String(1000000 + i * 43210).substring(0, 7),
                gender: gender,
                occupation: "student",
                roomCount: "any",
                roommateCount: "any",
                totalResidents: 1,
                residentsCount: 1 + (i % 3), // mock counts 1 to 3
                genderPref: i % 3 === 0 ? "male" : (i % 3 === 1 ? "female" : "any"),
                description: `Ищу комнату или подселение в ${city}. Чистоплотный(ая).`,
                photos: [],
                address: "",
                gisLink: "",
                hasDeposit: false,
                hasContract: false,
                createdAt: new Date().toISOString(),
                boostExpiredAt: null,
                status: "active"
            });
        }
 
        return listings;
    }
}

module.exports = new ServerDatabase();
