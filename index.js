// Hata.kz Application Controller

// Global active state
let currentCategory = 'need_room'; // 'need_room' or 'have_room'
let selectedFilterDistricts = new Set();
let selectedFormDistricts = new Set();
let formImagesList = [];
let activePromoListingId = null;
let activePromoDays = 3;

// Initialize app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI triggers
    initCategoryTabs();
    initFilters();
    initAuth();
    initForm();
    initAdmin();
    
    // Initial Render
    updateDistrictsFilter();
    renderListings();
    
    // Listeners for DB changes
    window.addEventListener('hata_listings_changed', () => {
        renderListings();
        renderUserProfile();
        renderAdminModerationList();
    });
    
    window.addEventListener('hata_auth_changed', () => {
        updateAuthHeader();
        renderUserProfile();
    });
    
    window.addEventListener('hata_config_changed', () => {
        updateAdminInputs();
        renderListings();
    });
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

// --- AUTHENTICATION MOCK ---
function initAuth() {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => openModal('loginModal'));
    }
    updateAuthHeader();
    renderUserProfile();
}

function updateAuthHeader() {
    const container = document.getElementById('authContainer');
    const user = db.getCurrentUser();
    
    if (!container) return;
    
    if (user) {
        container.innerHTML = `
            <div class="user-profile-btn" id="userMenuBtn">
                <img class="user-avatar" src="${user.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}" alt="">
                <span class="username">${user.name}</span>
                <span style="font-size: 0.75rem; margin-left: 0.25rem;">▼</span>
            </div>
            <!-- Simple context menu popup -->
            <div id="userMenuDropdown" style="display:none; position:absolute; right:1.5rem; top:5rem; background:#2d3042; border:1px solid var(--border-color); border-radius:var(--radius-md); overflow:hidden; box-shadow:var(--shadow-md); z-index:10;">
                <button class="btn" style="background:transparent; color:var(--text-primary); text-align:left; border-radius:0; padding:0.75rem 1.5rem; font-size:0.85rem; width:100%;" onclick="logoutUser()">Выйти</button>
            </div>
        `;
        
        // Add dropdown toggle event
        const btn = document.getElementById('userMenuBtn');
        const dropdown = document.getElementById('userMenuDropdown');
        if (btn && dropdown) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
            });
            document.addEventListener('click', () => {
                dropdown.style.display = 'none';
            });
        }
        
        // Make Profile Panel visible
        document.getElementById('userProfilePanel').style.display = 'block';
    } else {
        container.innerHTML = `<button class="btn btn-primary" id="loginBtn" onclick="openModal('loginModal')">Войти</button>`;
        document.getElementById('userProfilePanel').style.display = 'none';
    }
}

window.mockGoogleLogin = function(id) {
    let user = {};
    if (id === 'user-mock-1') {
        user = { id: "user-mock-1", name: "Аружан", email: "aruzhan@gmail.com", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", isAdmin: false };
    } else if (id === 'user-mock-2') {
        user = { id: "user-mock-2", name: "Данияр", email: "daniyar@gmail.com", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", isAdmin: false };
    } else if (id === 'user-mock-3') {
        user = { id: "user-mock-3", name: "Камила", email: "kamila@gmail.com", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop", isAdmin: false };
    } else {
        user = { id: "admin-user", name: "Администратор Hata", email: "admin@hata.kz", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop", isAdmin: true };
    }
    
    db.login(user);
    closeModal('loginModal');
};

window.logoutUser = function() {
    db.logout();
};

// --- CATEGORY TABS ---
function initCategoryTabs() {
    const tabNeedRoom = document.getElementById('tabNeedRoom');
    const tabHaveRoom = document.getElementById('tabHaveRoom');
    
    if (tabNeedRoom && tabHaveRoom) {
        tabNeedRoom.addEventListener('click', () => switchCategoryTab('need_room'));
        tabHaveRoom.addEventListener('click', () => switchCategoryTab('have_room'));
    }
}

function switchCategoryTab(cat) {
    currentCategory = cat;
    document.getElementById('tabNeedRoom').classList.toggle('active', cat === 'need_room');
    document.getElementById('tabHaveRoom').classList.toggle('active', cat === 'have_room');
    
    // Reset filters
    selectedFilterDistricts.clear();
    updateDistrictsFilter();
    renderListings();
}

// --- FILTERS LOGIC ---
function initFilters() {
    const filterCity = document.getElementById('filterCity');
    const filterBudgetMax = document.getElementById('filterBudgetMax');
    const filterGender = document.getElementById('filterGender');
    const filterRooms = document.getElementById('filterRooms');
    
    if (filterCity) {
        filterCity.addEventListener('change', () => {
            selectedFilterDistricts.clear();
            updateDistrictsFilter();
            renderListings();
        });
    }
    
    if (filterBudgetMax) filterBudgetMax.addEventListener('change', renderListings);
    if (filterGender) filterGender.addEventListener('change', renderListings);
    if (filterRooms) filterRooms.addEventListener('change', renderListings);
}

function updateDistrictsFilter() {
    const cityKey = document.getElementById('filterCity').value;
    const container = document.getElementById('filterDistrictsContainer');
    
    if (!container) return;
    container.innerHTML = '';
    
    const cityInfo = HataConfig.cities[cityKey];
    if (cityInfo && cityInfo.districts) {
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
                renderListings();
            });
            container.appendChild(pill);
        });
    }
}

// --- LISTINGS RENDERING ---
function renderListings() {
    const grid = document.getElementById('listingsGrid');
    if (!grid) return;
    
    // Load config dynamic prices
    const config = loadConfig();
    
    const activeListings = db.getListings();
    
    // Read Filter States
    const cityFilter = document.getElementById('filterCity').value;
    const budgetMaxVal = document.getElementById('filterBudgetMax').value;
    const genderFilter = document.getElementById('filterGender').value;
    const roomFilter = document.getElementById('filterRooms').value;
    
    // Filter the listings
    let filtered = activeListings.filter(item => {
        // Category Filter
        if (item.category !== currentCategory) return false;
        
        // City Filter
        if (item.city !== cityFilter) return false;
        
        // Budget Filter
        if (budgetMaxVal !== 'any') {
            const max = parseInt(budgetMaxVal);
            if (item.budget > max) return false;
        }
        
        // Gender Filter
        if (genderFilter !== 'any' && item.gender !== genderFilter) return false;
        
        // Room Filter
        if (roomFilter !== 'any') {
            if (roomFilter === '4plus') {
                if (item.roomCount < 4) return false;
            } else {
                if (item.roomCount !== parseInt(roomFilter)) return false;
            }
        }
        
        // Districts Filter (Multiple selection - AND matching: match if listing districts overlaps selected districts)
        if (selectedFilterDistricts.size > 0) {
            const hasMatch = item.districts.some(dist => selectedFilterDistricts.has(dist));
            if (!hasMatch) return false;
        }
        
        return true;
    });
    
    // Sorting: Promoted first (boostExpiredAt in future), then by creation date descending
    const now = new Date().getTime();
    filtered.sort((a, b) => {
        const aBoosted = a.boostExpiredAt && new Date(a.boostExpiredAt).getTime() > now;
        const bBoosted = b.boostExpiredAt && new Date(b.boostExpiredAt).getTime() > now;
        
        if (aBoosted && !bBoosted) return -1;
        if (!aBoosted && bBoosted) return 1;
        
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Render count
    document.getElementById('listingsCount').textContent = filtered.length;
    
    // Empty state
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-feed form-full">
                <div class="empty-icon">🔍</div>
                <div class="empty-title">Ничего не найдено</div>
                <p>Попробуйте сбросить фильтры или выбрать другие районы.</p>
            </div>
        `;
        return;
    }
    
    // Grid rendering
    grid.innerHTML = filtered.map(item => {
        const isBoosted = item.boostExpiredAt && new Date(item.boostExpiredAt).getTime() > now;
        const formattedDate = formatListingDate(item.createdAt);
        
        // Photo carousel UI
        let carouselHTML = '';
        if (item.photos && item.photos.length > 0) {
            // Render first image only for P2P feed card (simple display)
            carouselHTML = `
                <div class="card-gallery">
                    <img class="card-img" src="${item.photos[0]}" alt="Квартира">
                    <div class="gallery-nav">
                        ${item.photos.map((_, i) => `<span class="gallery-dot ${i === 0 ? 'active' : ''}"></span>`).join('')}
                    </div>
                </div>
            `;
        } else {
            carouselHTML = `
                <div class="card-gallery">
                    <div class="no-photo">
                        <span class="no-photo-icon">📷</span>
                        <span>Без фотографий</span>
                    </div>
                </div>
            `;
        }
        
        // Tag badges
        let tagOccupation = '';
        if (item.occupation === 'student') tagOccupation = 'Учеба';
        else if (item.occupation === 'student_work') tagOccupation = 'Учеба + Работа';
        else if (item.occupation === 'work') tagOccupation = 'Работает';
        else tagOccupation = 'Не занят';

        const genderLabel = item.gender === 'male' ? 'Парень' : 'Девушка';
        
        // 2GIS block
        const mapButton = (item.gisLink && item.category === 'have_room') 
            ? `<a href="${item.gisLink}" target="_blank" class="btn btn-secondary">🗺️ В 2GIS</a>`
            : '';
            
        // WhatsApp link generator (starting with wa.me/7...)
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
                    
                    <div class="card-title">${item.budget.toLocaleString()} ₸ <span>/ мес</span></div>
                    
                    <div class="card-tags">
                        <span class="card-tag accent">${genderLabel}, ${item.age} лет</span>
                        <span class="card-tag">${tagOccupation}</span>
                        <span class="card-tag">${item.roomCount} комн.</span>
                        ${item.hasDeposit ? '<span class="card-tag accent">С депозитом</span>' : ''}
                        ${item.hasContract ? '<span class="card-tag">Договор</span>' : ''}
                    </div>
                    
                    <p class="card-desc">${item.description}</p>
                    
                    <div class="card-footer">
                        <a href="${waLink}" target="_blank" class="btn btn-primary" style="background:#25d366; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.25);">💬 WhatsApp</a>
                        ${mapButton}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function formatListingDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    
    // Check if today
    if (date.toDateString() === now.toDateString()) {
        return 'Сегодня';
    }
    
    // Check if yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Вчера';
    }
    
    // Otherwise regular date
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

// --- PROFILE PANEL (MY LISTINGS) ---
function renderUserProfile() {
    const container = document.getElementById('userListingsContainer');
    const user = db.getCurrentUser();
    
    if (!container || !user) return;
    
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
        
        const catLabel = item.category === 'need_room' ? 'Ищу сожителя' : 'Сдаю комнату';
        const dateStr = new Date(item.createdAt).toLocaleDateString('ru-RU');

        // Toggle buttons based on status
        let actionButtons = '';
        if (item.status === 'active') {
            actionButtons += `
                <button class="btn btn-lime" style="font-size:0.75rem;" onclick="openPromoModal('${item.id}')">🚀 В ТОП</button>
                <button class="btn btn-secondary" style="font-size:0.75rem;" onclick="editListing('${item.id}')">✏️ Редактировать</button>
                <button class="btn btn-secondary" style="font-size:0.75rem; color:#ef4444; border-color:rgba(239, 68, 68, 0.2);" onclick="archiveListing('${item.id}')">📥 В архив</button>
            `;
        } else {
            actionButtons += `
                <button class="btn btn-lime" style="font-size:0.75rem;" onclick="reactivateListing('${item.id}')">📤 Активировать</button>
                <button class="btn btn-danger" style="font-size:0.75rem;" onclick="deleteListing('${item.id}')">❌ Удалить</button>
            `;
        }

        return `
            <div class="user-listing-item">
                <div class="item-info">
                    <div class="item-title">${catLabel} - ${item.budget.toLocaleString()} ₸</div>
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
}

window.archiveListing = function(id) {
    if (confirm("Вы уверены, что хотите убрать объявление в архив? Оно перестанет отображаться в общем поиске.")) {
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

// --- FORM SUBMIT & EDIT ---
function initForm() {
    const createListingBtn = document.getElementById('createListingBtn');
    if (createListingBtn) {
        createListingBtn.addEventListener('click', () => openListingForm());
    }
    
    // Add WhatsApp auto-fill trigger on focus
    const formWhatsapp = document.getElementById('formWhatsapp');
    if (formWhatsapp) {
        formWhatsapp.addEventListener('focus', () => {
            const user = db.getCurrentUser();
            if (user) {
                const suggestions = db.getAutoFillSuggestions(user.id);
                if (suggestions.whatsapp && !formWhatsapp.value) {
                    formWhatsapp.value = suggestions.whatsapp;
                    // Trigger input event to clear validation errors
                    formWhatsapp.dispatchEvent(new Event('input'));
                }
            }
        });
    }

    // Add Address auto-fill trigger on focus
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
    
    // Update config listing price label
    const config = loadConfig();
    submitBtn.textContent = `Опубликовать (${config.pricing.postingFee} ₸)`;
    
    // Toggle fields based on active tab category
    const formCat = document.getElementById('formCategory');
    formCat.value = currentCategory;
    
    const detailsBlock = document.getElementById('haveRoomDetails');
    if (currentCategory === 'have_room') {
        detailsBlock.style.display = 'grid';
        document.getElementById('formBudgetLabel').textContent = 'Стоимость аренды (₸/мес) *';
        document.getElementById('formGenderLabel').textContent = 'Кого вы ищете (Пол) *';
        document.getElementById('formRoommateLabel').textContent = 'Сколько сожителей ищете *';
        initFormPhotoPreviews();
    } else {
        detailsBlock.style.display = 'none';
        document.getElementById('formBudgetLabel').textContent = 'Ваш бюджет (₸/мес) *';
        document.getElementById('formGenderLabel').textContent = 'Ваш пол *';
        document.getElementById('formRoommateLabel').textContent = 'С кем хотите жить *';
    }

    if (id) {
        // EDIT MODE
        title.textContent = 'Редактировать объявление';
        submitBtn.textContent = 'Сохранить изменения';
        
        const all = db.getListings().concat(db.getUserListings(user.id));
        const item = all.find(x => x.id === id);
        if (item) {
            document.getElementById('formListingId').value = item.id;
            document.getElementById('formCategory').value = item.category;
            
            // Adjust toggled display block based on item category
            if (item.category === 'have_room') {
                detailsBlock.style.display = 'grid';
                document.getElementById('formBudgetLabel').textContent = 'Стоимость аренды (₸/мес) *';
                document.getElementById('formGenderLabel').textContent = 'Кого вы ищете (Пол) *';
                document.getElementById('formRoommateLabel').textContent = 'Сколько сожителей ищете *';
                
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
            
            document.getElementById('formBudget').value = item.budget;
            document.getElementById('formAge').value = item.age;
            document.getElementById('formCity').value = item.city;
            document.getElementById('formGender').value = item.gender;
            document.getElementById('formOccupation').value = item.occupation;
            document.getElementById('formWhatsapp').value = item.whatsapp;
            document.getElementById('formRoomCount').value = item.roomCount;
            document.getElementById('formRoommateCount').value = item.roommateCount;
            document.getElementById('formDescription').value = item.description;
            
            // Load districts
            selectedFormDistricts = new Set(item.districts);
        }
    } else {
        // CREATE MODE
        title.textContent = 'Создать объявление';
        document.getElementById('formListingId').value = '';
        
        // Auto-fill defaults if database contains them
        const suggestions = db.getAutoFillSuggestions(user.id);
        if (suggestions.gender) document.getElementById('formGender').value = suggestions.gender;
        if (suggestions.occupation) document.getElementById('formOccupation').value = suggestions.occupation;
        if (suggestions.whatsapp) document.getElementById('formWhatsapp').value = suggestions.whatsapp;
    }
    
    updateFormDistricts();
    openModal('listingModal');
}

window.updateFormDistricts = function() {
    const cityKey = document.getElementById('formCity').value;
    const container = document.getElementById('formDistrictsContainer');
    
    if (!container) return;
    container.innerHTML = '';
    
    const cityInfo = HataConfig.cities[cityKey];
    if (cityInfo && cityInfo.districts) {
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

// Photos uploading logic mockup
function initFormPhotoPreviews() {
    const container = document.getElementById('photoPreviews');
    if (!container) return;
    container.innerHTML = '';
    
    // Render existing photos
    formImagesList.forEach((src, idx) => {
        const box = document.createElement('div');
        box.className = 'img-preview-box';
        box.innerHTML = `
            <img src="${src}" alt="Фото">
            <span class="remove-btn" onclick="removeFormImage(${idx})">&times;</span>
        `;
        container.appendChild(box);
    });
    
    // Add "+" empty boxes up to 6
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
    // Generate simple mock apartment image from Unsplash for prototyping
    const mockImages = [
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=600&h=400&fit=crop"
    ];
    
    // Grab next available or random
    const src = mockImages[formImagesList.length % mockImages.length];
    formImagesList.push(src);
    initFormPhotoPreviews();
}

window.handleListingSubmit = function(event) {
    event.preventDefault();
    
    const id = document.getElementById('formListingId').value;
    const category = document.getElementById('formCategory').value;
    
    const budget = parseInt(document.getElementById('formBudget').value);
    const age = parseInt(document.getElementById('formAge').value);
    const city = document.getElementById('formCity').value;
    const gender = document.getElementById('formGender').value;
    const occupation = document.getElementById('formOccupation').value;
    const whatsapp = document.getElementById('formWhatsapp').value;
    const roomCount = document.getElementById('formRoomCount').value === 'any' ? 'any' : parseInt(document.getElementById('formRoomCount').value);
    const roommateCount = document.getElementById('formRoommateCount').value === 'any' ? 'any' : parseInt(document.getElementById('formRoommateCount').value);
    const description = document.getElementById('formDescription').value;
    
    // District validation
    if (selectedFormDistricts.size === 0) {
        alert("Выберите хотя бы один район!");
        return;
    }
    
    const districts = Array.from(selectedFormDistricts);
    
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
    
    // Validation spec for room owners
    if (category === 'have_room') {
        if (formImagesList.length < 3) {
            alert("Пожалуйста, прикрепите как минимум 3 фотографии квартиры!");
            return;
        }
        
        const address = document.getElementById('formAddress').value;
        const gisLink = document.getElementById('formGisLink').value;
        const hasDeposit = document.getElementById('formDeposit').value === 'true';
        const hasContract = document.getElementById('formContract').value === 'true';
        
        if (!address || !gisLink) {
            alert("Поля 'Адрес' и 'Ссылка на 2GIS' обязательны для заполнения!");
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
    
    // Set default selected options
    selectPromoOption('opt3Days', 3);
    
    // Load current config prices
    const config = loadConfig();
    document.getElementById('priceLabel3Days').textContent = `${config.pricing.promo3Days} ₸`;
    document.getElementById('priceLabelWeek').textContent = `${config.pricing.promoWeek} ₸`;
    document.getElementById('priceLabelMonth').textContent = `${config.pricing.promoMonth} ₸`;
    
    openModal('promoModal');
};

window.selectPromoOption = function(optId, days) {
    activePromoDays = days;
    
    // Toggle visual selection style
    document.querySelectorAll('.promo-option').forEach(el => el.classList.remove('selected'));
    document.getElementById(optId).classList.add('selected');
    
    // Update price label below
    const config = loadConfig();
    let price = config.pricing.promo3Days;
    if (days === 7) price = config.pricing.promoWeek;
    else if (days === 30) price = config.pricing.promoMonth;
    
    document.getElementById('paySumLabel').textContent = `${price} ₸`;
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
                alert("Доступ ограничен. Пожалуйста, войдите в аккаунт Администратора.");
                openModal('loginModal');
                return;
            }
            updateAdminInputs();
            renderAdminModerationList();
            openModal('adminModal');
        });
    }
}

function updateAdminInputs() {
    const config = loadConfig();
    document.getElementById('adminPostingFee').value = config.pricing.postingFee;
    document.getElementById('adminPromo3Days').value = config.pricing.promo3Days;
    document.getElementById('adminPromoWeek').value = config.pricing.promoWeek;
    document.getElementById('adminPromoMonth').value = config.pricing.promoMonth;
}

window.saveAdminSettings = function() {
    const postingFee = parseInt(document.getElementById('adminPostingFee').value) || 0;
    const promo3Days = parseInt(document.getElementById('adminPromo3Days').value) || 0;
    const promoWeek = parseInt(document.getElementById('adminPromoWeek').value) || 0;
    const promoMonth = parseInt(document.getElementById('adminPromoMonth').value) || 0;
    
    const config = loadConfig();
    config.pricing = {
        postingFee,
        promo3Days,
        promoWeek,
        promoMonth
    };
    
    saveConfig(config);
    alert("Настройки тарифов сохранены!");
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
        const catLabel = item.category === 'need_room' ? 'Ищу сожителя' : 'Сдаю комнату';
        const districtsStr = item.districts.slice(0, 2).join(', ') + (item.districts.length > 2 ? '...' : '');
        return `
            <tr style="border-bottom:1px solid var(--border-color); color:var(--text-secondary);">
                <td style="padding: 0.75rem;">${catLabel}</td>
                <td style="padding: 0.75rem;">${item.ownerName}</td>
                <td style="padding: 0.75rem;" title="${item.districts.join(', ')}">${districtsStr}</td>
                <td style="padding: 0.75rem; font-weight:700;">${item.budget.toLocaleString()} ₸</td>
                <td style="padding: 0.75rem; text-align:center;">
                    <button class="btn btn-danger" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="deleteListing('${item.id}')">Удалить</button>
                </td>
            </tr>
        `;
    }).join('');
}
