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
    if (el) {
        el.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
};

window.closeModal = function(id) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.remove('open');
        const anyOpen = document.querySelectorAll('.modal-overlay.open').length > 0;
        if (!anyOpen) {
            document.body.style.overflow = '';
        }
    }
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
        } else {
            filterCity.value = 'almaty';
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
        } else {
            formCity.value = 'almaty';
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

function updateFilterLabels(cat) {
    const filterGenderLabel = document.getElementById('filterGenderLabel');
    const filterRoomsLabel = document.getElementById('filterRoomsLabel');
    const filterDepositLabel = document.getElementById('filterDepositLabel');
    
    const stayTermGroup = document.getElementById('filterStayTermGroup');
    const totalResidentsGroup = document.getElementById('filterTotalResidentsGroup');
    const roommateCountGroup = document.getElementById('filterRoommateCountGroup');
    const filterHasPhotosGroup = document.getElementById('filterHasPhotosGroup');
    
    if (cat === 'have_room') {
        if (filterGenderLabel) filterGenderLabel.textContent = 'Пол сожителя';
        if (filterRoomsLabel) filterRoomsLabel.textContent = 'Комнат в квартире';
        if (filterDepositLabel) filterDepositLabel.textContent = 'Депозит';
        
        if (stayTermGroup) stayTermGroup.style.display = 'none';
        if (totalResidentsGroup) totalResidentsGroup.style.display = 'flex';
        if (roommateCountGroup) roommateCountGroup.style.display = 'flex';
        if (filterHasPhotosGroup) filterHasPhotosGroup.style.display = 'none';
    } else {
        if (filterGenderLabel) filterGenderLabel.textContent = 'Пол соискателя';
        if (filterRoomsLabel) filterRoomsLabel.textContent = 'Нужно комнат';
        if (filterDepositLabel) filterDepositLabel.textContent = 'Готовность к депозиту';
        
        if (stayTermGroup) stayTermGroup.style.display = 'flex';
        if (totalResidentsGroup) totalResidentsGroup.style.display = 'none';
        if (roommateCountGroup) roommateCountGroup.style.display = 'none';
        if (filterHasPhotosGroup) filterHasPhotosGroup.style.display = 'flex';
    }
}

function switchCategoryTab(cat) {
    currentCategory = cat;
    document.getElementById('tabNeedRoom').classList.toggle('active', cat === 'have_room');
    document.getElementById('tabHaveRoom').classList.toggle('active', cat === 'need_room');
    
    updateFilterLabels(cat);
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
    
    const filterDeposit = document.getElementById('filterDeposit');
    if (filterDeposit) filterDeposit.addEventListener('change', () => { if (!filterHasErrors) renderListings(); });
    
    const filterStayTerm = document.getElementById('filterStayTerm');
    if (filterStayTerm) filterStayTerm.addEventListener('change', () => { if (!filterHasErrors) renderListings(); });
    
    const filterTotalResidents = document.getElementById('filterTotalResidents');
    if (filterTotalResidents) filterTotalResidents.addEventListener('change', () => { if (!filterHasErrors) renderListings(); });
    
    const filterRoommateCount = document.getElementById('filterRoommateCount');
    if (filterRoommateCount) filterRoommateCount.addEventListener('change', () => { if (!filterHasErrors) renderListings(); });

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
    let cityKey = document.getElementById('filterCity').value;
    if (!cityKey) cityKey = 'almaty';
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
    
    const depositFilter = document.getElementById('filterDeposit').value;
    const stayTermFilter = document.getElementById('filterStayTerm').value;
    const totalResidentsFilter = document.getElementById('filterTotalResidents').value;
    const roommateCountFilter = document.getElementById('filterRoommateCount').value;
    const hasPhotosFilterEl = document.getElementById('filterHasPhotos');
    const hasPhotosFilter = hasPhotosFilterEl ? hasPhotosFilterEl.value : 'any';
    
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
        const itemMin = item.budgetMin || item.budget || 0;
        const itemMax = item.budgetMax || item.budget || 0;
        if (itemMax < budgetMinVal || itemMin > budgetMaxVal) return false;
        
        if (genderFilter !== 'any' && item.gender !== genderFilter) return false;
        
        if (roomFilter !== 'any') {
            if (roomFilter === '4plus') {
                if (item.roomCount < 4) return false;
            } else {
                if (item.roomCount !== parseInt(roomFilter)) return false;
            }
        }
        
        // Asymmetric Filters
        if (depositFilter !== 'any') {
            const match = item.hasDeposit === (depositFilter === 'true');
            if (!match) return false;
        }
        
        if (hasPhotosFilter !== 'any') {
            const hasPhotos = item.photos && item.photos.length > 0;
            if (hasPhotosFilter === 'true' && !hasPhotos) return false;
            if (hasPhotosFilter === 'false' && hasPhotos) return false;
        }

        if (currentCategory === 'need_room') {
            if (stayTermFilter !== 'any' && item.stayTerm !== stayTermFilter) return false;
        } else {
            if (totalResidentsFilter !== 'any' && item.totalResidents !== totalResidentsFilter) return false;
            if (roommateCountFilter !== 'any') {
                if (roommateCountFilter === '4plus') {
                    if (item.roommateCount < 4) return false;
                } else {
                    if (item.roommateCount !== parseInt(roommateCountFilter)) return false;
                }
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

        let genderLabel = '';
        if (item.gender === 'male') genderLabel = 'Парень';
        else if (item.gender === 'female') genderLabel = 'Девушка';
        else genderLabel = 'Любой пол';
        
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
                    
                    <div class="card-title">
                        ${(item.budgetMin && item.budgetMax && item.budgetMin !== item.budgetMax) ? 
                          `от ${formatNumberWithSpaces(item.budgetMin)} до ${formatNumberWithSpaces(item.budgetMax)} ₸` : 
                          `${formatNumberWithSpaces(item.budgetMax || item.budget || 0)} ₸`} 
                        <span>/ мес</span>
                    </div>
                    
                    <div class="card-tags">
                        ${item.category === 'have_room'
                            ? `<span class="card-tag accent">Ищу сожителя, ${item.ageMin}-${item.ageMax} лет</span><span class="card-tag">Пол: ${genderLabel}</span>`
                            : `<span class="card-tag accent">${genderLabel}, ${item.age} лет</span>`
                        }
                        <span class="card-tag">${tagOccupation}</span>
                        <span class="card-tag">${item.roomCount === 'any' ? 'Любая комн.' : item.roomCount + ' комн.'}</span>
                        ${item.hasDeposit ? `<span class="card-tag accent">${item.category === 'need_room' ? 'Готов к депозиту' : 'Депозит'}</span>` : ''}
                        ${item.category === 'have_room' && item.totalResidents ? `<span class="card-tag">Жильцов: ${item.totalResidents}</span>` : ''}
                        ${item.category === 'have_room' && item.roommateCount ? `<span class="card-tag">Ищут: ${item.roommateCount}</span>` : ''}
                        ${item.category === 'need_room' && item.stayTerm ? `<span class="card-tag">Срок: ${getStayTermLabel(item.stayTerm)}</span>` : ''}
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
        
        const catLabel = item.category === 'have_room' ? 'Сдаю комнату / подселение' : 'Ищу сожителя / комнату';
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
                    <div class="item-title">${catLabel} - ${(item.budgetMin && item.budgetMax && item.budgetMin !== item.budgetMax) ? `от ${formatNumberWithSpaces(item.budgetMin)} до ${formatNumberWithSpaces(item.budgetMax)}` : `${formatNumberWithSpaces(item.budgetMax || item.budget)}`} ₸</div>
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

window.archiveListing = async function(id) {
    if (confirm("Вы уверены, что хотите убрать объявление в архив?")) {
        try {
            await db.archiveListing(id);
        } catch (e) {
            alert(e.message);
        }
    }
};

window.reactivateListing = async function(id) {
    try {
        await db.reactivateListing(id);
    } catch (e) {
        alert(e.message);
    }
};

window.deleteListing = async function(id) {
    if (confirm("Удалить объявление навсегда? Это действие необратимо.")) {
        try {
            await db.deleteListing(id);
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
    
    // Setup formatting and validations on creation form budget (Min & Max)
    const formBudgetMin = document.getElementById('formBudgetMin');
    const formBudgetMax = document.getElementById('formBudgetMax');
    if (formBudgetMin) attachNumberFormatting(formBudgetMin, validateFormBudgetBounds);
    if (formBudgetMax) attachNumberFormatting(formBudgetMax, validateFormBudgetBounds);
    
    // Populate formAge dropdowns (16 to 50 years)
    const formAge = document.getElementById('formAge');
    const formAgeMin = document.getElementById('formAgeMin');
    const formAgeMax = document.getElementById('formAgeMax');
    [formAge, formAgeMin, formAgeMax].forEach(select => {
        if (select) {
            select.innerHTML = '';
            for (let i = 16; i <= 50; i++) {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = `${i} ${getRussianAgeSuffix(i)}`;
                select.appendChild(opt);
            }
        }
    });

    // Setup mask on phone (WhatsApp) - 11 digits starting with 77
    const formWhatsapp = document.getElementById('formWhatsapp');
    if (formWhatsapp) {
        formWhatsapp.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 11);
        });
    }

    // Setup file upload listener
    const formPhotoUploadInput = document.getElementById('formPhotoUploadInput');
    if (formPhotoUploadInput) {
        formPhotoUploadInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;
            
            const formCatEl = document.getElementById('formCategory');
            const formCat = formCatEl ? formCatEl.value : 'have_room';
            const maxPhotos = formCat === 'have_room' ? 6 : 3;
            const remaining = maxPhotos - formImagesList.length;
            
            if (files.length > remaining) {
                alert(`Вы можете выбрать еще максимум ${remaining} фото.`);
                e.target.value = '';
                return;
            }
            
            const submitBtn = document.getElementById('formSubmitBtn');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Загрузка фото...';
            
            for (const file of files) {
                try {
                    const url = await uploadPhoto(file);
                    formImagesList.push(url);
                } catch (err) {
                    alert(`Ошибка при загрузке "${file.name}": ` + err.message);
                }
            }
            
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            e.target.value = '';
            initFormPhotoPreviews();
        });
    }

    setupAutofillPopup(formWhatsapp, document.getElementById('whatsappSuggestion'), 'whatsapp');
    setupAutofillPopup(document.getElementById('formAddress'), document.getElementById('addressSuggestion'), 'address');
}

async function uploadPhoto(file) {
    if (db.supabaseClient) {
        try {
            const user = db.getCurrentUser();
            const userId = user ? user.id : 'anonymous';
            const fileExt = file.name.split('.').pop() || 'jpg';
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
            const filePath = `${userId}/${fileName}`;
            
            const { data, error } = await db.supabaseClient.storage
                .from('listing-photos')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });
                
            if (error) throw error;
            
            const { data: publicUrlData } = db.supabaseClient.storage
                .from('listing-photos')
                .getPublicUrl(filePath);
                
            return publicUrlData.publicUrl;
        } catch (e) {
            console.warn("Supabase Storage Upload failed, falling back to base64:", e.message);
        }
    }
    // Local fallback (Base64 data URI)
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}

function getRussianAgeSuffix(age) {
    const lastDigit = age % 10;
    const lastTwoDigits = age % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'лет';
    if (lastDigit === 1) return 'год';
    if (lastDigit >= 2 && lastDigit <= 4) return 'года';
    return 'лет';
}

function getStayTermLabel(term) {
    if (term === '1') return '1 мес';
    if (term === '2') return '2 мес';
    if (term === '3') return '3-6 мес';
    if (term === '6') return '6-12 мес';
    if (term === '12') return '12+ мес';
    if (term === 'always') return 'Всегда';
    return 'Не важно';
}

function setupAutofillPopup(inputEl, suggestionContainerEl, key, formatFn = null) {
    if (!inputEl || !suggestionContainerEl) return;
    
    const showSuggestion = () => {
        const user = db.getCurrentUser();
        if (!user) return;
        const suggestions = db.getAutoFillSuggestions(user.id);
        const val = suggestions[key];
        
        if (val && !inputEl.value) {
            suggestionContainerEl.innerHTML = `<div class="autofill-item">Использовать прошлый: <strong>${formatFn ? formatFn(val) : val}</strong></div>`;
            suggestionContainerEl.style.display = 'block';
            
            const item = suggestionContainerEl.querySelector('.autofill-item');
            if (item) {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    inputEl.value = val;
                    if (key === 'whatsapp') {
                        inputEl.value = formatNumberWithSpaces(val);
                    }
                    suggestionContainerEl.style.display = 'none';
                    if (inputEl.id === 'formBudget') {
                        validateFormBudgetBounds();
                    }
                });
            }
        } else {
            suggestionContainerEl.style.display = 'none';
        }
    };
    
    inputEl.addEventListener('focus', showSuggestion);
    
    inputEl.addEventListener('input', () => {
        suggestionContainerEl.style.display = 'none';
    });
    
    document.addEventListener('click', (e) => {
        if (e.target !== inputEl && !suggestionContainerEl.contains(e.target)) {
            suggestionContainerEl.style.display = 'none';
        }
    });
}

function validateFormBudgetBounds() {
    const budgetMinEl = document.getElementById('formBudgetMin');
    const budgetMaxEl = document.getElementById('formBudgetMax');
    const minVal = budgetMinEl ? parseFormattedNumber(budgetMinEl.value) : 0;
    const maxVal = budgetMaxEl ? parseFormattedNumber(budgetMaxEl.value) : 0;
    const submitBtn = document.getElementById('formSubmitBtn');
    
    let isMinInvalid = budgetMinEl && budgetMinEl.value && (minVal < 10000 || minVal > 1000000);
    let isMaxInvalid = budgetMaxEl && budgetMaxEl.value && (maxVal < 10000 || maxVal > 1000000);
    let isRelationInvalid = budgetMinEl && budgetMinEl.value && budgetMaxEl && budgetMaxEl.value && (minVal > maxVal);
    
    if (budgetMinEl) {
        if (isMinInvalid || isRelationInvalid) budgetMinEl.classList.add('is-invalid');
        else budgetMinEl.classList.remove('is-invalid');
    }
    if (budgetMaxEl) {
        if (isMaxInvalid || isRelationInvalid) budgetMaxEl.classList.add('is-invalid');
        else budgetMaxEl.classList.remove('is-invalid');
    }
    
    if (submitBtn) {
        submitBtn.disabled = (isMinInvalid || isMaxInvalid || isRelationInvalid);
    }
}

window.toggleFormCategory = function(category) {
    document.getElementById('formCategory').value = category;
    
    const detailsBlock = document.getElementById('haveRoomDetails');
    const stayTermBlock = document.getElementById('formStayTermGroup');
    const residentsCountBlock = document.getElementById('formResidentsCountGroup');
    const genderAnyOpt = document.getElementById('formGenderAnyOption');
    const genderSelect = document.getElementById('formGender');
    
    const formAgeSingleGroup = document.getElementById('formAgeSingleGroup');
    const formAgeRangeGroup = document.getElementById('formAgeRangeGroup');
    
    const formPhotosLabel = document.getElementById('formPhotosLabel');
    const formPhotosSubtitle = document.getElementById('formPhotosSubtitle');
    
    if (category === 'have_room') {
        if (detailsBlock) detailsBlock.style.display = 'grid';
        if (stayTermBlock) stayTermBlock.style.display = 'none';
        if (residentsCountBlock) residentsCountBlock.style.display = 'none';
        if (genderAnyOpt) genderAnyOpt.style.display = 'block';
        
        if (formAgeSingleGroup) formAgeSingleGroup.style.display = 'none';
        if (formAgeRangeGroup) formAgeRangeGroup.style.display = 'grid';
        
        document.getElementById('formBudgetLabel').textContent = 'Стоимость аренды (₸/мес)';
        document.getElementById('formGenderLabel').textContent = 'Кого вы ищете (Пол сожителя)';
        document.getElementById('formRoommateLabel').textContent = 'Сколько человек ищете';
        document.getElementById('formRoomCountLabel').textContent = 'Комнат в квартире';
        document.getElementById('formDepositLabel').textContent = 'Депозит';
        
        if (formPhotosLabel) formPhotosLabel.textContent = 'Фотографии квартиры (минимум 3, максимум 6)';
        if (formPhotosSubtitle) formPhotosSubtitle.textContent = 'Нажмите на плюс, чтобы выбрать фото квартиры.';
    } else {
        if (detailsBlock) detailsBlock.style.display = 'none';
        if (stayTermBlock) stayTermBlock.style.display = 'block';
        if (residentsCountBlock) residentsCountBlock.style.display = 'block';
        if (genderAnyOpt) {
            genderAnyOpt.style.display = 'none';
            if (genderSelect.value === 'any') {
                genderSelect.value = 'male';
            }
        }
        
        if (formAgeSingleGroup) formAgeSingleGroup.style.display = 'block';
        if (formAgeRangeGroup) formAgeRangeGroup.style.display = 'none';
        
        document.getElementById('formBudgetLabel').textContent = 'Ваш бюджет (₸/мес)';
        document.getElementById('formGenderLabel').textContent = 'Ваш пол';
        document.getElementById('formRoommateLabel').textContent = 'С кем хотите жить';
        document.getElementById('formRoomCountLabel').textContent = 'Сколько комнат нужно';
        document.getElementById('formDepositLabel').textContent = 'Готовность внести депозит';
        
        if (formPhotosLabel) formPhotosLabel.textContent = 'Ваши фотографии / селфи (необязательно, максимум 3)';
        if (formPhotosSubtitle) formPhotosSubtitle.textContent = 'Загрузите свое фото, чтобы арендодатели могли видеть сожителя.';
    }
    
    initFormPhotoPreviews();
};

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
    
    // Explicitly set default city key to fix districts loading bug
    document.getElementById('formCity').value = 'almaty';
    
    const title = document.getElementById('listingModalTitle');
    const submitBtn = document.getElementById('formSubmitBtn');
    
    const config = loadConfig();
    submitBtn.textContent = `Опубликовать (${formatNumberWithSpaces(config.pricing.postingFee)} ₸)`;
    
    const catSelect = document.getElementById('formCategorySelect');
    if (catSelect) {
        catSelect.value = currentCategory;
    }
    toggleFormCategory(currentCategory);

    if (id) {
        title.textContent = 'Редактировать объявление';
        submitBtn.textContent = 'Сохранить изменения';
        
        const all = db.getListings().concat(db.getUserListings(user.id));
        const item = all.find(x => x.id === id);
        if (item) {
            document.getElementById('formListingId').value = item.id;
            if (catSelect) {
                catSelect.value = item.category;
            }
            toggleFormCategory(item.category);
            
            formImagesList = [...(item.photos || [])];
            initFormPhotoPreviews();

            if (item.category === 'have_room') {
                document.getElementById('formAddress').value = item.address || '';
                document.getElementById('formGisLink').value = item.gisLink || '';
                document.getElementById('formTotalResidents').value = item.totalResidents || '1';
                document.getElementById('formContract').value = item.hasContract ? 'true' : 'false';
                
                document.getElementById('formAgeMin').value = item.ageMin || item.age || '18';
                document.getElementById('formAgeMax').value = item.ageMax || item.age || '25';
            } else {
                document.getElementById('formStayTerm').value = item.stayTerm || 'any';
                document.getElementById('formResidentsCount').value = item.residentsCount || '1';
            }
            
            document.getElementById('formBudgetMin').value = formatNumberWithSpaces(item.budgetMin || item.budget || 0);
            document.getElementById('formBudgetMax').value = formatNumberWithSpaces(item.budgetMax || item.budget || 0);
            document.getElementById('formAge').value = item.age || '20';
            document.getElementById('formCity').value = item.city;
            document.getElementById('formGender').value = item.gender;
            document.getElementById('formGenderPref').value = item.genderPref || 'any';
            document.getElementById('formOccupation').value = item.occupation;
            document.getElementById('formWhatsapp').value = item.whatsapp;
            document.getElementById('formRoomCount').value = item.roomCount;
            document.getElementById('formRoommateCount').value = item.roommateCount;
            document.getElementById('formDeposit').value = item.hasDeposit ? 'true' : 'false';
            document.getElementById('formDescription').value = item.description || '';
            
            selectedFormDistricts = new Set(item.districts);
        }
    } else {
        title.textContent = 'Создать объявление';
        document.getElementById('formListingId').value = '';
        document.getElementById('formBudgetMin').value = '';
        document.getElementById('formBudgetMax').value = '';
        document.getElementById('formAge').value = '20';
        document.getElementById('formAgeMin').value = '18';
        document.getElementById('formAgeMax').value = '25';
        document.getElementById('formGenderPref').value = 'any';
        document.getElementById('formResidentsCount').value = '1';
        document.getElementById('formDescription').value = '';
        
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
    let cityKey = document.getElementById('formCity').value;
    if (!cityKey) cityKey = 'almaty';
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
    
    // 1. Add "Любой / Не важно" pill
    const anyPill = document.createElement('div');
    anyPill.className = 'district-pill';
    if (selectedFormDistricts.has('Любой / Не важно') || selectedFormDistricts.size === 0) {
        anyPill.classList.add('selected');
        selectedFormDistricts.add('Любой / Не важно');
    }
    anyPill.textContent = 'Любой / Не важно';
    anyPill.addEventListener('click', () => {
        selectedFormDistricts.clear();
        selectedFormDistricts.add('Любой / Не важно');
        updateFormDistricts();
    });
    container.appendChild(anyPill);

    // 2. Add other districts
    if (cityInfo.districts) {
        cityInfo.districts.forEach(district => {
            const pill = document.createElement('div');
            pill.className = 'district-pill';
            if (selectedFormDistricts.has(district) && !selectedFormDistricts.has('Любой / Не важно')) {
                pill.classList.add('selected');
            }
            pill.textContent = district;
            pill.addEventListener('click', () => {
                if (selectedFormDistricts.has('Любой / Не важно')) {
                    selectedFormDistricts.delete('Любой / Не важно');
                }
                if (selectedFormDistricts.has(district)) {
                    selectedFormDistricts.delete(district);
                } else {
                    selectedFormDistricts.add(district);
                }
                if (selectedFormDistricts.size === 0) {
                    selectedFormDistricts.add('Любой / Не важно');
                }
                updateFormDistricts();
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
    
    const formCatEl = document.getElementById('formCategory');
    const formCat = formCatEl ? formCatEl.value : 'have_room';
    const maxPhotos = formCat === 'have_room' ? 6 : 3;
    
    if (formImagesList.length < maxPhotos) {
        const addBox = document.createElement('div');
        addBox.className = 'img-preview-box';
        addBox.textContent = '+';
        addBox.addEventListener('click', () => {
            const fileInput = document.getElementById('formPhotoUploadInput');
            if (fileInput) fileInput.click();
        });
        container.appendChild(addBox);
    }
}

window.removeFormImage = function(idx) {
    formImagesList.splice(idx, 1);
    initFormPhotoPreviews();
};

window.handleListingSubmit = async function(event) {
    event.preventDefault();
    
    const id = document.getElementById('formListingId').value;
    const category = document.getElementById('formCategory').value;
    
    const budgetMin = parseFormattedNumber(document.getElementById('formBudgetMin').value);
    const budgetMax = parseFormattedNumber(document.getElementById('formBudgetMax').value);
    
    if (isNaN(budgetMin) || budgetMin < 10000 || budgetMin > 1000000) {
        alert("Ошибка: Минимальная цена должна быть от 10 000 до 1 000 000 тенге.");
        return;
    }
    if (isNaN(budgetMax) || budgetMax < 10000 || budgetMax > 1000000) {
        alert("Ошибка: Максимальная цена должна быть от 10 000 до 1 000 000 тенге.");
        return;
    }
    if (budgetMin > budgetMax) {
        alert("Ошибка: Цена 'от' не может превышать цену 'до'.");
        return;
    }
    
    let age = parseInt(document.getElementById('formAge').value);
    let ageMin = null;
    let ageMax = null;
    
    if (category === 'have_room') {
        ageMin = parseInt(document.getElementById('formAgeMin').value);
        ageMax = parseInt(document.getElementById('formAgeMax').value);
        if (isNaN(ageMin) || ageMin < 16 || ageMin > 50) {
            alert("Пожалуйста, укажите минимальный возраст сожителя от 16 до 50 лет.");
            return;
        }
        if (isNaN(ageMax) || ageMax < 16 || ageMax > 50) {
            alert("Пожалуйста, укажите максимальный возраст сожителя от 16 до 50 лет.");
            return;
        }
        if (ageMin > ageMax) {
            alert("Ошибка: Минимальный возраст не может превышать максимальный.");
            return;
        }
        age = ageMin; // fallback
    } else {
        if (!age || age < 16 || age > 50) {
            alert("Пожалуйста, укажите возраст от 16 до 50 лет.");
            return;
        }
    }
    
    const city = document.getElementById('formCity').value;
    const gender = document.getElementById('formGender').value;
    const genderPref = document.getElementById('formGenderPref').value;
    const occupation = document.getElementById('formOccupation').value;
    const whatsapp = document.getElementById('formWhatsapp').value;
    const roomCount = document.getElementById('formRoomCount').value === 'any' ? 'any' : parseInt(document.getElementById('formRoomCount').value);
    const roommateCount = document.getElementById('formRoommateCount').value === 'any' ? 'any' : parseInt(document.getElementById('formRoommateCount').value);
    const hasDeposit = document.getElementById('formDeposit').value === 'true';
    const description = document.getElementById('formDescription').value || '';
    
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
        budgetMin,
        budgetMax,
        budget: budgetMax, // fallback for schema / old queries
        age,
        ageMin,
        ageMax,
        city,
        districts,
        whatsapp,
        gender,
        genderPref,
        occupation,
        roomCount,
        roommateCount,
        hasDeposit,
        description
    };
    
    if (category === 'have_room') {
        if (formImagesList.length < 3 || formImagesList.length > 6) {
            alert("Пожалуйста, загрузите от 3 до 6 фотографий квартиры.");
            return;
        }
        
        const address = document.getElementById('formAddress').value;
        const gisLink = document.getElementById('formGisLink').value;
        const totalResidents = document.getElementById('formTotalResidents').value;
        const hasContract = document.getElementById('formContract').value === 'true';
        
        if (!address || !gisLink) {
            alert("Поля адреса и 2GIS ссылки обязательны для заполнения!");
            return;
        }
        
        payload.address = address;
        payload.gisLink = gisLink;
        payload.photos = formImagesList;
        payload.totalResidents = totalResidents;
        payload.hasContract = hasContract;
        payload.stayTerm = "any";
        payload.residentsCount = 1;
    } else {
        if (formImagesList.length > 3) {
            alert("Пожалуйста, загрузите не более 3 фотографий вашей анкеты.");
            return;
        }
        const stayTerm = document.getElementById('formStayTerm').value;
        const residentsCount = parseInt(document.getElementById('formResidentsCount').value) || 1;
        payload.address = "";
        payload.gisLink = "";
        payload.photos = formImagesList;
        payload.totalResidents = "1";
        payload.hasContract = false;
        payload.stayTerm = stayTerm;
        payload.residentsCount = residentsCount;
    }
    
    try {
        if (id) {
            await db.updateListing(id, payload);
        } else {
            await db.addListing(payload);
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
    const config = loadConfig();
    let price = config.pricing.promo3Days;
    if (activePromoDays === 7) price = config.pricing.promoWeek;
    else if (activePromoDays === 30) price = config.pricing.promoMonth;
    
    // Redirect to the server checkout page
    window.location.href = `/api/payments/pay?listingId=${activePromoListingId}&amount=${price}`;
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
        const catLabel = item.category === 'have_room' ? 'Сдаю комнату / подселение' : 'Ищу сожителя / комнату';
        const districtsStr = item.districts && item.districts.length > 0 
            ? item.districts.slice(0, 2).join(', ') + (item.districts.length > 2 ? '...' : '') 
            : 'Все районы';
        return `
            <tr style="border-bottom:1px solid var(--border-color); color:var(--text-secondary);">
                <td style="padding: 0.75rem;">${catLabel}</td>
                <td style="padding: 0.75rem;">${item.ownerName}</td>
                <td style="padding: 0.75rem;" title="${item.districts.join(', ')}">${districtsStr}</td>
                <td style="padding: 0.75rem; font-weight:700;">${(item.budgetMin && item.budgetMax && item.budgetMin !== item.budgetMax) ? `${formatNumberWithSpaces(item.budgetMin)} - ${formatNumberWithSpaces(item.budgetMax)}` : `${formatNumberWithSpaces(item.budgetMax || item.budget)}`} ₸</td>
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
                    
                    <div class="card-title">
                        ${(item.budgetMin && item.budgetMax && item.budgetMin !== item.budgetMax) ? 
                          `от ${formatNumberWithSpaces(item.budgetMin)} до ${formatNumberWithSpaces(item.budgetMax)} ₸` : 
                          `${formatNumberWithSpaces(item.budgetMax || item.budget || 0)} ₸`} 
                        <span>/ мес</span>
                    </div>
                    
                    <div class="card-tags">
                        <span class="card-tag accent">${genderLabel}, ${item.age} лет</span>
                        <span class="card-tag">${tagOccupation}</span>
                        <span class="card-tag">${item.roomCount === 'any' ? 'Любая комн.' : item.roomCount + ' комн.'}</span>
                        ${item.hasDeposit ? `<span class="card-tag accent">${item.category === 'need_room' ? 'Готов к депозиту' : 'Депозит'}</span>` : ''}
                        ${item.category === 'have_room' && item.totalResidents ? `<span class="card-tag">Жильцов: ${item.totalResidents}</span>` : ''}
                        ${item.category === 'have_room' && item.roommateCount ? `<span class="card-tag">Ищут: ${item.roommateCount}</span>` : ''}
                        ${item.category === 'need_room' && item.stayTerm ? `<span class="card-tag">Срок: ${getStayTermLabel(item.stayTerm)}</span>` : ''}
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
