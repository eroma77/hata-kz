const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cron = require('node-cron');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dbServer = require('./db-server');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// --- SECURITY MIDDLEWARE ---

// Helmet: sets secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "https://unpkg.com", 
                "https://cdn.jsdelivr.net", 
                "https://accounts.google.com", 
                "https://fonts.googleapis.com"
            ],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
            fontSrc: ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
            imgSrc: [
                "'self'", 
                "data:", 
                "blob:", 
                "https://*.supabase.co", 
                "https://images.unsplash.com", 
                "https://lh3.googleusercontent.com",
                "https://*.googleusercontent.com",
                "https://*.gravatar.com",
                "https://www.gravatar.com"
            ],
            connectSrc: [
                "'self'", 
                "https://*.supabase.co", 
                "https://lyzbgzxmevttepsdpsor.supabase.co",
                "https://accounts.google.com",
                "https://*.googleapis.com"
            ],
            frameSrc: [
                "'self'",
                "https://accounts.google.com",
                "https://*.supabase.co"
            ]
        }
    },
    crossOriginEmbedderPolicy: false // Needed for images from external sources
}));

// CORS: only allow requests from the production domain
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5000'];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('CORS policy violation: origin not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Rate Limiting: protect API endpoints from abuse and DoS
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Слишком много запросов. Пожалуйста, подождите 15 минут.' }
});
const paymentLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: { error: 'Слишком много платёжных запросов. Подождите минуту.' }
});
const createListingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    message: { error: 'Слишком много объявлений. Подождите час.' }
});
app.use('/api/', generalLimiter);

// Middleware for parsing requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Global mock storage for server config
let HataConfig = {
    pricing: { postingFee: 0, promo3Days: 190, promoWeek: 490, promoMonth: 590 },
    supabaseUrl: "https://lyzbgzxmevttepsdpsor.supabase.co",
    adminEmail: "admin@hata.kz"
};

// Log requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// XSS Sanitizer Helper
function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

// Supabase JWT Verification Middleware
async function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Требуется токен авторизации' });
    }

    let user = null;

    // Simulated token ONLY for local development/E2E testing (never in production)
    if (!IS_PRODUCTION && token === 'simulated-token-123') {
        user = {
            id: 'simulated-user-123',
            email: 'student@hata.kz',
            name: 'Тестовый Студент',
            avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop',
            isAdmin: false
        };
    } else {
        if (dbServer.supabaseClient) {
            try {
                const { data, error } = await dbServer.supabaseClient.auth.getUser(token);
                if (error || !data?.user) {
                    return res.status(401).json({ error: 'Недействительный или истекший токен авторизации' });
                }
                const email = data.user.email;
                const adminEmail = process.env.ADMIN_EMAIL || HataConfig.adminEmail || 'admin@hata.kz';
                user = {
                    id: data.user.id,
                    email: email,
                    name: data.user.user_metadata.full_name || email,
                    avatar: data.user.user_metadata.avatar_url || '',
                    isAdmin: email === adminEmail
                };
            } catch (err) {
                return res.status(500).json({ error: 'Ошибка верификации токена на сервере' });
            }
        } else {
            return res.status(503).json({ error: 'Сервер авторизации временно недоступен (конфигурация Supabase отсутствует)' });
        }
    }

    req.user = user;
    next();
}

// --- REST API ENDPOINTS ---

// 1. GET Filters & Listings
app.get('/api/listings', async (req, res) => {
    try {
        const filters = {
            city: req.query.city,
            category: req.query.category,
            gender: req.query.gender,
            minBudget: req.query.minBudget,
            maxBudget: req.query.maxBudget,
            search: req.query.search
        };
        const listings = await dbServer.getListings(filters);
        res.json(listings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка получения объявлений' });
    }
});

// 1b. GET User Specific Listings (Including Archived)
app.get('/api/listings/user', authenticateToken, async (req, res) => {
    try {
        const listings = await dbServer.getUserListings(req.user.id);
        res.json(listings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка получения личных объявлений' });
    }
});

// 2. POST Add Listing
app.post('/api/listings', authenticateToken, createListingLimiter, async (req, res) => {
    try {
        // Enforce 7 active listings limit
        const activeCount = await dbServer.getActiveCountForUser(req.user.id);
        if (activeCount >= 7) {
            return res.status(400).json({ error: 'Превышен лимит: Максимально разрешено иметь 7 активных объявлений. Удалите или заархивируйте старое.' });
        }

        const {
            category, budgetMin, budgetMax, budget, age, ageMin, ageMax, city, districts, whatsapp, gender, occupation,
            roomCount, roommateCount, totalResidents, genderPref, description, photos, address, gisLink, hasDeposit, hasContract, residentsCount
        } = req.body;

        // Basic Validations
        if (!category || !['have_room', 'need_room'].includes(category)) {
            return res.status(400).json({ error: 'Неверная категория объявления' });
        }

        // Validate budgetMin and budgetMax
        const bMin = parseFloat(budgetMin || budget);
        const bMax = parseFloat(budgetMax || budget);
        if (isNaN(bMin) || bMin < 10000 || bMin > 1000000) {
            return res.status(400).json({ error: 'Минимальный бюджет должен быть от 10 000 до 1 000 000 тенге' });
        }
        if (isNaN(bMax) || bMax < 10000 || bMax > 1000000) {
            return res.status(400).json({ error: 'Максимальный бюджет должен быть от 10 000 до 1 000 000 тенге' });
        }
        if (bMin > bMax) {
            return res.status(400).json({ error: 'Минимальный бюджет не может превышать максимальный' });
        }

        // Validate age range based on category
        let ageVal, ageMinVal, ageMaxVal;
        if (category === 'have_room') {
            ageMinVal = parseInt(ageMin);
            ageMaxVal = parseInt(ageMax);
            if (isNaN(ageMinVal) || ageMinVal < 16 || ageMinVal > 50) {
                return res.status(400).json({ error: 'Минимальный возраст должен быть от 16 до 50 лет' });
            }
            if (isNaN(ageMaxVal) || ageMaxVal < 16 || ageMaxVal > 50) {
                return res.status(400).json({ error: 'Максимальный возраст должен быть от 16 до 50 лет' });
            }
            if (ageMinVal > ageMaxVal) {
                return res.status(400).json({ error: 'Минимальный возраст не может быть больше максимального' });
            }
            ageVal = ageMaxVal; // fallback for older code
        } else {
            ageVal = parseInt(age);
            if (isNaN(ageVal) || ageVal < 16 || ageVal > 50) {
                return res.status(400).json({ error: 'Возраст должен быть в диапазоне от 16 до 50 лет' });
            }
            ageMinVal = ageVal;
            ageMaxVal = ageVal;
        }

        if (!city) {
            return res.status(400).json({ error: 'Выберите город' });
        }

        // Validate residents count for room seekers (1 to 9)
        let resCount = 1;
        if (category === 'need_room') {
            resCount = parseInt(residentsCount);
            if (isNaN(resCount) || resCount < 1 || resCount > 9) {
                return res.status(400).json({ error: 'Количество заселяющихся должно быть от 1 до 9' });
            }
        }

        // WhatsApp Validation E.164 (strictly 11 digits starting with 77)
        const digits = whatsapp ? whatsapp.replace(/\D/g, '') : '';
        if (digits.length !== 11 || !digits.startsWith('77')) {
            return res.status(400).json({ error: 'Номер WhatsApp должен содержать строго 11 цифр и начинаться с 77 (например, 77071234567)' });
        }

        // 2GIS Link validation (allows both kz and mobile go.2gis.com)
        if (category === 'have_room') {
            if (!gisLink || (!gisLink.startsWith('https://2gis.kz/') && !gisLink.startsWith('https://go.2gis.com/'))) {
                return res.status(400).json({ error: 'Ссылка 2GIS должна начинаться строго с https://2gis.kz/ или https://go.2gis.com/' });
            }
        }

        // Photos validation based on category (optional for seekers, required for landlords)
        // [SECURITY] Whitelist only HTTPS URLs from trusted domains (Supabase storage or Base64 data URIs)
        function isValidPhotoUrl(url) {
            if (!url || typeof url !== 'string') return false;
            if (url.startsWith('data:image/')) return true; // Base64 fallback allowed
            try {
                const parsed = new URL(url);
                return parsed.protocol === 'https:' &&
                    (parsed.hostname.endsWith('.supabase.co') ||
                     parsed.hostname.endsWith('.unsplash.com')); // Allow unsplash for mock data
            } catch { return false; }
        }
        const cleanPhotos = Array.isArray(photos)
            ? photos.map(url => url.trim()).filter(url => url !== '' && isValidPhotoUrl(url))
            : [];
        if (category === 'have_room') {
            if (cleanPhotos.length < 3 || cleanPhotos.length > 6) {
                return res.status(400).json({ error: 'Необходимо добавить от 3 до 6 фотографий квартиры' });
            }
        } else {
            if (cleanPhotos.length > 3) {
                return res.status(400).json({ error: 'Для анкеты соискателя можно добавить максимум 3 селфи/аватарки' });
            }
        }

        const gPref = genderPref && ['male', 'female', 'any'].includes(genderPref) ? genderPref : 'any';

        // Sanitize strings to prevent XSS injection
        const sanitizedListing = {
            id: `list-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            category,
            ownerId: req.user.id,
            ownerName: escapeHTML(req.user.name),
            ownerAvatar: req.user.avatar,
            budgetMin: bMin,
            budgetMax: bMax,
            budget: bMax, // fallback
            age: ageVal,
            ageMin: ageMinVal,
            ageMax: ageMaxVal,
            city,
            districts: Array.isArray(districts) ? districts.map(d => escapeHTML(d)) : [],
            whatsapp: digits,
            gender,
            genderPref: gPref,
            occupation: escapeHTML(occupation),
            roomCount: roomCount ? parseInt(roomCount) : null,
            roommateCount: roommateCount ? parseInt(roommateCount) : null,
            totalResidents: category === 'have_room' && totalResidents ? parseInt(totalResidents) : 1,
            residentsCount: category === 'need_room' ? resCount : 1,
            description: escapeHTML(description),
            photos: cleanPhotos,
            address: escapeHTML(address),
            gisLink: category === 'have_room' ? escapeHTML(gisLink) : '',
            hasDeposit: !!hasDeposit,
            hasContract: !!hasContract,
            createdAt: new Date().toISOString(),
            boostExpiredAt: null,
            status: 'active'
        };

        const savedListing = await dbServer.addListing(sanitizedListing);
        res.status(201).json(savedListing);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сохранения объявления' });
    }
});

// 3. PUT Edit Listing
app.put('/api/listings/:id', authenticateToken, async (req, res) => {
    try {
        const listing = await dbServer.getListingById(req.params.id);
        if (!listing) return res.status(404).json({ error: 'Объявление не найдено' });

        // Authorization check: only owner or admin can edit
        if (listing.ownerId !== req.user.id && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Доступ запрещен: Вы не являетесь владельцем этого объявления' });
        }

        const {
            budgetMin, budgetMax, budget, age, ageMin, ageMax, city, districts, whatsapp, gender, occupation,
            roomCount, roommateCount, totalResidents, genderPref, description, photos, address, gisLink, hasDeposit, hasContract, residentsCount
        } = req.body;

        // Validations
        const bMin = parseFloat(budgetMin || budget);
        const bMax = parseFloat(budgetMax || budget);
        if (isNaN(bMin) || bMin < 10000 || bMin > 1000000) {
            return res.status(400).json({ error: 'Минимальный бюджет должен быть от 10 000 до 1 000 000 тенге' });
        }
        if (isNaN(bMax) || bMax < 10000 || bMax > 1000000) {
            return res.status(400).json({ error: 'Максимальный бюджет должен быть от 10 000 до 1 000 000 тенге' });
        }
        if (bMin > bMax) {
            return res.status(400).json({ error: 'Минимальный бюджет не может превышать максимальный' });
        }

        // Validate age range based on category
        let ageVal, ageMinVal, ageMaxVal;
        if (listing.category === 'have_room') {
            ageMinVal = parseInt(ageMin);
            ageMaxVal = parseInt(ageMax);
            if (isNaN(ageMinVal) || ageMinVal < 16 || ageMinVal > 50) {
                return res.status(400).json({ error: 'Минимальный возраст должен быть от 16 до 50 лет' });
            }
            if (isNaN(ageMaxVal) || ageMaxVal < 16 || ageMaxVal > 50) {
                return res.status(400).json({ error: 'Максимальный возраст должен быть от 16 до 50 лет' });
            }
            if (ageMinVal > ageMaxVal) {
                return res.status(400).json({ error: 'Минимальный возраст не может быть больше максимального' });
            }
            ageVal = ageMaxVal;
        } else {
            ageVal = parseInt(age);
            if (isNaN(ageVal) || ageVal < 16 || ageVal > 50) {
                return res.status(400).json({ error: 'Возраст должен быть в диапазоне от 16 до 50 лет' });
            }
            ageMinVal = ageVal;
            ageMaxVal = ageVal;
        }

        const digits = whatsapp ? whatsapp.replace(/\D/g, '') : '';
        if (digits.length !== 11 || !digits.startsWith('77')) {
            return res.status(400).json({ error: 'Номер WhatsApp должен содержать строго 11 цифр и начинаться с 77 (например, 77071234567)' });
        }

        let resCount = 1;
        if (listing.category === 'need_room') {
            resCount = parseInt(residentsCount);
            if (isNaN(resCount) || resCount < 1 || resCount > 9) {
                return res.status(400).json({ error: 'Количество заселяющихся должно быть от 1 до 9' });
            }
        }

        if (listing.category === 'have_room') {
            if (!gisLink || (!gisLink.startsWith('https://2gis.kz/') && !gisLink.startsWith('https://go.2gis.com/'))) {
                return res.status(400).json({ error: 'Ссылка 2GIS должна начинаться строго с https://2gis.kz/ или https://go.2gis.com/' });
            }
        }

        // Photos validation based on category (optional for seekers, required for landlords)
        // [SECURITY] Whitelist only HTTPS URLs from trusted domains
        function isValidPhotoUrlEdit(url) {
            if (!url || typeof url !== 'string') return false;
            if (url.startsWith('data:image/')) return true;
            try {
                const parsed = new URL(url);
                return parsed.protocol === 'https:' &&
                    (parsed.hostname.endsWith('.supabase.co') ||
                     parsed.hostname.endsWith('.unsplash.com'));
            } catch { return false; }
        }
        const cleanPhotos = Array.isArray(photos)
            ? photos.map(url => url.trim()).filter(url => url !== '' && isValidPhotoUrlEdit(url))
            : [];
        if (listing.category === 'have_room') {
            if (cleanPhotos.length < 3 || cleanPhotos.length > 6) {
                return res.status(400).json({ error: 'Необходимо добавить от 3 до 6 фотографий квартиры' });
            }
        } else {
            if (cleanPhotos.length > 3) {
                return res.status(400).json({ error: 'Для анкеты соискателя можно добавить максимум 3 селфи/аватарки' });
            }
        }

        const gPref = genderPref && ['male', 'female', 'any'].includes(genderPref) ? genderPref : 'any';

        const updatedFields = {
            budgetMin: bMin,
            budgetMax: bMax,
            budget: bMax, // fallback
            age: ageVal,
            ageMin: ageMinVal,
            ageMax: ageMaxVal,
            city,
            districts: Array.isArray(districts) ? districts.map(d => escapeHTML(d)) : [],
            whatsapp: digits,
            gender,
            genderPref: gPref,
            occupation: escapeHTML(occupation),
            roomCount: roomCount ? parseInt(roomCount) : null,
            roommateCount: roommateCount ? parseInt(roommateCount) : null,
            totalResidents: listing.category === 'have_room' && totalResidents ? parseInt(totalResidents) : 1,
            residentsCount: listing.category === 'need_room' ? resCount : 1,
            description: escapeHTML(description),
            photos: cleanPhotos,
            address: escapeHTML(address),
            gisLink: listing.category === 'have_room' ? escapeHTML(gisLink) : '',
            hasDeposit: !!hasDeposit,
            hasContract: !!hasContract
        };

        const updatedListing = await dbServer.updateListing(req.params.id, updatedFields);
        res.json(updatedListing);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка обновления объявления' });
    }
});

// 4. DELETE Listing
app.delete('/api/listings/:id', authenticateToken, async (req, res) => {
    try {
        const listing = await dbServer.getListingById(req.params.id);
        if (!listing) return res.status(404).json({ error: 'Объявление не найдено' });

        if (listing.ownerId !== req.user.id && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Доступ запрещен: Вы не можете удалить это объявление' });
        }

        await dbServer.deleteListing(req.params.id);
        res.json({ success: true, message: 'Объявление успешно удалено' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка удаления объявления' });
    }
});

// 5. POST Archive Listing
app.post('/api/listings/:id/archive', authenticateToken, async (req, res) => {
    try {
        const listing = await dbServer.getListingById(req.params.id);
        if (!listing) return res.status(404).json({ error: 'Объявление не найдено' });

        if (listing.ownerId !== req.user.id && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }

        const updated = await dbServer.archiveListing(req.params.id);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка архивации объявления' });
    }
});

// 6. POST Reactivate Listing
app.post('/api/listings/:id/reactivate', authenticateToken, async (req, res) => {
    try {
        const listing = await dbServer.getListingById(req.params.id);
        if (!listing) return res.status(404).json({ error: 'Объявление не найдено' });

        if (listing.ownerId !== req.user.id && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }

        const updated = await dbServer.reactivateListing(req.params.id);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка реактивации объявления' });
    }
});

// --- KASPI PAYMENT FLOW & WEBHOOKS ---

// 7. GET Payment Mock Page (Renders a glassmorphic simulated Kaspi QR checkout page)
app.get('/api/payments/pay', async (req, res) => {
    const { listingId, amount } = req.query;
    if (!listingId || !amount) {
        return res.status(400).send("<h3>Неверные параметры платежа (отсутствуют listingId или amount)</h3>");
    }

    // [SECURITY] Validate amount is a known price (whitelist)
    const validAmounts = [190, 490, 590];
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || !validAmounts.includes(numericAmount)) {
        return res.status(400).send("<h3>Неверная сумма платежа</h3>");
    }

    const listing = await dbServer.getListingById(listingId);
    if (!listing) return res.status(404).send("<h3>Объявление не найдено</h3>");

    // [SECURITY] XSS: Escape all user-controlled values before injecting into HTML
    const safeAmount = escapeHTML(String(numericAmount));
    const safeListingId = escapeHTML(String(listingId));
    const safeOwnerName = escapeHTML(String(listing.ownerName || ''));

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <title>Симуляция оплаты Kaspi.kz</title>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
            :root {
                --bg: #1c1d26;
                --card-bg: rgba(37, 39, 54, 0.7);
                --accent-red: #f14635;
                --text: #ffffff;
                --text-muted: #8e90a6;
                --radius: 20px;
            }
            body {
                margin: 0;
                font-family: 'Montserrat', sans-serif;
                background-color: var(--bg);
                color: var(--text);
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                overflow: hidden;
            }
            .payment-card {
                background: var(--card-bg);
                backdrop-filter: blur(15px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                width: 90%;
                max-width: 400px;
                border-radius: var(--radius);
                padding: 30px;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
            }
            .kaspi-header {
                font-size: 24px;
                font-weight: 600;
                color: var(--accent-red);
                margin-bottom: 25px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
            }
            .kaspi-logo {
                background: var(--accent-red);
                color: white;
                font-weight: 600;
                padding: 4px 10px;
                border-radius: 8px;
                font-size: 16px;
            }
            .amount {
                font-size: 36px;
                font-weight: 600;
                margin: 15px 0;
            }
            .amount span {
                font-size: 20px;
                color: var(--accent-red);
            }
            .info-box {
                background: rgba(255, 255, 255, 0.03);
                border-radius: 12px;
                padding: 15px;
                margin: 20px 0;
                font-size: 14px;
                line-height: 1.5;
                text-align: left;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            .info-row:last-child {
                margin-bottom: 0;
            }
            .info-label {
                color: var(--text-muted);
            }
            .qr-mock {
                background: white;
                width: 200px;
                height: 200px;
                margin: 25px auto;
                padding: 10px;
                border-radius: 15px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
            }
            .qr-image {
                width: 100%;
                height: 100%;
                background-image: repeating-conic-gradient(#1c1d26 0% 25%, transparent 0% 50%);
                background-size: 20px 20px;
                opacity: 0.85;
            }
            .qr-center {
                position: absolute;
                background: var(--accent-red);
                color: white;
                font-weight: 600;
                padding: 6px 12px;
                border-radius: 8px;
                font-size: 14px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
            }
            .pay-btn {
                background: var(--accent-red);
                color: white;
                border: none;
                padding: 16px 32px;
                font-size: 16px;
                font-weight: 600;
                width: 100%;
                border-radius: 12px;
                cursor: pointer;
                transition: transform 0.2s, opacity 0.2s;
            }
            .pay-btn:hover {
                transform: translateY(-2px);
                opacity: 0.9;
            }
            .pay-btn:active {
                transform: translateY(0);
            }
            .status-msg {
                margin-top: 15px;
                font-size: 14px;
                color: #b8ff00;
                display: none;
            }
        </style>
    </head>
    <body>
        <div class="payment-card">
            <div class="kaspi-header">
                <div class="kaspi-logo">K</div>
                Kaspi Pay
            </div>
            <div class="amount">${safeAmount} <span>₸</span></div>
            
            <div class="info-box">
                <div class="info-row">
                    <div class="info-label">Объявление ID:</div>
                    <div>${safeListingId}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Владелец:</div>
                    <div>${safeOwnerName}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Услуга:</div>
                    <div>Топ-продвижение Hata.kz</div>
                </div>
            </div>

            <div class="qr-mock">
                <div class="qr-image"></div>
                <div class="qr-center">QR PAY</div>
            </div>

            <button class="pay-btn" id="confirmBtn" onclick="processPayment()">Подтвердить оплату</button>
            <div class="status-msg" id="statusMsg">Отправка защищенного вебхука...</div>
        </div>

        <script>
            async function processPayment() {
                const btn = document.getElementById('confirmBtn');
                const msg = document.getElementById('statusMsg');
                btn.disabled = true;
                msg.style.display = 'block';

                const payload = {
                    txn_id: 'kaspi-txn-' + Math.floor(Math.random() * 100000000),
                    listing_id: '${safeListingId}',
                    amount: ${safeAmount},
                    status: 'completed',
                    timestamp: new Date().toISOString()
                };

                // [SECURITY] Signature is generated server-side via webhook.
                // Client does NOT know the secret — it sends the payload without a signature.
                // The payment page is a SIMULATION only. Real Kaspi payments use server-to-server webhooks.
                // Client sends the payload; server validates via its own HMAC calculation.
                const signSource = JSON.stringify(payload);
                
                // Simple SHA256 simulation helper (standard browser crypto api)
                async function sha256(message) {
                    const msgBuffer = new TextEncoder().encode(message);
                    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                }

                try {
                    const signature = await sha256(signSource);
                    
                    const response = await fetch('/api/payments/kaspi-webhook', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-kaspi-signature': signature
                        },
                        body: JSON.stringify(payload)
                    });
                    
                    const data = await response.json();
                    if (response.ok && data.success) {
                        msg.innerHTML = 'Оплата успешно проведена! Возвращаемся на сайт...';
                        msg.style.color = '#b8ff00';
                        setTimeout(() => {
                            window.location.href = '/';
                        }, 2000);
                    } else {
                        btn.disabled = false;
                        msg.innerHTML = 'Ошибка оплаты: ' + (data.error || 'Неизвестная ошибка');
                        msg.style.color = '#f14635';
                    }
                } catch (e) {
                    btn.disabled = false;
                    msg.innerHTML = 'Сетевая ошибка при отправке вебхука';
                    msg.style.color = '#f14635';
                }
            }
        </script>
    </body>
    </html>
    `;
    res.send(htmlContent);
});

// 8. POST Kaspi Webhook
app.post('/api/payments/kaspi-webhook', paymentLimiter, async (req, res) => {
    try {
        const signature = req.headers['x-kaspi-signature'];
        const payload = req.body;

        if (!signature || !payload) {
            return res.status(400).json({ error: 'Missing webhook signature or payload' });
        }

        const { txn_id, listing_id, amount, status } = payload;

        // [SECURITY] Verify HMAC-SHA256 signature (NOT plain SHA256!)
        // HMAC is resistant to length-extension attacks unlike plain SHA256
        const secret = process.env.KASPI_WEBHOOK_SECRET;
        if (!secret) {
            console.error('[Payment Webhook] KASPI_WEBHOOK_SECRET is not set! Rejecting all webhook requests.');
            return res.status(503).json({ error: 'Платёжный сервис временно недоступен' });
        }

        // Calculate expected HMAC-SHA256 signature
        const signSource = JSON.stringify(payload);
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(signSource)
            .digest('hex');

        // [SECURITY] Use timing-safe comparison to prevent timing attacks
        const sigBuffer = Buffer.from(signature || '', 'hex');
        const expBuffer = Buffer.from(expectedSignature, 'hex');
        const signaturesMatch = sigBuffer.length === expBuffer.length &&
            crypto.timingSafeEqual(sigBuffer, expBuffer);

        if (!signaturesMatch) {
            console.warn('[Payment Webhook] Signature mismatch for txn_id:', txn_id);
            return res.status(401).json({ error: 'Недействительная цифровая подпись Kaspi' });
        }

        if (status !== 'completed') {
            return res.status(400).json({ error: 'Транзакция не завершена' });
        }

        // Determine promo boost days based on price paid
        let days = 0;
        if (amount === 190) days = 3;
        else if (amount === 490) days = 7;
        else if (amount === 590) days = 30;
        else {
            return res.status(400).json({ error: 'Неверная сумма платежа' });
        }

        console.log(`[Payment Webhook] Success! Boosting listing ${listing_id} for ${days} days. Txn: ${txn_id}`);
        await dbServer.boostListing(listing_id, days);

        res.json({ success: true, message: 'Платеж успешно зачислен, объявление поднято в топ' });
    } catch (err) {
        console.error("[Payment Webhook] Error processing payment:", err);
        res.status(500).json({ error: 'Внутренняя ошибка обработки платежа на сервере' });
    }
});

// Dynamic injector for config.js
app.get('/config.js', (req, res) => {
    try {
        const filePath = path.join(__dirname, 'config.js');
        let configContent = fs.readFileSync(filePath, 'utf8');

        if (process.env.SUPABASE_URL) {
            configContent = configContent.replace(
                /supabaseUrl:\s*["'][^"']*["']/g,
                `supabaseUrl: "${process.env.SUPABASE_URL}"`
            );
        }
        if (process.env.SUPABASE_ANON_KEY) {
            configContent = configContent.replace(
                /supabaseAnonKey:\s*["'][^"']*["']/g,
                `supabaseAnonKey: "${process.env.SUPABASE_ANON_KEY}"`
            );
        }
        if (process.env.SUPABASE_REDIRECT_URL) {
            configContent = configContent.replace(
                /supabaseRedirectUrl:\s*["'][^"']*["']/g,
                `supabaseRedirectUrl: "${process.env.SUPABASE_REDIRECT_URL}"`
            );
        }
        if (process.env.ADMIN_EMAIL) {
            configContent = configContent.replace(
                /adminEmail:\s*["'][^"']*["']/g,
                `adminEmail: "${process.env.ADMIN_EMAIL}"`
            );
        }

        res.setHeader('Content-Type', 'application/javascript');
        res.send(configContent);
    } catch (err) {
        res.status(500).send("Internal Server Error");
    }
});

// Serve static files
app.use(express.static(__dirname));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start node-cron scheduler (runs every 24 hours at midnight to prune listings)
cron.schedule('0 0 * * *', async () => {
    try {
        await dbServer.runPruningDaemon();
    } catch (err) {
        console.error("Pruning Cron Job error:", err);
    }
});
console.log("[Scheduler] Daily archiving cron job scheduled successfully.");

app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` Hata.kz Secure Monolithic Server running...`);
    console.log(` Local URL: http://localhost:${PORT}`);
    console.log(`===============================================`);
});
