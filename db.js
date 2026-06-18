// Hata.kz Database Layer

function generateMockListings() {
    const listings = [];
    
    const maleNames = ["Данияр", "Адиль", "Санжар", "Темирлан", "Нурдаулет", "Алихан", "Арман", "Ербол", "Ануар", "Жандос", "Амир", "Бахтияр", "Аслан", "Рустем", "Максат", "Султан", "Али", "Олжас", "Азамат", "Мадияр"];
    const femaleNames = ["Аружан", "Камила", "Мадина", "Диана", "Асем", "Аиша", "Гульдана", "Дана", "Алия", "Фариза", "Жасмин", "Алина", "Зарина", "Динара", "Айгерим", "Сабина", "Аяулым", "Инжу", "Томирис", "Меруерт"];
    
    const maleAvatars = [
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop"
    ];

    const femaleAvatars = [
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&h=100&fit=crop"
    ];

    const roomPhotos = [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&h=400&fit=crop"
    ];

    const occupations = ["student", "student_work", "work"];
    const citiesList = ["almaty", "astana", "shymkent", "karaganda"];
    const cityNames = {
        almaty: "Алматы",
        astana: "Астана",
        shymkent: "Шымкент",
        karaganda: "Караганда"
    };

    const districtsByCity = {
        almaty: ["Бостандыкский район", "Алмалинский район", "Медеуский район", "Ауэзовский район"],
        astana: ["Есильский район", "Алматинский район", "Сарыаркинский район", "Нуринский район"],
        shymkent: ["Абайский район", "Аль-Фарабийский район", "Каратауский район"],
        karaganda: ["Район имени Казыбек би", "Район Алихана Бокейханова"]
    };

    const haveRoomDescriptions = [
        "Привет! Ищу сожителя в отдельную комнату. Квартира очень чистая, полностью меблирована. Я сам учусь и работаю, дома бываю в основном вечером. Ищу адекватного соседа.",
        "Ищу чистоплотную девушку на подселение в 2-комнатную квартиру. Вторая комната моя, я тихая, уважаю личные границы. Вся бытовая техника в наличии.",
        "Сдаю комнату на подселение. Живем вдвоем, ищем третьего человека в квартиру. Официальный договор аренды, депозит небольшой.",
        "Ищу соседку в уютную комнату. Очень удобное расположение, рядом супермаркеты и остановки. Сама учусь на 3 курсе.",
        "Сдаю комнату парню без вредных привычек. В квартире есть стиральная машина, высокоскоростной Wi-Fi, микроволновка. Чистота гарантирована.",
        "Ищу сожителя в двухкомнатную квартиру. Снимаю давно, хозяева отличные, не беспокоят. Коммуналка пополам."
    ];

    const needRoomDescriptions = [
        "Привет! Ищу сожителей для совместного съема квартиры. Бюджет гибкий, рассматриваю разные районы. Сам чистоплотный, не курю.",
        "Ищу комнату или подселение к девочкам. Бюджет до 80 тысяч тенге. Учусь на дневном отделении, спокойная, аккуратная.",
        "Ищу комнату в Алматы. Своевременную оплату гарантирую, уважаю личное пространство сожителей. Заселение желательно в ближайшее время.",
        "Ищу парней, к которым можно подселиться. Бюджет до 70к. Спокойный, без вредных привычек, учусь в университете.",
        "Срочно ищу комнату на подселение. Готова платить вовремя, чистоту и порядок обещаю. Рассматриваю левый берег.",
        "Ищу сожителя, чтобы вместе найти и арендовать 2-комнатную квартиру в центре. Так выйдет намного выгоднее. Пишите в WhatsApp!"
    ];

    // Generate 30 for category "have_room"
    for (let i = 1; i <= 30; i++) {
        const gender = Math.random() > 0.5 ? "male" : "female";
        const name = gender === "male" ? maleNames[i % maleNames.length] : femaleNames[i % femaleNames.length];
        const avatar = gender === "male" ? maleAvatars[i % maleAvatars.length] : femaleAvatars[i % femaleAvatars.length];
        const city = citiesList[i % citiesList.length];
        const districts = districtsByCity[city];
        const selectedDistricts = [districts[i % districts.length]];
        if (districts.length > 1 && Math.random() > 0.5) {
            selectedDistricts.push(districts[(i + 1) % districts.length]);
        }
        const budget = 60000 + (i * 7000) % 150000;
        const age = 18 + (i % 6);
        const occupation = occupations[i % occupations.length];
        const roomCount = 1 + (i % 3);
        const roommateCount = 1 + (i % 3);
        const description = haveRoomDescriptions[i % haveRoomDescriptions.length] + ` Город ${cityNames[city]}, район ${selectedDistricts.join('/')}.`;
        const phone = "7" + (700 + (i * 13) % 99) + String(1000000 + (i * 234567) % 8999999);
        
        const photos = [
            roomPhotos[i % roomPhotos.length],
            roomPhotos[(i + 1) % roomPhotos.length],
            roomPhotos[(i + 2) % roomPhotos.length]
        ];

        listings.push({
            id: `mock-have-${i}`,
            category: "have_room",
            ownerId: `user-gen-have-${i}`,
            ownerName: name,
            ownerAvatar: avatar,
            budget: budget,
            age: age,
            city: city,
            districts: selectedDistricts,
            whatsapp: phone,
            gender: gender,
            occupation: occupation,
            roomCount: roomCount,
            roommateCount: roommateCount,
            totalResidents: 1 + (i % 4),
            genderPref: i % 3 === 0 ? "male" : (i % 3 === 1 ? "female" : "any"),
            description: description,
            photos: photos,
            address: `ул. Достык ${10 + i}, ${cityNames[city]}`,
            gisLink: `https://2gis.kz/${city}/search/Достык ${10 + i}`,
            hasDeposit: i % 2 === 0,
            hasContract: i % 3 !== 0,
            createdAt: new Date(Date.now() - (i % 10) * 24 * 60 * 60 * 1000).toISOString(),
            boostExpiredAt: i % 7 === 0 ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() : null,
            status: "active"
        });
    }

    // Generate 30 for category "need_room"
    for (let i = 1; i <= 30; i++) {
        const gender = Math.random() > 0.5 ? "male" : "female";
        const name = gender === "male" ? maleNames[(i + 5) % maleNames.length] : femaleNames[(i + 5) % femaleNames.length];
        const avatar = gender === "male" ? maleAvatars[(i + 3) % maleAvatars.length] : femaleAvatars[(i + 3) % femaleAvatars.length];
        const city = citiesList[(i + 2) % citiesList.length];
        const districts = districtsByCity[city];
        const selectedDistricts = [districts[(i + 1) % districts.length]];
        if (districts.length > 1 && Math.random() > 0.6) {
            selectedDistricts.push(districts[(i + 2) % districts.length]);
        }
        const budget = 50000 + (i * 6000) % 100000;
        const age = 18 + (i % 5);
        const occupation = occupations[(i + 1) % occupations.length];
        const roomCount = 1 + (i % 3);
        const roommateCount = 1 + (i % 2);
        const description = needRoomDescriptions[i % needRoomDescriptions.length] + ` Интересует ${cityNames[city]}.`;
        const phone = "7" + (700 + (i * 17) % 99) + String(1000000 + (i * 123456) % 8999999);

        listings.push({
            id: `mock-need-${i}`,
            category: "need_room",
            ownerId: `user-gen-need-${i}`,
            ownerName: name,
            ownerAvatar: avatar,
            budget: budget,
            age: age,
            city: city,
            districts: selectedDistricts,
            whatsapp: phone,
            gender: gender,
            occupation: occupation,
            roomCount: roomCount,
            roommateCount: roommateCount,
            description: description,
            photos: [],
            address: "",
            gisLink: "",
            hasDeposit: i % 2 === 0,
            hasContract: false,
            stayTerm: i % 4 === 0 ? "1" : (i % 4 === 1 ? "6" : (i % 4 === 2 ? "12" : "always")),
            createdAt: new Date(Date.now() - (i % 8) * 24 * 60 * 60 * 1000).toISOString(),
            boostExpiredAt: i % 8 === 0 ? new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString() : null,
            status: "active"
        });
    }

    return listings;
}

class HataDatabase {
    constructor() {
        this.supabaseClient = null;
        this.init();
    }

    init() {
        // Initialize listings
        if (!localStorage.getItem('hata_listings')) {
            localStorage.setItem('hata_listings', JSON.stringify(generateMockListings()));
        }

        // Initialize users (empty on start)
        if (!localStorage.getItem('hata_users')) {
            localStorage.setItem('hata_users', JSON.stringify([]));
        }

        // Initialize Supabase Client if configured
        this.initSupabase();

        // Run archiving daemon check
        this.runArchivingDaemon();

        // Run cloud listings sync
        this.syncListingsWithSupabase();
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
                const config = HataConfig; // Loaded from config.js
                const user = {
                    id: session.user.id,
                    name: session.user.user_metadata.full_name || session.user.email,
                    email: session.user.email,
                    avatar: session.user.user_metadata.avatar_url || '',
                    isAdmin: config.adminEmail ? session.user.email === config.adminEmail : session.user.email === 'admin@hata.kz'
                };
                localStorage.setItem('hata_current_user', JSON.stringify(user));
                
                // Keep users list in sync
                const users = JSON.parse(localStorage.getItem('hata_users') || '[]');
                if (!users.some(u => u.id === user.id)) {
                    users.push(user);
                    localStorage.setItem('hata_users', JSON.stringify(users));
                }
            } else {
                localStorage.removeItem('hata_current_user');
                sessionStorage.removeItem('hata_current_user');
            }
            window.dispatchEvent(new Event('hata_auth_changed'));
            this.syncListingsWithSupabase();
        });
    }

    async syncListingsWithSupabase() {
        if (!this.supabaseClient) return;
        try {
            const { data, error } = await this.supabaseClient
                .from('listings')
                .select('*');
            
            if (error) {
                console.warn("Supabase fetch failed (probably table 'listings' doesn't exist yet):", error.message);
                return;
            }
            
            if (data && data.length > 0) {
                const localListings = JSON.parse(localStorage.getItem('hata_listings') || '[]');
                const merged = [...localListings];
                
                data.forEach(dbItem => {
                    const idx = merged.findIndex(item => item.id === dbItem.id);
                    if (idx > -1) {
                        merged[idx] = dbItem;
                    } else {
                        merged.push(dbItem);
                    }
                });
                
                localStorage.setItem('hata_listings', JSON.stringify(merged));
                window.dispatchEvent(new Event('hata_listings_changed'));
                console.log("Synchronized listings successfully with Supabase table.");
            }
        } catch (e) {
            console.warn("Gracefully caught error during Supabase listings sync:", e);
        }
    }

    // Get currentUser
    getCurrentUser() {
        const user = sessionStorage.getItem('hata_current_user') || localStorage.getItem('hata_current_user');
        return user ? JSON.parse(user) : null;
    }

    // Stub login method (OAuth is used instead of mock login)
    login(user) {
        console.warn("Mock login has been disabled for safety. Use Supabase Google Auth.");
    }

    // Logout user
    logout() {
        localStorage.removeItem('hata_current_user');
        sessionStorage.removeItem('hata_current_user');
        window.dispatchEvent(new Event('hata_auth_changed'));
    }

    // --- FAVORITES SYSTEM ---
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
        window.dispatchEvent(new Event('hata_listings_changed')); // Trigger feed update
        return isFavorite;
    }

    getFavorites(userId) {
        if (!userId) return [];
        return JSON.parse(localStorage.getItem(`hata_favorites_${userId}`) || '[]');
    }

    // Get all active listings
    getListings() {
        return JSON.parse(localStorage.getItem('hata_listings') || '[]').filter(item => item.status === 'active');
    }

    // Get all user listings (active and archived)
    getUserListings(userId) {
        const all = JSON.parse(localStorage.getItem('hata_listings') || '[]');
        return all.filter(item => item.ownerId === userId);
    }

    // Get auto-fill suggestions for form
    getAutoFillSuggestions(userId) {
        const suggestions = localStorage.getItem(`hata_autofill_${userId}`);
        return suggestions ? JSON.parse(suggestions) : {};
    }

    // Save auto-fill parameters
    saveAutoFillSuggestions(userId, fields) {
        const current = this.getAutoFillSuggestions(userId);
        const updated = { ...current, ...fields };
        localStorage.setItem(`hata_autofill_${userId}`, JSON.stringify(updated));
    }

    // Add new listing
    addListing(listing) {
        const user = this.getCurrentUser();
        if (!user) throw new Error("Требуется авторизация");

        const all = JSON.parse(localStorage.getItem('hata_listings') || '[]');
        
        const activeCount = all.filter(item => item.ownerId === user.id && item.status === 'active').length;
        if (activeCount >= 7) {
            throw new Error("Максимально разрешено иметь 7 активных объявлений. Удалите или архивируйте старое объявление.");
        }

        const newListing = {
            id: 'hata-' + Math.random().toString(36).substring(2, 9),
            ownerId: user.id,
            ownerName: user.name,
            ownerAvatar: user.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
            status: 'active',
            createdAt: new Date().toISOString(),
            boostExpiredAt: null,
            ...listing
        };

        all.unshift(newListing); // Add to beginning of array
        localStorage.setItem('hata_listings', JSON.stringify(all));

        // Save auto-fill memory
        this.saveAutoFillSuggestions(user.id, {
            whatsapp: listing.whatsapp,
            gender: listing.gender,
            occupation: listing.occupation,
            address: listing.address || ""
        });

        // Background write to Supabase (hybrid sync)
        if (this.supabaseClient) {
            this.supabaseClient.from('listings').insert([newListing]).then(({ error }) => {
                if (error) console.warn("Supabase insert error (table might not exist):", error.message);
            }).catch(err => console.warn("Supabase insert promise rejected:", err));
        }

        window.dispatchEvent(new Event('hata_listings_changed'));
        return newListing;
    }

    // Edit listing
    updateListing(id, updatedFields) {
        const user = this.getCurrentUser();
        if (!user) throw new Error("Требуется авторизация");

        const all = JSON.parse(localStorage.getItem('hata_listings') || '[]');
        const idx = all.findIndex(item => item.id === id);
        
        if (idx === -1) throw new Error("Объявление не найдено");
        if (all[idx].ownerId !== user.id) throw new Error("Нет прав для редактирования");

        all[idx] = {
            ...all[idx],
            ...updatedFields,
            id: all[idx].id,
            ownerId: all[idx].ownerId,
            ownerName: all[idx].ownerName,
            ownerAvatar: all[idx].ownerAvatar,
            createdAt: all[idx].createdAt, 
            boostExpiredAt: all[idx].boostExpiredAt
        };

        localStorage.setItem('hata_listings', JSON.stringify(all));

        // Background write to Supabase (hybrid sync)
        if (this.supabaseClient) {
            this.supabaseClient.from('listings').update(updatedFields).eq('id', id).then(({ error }) => {
                if (error) console.warn("Supabase update error (table might not exist):", error.message);
            }).catch(err => console.warn("Supabase update promise rejected:", err));
        }

        window.dispatchEvent(new Event('hata_listings_changed'));
    }

    // Delete listing permanently
    deleteListing(id) {
        const user = this.getCurrentUser();
        const all = JSON.parse(localStorage.getItem('hata_listings') || '[]');
        const idx = all.findIndex(item => item.id === id);

        if (idx === -1) throw new Error("Объявление не найдено");
        
        const isAdmin = user && user.isAdmin;
        if (!isAdmin && (!user || all[idx].ownerId !== user.id)) {
            throw new Error("Нет прав для удаления");
        }

        all.splice(idx, 1);
        localStorage.setItem('hata_listings', JSON.stringify(all));

        // Background write to Supabase (hybrid sync)
        if (this.supabaseClient) {
            this.supabaseClient.from('listings').delete().eq('id', id).then(({ error }) => {
                if (error) console.warn("Supabase delete error (table might not exist):", error.message);
            }).catch(err => console.warn("Supabase delete promise rejected:", err));
        }

        window.dispatchEvent(new Event('hata_listings_changed'));
    }

    // Archive listing manually
    archiveListing(id) {
        const user = this.getCurrentUser();
        if (!user) throw new Error("Требуется авторизация");

        const all = JSON.parse(localStorage.getItem('hata_listings') || '[]');
        const idx = all.findIndex(item => item.id === id);

        if (idx === -1) throw new Error("Объявление не найдено");
        if (all[idx].ownerId !== user.id) throw new Error("Нет прав для архивации");

        all[idx].status = 'archived';
        all[idx].archivedAt = new Date().toISOString();

        localStorage.setItem('hata_listings', JSON.stringify(all));

        // Background write to Supabase (hybrid sync)
        if (this.supabaseClient) {
            this.supabaseClient.from('listings').update({ status: 'archived', archivedAt: all[idx].archivedAt }).eq('id', id).then(({ error }) => {
                if (error) console.warn("Supabase archive error (table might not exist):", error.message);
            }).catch(err => console.warn("Supabase archive promise rejected:", err));
        }

        window.dispatchEvent(new Event('hata_listings_changed'));
    }

    // Reactivate listing from archive
    reactivateListing(id) {
        const user = this.getCurrentUser();
        if (!user) throw new Error("Требуется авторизация");

        const all = JSON.parse(localStorage.getItem('hata_listings') || '[]');
        
        const activeCount = all.filter(item => item.ownerId === user.id && item.status === 'active').length;
        if (activeCount >= 7) {
            throw new Error("Нельзя активировать. У вас уже есть 7 активных объявлений.");
        }

        const idx = all.findIndex(item => item.id === id);
        if (idx === -1) throw new Error("Объявление не найдено");
        if (all[idx].ownerId !== user.id) throw new Error("Нет прав для активации");

        all[idx].status = 'active';
        all[idx].createdAt = new Date().toISOString(); // Reset date
        all[idx].archivedAt = null;

        localStorage.setItem('hata_listings', JSON.stringify(all));

        // Background write to Supabase (hybrid sync)
        if (this.supabaseClient) {
            this.supabaseClient.from('listings').update({ status: 'active', createdAt: all[idx].createdAt, archivedAt: null }).eq('id', id).then(({ error }) => {
                if (error) console.warn("Supabase reactivate error (table might not exist):", error.message);
            }).catch(err => console.warn("Supabase reactivate promise rejected:", err));
        }

        window.dispatchEvent(new Event('hata_listings_changed'));
    }

    // Boost listing (Promoted/TOP status)
    boostListing(id, days) {
        const all = JSON.parse(localStorage.getItem('hata_listings') || '[]');
        const idx = all.findIndex(item => item.id === id);

        if (idx === -1) throw new Error("Объявление не найдено");

        const now = new Date();
        now.setDate(now.getDate() + days);
        all[idx].boostExpiredAt = now.toISOString();
        all[idx].createdAt = new Date().toISOString();

        localStorage.setItem('hata_listings', JSON.stringify(all));

        // Background write to Supabase (hybrid sync)
        if (this.supabaseClient) {
            this.supabaseClient.from('listings').update({ boostExpiredAt: all[idx].boostExpiredAt, createdAt: all[idx].createdAt }).eq('id', id).then(({ error }) => {
                if (error) console.warn("Supabase boost error (table might not exist):", error.message);
            }).catch(err => console.warn("Supabase boost promise rejected:", err));
        }

        window.dispatchEvent(new Event('hata_listings_changed'));
    }

    // Background job for archiving loop (runs on load/actions)
    runArchivingDaemon() {
        const all = JSON.parse(localStorage.getItem('hata_listings') || '[]');
        const now = new Date().getTime();
        let changed = false;

        for (let i = all.length - 1; i >= 0; i--) {
            const item = all[i];
            
            if (item.status === 'active') {
                if (item.boostExpiredAt) {
                    const boostExpiry = new Date(item.boostExpiredAt).getTime();
                    const boostEndPlusBonus = boostExpiry + (5 * 24 * 60 * 60 * 1000);
                    if (now > boostEndPlusBonus) {
                        item.status = 'archived';
                        item.archivedAt = new Date().toISOString();
                        item.boostExpiredAt = null;
                        changed = true;
                    }
                } else {
                    const createdTime = new Date(item.createdAt).getTime();
                    const diffTime = now - createdTime;
                    const limit = 20 * 24 * 60 * 60 * 1000;
                    if (diffTime > limit) {
                        item.status = 'archived';
                        item.archivedAt = new Date().toISOString();
                        changed = true;
                    }
                }
            } 
            else if (item.status === 'archived') {
                const archivedTime = new Date(item.archivedAt || item.createdAt).getTime();
                const diffTime = now - archivedTime;
                const limit = 3 * 24 * 60 * 60 * 1000;
                if (diffTime > limit) {
                    all.splice(i, 1); // Delete permanently
                    changed = true;
                }
            }
        }

        if (changed) {
            localStorage.setItem('hata_listings', JSON.stringify(all));
        }
    }
}

const db = new HataDatabase();
window.db = db;
