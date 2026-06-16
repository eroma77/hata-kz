// Hata.kz Configuration File

const DEFAULT_CONFIG = {
    pricing: {
        postingFee: 0,        // Бесплатная публикация на старте
        promo3Days: 190,      // Топ на 3 дня (190 ₸)
        promoWeek: 490,       // Топ на неделю (490 ₸)
        promoMonth: 590       // Топ на месяц (590 ₸)
    },
    cities: {
        almaty: {
            name: "Алматы",
            districts: [
                "Алатауский район",
                "Алмалинский район",
                "Ауэзовский район",
                "Бостандыкский район",
                "Жетысуский район",
                "Медеуский район",
                "Наурызбайский район",
                "Турксибский район"
            ]
        },
        astana: {
            name: "Астана",
            districts: [
                "Район Алматы",
                "Район Байконур",
                "Район Есиль",
                "Район Нура",
                "Район Сарыарка"
            ]
        },
        shymkent: {
            name: "Шымкент",
            districts: [
                "Абайский район",
                "Аль-Фарабийский район",
                "Енбекшинский район",
                "Каратауский район",
                "Туранский район"
            ]
        },
        karaganda: {
            name: "Караганда",
            districts: [
                "Район имени Казыбек би",
                "Район имени Алихана Бокейханова"
            ]
        }
    }
};

// Load or initialize config from localStorage
function loadConfig() {
    const savedConfig = localStorage.getItem('hata_config');
    if (!savedConfig) {
        localStorage.setItem('hata_config', JSON.stringify(DEFAULT_CONFIG));
        return DEFAULT_CONFIG;
    }
    try {
        return JSON.parse(savedConfig);
    } catch (e) {
        console.error("Error parsing hata_config, resetting to default:", e);
        localStorage.setItem('hata_config', JSON.stringify(DEFAULT_CONFIG));
        return DEFAULT_CONFIG;
    }
}

// Update configuration values (e.g. from Admin Panel)
function saveConfig(newConfig) {
    localStorage.setItem('hata_config', JSON.stringify(newConfig));
    window.dispatchEvent(new Event('hata_config_changed'));
}

const HataConfig = loadConfig();
