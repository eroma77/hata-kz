// Hata.kz Mock Database Layer

// Mock listings to populate the platform initially
const MOCK_LISTINGS = [
    {
        id: "mock-1",
        category: "have_room",
        ownerId: "user-mock-1",
        ownerName: "Аружан",
        ownerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
        budget: 70000,
        age: 20,
        city: "almaty",
        districts: ["Бостандыкский район", "Алмалинский район"],
        whatsapp: "7071234567",
        gender: "female",
        occupation: "student",
        roomCount: 2,
        roommateCount: 1,
        description: "Привет! Ищу соседку-студентку в уютную двухкомнатную квартиру на пересечении Абая-Манаса. Квартира полностью меблирована, есть скоростной интернет, стиралка, микроволновка. Живу сама, учусь в КазНУ. Ищу чистоплотную, адекватную сожительницу без вредных привычек.",
        photos: [
            "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=400&fit=crop",
            "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&h=400&fit=crop",
            "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600&h=400&fit=crop"
        ],
        address: "пр. Абая 44, Алматы",
        gisLink: "https://2gis.kz/almaty/search/Абая 44",
        hasDeposit: false,
        hasContract: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        boostExpiredAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // Boosted, expires in 4 days
        status: "active"
    },
    {
        id: "mock-2",
        category: "need_room",
        ownerId: "user-mock-2",
        ownerName: "Данияр",
        ownerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
        budget: 50000,
        age: 19,
        city: "almaty",
        districts: ["Ауэзовский район", "Бостандыкский район"],
        whatsapp: "7778889900",
        gender: "male",
        occupation: "student_work",
        roomCount: 1,
        roommateCount: 2,
        description: "Салам! Ищу комнату или подселение к парням. Бюджет до 50k. Сам учусь в МУИТ на 2 курсе и подрабатываю по вечерам. Не шумлю, уважаю чужое пространство. Могу заселиться хоть завтра. Было бы круто в районе Саина-Шаляпина.",
        photos: [],
        address: "",
        gisLink: "",
        hasDeposit: false,
        hasContract: false,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        boostExpiredAt: null,
        status: "active"
    },
    {
        id: "mock-3",
        category: "have_room",
        ownerId: "user-mock-3",
        ownerName: "Камила",
        ownerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
        budget: 90000,
        age: 21,
        city: "astana",
        districts: ["Район Есиль"],
        whatsapp: "7476543210",
        gender: "female",
        occupation: "work",
        roomCount: 3,
        roommateCount: 1,
        description: "Сдаю комнату в 3-комнатной квартире на левом берегу (ЖК Времена Года). Комната изолированная, светлая, с большой кроватью. В квартире живем я и еще одна девушка (обе работаем). Ищем чистоплотную третью соседку. Без парней и тусовок дома.",
        photos: [
            "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=400&fit=crop",
            "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&h=400&fit=crop",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop"
        ],
        address: "ул. Кабанбай батыра 48, Астана",
        gisLink: "https://2gis.kz/astana/search/Кабанбай батыра 48",
        hasDeposit: true,
        hasContract: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        boostExpiredAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Boosted
        status: "active"
    },
    {
        id: "mock-4",
        category: "need_room",
        ownerId: "user-mock-4",
        ownerName: "Адиль",
        ownerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        budget: 65000,
        age: 22,
        city: "astana",
        districts: ["Район Алматы", "Район Сарыарка"],
        whatsapp: "7053334455",
        gender: "male",
        occupation: "student",
        roomCount: 2,
        roommateCount: 1,
        description: "Ищу сожителя парня для совместного съема 2-комнатной квартиры на правом берегу в Астане. Бюджет 60-70к с каждого. Сам учусь в ЕНУ, 4 курс. Чистоплотный, спокойный, дома бываю редко. Квартиру можем поискать вместе.",
        photos: [],
        address: "",
        gisLink: "",
        hasDeposit: true,
        hasContract: true,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        boostExpiredAt: null,
        status: "active"
    }
];

class HataDatabase {
    constructor() {
        this.init();
    }

    init() {
        // Initialize listings
        if (!localStorage.getItem('hata_listings')) {
            localStorage.setItem('hata_listings', JSON.stringify(MOCK_LISTINGS));
        }

        // Initialize users (empty or mock users)
        if (!localStorage.getItem('hata_users')) {
            const mockUsers = [
                { id: "user-mock-1", name: "Аружан", email: "aruzhan@gmail.com", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
                { id: "user-mock-2", name: "Данияр", email: "daniyar@gmail.com", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" },
                { id: "user-mock-3", name: "Канила", email: "kamila@gmail.com", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" },
                { id: "user-mock-4", name: "Адиль", email: "adil@gmail.com", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" }
            ];
            localStorage.setItem('hata_users', JSON.stringify(mockUsers));
        }

        // Run archiving daemon check
        this.runArchivingDaemon();
    }

    // Get currentUser
    getCurrentUser() {
        const user = sessionStorage.getItem('hata_current_user') || localStorage.getItem('hata_current_user');
        return user ? JSON.parse(user) : null;
    }

    // Login user (Google Auth mock)
    login(user, remember = true) {
        const serialized = JSON.stringify(user);
        if (remember) {
            localStorage.setItem('hata_current_user', serialized);
        } else {
            sessionStorage.setItem('hata_current_user', serialized);
        }
        
        // Add to users list if new
        const users = JSON.parse(localStorage.getItem('hata_users') || '[]');
        if (!users.some(u => u.id === user.id)) {
            users.push(user);
            localStorage.setItem('hata_users', JSON.stringify(users));
        }
        
        window.dispatchEvent(new Event('hata_auth_changed'));
    }

    // Logout user
    logout() {
        localStorage.removeItem('hata_current_user');
        sessionStorage.removeItem('hata_current_user');
        window.dispatchEvent(new Event('hata_auth_changed'));
    }

    // Get all active listings
    getListings() {
        const all = JSON.parse(localStorage.getItem('hata_listings') || '[]');
        this.runArchivingDaemon(); // clean up just in case
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
        
        // Check active count limit
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

        // Merge updated fields but retain ID, owner info, createdAt and promotion status
        all[idx] = {
            ...all[idx],
            ...updatedFields,
            id: all[idx].id,
            ownerId: all[idx].ownerId,
            ownerName: all[idx].ownerName,
            ownerAvatar: all[idx].ownerAvatar,
            // Keep createdAt date unchanged as requested:
            // "если чел опубликовал и изменил его завтра то все ровно будет написано вчера"
            createdAt: all[idx].createdAt, 
            boostExpiredAt: all[idx].boostExpiredAt
        };

        localStorage.setItem('hata_listings', JSON.stringify(all));
        window.dispatchEvent(new Event('hata_listings_changed'));
    }

    // Delete listing permanently
    deleteListing(id) {
        const user = this.getCurrentUser();
        const all = JSON.parse(localStorage.getItem('hata_listings') || '[]');
        const idx = all.findIndex(item => item.id === id);

        if (idx === -1) throw new Error("Объявление не найдено");
        
        // Allow owner or admin
        const isAdmin = user && user.isAdmin;
        if (!isAdmin && (!user || all[idx].ownerId !== user.id)) {
            throw new Error("Нет прав для удаления");
        }

        all.splice(idx, 1);
        localStorage.setItem('hata_listings', JSON.stringify(all));
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
        window.dispatchEvent(new Event('hata_listings_changed'));
    }

    // Reactivate listing from archive
    reactivateListing(id) {
        const user = this.getCurrentUser();
        if (!user) throw new Error("Требуется авторизация");

        const all = JSON.parse(localStorage.getItem('hata_listings') || '[]');
        
        // Limit check
        const activeCount = all.filter(item => item.ownerId === user.id && item.status === 'active').length;
        if (activeCount >= 7) {
            throw new Error("Нельзя активировать. У вас уже есть 7 активных объявлений.");
        }

        const idx = all.findIndex(item => item.id === id);
        if (idx === -1) throw new Error("Объявление не найдено");
        if (all[idx].ownerId !== user.id) throw new Error("Нет прав для активации");

        all[idx].status = 'active';
        all[idx].createdAt = new Date().toISOString(); // Reset date for fresh start
        all[idx].archivedAt = null;

        localStorage.setItem('hata_listings', JSON.stringify(all));
        window.dispatchEvent(new Event('hata_listings_changed'));
    }

    // Boost listing (Promoted/TOP status)
    boostListing(id, days) {
        const all = JSON.parse(localStorage.getItem('hata_listings') || '[]');
        const idx = all.findIndex(item => item.id === id);

        if (idx === -1) throw new Error("Объявление не найдено");

        // Calculate boost expiration
        const now = new Date();
        now.setDate(now.getDate() + days);
        all[idx].boostExpiredAt = now.toISOString();

        // Also reset listing creation date to now so it goes back to the top immediately
        all[idx].createdAt = new Date().toISOString();

        localStorage.setItem('hata_listings', JSON.stringify(all));
        window.dispatchEvent(new Event('hata_listings_changed'));
    }

    // Background job for archiving loop (runs on load/actions)
    runArchivingDaemon() {
        const all = JSON.parse(localStorage.getItem('hata_listings') || '[]');
        const now = new Date().getTime();
        let changed = false;

        for (let i = all.length - 1; i >= 0; i--) {
            const item = all[i];
            
            // Check if active and expired (20 days)
            if (item.status === 'active') {
                // If boosted, check if boost has active state. 
                // Promoted listing auto-renews up to the boost period.
                let expiryDays = 20;
                if (item.boostExpiredAt) {
                    const boostExpiry = new Date(item.boostExpiredAt).getTime();
                    if (boostExpiry > now) {
                        // Promoted listings stay active until promotion ends, plus they get +5 bonus days
                        const boostEndPlusBonus = boostExpiry + (5 * 24 * 60 * 60 * 1000);
                        if (now > boostEndPlusBonus) {
                            item.status = 'archived';
                            item.archivedAt = new Date().toISOString();
                            item.boostExpiredAt = null; // reset boost
                            changed = true;
                        }
                        continue;
                    }
                }

                // Standard listing archive check (20 days)
                const createdTime = new Date(item.createdAt).getTime();
                const diffTime = now - createdTime;
                const limit = 20 * 24 * 60 * 60 * 1000;
                if (diffTime > limit) {
                    item.status = 'archived';
                    item.archivedAt = new Date().toISOString();
                    changed = true;
                }
            } 
            // Check if archived and expired (3 days in archive)
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
window.db = db; // make globally available
