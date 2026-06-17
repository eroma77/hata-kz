// Hata.kz Configuration File

const DEFAULT_CONFIG = {
    pricing: {
        postingFee: 0,        // Бесплатная публикация на старте
        promo3Days: 190,      // Топ на 3 дня (190 ₸)
        promoWeek: 490,       // Топ на неделю (490 ₸)
        promoMonth: 590       // Топ на месяц (590 ₸)
    },
    supabaseUrl: "https://lyzbgzxmevttepsdpsor.supabase.co", // Реальный URL проекта
    supabaseAnonKey: "your-anon-key",                       // Сюда пользователь вставит свой реальный Anon Key через админку
    supabaseRedirectUrl: "",                                // URL перенаправления после авторизации (опционально)
    adminEmail: "admin@hata.kz",                            // Email администратора (для назначения прав в продакшене)
    cities: {
        almaty: {
            name: "Алматы",
            hasDistricts: true,
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
            hasDistricts: true,
            districts: [
                "Алматинский район",
                "Байконурский район",
                "Есильский район",
                "Нуринский район",
                "Сарыаркинский район",
                "Сарайшык"
            ]
        },
        shymkent: {
            name: "Шымкент",
            hasDistricts: true,
            districts: [
                "Абайский район",
                "Аль-Фарабийский район",
                "Каратауский район",
                "Енбекшинский район",
                "Туранский район"
            ]
        },
        karaganda: {
            name: "Караганда",
            hasDistricts: true,
            districts: [
                "Район имени Казыбек би",
                "Район Алихана Бокейханова"
            ]
        },
        aktobe: {
            name: "Актобе",
            hasDistricts: true,
            districts: [
                "Район Алматы",
                "Район Астана"
            ]
        },
        uralsk: {
            name: "Уральск",
            hasDistricts: true,
            districts: [
                "мкр 4",
                "мкр Азаулы",
                "мкр Айгуль",
                "мкр Астана",
                "мкр Жана Орда",
                "мкр Женис",
                "мкр Жулдыз",
                "мкр Кадыра Мырза-Али",
                "мкр Кунаева",
                "мкр Мясокомбинат",
                "мкр Омега",
                "мкр Северо-Восток",
                "мкр Старый Аэропорт",
                "мкр Строитель",
                "мкр Школьник",
                "мкр. Зачаганск пгт"
            ]
        },
        pavlodar: { name: "Павлодар", hasDistricts: false, districts: [] },
        taraz: { name: "Тараз", hasDistricts: false, districts: [] },
        semey: { name: "Семей", hasDistricts: false, districts: [] },
        atyrau: { name: "Атырау", hasDistricts: false, districts: [] },
        aktau: { name: "Актау", hasDistricts: false, districts: [] },
        kyzylorda: { name: "Кызылорда", hasDistricts: false, districts: [] },
        kostanay: { name: "Костанай", hasDistricts: false, districts: [] },
        petropavlovsk: { name: "Петропавловск", hasDistricts: false, districts: [] },
        kokshetau: { name: "Кокшетау", hasDistricts: false, districts: [] },
        taldykorgan: { name: "Талдыкорган", hasDistricts: false, districts: [] },
        turkestan: { name: "Туркестан", hasDistricts: false, districts: [] },
        zhezkazgan: { name: "Жезказган", hasDistricts: false, districts: [] }
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
        const parsed = JSON.parse(savedConfig);
        
        // Автоматическая миграция: если в localStorage старый URL-заглушка, обновляем на реальный
        let needsSave = false;
        if (!parsed.supabaseUrl || parsed.supabaseUrl === "https://your-project.supabase.co") {
            parsed.supabaseUrl = DEFAULT_CONFIG.supabaseUrl;
            needsSave = true;
        }
        if (parsed.supabaseRedirectUrl === undefined) {
            parsed.supabaseRedirectUrl = DEFAULT_CONFIG.supabaseRedirectUrl;
            needsSave = true;
        }
        if (parsed.adminEmail === undefined) {
            parsed.adminEmail = DEFAULT_CONFIG.adminEmail;
            needsSave = true;
        }
        if (needsSave) {
            localStorage.setItem('hata_config', JSON.stringify(parsed));
        }
        return parsed;
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
