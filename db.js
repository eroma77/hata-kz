// Hata.kz Mock Database Layer

// Mock listings to populate the platform initially (aligned with new config names)
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
        boostExpiredAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // Boosted
        status: "active"
    },
    {
        id: "mock-2",
        category: "need_room",
        ownerId: "user-mock-2",
        ownerName: "Данияр",
        ownerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
        budget: 55000,
        age: 19,
        city: "almaty",
        districts: ["Ауэзовский район", "Бостандыкский район"],
        whatsapp: "7778889900",
        gender: "male",
        occupation: "student_work",
        roomCount: 1,
        roommateCount: 2,
        description: "Салам! Ищу комнату или подселение к парням. Бюджет до 60k. Сам учусь в МУИТ на 2 курсе и подрабатываю по вечерам. Не шумлю, уважаю чужое пространство. Могу заселиться хоть завтра. Было бы круто в районе Саина-Шаляпина.",
        photos: [],
        address: "",
        gisLink: "",
        hasDeposit: false,
        hasContract: false,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
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
        districts: ["Есильский район"],
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
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
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
        districts: ["Алматинский район", "Сарыаркинский район"],
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
    },
    {
        id: "mock-5",
        category: "need_room",
        ownerId: "user-mock-2",
        ownerName: "Данияр",
        ownerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
        budget: 85000,
        age: 23,
        city: "pavlodar",
        districts: [], // Павлодар has no districts
        whatsapp: "7778889900",
        gender: "male",
        occupation: "work",
        roomCount: 2,
        roommateCount: 1,
        description: "Ищу сожителя в Павлодаре, снимаю хорошую двушку в центре. Районов в выборе нет, так как город небольшой. Оплата 85 тыс тг плюс коммуналка. Сам работаю инженером. Чистоплотный, без вредных привычек.",
        photos: [],
        address: "",
        gisLink: "",
        hasDeposit: false,
        hasContract: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        boostExpiredAt: null,
        status: "active"
    }
];

class HataDatabase {
    constructor() {
        this.init();
    }

    init() {
        // Reset or initialize listings to align with new mock configurations
        // If cities uralsk/pavlodar are not in config we might need to reset localStorage listings
        const currentListings = localStorage.getItem('hata_listings');
        if (!currentListings) {
            localStorage.setItem('hata_listings', JSON.stringify(MOCK_LISTINGS));
        } else {
            try {
                // If it exists, let's verify if uralsk or pavlodar items exist.
                // If the user refreshed they might want the fresh mock database with new districts
                const parsed = JSON.parse(currentListings);
                const hasUpdatedMocks = parsed.some(item => item.city === 'pavlodar' || item.districts.includes("Нуринский район") || item.districts.includes("Сарайшык"));
                if (!hasUpdatedMocks) {
                    // Let's reset the database to include the new districts and Pavlodar mock
                    localStorage.setItem('hata_listings', JSON.stringify(MOCK_LISTINGS));
                }
            } catch (e) {
                localStorage.setItem('hata_listings', JSON.stringify(MOCK_LISTINGS));
            }
        }

        // Initialize users (empty or mock users)
        if (!localStorage.getItem('hata_users')) {
            const mockUsers = [
                { id: "user-mock-1", name: "Аружан", email: "aruzhan@gmail.com", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
                { id: "user-mock-2", name: "Данияр", email: "daniyar@gmail.com", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" },
                { id: "user-mock-3", name: "Камила", email: "kamila@gmail.com", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" },
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
                let expiryDays = 20;
                if (item.boostExpiredAt) {
                    const boostExpiry = new Date(item.boostExpiredAt).getTime();
                    if (boostExpiry > now) {
                        const boostEndPlusBonus = boostExpiry + (5 * 24 * 60 * 60 * 1000);
                        if (now > boostEndPlusBonus) {
                            item.status = 'archived';
                            item.archivedAt = new Date().toISOString();
                            item.boostExpiredAt = null;
                            changed = true;
                        }
                        continue;
                    }
                }

                const createdTime = new Date(item.createdAt).getTime();
                const diffTime = now - createdTime;
                const limit = 20 * 24 * 60 * 60 * 1000;
                if (diffTime > limit) {
                    item.status = 'archived';
                    item.archivedAt = new Date().toISOString();
                    changed = true;
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
