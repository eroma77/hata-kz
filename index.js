// Hata.kz Application Controller

// Global state
let currentCategory = 'have_room'; // 'have_room' (Ищу квартиру) or 'need_room' (Ищу сожителя)
let selectedFilterDistricts = new Set();
let selectedFormDistricts = new Set();
let formImagesList = [];
let activePromoListingId = null;
let activePromoDays = 3;
let filterHasErrors = false;

// Initialize app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    populateCitiesDropdowns();

    // Initialize UI triggers
    initTheme();
    initNavigation();
    initCategoryTabs();
    initFilters();
    initAuth();
    initForm();
    initAdmin();
    
    // Print local access guides
    printMobileAccessGuide();
    
    // Initial Render
    updateDistrictsFilter();
    renderListings();
    
    // Listeners for DB changes
    window.addEventListener('hata_listings_changed', () => {
        if (currentActiveTab === 'feed') renderListings();
        else if (currentActiveTab === 'favorites') renderFavorites();
        
        renderUserProfile();
        renderAdminModerationList();
    });
    
    window.addEventListener('hata_auth_changed', () => {
        updateAuthHeader();
        renderUserProfile();
        lucide.createIcons();
    });
    
    window.addEventListener('hata_config_changed', () => {
        updateAdminInputs();
        populateCitiesDropdowns();
        renderListings();
    });

    // Initial run of Lucide icons
    lucide.createIcons();
});

// Modal helpers
window.openModal = function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
};

window.closeModal = function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
};

// --- THEME MANAGEMENT ---
function initTheme() {
    const themeBtn = document.getElementById('themeToggleBtn');
    const themeBtnMobile = document.getElementById('themeToggleBtnMobile');
    
    const savedTheme = localStorage.getItem('hata_theme') || 'dark';
    setTheme(savedTheme);
    
    const handleToggle = () => {
        const isDark = document.body.classList.contains('dark-theme');
        const nextTheme = isDark ? 'light' : 'dark';
        setTheme(nextTheme);
    };

    if (themeBtn) themeBtn.addEventListener('click', handleToggle);
    if (themeBtnMobile) themeBtnMobile.addEventListener('click', handleToggle);
}

function setTheme(theme) {
    const themeBtn = document.getElementById('themeToggleBtn');
    const themeBtnMobile = document.getElementById('themeToggleBtnMobile');
    
    if (theme === 'dark') {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        if (themeBtn) {
            const darkIcon = themeBtn.querySelector('.theme-icon-dark');
            const lightIcon = themeBtn.querySelector('.theme-icon-light');
            const themeTxt = themeBtn.querySelector('.theme-text');
            if (darkIcon) darkIcon.style.display = 'none';
            if (lightIcon) lightIcon.style.display = 'inline-block';
            if (themeTxt) themeTxt.textContent = 'Светлая тема';
        }
        if (themeBtnMobile) {
            themeBtnMobile.innerHTML = `<i data-lucide="sun"></i>`;
        }
    } else {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        if (themeBtn) {
            const darkIcon = themeBtn.querySelector('.theme-icon-dark');
            const lightIcon = themeBtn.querySelector('.theme-icon-light');
            const themeTxt = themeBtn.querySelector('.theme-text');
            if (darkIcon) darkIcon.style.display = 'inline-block';
            if (lightIcon) lightIcon.style.display = 'none';
            if (themeTxt) themeTxt.textContent = 'Темная тема';
        }
        if (themeBtnMobile) {
            themeBtnMobile.innerHTML = `<i data-lucide="moon"></i>`;
        }
    }
    localStorage.setItem('hata_theme', theme);
    lucide.createIcons();
}

// --- POPULATE CITIES DYNAMICALLY ---
function populateCitiesDropdowns() {
    const filterCity = document.getElementById('filterCity');
    const formCity = document.getElementById('formCity');
    
    if (filterCity) {
        const currentVal = filterCity.value;
        filterCity.innerHTML = '';
        Object.keys(HataConfig.cities).forEach(key => {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = HataConfig.cities[key].name;
            filterCity.appendChild(opt);
        });
        if (currentVal && HataConfig.cities[currentVal]) {
            filterCity.value = currentVal;
        }
    }
    
    if (formCity) {
        const currentVal = formCity.value;
        formCity.innerHTML = '';
        Object.keys(HataConfig.cities).forEach(key => {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = HataConfig.cities[key].name;
            formCity.appendChild(opt);
        });
        if (currentVal && HataConfig.cities[currentVal]) {
            formCity.value = currentVal;
        }
    }
}

// --- AUTHENTICATION & SUPABASE INTEGRATION ---
function initAuth() {
    // Real Supabase Auth redirection trigger
    const googleRealLoginBtn = document.getElementById('googleRealLoginBtn');
    if (googleRealLoginBtn) {
        googleRealLoginBtn.addEventListener('click', async () => {
            if (window.location.protocol === 'file:') {
                alert("Ошибка: Вы открыли проект напрямую через файл (file://). Google OAuth не поддерживает файлы. Запустите локальный сервер и откройте сайт по адресу http://localhost:3000 для проверки входа.");
                return;
            }
            if (db.supabaseClient) {
                const config = loadConfig();
                const redirectUrl = config.supabaseRedirectUrl || (window.location.origin + window.location.pathname);
                const { error } = await db.supabaseClient.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: redirectUrl
                    }
                });
                if (error) alert("Ошибка авторизации Supabase: " + error.message);
            } else {
                alert("Supabase не настроен в Панели Администратора.");
            }
        });
    }

    updateAuthHeader();
}

function updateAuthHeader() {
    const desktopContainer = document.getElementById('authContainer');
    const mobileContainer = document.getElementById('authContainerMobile');
    const user = db.getCurrentUser();
    
    if (user) {
        // Desktop Sidebar layout
        if (desktopContainer) {
            desktopContainer.innerHTML = `
                <div class="user-profile-badge">
                    <div class="user-profile-info" onclick="switchTab('profile')" style="cursor:pointer;" title="Кабинет">
                        <img src="${user.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}" alt="">
                        <div class="name-email">
                            <span class="user-name">${user.name}</span>
                            <span class="user-email">${user.email}</span>
                        </div>
                    </div>
                    <button class="logout-icon-btn" onclick="logoutUser()" title="Выйти">
                        <i data-lucide="log-out" style="width:16px; height:16px;"></i>
                    </button>
                </div>
            `;
        }
        
        // Mobile Header layout
        if (mobileContainer) {
            mobileContainer.innerHTML = `
                <img src="${user.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}" class="user-avatar" onclick="switchTab('profile')" style="cursor:pointer; width:34px; height:34px; border-radius:50%; object-fit:cover; border:2px solid var(--accent-violet);">
            `;
        }
        
        // Toggle Admin tabs visibility
        const adminMenuOptions = document.querySelectorAll('.admin-only');
        if (user.isAdmin) {
            adminMenuOptions.forEach(opt => opt.style.display = 'flex');
        } else {
            adminMenuOptions.forEach(opt => opt.style.display = 'none');
            if (currentActiveTab === 'admin') {
                switchTab('feed');
            }
        }
    } else {
        // Logged out states
        if (desktopContainer) {
            desktopContainer.innerHTML = `<button class="btn btn-primary" onclick="openModal('loginModal')" style="width:100%;">Войти</button>`;
        }
        if (mobileContainer) {
            mobileContainer.innerHTML = `<button class="btn btn-primary" onclick="openModal('loginModal')" style="font-size:0.8rem; padding:0.4rem 0.8rem;">Войти</button>`;
        }
        
        // Hide Admin tabs
        document.querySelectorAll('.admin-only').forEach(opt => opt.style.display = 'none');
        if (currentActiveTab === 'admin' || currentActiveTab === 'profile') {
            switchTab('feed');
        }
    }
    
    lucide.createIcons();
}

window.logoutUser = async function() {
    if (db.supabaseClient) {
        await db.supabaseClient.auth.signOut();
    }
    db.logout();
    switchTab('feed');
};

// --- CATEGORY TABS ---
function initCategoryTabs() {
    const tabNeedRoom = document.getElementById('tabNeedRoom');
    const tabHaveRoom = document.getElementById('tabHaveRoom');
    
    if (tabNeedRoom && tabHaveRoom) {
        tabNeedRoom.addEventListener('click', () => switchCategoryTab('have_room')); // Ищу квартиру -> shows have_room listings
        tabHaveRoom.addEventListener('click', () => switchCategoryTab('need_room')); // Ищу сожителя -> shows need_room listings
    }
}

function switchCategoryTab(cat) {
    currentCategory = cat;
    document.getElementById('tabNeedRoom').classList.toggle('active', cat === 'have_room');
    document.getElementById('tabHaveRoom').classList.toggle('active', cat === 'need_room');
    
    selectedFilterDistricts.clear();
    updateDistrictsFilter();
    renderListings();
}

// --- MASKS & NUMERIC VALIDATIONS ---
function formatNumberWithSpaces(val) {
    const clean = val.toString().replace(/\D/g, '');
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function parseFormattedNumber(val) {
    return parseInt(val.toString().replace(/\D/g, '')) || 0;
}

// Setup input listeners to strip non-digits and format numbers dynamically
function attachNumberFormatting(inputEl, boundsCheckCallback = null) {
    if (!inputEl) return;
    
    inputEl.addEventListener('input', (e) => {
        // Strip non-digits
        const start = e.target.selectionStart;
        const oldLen = e.target.value.length;
        
        const rawDigits = e.target.value.replace(/\D/g, '');
        e.target.value = formatNumberWithSpaces(rawDigits);
        
        // Adjust cursor position
        const newLen = e.target.value.length;
        e.target.setSelectionRange(start + (newLen - oldLen), start + (newLen - oldLen));
        
        if (boundsCheckCallback) boundsCheckCallback();
    });
}

// Strip numbers from text input fields (e.g. form fields that shouldn't contain digits)
function attachTextOnlyConstraint(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[0-9]/g, '');
    });
}

// --- FILTERS & VALIDATION ENGINE ---
function initFilters() {
    const filterCity = document.getElementById('filterCity');
    const filterBudgetMin = document.getElementById('filterBudgetMin');
    const filterBudgetMax = document.getElementById('filterBudgetMax');
    const filterGender = document.getElementById('filterGender');
    const filterRooms = document.getElementById('filterRooms');
    
    if (filterCity) {
        filterCity.addEventListener('change', () => {
            selectedFilterDistricts.clear();
            updateDistrictsFilter();
            if (!filterHasErrors) renderListings();
        });
    }
    
    // Attach masks
    attachNumberFormatting(filterBudgetMin, validateFilterBudgetRange);
    attachNumberFormatting(filterBudgetMax, validateFilterBudgetRange);
    
    if (filterGender) filterGender.addEventListener('change', () => { if (!filterHasErrors) renderListings(); });
    if (filterRooms) filterRooms.addEventListener('change', () => { if (!filterHasErrors) renderListings(); });

    // Collapsible filter panel toggle
    const filterToggleBtn = document.getElementById('filterToggleBtn');
    const filterCard = document.getElementById('filterCard');
    if (filterToggleBtn && filterCard) {
        filterToggleBtn.addEventListener('click', () => {
            const isHidden = filterCard.style.display === 'none' || filterCard.style.display === '';
            if (isHidden) {
                filterCard.style.display = 'block';
                filterToggleBtn.classList.add('active');
            } else {
                filterCard.style.display = 'none';
                filterToggleBtn.classList.remove('active');
            }
        });
    }

    // Global Search trigger
    const globalSearchInput = document.getElementById('globalSearchInput');
    if (globalSearchInput) {
        globalSearchInput.addEventListener('input', () => {
            if (!filterHasErrors) renderListings();
        });
    }
}

function validateFilterBudgetRange() {
    const minEl = document.getElementById('filterBudgetMin');
    const maxEl = document.getElementById('filterBudgetMax');
    
    const minVal = parseFormattedNumber(minEl.value);
    const maxVal = parseFormattedNumber(maxEl.value);
    
    let hasErr = false;
    
    // Reset borders
    minEl.classList.remove('is-invalid');
    maxEl.classList.remove('is-invalid');
    
    // Validation 1: min bounds
    if (minEl.value && (minVal < 10000 || minVal > 1000000)) {
        minEl.classList.add('is-invalid');
        hasErr = true;
    }
    
    // Validation 2: max bounds
    if (maxEl.value && (maxVal < 10000 || maxVal > 1000000)) {
        maxEl.classList.add('is-invalid');
        hasErr = true;
    }
    
    // Validation 3: Min > Max
    if (minEl.value && maxEl.value && minVal > maxVal) {
        minEl.classList.add('is-invalid');
        maxEl.classList.add('is-invalid');
        hasErr = true;
    }
    
    filterHasErrors = hasErr;
    
    // If validation fails, completely block query filtering
    if (!filterHasErrors) {
        renderListings();
    }
}

function updateDistrictsFilter() {
    const cityKey = document.getElementById('filterCity').value;
    const container = document.getElementById('filterDistrictsContainer');
    const wrapper = document.getElementById('filterDistrictsWrapper');
    
    if (!container || !wrapper) return;
    container.innerHTML = '';
    
    const cityInfo = HataConfig.cities[cityKey];
    if (!cityInfo || !cityInfo.hasDistricts) {
        wrapper.style.display = 'none';
        return;
    }
    
    wrapper.style.display = 'block';
    
    if (cityInfo.districts) {
        cityInfo.districts.forEach(district => {
            const pill = document.createElement('div');
            pill.className = 'district-pill';
            if (selectedFilterDistricts.has(district)) {
                pill.classList.add('selected');
            }
            pill.textContent = district;
            pill.addEventListener('click', () => {
                if (selectedFilterDistricts.has(district)) {
                    selectedFilterDistricts.delete(district);
                    pill.classList.remove('selected');
                } else {
                    selectedFilterDistricts.add(district);
                    pill.classList.add('selected');
                }
                if (!filterHasErrors) renderListings();
            });
            container.appendChild(pill);
        });
    }
}

// --- LISTINGS RENDERING ---
function renderListings() {
    const grid = document.getElementById('listingsGrid');
    if (!grid) return;
    
    const activeListings = db.getListings();
    
    const cityFilter = document.getElementById('filterCity').value;
    const budgetMinVal = parseFormattedNumber(document.getElementById('filterBudgetMin').value) || 10000;
    const budgetMaxVal = parseFormattedNumber(document.getElementById('filterBudgetMax').value) || 1000000;
    const genderFilter = document.getElementById('filterGender').value;
    const roomFilter = document.getElementById('filterRooms').value;
    
    // Global search input
    const searchInput = document.getElementById('globalSearchInput');
    const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const cityInfo = HataConfig.cities[cityFilter];
    const cityHasDistricts = cityInfo ? cityInfo.hasDistricts : false;

    // Filter listings matching current tab & filters
    let filtered = activeListings.filter(item => {
        if (item.category !== currentCategory) return false;
        if (item.city !== cityFilter) return false;
        
        // Match range bounds
        if (item.budget < budgetMinVal || item.budget > budgetMaxVal) return false;
        
        if (genderFilter !== 'any' && item.gender !== genderFilter) return false;
        
        if (roomFilter !== 'any') {
            if (roomFilter === '4plus') {
                if (item.roomCount < 4) return false;
            } else {
                if (item.roomCount !== parseInt(roomFilter)) return false;
            }
        }
        
        if (cityHasDistricts && selectedFilterDistricts.size > 0) {
            const hasMatch = item.districts.some(dist => selectedFilterDistricts.has(dist));
            if (!hasMatch) return false;
        }
        
        // Match search query
        if (searchVal) {
            const descMatch = item.description.toLowerCase().includes(searchVal);
            const addrMatch = item.address && item.address.toLowerCase().includes(searchVal);
            const distsMatch = item.districts && item.districts.some(d => d.toLowerCase().includes(searchVal));
            const ownerMatch = item.ownerName.toLowerCase().includes(searchVal);
            if (!descMatch && !addrMatch && !distsMatch && !ownerMatch) return false;
        }
        
        return true;
    });
    
    // Sort promoted listings to the top
    const now = new Date().getTime();
    filtered.sort((a, b) => {
        const aBoosted = a.boostExpiredAt && new Date(a.boostExpiredAt).getTime() > now;
        const bBoosted = b.boostExpiredAt && new Date(b.boostExpiredAt).getTime() > now;
        
        if (aBoosted && !bBoosted) return -1;
        if (!aBoosted && bBoosted) return 1;
        
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    document.getElementById('listingsCount').textContent = filtered.length;
    
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-feed form-full">
                <div class="empty-icon"><i data-lucide="search" style="width:48px; height:48px;"></i></div>
                <div class="empty-title">Ничего не найдено</div>
                <p>Попробуйте сбросить фильтры или изменить поисковый запрос.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    const user = db.getCurrentUser();
    const favorites = user ? db.getFavorites(user.id) : [];

    grid.innerHTML = filtered.map(item => {
        const isBoosted = item.boostExpiredAt && new Date(item.boostExpiredAt).getTime() > now;
        const formattedDate = formatListingDate(item.createdAt);
        
        const isFav = favorites.includes(item.id);
        const heartButton = `
            <button class="favorite-btn ${isFav ? 'active' : ''}" onclick="toggleFavoriteListing(event, '${item.id}')" title="В избранное">
                <i data-lucide="heart"></i>
            </button>
        `;

        let carouselHTML = '';
        if (item.photos && item.photos.length > 0) {
            carouselHTML = `
                <div class="card-gallery">
                    ${heartButton}
                    <img class="card-img" src="${item.photos[0]}" alt="Квартира">
                    <div class="gallery-nav">
                        ${item.photos.map((_, i) => `<span class="gallery-dot ${i === 0 ? 'active' : ''}"></span>`).join('')}
                    </div>
                </div>
            `;
        } else {
            carouselHTML = `
                <div class="card-gallery">
                    ${heartButton}
                    <div class="no-photo">
                        <i data-lucide="camera" class="no-photo-icon"></i>
                        <span>Без фотографий</span>
                    </div>
                </div>
            `;
        }
        
        let tagOccupation = '';
        if (item.occupation === 'student') tagOccupation = 'Учеба';
        else if (item.occupation === 'student_work') tagOccupation = 'Учеба + Работа';
        else if (item.occupation === 'work') tagOccupation = 'Работает';
        else tagOccupation = 'Не занят';

        const genderLabel = item.gender === 'male' ? 'Парень' : 'Девушка';
        
        const distStr = item.districts && item.districts.length > 0
            ? `<span class="card-tag accent"><i data-lucide="map-pin" style="width:10px; height:10px; margin-right:2px; vertical-align:middle;"></i>${item.districts.join(', ')}</span>`
            : '';

        const mapButton = (item.gisLink && item.category === 'have_room') 
            ? `<a href="${item.gisLink}" target="_blank" class="btn btn-secondary"><i data-lucide="map"></i><span>В 2GIS</span></a>`
            : '';
            
        const cleanPhone = item.whatsapp.startsWith('8') ? '7' + item.whatsapp.substring(1) : item.whatsapp;
        const waLink = `https://wa.me/7${cleanPhone.replace(/^7/, '')}?text=Привет!%20Я%20насчет%20объявления%20на%20Hata.kz`;

        return `
            <div class="hata-card ${isBoosted ? 'promoted' : ''}">
                ${isBoosted ? `<span class="promoted-tag">В ТОПЕ</span>` : ''}
                ${carouselHTML}
                <div class="card-body">
                    <div class="card-top">
                        <img class="owner-img" src="${item.ownerAvatar}" alt="">
                        <div class="owner-meta">
                            <span class="owner-name">${item.ownerName}</span>
                            <span class="listing-date">${formattedDate}</span>
                        </div>
                    </div>
                    
                    <div class="card-title">${formatNumberWithSpaces(item.budget)} ₸ <span>/ мес</span></div>
                    
                    <div class="card-tags">
                        <span class="card-tag accent">${genderLabel}, ${item.age} лет</span>
                        <span class="card-tag">${tagOccupation}</span>
                        <span class="card-tag">${item.roomCount} комн.</span>
                        ${item.hasDeposit ? '<span class="card-tag accent">Депозит</span>' : ''}
                        ${item.hasContract ? '<span class="card-tag">Договор</span>' : ''}
                        ${distStr}
                    </div>
                    
                    <p class="card-desc">${item.description}</p>
                    
                    <div class="card-footer">
                        <a href="${waLink}" target="_blank" class="btn btn-primary" style="background:#25d366; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.25);">
                            <i data-lucide="message-square"></i>
                            <span>WhatsApp</span>
                        </a>
                        ${mapButton}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Load icons
    lucide.createIcons();
}

function formatListingDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) return 'Сегодня';
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Вчера';
    
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

// --- PROFILE PANEL (MY LISTINGS) ---
function renderUserProfile() {
    const container = document.getElementById('userListingsContainer');
    const user = db.getCurrentUser();
    
    const avatarEl = document.getElementById('cabinetUserAvatar');
    const nameEl = document.getElementById('cabinetUserName');
    const emailEl = document.getElementById('cabinetUserEmail');
    
    if (user) {
        if (avatarEl) avatarEl.src = user.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
        if (nameEl) nameEl.textContent = user.name;
        if (emailEl) emailEl.textContent = user.email;
    }
    
    if (!container) return;
    if (!user) {
        container.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-muted);">Пожалуйста, войдите в систему.</div>`;
        return;
    }
    
    const myListings = db.getUserListings(user.id);
    
    if (myListings.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 2rem; color: var(--text-muted);">
                У вас еще нет объявлений. Нажмите кнопку "+ Создать объявление", чтобы опубликовать первое.
            </div>
        `;
        return;
    }
    
    const now = new Date().getTime();
    container.innerHTML = myListings.map(item => {
        const isBoosted = item.boostExpiredAt && new Date(item.boostExpiredAt).getTime() > now;
        
        let badgesHTML = '';
        if (item.status === 'active') {
            badgesHTML += `<span class="item-badge active">Активно</span> `;
            if (isBoosted) {
                badgesHTML += `<span class="item-badge promoted">В Топе</span>`;
            }
        } else {
            badgesHTML += `<span class="item-badge archived">В архиве</span>`;
        }
        
        const catLabel = item.category === 'have_room' ? 'Ищу сожителя (Сдам)' : 'Ищу комнату (Сниму)';
        const dateStr = new Date(item.createdAt).toLocaleDateString('ru-RU');

        let actionButtons = '';
        if (item.status === 'active') {
            actionButtons += `
                <button class="btn btn-lime" style="font-size:0.75rem;" onclick="openPromoModal('${item.id}')"><i data-lucide="upload-cloud"></i>В ТОП</button>
                <button class="btn btn-secondary" style="font-size:0.75rem;" onclick="editListing('${item.id}')"><i data-lucide="edit-3"></i></button>
                <button class="btn btn-secondary" style="font-size:0.75rem; color:#ef4444; border-color:rgba(239, 68, 68, 0.2);" onclick="archiveListing('${item.id}')"><i data-lucide="archive"></i></button>
            `;
        } else {
            actionButtons += `
                <button class="btn btn-lime" style="font-size:0.75rem;" onclick="reactivateListing('${item.id}')"><i data-lucide="upload-cloud"></i>Активировать</button>
                <button class="btn btn-danger" style="font-size:0.75rem;" onclick="deleteListing('${item.id}')"><i data-lucide="trash-2"></i></button>
            `;
        }

        return `
            <div class="user-listing-item">
                <div class="item-info">
                    <div class="item-title">${catLabel} - ${formatNumberWithSpaces(item.budget)} ₸</div>
                    <div class="item-meta">
                        <span>Дата: ${dateStr}</span>
                        <span>Город: ${HataConfig.cities[item.city].name}</span>
                        <div>${badgesHTML}</div>
                    </div>
                </div>
                <div class="item-actions">
                    ${actionButtons}
                </div>
            </div>
        `;
    }).join('');
    
    lucide.createIcons();
}

window.archiveListing = function(id) {
    if (confirm("Вы уверены, что хотите убрать объявление в архив?")) {
        try {
            db.archiveListing(id);
        } catch (e) {
            alert(e.message);
        }
    }
};

window.reactivateListing = function(id) {
    try {
        db.reactivateListing(id);
    } catch (e) {
        alert(e.message);
    }
};

window.deleteListing = function(id) {
    if (confirm("Удалить объявление навсегда? Это действие необратимо.")) {
        try {
            db.deleteListing(id);
        } catch (e) {
            alert(e.message);
        }
    }
};

// --- FORM CONTROLLER & VALIDATIONS ---
function initForm() {
    const createListingBtn = document.getElementById('createListingBtn');
    if (createListingBtn) {
        createListingBtn.addEventListener('click', () => openListingForm());
    }
    
    // Setup formatting and validations on creation form budget
    const formBudget = document.getElementById('formBudget');
    attachNumberFormatting(formBudget, validateFormBudgetBounds);
    
    // Setup numbers formatting on age (strip non-digits, max length 2)
    const formAge = document.getElementById('formAge');
    if (formAge) {
        formAge.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 2);
        });
    }

    // Setup mask on phone (WhatsApp)
    const formWhatsapp = document.getElementById('formWhatsapp');
    if (formWhatsapp) {
        formWhatsapp.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 10);
        });
        
        formWhatsapp.addEventListener('focus', () => {
            const user = db.getCurrentUser();
            if (user) {
                const suggestions = db.getAutoFillSuggestions(user.id);
                if (suggestions.whatsapp && !formWhatsapp.value) {
                    formWhatsapp.value = suggestions.whatsapp;
                }
            }
        });
    }

    const formAddress = document.getElementById('formAddress');
    if (formAddress) {
        formAddress.addEventListener('focus', () => {
            const user = db.getCurrentUser();
            if (user) {
                const suggestions = db.getAutoFillSuggestions(user.id);
                if (suggestions.address && !formAddress.value) {
                    formAddress.value = suggestions.address;
                }
            }
        });
    }
}

function validateFormBudgetBounds() {
    const budgetEl = document.getElementById('formBudget');
    const val = parseFormattedNumber(budgetEl.value);
    const submitBtn = document.getElementById('formSubmitBtn');
    
    if (budgetEl.value && (val < 10000 || val > 1000000)) {
        budgetEl.classList.add('is-invalid');
        if (submitBtn) submitBtn.disabled = true;
    } else {
        budgetEl.classList.remove('is-invalid');
        if (submitBtn) submitBtn.disabled = false;
    }
}

function openListingForm(id = null) {
    const user = db.getCurrentUser();
    if (!user) {
        openModal('loginModal');
        return;
    }
    
    const form = document.getElementById('listingForm');
    form.reset();
    selectedFormDistricts.clear();
    formImagesList = [];
    
    const title = document.getElementById('listingModalTitle');
    const submitBtn = document.getElementById('formSubmitBtn');
    
    const config = loadConfig();
    submitBtn.textContent = `Опубликовать (${formatNumberWithSpaces(config.pricing.postingFee)} ₸)`;
    
    // Invert mapping for posting
    // Tab "Ищу квартиру" (displays have_room) -> User wants to POST "have_room" if they rent/offer flat.
    // Wait, let's keep Category selection clean:
    // User wants to post what is selected in currentCategory tab
    const formCat = document.getElementById('formCategory');
    formCat.value = currentCategory;
    
    const detailsBlock = document.getElementById('haveRoomDetails');
    if (currentCategory === 'have_room') {
        detailsBlock.style.display = 'grid';
        document.getElementById('formBudgetLabel').textContent = 'Стоимость аренды (₸/мес) *';
        document.getElementById('formGenderLabel').textContent = 'Кого вы ищете (Пол сожителя) *';
        document.getElementById('formRoommateLabel').textContent = 'Сколько человек ищете *';
        initFormPhotoPreviews();
    } else {
        detailsBlock.style.display = 'none';
        document.getElementById('formBudgetLabel').textContent = 'Ваш бюджет (₸/мес) *';
        document.getElementById('formGenderLabel').textContent = 'Ваш пол *';
        document.getElementById('formRoommateLabel').textContent = 'С кем хотите жить *';
    }

    if (id) {
        title.textContent = 'Редактировать объявление';
        submitBtn.textContent = 'Сохранить изменения';
        
        const all = db.getListings().concat(db.getUserListings(user.id));
        const item = all.find(x => x.id === id);
        if (item) {
            document.getElementById('formListingId').value = item.id;
            document.getElementById('formCategory').value = item.category;
            
            if (item.category === 'have_room') {
                detailsBlock.style.display = 'grid';
                document.getElementById('formBudgetLabel').textContent = 'Стоимость аренды (₸/мес) *';
                document.getElementById('formGenderLabel').textContent = 'Кого вы ищете (Пол сожителя) *';
                document.getElementById('formRoommateLabel').textContent = 'Сколько человек ищете *';
                
                document.getElementById('formAddress').value = item.address || '';
                document.getElementById('formGisLink').value = item.gisLink || '';
                document.getElementById('formDeposit').value = item.hasDeposit ? 'true' : 'false';
                document.getElementById('formContract').value = item.hasContract ? 'true' : 'false';
                
                formImagesList = [...(item.photos || [])];
                initFormPhotoPreviews();
            } else {
                detailsBlock.style.display = 'none';
                document.getElementById('formBudgetLabel').textContent = 'Ваш бюджет (₸/мес) *';
                document.getElementById('formGenderLabel').textContent = 'Ваш пол *';
                document.getElementById('formRoommateLabel').textContent = 'С кем хотите жить *';
            }
            
            document.getElementById('formBudget').value = formatNumberWithSpaces(item.budget);
            document.getElementById('formAge').value = item.age;
            document.getElementById('formCity').value = item.city;
            document.getElementById('formGender').value = item.gender;
            document.getElementById('formOccupation').value = item.occupation;
            document.getElementById('formWhatsapp').value = item.whatsapp;
            document.getElementById('formRoomCount').value = item.roomCount;
            document.getElementById('formRoommateCount').value = item.roommateCount;
            document.getElementById('formDescription').value = item.description;
            
            selectedFormDistricts = new Set(item.districts);
        }
    } else {
        title.textContent = 'Создать объявление';
        document.getElementById('formListingId').value = '';
        
        const suggestions = db.getAutoFillSuggestions(user.id);
        if (suggestions.gender) document.getElementById('formGender').value = suggestions.gender;
        if (suggestions.occupation) document.getElementById('formOccupation').value = suggestions.occupation;
        if (suggestions.whatsapp) document.getElementById('formWhatsapp').value = suggestions.whatsapp;
    }
    
    validateFormBudgetBounds();
    updateFormDistricts();
    openModal('listingModal');
}

window.updateFormDistricts = function() {
    const cityKey = document.getElementById('formCity').value;
    const container = document.getElementById('formDistrictsContainer');
    const wrapper = document.getElementById('formDistrictsWrapper');
    
    if (!container || !wrapper) return;
    container.innerHTML = '';
    
    const cityInfo = HataConfig.cities[cityKey];
    if (!cityInfo || !cityInfo.hasDistricts) {
        wrapper.style.display = 'none';
        return;
    }
    
    wrapper.style.display = 'block';
    
    if (cityInfo.districts) {
        cityInfo.districts.forEach(district => {
            const pill = document.createElement('div');
            pill.className = 'district-pill';
            if (selectedFormDistricts.has(district)) {
                pill.classList.add('selected');
            }
            pill.textContent = district;
            pill.addEventListener('click', () => {
                if (selectedFormDistricts.has(district)) {
                    selectedFormDistricts.delete(district);
                    pill.classList.remove('selected');
                } else {
                    selectedFormDistricts.add(district);
                    pill.classList.add('selected');
                }
            });
            container.appendChild(pill);
        });
    }
};

function initFormPhotoPreviews() {
    const container = document.getElementById('photoPreviews');
    if (!container) return;
    container.innerHTML = '';
    
    formImagesList.forEach((src, idx) => {
        const box = document.createElement('div');
        box.className = 'img-preview-box';
        box.innerHTML = `
            <img src="${src}" alt="Фото">
            <span class="remove-btn" onclick="removeFormImage(${idx})">&times;</span>
        `;
        container.appendChild(box);
    });
    
    if (formImagesList.length < 6) {
        const addBox = document.createElement('div');
        addBox.className = 'img-preview-box';
        addBox.textContent = '+';
        addBox.addEventListener('click', addFormImageMock);
        container.appendChild(addBox);
    }
}

window.removeFormImage = function(idx) {
    formImagesList.splice(idx, 1);
    initFormPhotoPreviews();
};

function addFormImageMock() {
    const mockImages = [
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=600&h=400&fit=crop"
    ];
    
    const src = mockImages[formImagesList.length % mockImages.length];
    formImagesList.push(src);
    initFormPhotoPreviews();
}

window.handleListingSubmit = function(event) {
    event.preventDefault();
    
    const id = document.getElementById('formListingId').value;
    const category = document.getElementById('formCategory').value;
    
    const budget = parseFormattedNumber(document.getElementById('formBudget').value);
    
    if (budget < 10000 || budget > 1000000) {
        alert("Ошибка: Допустимый бюджет от 10 000 до 1 000 000 тенге.");
        return;
    }
    
    const age = parseInt(document.getElementById('formAge').value);
    if (!age || age < 16 || age > 99) {
        alert("Пожалуйста, введите корректный возраст (от 16 до 99 лет)");
        return;
    }
    
    const city = document.getElementById('formCity').value;
    const gender = document.getElementById('formGender').value;
    const occupation = document.getElementById('formOccupation').value;
    const whatsapp = document.getElementById('formWhatsapp').value;
    const roomCount = document.getElementById('formRoomCount').value === 'any' ? 'any' : parseInt(document.getElementById('formRoomCount').value);
    const roommateCount = document.getElementById('formRoommateCount').value === 'any' ? 'any' : parseInt(document.getElementById('formRoommateCount').value);
    const description = document.getElementById('formDescription').value;
    
    const cityInfo = HataConfig.cities[city];
    let districts = [];
    
    if (cityInfo && cityInfo.hasDistricts) {
        if (selectedFormDistricts.size === 0) {
            alert("Пожалуйста, выберите хотя бы один район/микрорайон!");
            return;
        }
        districts = Array.from(selectedFormDistricts);
    }
    
    const payload = {
        category,
        budget,
        age,
        city,
        districts,
        whatsapp,
        gender,
        occupation,
        roomCount,
        roommateCount,
        description
    };
    
    if (category === 'have_room') {
        if (formImagesList.length < 3) {
            alert("Пожалуйста, загрузите не менее 3 фотографий квартиры.");
            return;
        }
        
        const address = document.getElementById('formAddress').value;
        const gisLink = document.getElementById('formGisLink').value;
        const hasDeposit = document.getElementById('formDeposit').value === 'true';
        const hasContract = document.getElementById('formContract').value === 'true';
        
        if (!address || !gisLink) {
            alert("Поля адреса и 2GIS ссылки обязательны для заполнения!");
            return;
        }
        
        payload.address = address;
        payload.gisLink = gisLink;
        payload.photos = formImagesList;
        payload.hasDeposit = hasDeposit;
        payload.hasContract = hasContract;
    } else {
        payload.address = "";
        payload.gisLink = "";
        payload.photos = [];
        payload.hasDeposit = false;
        payload.hasContract = false;
    }
    
    try {
        if (id) {
            db.updateListing(id, payload);
        } else {
            db.addListing(payload);
        }
        closeModal('listingModal');
    } catch (e) {
        alert(e.message);
    }
};

window.editListing = function(id) {
    openListingForm(id);
};

// --- PROMOTION BOOST MODAL ---
window.openPromoModal = function(id) {
    activePromoListingId = id;
    selectPromoOption('opt3Days', 3);
    
    const config = loadConfig();
    document.getElementById('priceLabel3Days').textContent = `${formatNumberWithSpaces(config.pricing.promo3Days)} ₸`;
    document.getElementById('priceLabelWeek').textContent = `${formatNumberWithSpaces(config.pricing.promoWeek)} ₸`;
    document.getElementById('priceLabelMonth').textContent = `${formatNumberWithSpaces(config.pricing.promoMonth)} ₸`;
    
    openModal('promoModal');
};

window.selectPromoOption = function(optId, days) {
    activePromoDays = days;
    document.querySelectorAll('.promo-option').forEach(el => el.classList.remove('selected'));
    document.getElementById(optId).classList.add('selected');
    
    const config = loadConfig();
    let price = config.pricing.promo3Days;
    if (days === 7) price = config.pricing.promoWeek;
    else if (days === 30) price = config.pricing.promoMonth;
    
    document.getElementById('paySumLabel').textContent = `${formatNumberWithSpaces(price)} ₸`;
};

window.processMockPayment = function() {
    if (!activePromoListingId) return;
    try {
        db.boostListing(activePromoListingId, activePromoDays);
        closeModal('promoModal');
        alert(`Оплата прошла успешно! Ваше объявление поднято в ТОП на ${activePromoDays} дней.`);
    } catch (e) {
        alert(e.message);
    }
};

// --- ADMIN DASHBOARD ---
function initAdmin() {
    const adminPanelBtn = document.getElementById('adminPanelBtn');
    if (adminPanelBtn) {
        adminPanelBtn.addEventListener('click', () => {
            const user = db.getCurrentUser();
            if (!user || !user.isAdmin) {
                alert("Доступ ограничен. Войдите под аккаунтом Администратора.");
                openModal('loginModal');
                return;
            }
            updateAdminInputs();
            renderAdminModerationList();
            openModal('adminModal');
        });
    }

    // Attach masks for admin pricing inputs
    attachNumberFormatting(document.getElementById('adminPostingFee'));
    attachNumberFormatting(document.getElementById('adminPromo3Days'));
    attachNumberFormatting(document.getElementById('adminPromoWeek'));
    attachNumberFormatting(document.getElementById('adminPromoMonth'));
}

function updateAdminInputs() {
    const config = loadConfig();
    document.getElementById('adminPostingFee').value = formatNumberWithSpaces(config.pricing.postingFee);
    document.getElementById('adminPromo3Days').value = formatNumberWithSpaces(config.pricing.promo3Days);
    document.getElementById('adminPromoWeek').value = formatNumberWithSpaces(config.pricing.promoWeek);
    document.getElementById('adminPromoMonth').value = formatNumberWithSpaces(config.pricing.promoMonth);
    
    document.getElementById('adminSupabaseUrl').value = config.supabaseUrl || '';
    document.getElementById('adminSupabaseAnonKey').value = config.supabaseAnonKey || '';
    
    const redirectInput = document.getElementById('adminSupabaseRedirectUrl');
    if (redirectInput) {
        redirectInput.value = config.supabaseRedirectUrl || '';
    }
}

window.saveAdminSettings = function() {
    const postingFee = parseFormattedNumber(document.getElementById('adminPostingFee').value) || 0;
    const promo3Days = parseFormattedNumber(document.getElementById('adminPromo3Days').value) || 0;
    const promoWeek = parseFormattedNumber(document.getElementById('adminPromoWeek').value) || 0;
    const promoMonth = parseFormattedNumber(document.getElementById('adminPromoMonth').value) || 0;
    
    const supabaseUrl = document.getElementById('adminSupabaseUrl').value.trim();
    const supabaseAnonKey = document.getElementById('adminSupabaseAnonKey').value.trim();
    
    const redirectInput = document.getElementById('adminSupabaseRedirectUrl');
    const supabaseRedirectUrl = redirectInput ? redirectInput.value.trim() : '';

    const config = loadConfig();
    config.pricing = {
        postingFee,
        promo3Days,
        promoWeek,
        promoMonth
    };
    config.supabaseUrl = supabaseUrl;
    config.supabaseAnonKey = supabaseAnonKey;
    config.supabaseRedirectUrl = supabaseRedirectUrl;
    
    saveConfig(config);
    
    // Re-initialize Supabase client dynamically if credentials were modified
    db.initSupabase();
    
    alert("Настройки сохранены! Если вы указали реальные данные Supabase, подключение обновится.");
};

function renderAdminModerationList() {
    const container = document.getElementById('adminModerationList');
    if (!container) return;
    
    const all = JSON.parse(localStorage.getItem('hata_listings') || '[]');
    
    if (all.length === 0) {
        container.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:1rem; color:var(--text-muted);">Объявлений пока нет.</td></tr>`;
        return;
    }
    
    container.innerHTML = all.map(item => {
        const catLabel = item.category === 'have_room' ? 'Ищу сожителя (Сдам)' : 'Ищу комнату (Сниму)';
        const districtsStr = item.districts && item.districts.length > 0 
            ? item.districts.slice(0, 2).join(', ') + (item.districts.length > 2 ? '...' : '') 
            : 'Все районы';
        return `
            <tr style="border-bottom:1px solid var(--border-color); color:var(--text-secondary);">
                <td style="padding: 0.75rem;">${catLabel}</td>
                <td style="padding: 0.75rem;">${item.ownerName}</td>
                <td style="padding: 0.75rem;" title="${item.districts.join(', ')}">${districtsStr}</td>
                <td style="padding: 0.75rem; font-weight:700;">${formatNumberWithSpaces(item.budget)} ₸</td>
                <td style="padding: 0.75rem; text-align:center;">
                    <button class="btn btn-danger" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="deleteListing('${item.id}')">Удалить</button>
                </td>
            </tr>
        `;
    }).join('');
}

// --- DYNAMIC VIEWPORT ROUTING / TABS NAVIGATION ---
let currentActiveTab = 'feed';

window.switchTab = function(tabId) {
    const user = db.getCurrentUser();
    
    // Security check for admin page
    if (tabId === 'admin') {
        if (!user || !user.isAdmin) {
            alert("Доступ запрещен. Эта страница доступна только администраторам.");
            window.switchTab('feed');
            return;
        }
    }

    // "Создать пост" trigger behavior
    if (tabId === 'create') {
        if (!user) {
            openModal('loginModal');
        } else {
            openModal('listingModal');
        }
        return;
    }

    currentActiveTab = tabId;

    // Hide all page sections
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });

    // Show active page section
    const activeSection = document.getElementById(tabId + 'Page');
    if (activeSection) {
        activeSection.classList.add('active');
        activeSection.style.display = 'block';
    }

    // Update active nav items in sidebar
    document.querySelectorAll('.sidebar-nav .menu-item').forEach(item => {
        if (item.getAttribute('data-tab') === tabId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update active nav items in mobile bottom nav
    document.querySelectorAll('.mobile-nav-bar .mobile-nav-item').forEach(item => {
        if (item.getAttribute('data-tab') === tabId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Render page content
    if (tabId === 'feed') {
        renderListings();
    } else if (tabId === 'favorites') {
        renderFavorites();
    } else if (tabId === 'profile') {
        renderUserProfile();
    } else if (tabId === 'admin') {
        renderAdminModerationList();
    }

    lucide.createIcons();
};

function initNavigation() {
    // Desktop sidebar click listeners
    document.querySelectorAll('.sidebar-nav .menu-item[data-tab]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.getAttribute('data-tab');
            window.switchTab(tab);
        });
    });

    // Mobile bottom nav click listeners
    document.querySelectorAll('.mobile-nav-bar .mobile-nav-item[data-tab]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.getAttribute('data-tab');
            window.switchTab(tab);
        });
    });

    // Sidebar create trigger
    const sidebarCreateBtn = document.getElementById('sidebarCreateBtn');
    if (sidebarCreateBtn) {
        sidebarCreateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.switchTab('create');
        });
    }

    // Mobile create trigger
    const mobileCreateBtn = document.getElementById('mobileCreateBtn');
    if (mobileCreateBtn) {
        mobileCreateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.switchTab('create');
        });
    }

    // Cabinet create triggers
    const createListingBtnProfile = document.getElementById('createListingBtnProfile');
    if (createListingBtnProfile) {
        createListingBtnProfile.addEventListener('click', () => {
            window.switchTab('create');
        });
    }
}

// --- FAVORITES CONTROLLER LOGIC ---
window.toggleFavoriteListing = function(event, listingId) {
    event.stopPropagation();
    event.preventDefault();
    
    const user = db.getCurrentUser();
    if (!user) {
        openModal('loginModal');
        return;
    }
    
    const isFav = db.toggleFavorite(user.id, listingId);
    const btn = event.currentTarget;
    if (btn) {
        if (isFav) {
            btn.classList.add('active');
            btn.style.transform = 'scale(1.25)';
            setTimeout(() => { btn.style.transform = ''; }, 200);
        } else {
            btn.classList.remove('active');
        }
    }
    
    // Refresh feeds
    if (currentActiveTab === 'feed') renderListings();
    else if (currentActiveTab === 'favorites') renderFavorites();
};

function renderFavorites() {
    const grid = document.getElementById('favoritesGrid');
    const countSpan = document.getElementById('favoritesCount');
    if (!grid) return;
    
    const user = db.getCurrentUser();
    if (!user) {
        grid.innerHTML = `
            <div class="empty-feed form-full">
                <div class="empty-icon"><i data-lucide="lock" style="width:48px; height:48px;"></i></div>
                <div class="empty-title">Вход не выполнен</div>
                <p>Войдите через Google, чтобы получить доступ к вашему списку избранного.</p>
                <button class="btn btn-primary" onclick="openModal('loginModal')" style="margin: 1.5rem auto 0; display: block;">Войти в аккаунт</button>
            </div>
        `;
        if (countSpan) countSpan.textContent = "0";
        lucide.createIcons();
        return;
    }
    
    const favIds = db.getFavorites(user.id);
    if (countSpan) countSpan.textContent = favIds.length;
    
    if (favIds.length === 0) {
        grid.innerHTML = `
            <div class="empty-feed form-full">
                <div class="empty-icon"><i data-lucide="heart" style="width:48px; height:48px;"></i></div>
                <div class="empty-title">В избранном пусто</div>
                <p>Нажмите на сердечко на карточках в ленте, чтобы добавить объявления сюда.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    const activeListings = db.getListings();
    const filtered = activeListings.filter(item => favIds.includes(item.id));
    
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-feed form-full">
                <div class="empty-icon"><i data-lucide="heart" style="width:48px; height:48px;"></i></div>
                <div class="empty-title">В избранном пусто</div>
                <p>Все ранее добавленные объявления были перемещены в архив.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    const now = new Date().getTime();
    grid.innerHTML = filtered.map(item => {
        const isBoosted = item.boostExpiredAt && new Date(item.boostExpiredAt).getTime() > now;
        const formattedDate = formatListingDate(item.createdAt);
        
        const heartButton = `
            <button class="favorite-btn active" onclick="toggleFavoriteListing(event, '${item.id}')" title="Убрать из избранного">
                <i data-lucide="heart"></i>
            </button>
        `;

        let carouselHTML = '';
        if (item.photos && item.photos.length > 0) {
            carouselHTML = `
                <div class="card-gallery">
                    ${heartButton}
                    <img class="card-img" src="${item.photos[0]}" alt="Квартира">
                    <div class="gallery-nav">
                        ${item.photos.map((_, i) => `<span class="gallery-dot ${i === 0 ? 'active' : ''}"></span>`).join('')}
                    </div>
                </div>
            `;
        } else {
            carouselHTML = `
                <div class="card-gallery">
                    ${heartButton}
                    <div class="no-photo">
                        <i data-lucide="camera" class="no-photo-icon"></i>
                        <span>Без фотографий</span>
                    </div>
                </div>
            `;
        }
        
        let tagOccupation = '';
        if (item.occupation === 'student') tagOccupation = 'Учеба';
        else if (item.occupation === 'student_work') tagOccupation = 'Учеба + Работа';
        else if (item.occupation === 'work') tagOccupation = 'Работает';
        else tagOccupation = 'Не занят';

        const genderLabel = item.gender === 'male' ? 'Парень' : 'Девушка';
        
        const distStr = item.districts && item.districts.length > 0
            ? `<span class="card-tag accent"><i data-lucide="map-pin" style="width:10px; height:10px; margin-right:2px; vertical-align:middle;"></i>${item.districts.join(', ')}</span>`
            : '';

        const mapButton = (item.gisLink && item.category === 'have_room') 
            ? `<a href="${item.gisLink}" target="_blank" class="btn btn-secondary"><i data-lucide="map"></i><span>В 2GIS</span></a>`
            : '';
            
        const cleanPhone = item.whatsapp.startsWith('8') ? '7' + item.whatsapp.substring(1) : item.whatsapp;
        const waLink = `https://wa.me/7${cleanPhone.replace(/^7/, '')}?text=Привет!%20Я%20насчет%20объявления%20на%20Hata.kz`;

        return `
            <div class="hata-card ${isBoosted ? 'promoted' : ''}">
                ${isBoosted ? `<span class="promoted-tag">В ТОПЕ</span>` : ''}
                ${carouselHTML}
                <div class="card-body">
                    <div class="card-top">
                        <img class="owner-img" src="${item.ownerAvatar}" alt="">
                        <div class="owner-meta">
                            <span class="owner-name">${item.ownerName}</span>
                            <span class="listing-date">${formattedDate}</span>
                        </div>
                    </div>
                    
                    <div class="card-title">${formatNumberWithSpaces(item.budget)} ₸ <span>/ мес</span></div>
                    
                    <div class="card-tags">
                        <span class="card-tag accent">${genderLabel}, ${item.age} лет</span>
                        <span class="card-tag">${tagOccupation}</span>
                        <span class="card-tag">${item.roomCount} комн.</span>
                        ${item.hasDeposit ? '<span class="card-tag accent">Депозит</span>' : ''}
                        ${item.hasContract ? '<span class="card-tag">Договор</span>' : ''}
                        ${distStr}
                    </div>
                    
                    <p class="card-desc">${item.description}</p>
                    
                    <div class="card-footer">
                        <a href="${waLink}" target="_blank" class="btn btn-primary" style="background:#25d366; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.25);">
                            <i data-lucide="message-square"></i>
                            <span>WhatsApp</span>
                        </a>
                        ${mapButton}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    lucide.createIcons();
}

// --- MOBILE ACCESS TUNNEL GUIDE ---
function printMobileAccessGuide() {
    console.log("%c📱 HATA.KZ: ИНСТРУКЦИЯ ДЛЯ ТЕСТИРОВАНИЯ С ТЕЛЕФОНА", "color:#7e52ff; font-weight:bold; font-size:14px;");
    console.log("Вы можете протестировать этот адаптивный интерфейс на мобильном с помощью одного из способов:");
    console.log("%c1. Локальная Wi-Fi сеть:", "color:#b8ff00; font-weight:bold;");
    console.log("   Узнайте свой локальный IP компьютера (команда ipconfig в терминале, например 192.168.1.55).");
    console.log("   Запустите локальный http-сервер в этой папке (например: npx http-server ./ -p 8080).");
    console.log("   Откройте на мобильном телефоне в браузере: http://192.168.1.55:8080");
    console.log("%c2. Временный туннель (свободный доступ из интернета):", "color:#b8ff00; font-weight:bold;");
    console.log("   Запустите сервер: npx http-server ./ -p 8080");
    console.log("   В другом окне запустите туннель: npx localtunnel --port 8080");
    console.log("   Или через ngrok: ngrok http 8080");
}
