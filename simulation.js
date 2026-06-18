const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\a\\.gemini\\antigravity\\brain\\8f77d9a2-030e-4d5f-b016-ea62fbb5c0e5';

async function runSimulation() {
    console.log('Starting Hata.kz E2E Browser Simulation...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // 1. Desktop Feed View
    console.log('Step 1: Loading desktop view...');
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'sim_desktop_feed.png') });
    console.log('Saved: sim_desktop_feed.png');

    // 2. Open Filters Drawer
    console.log('Step 2: Toggling filters drawer...');
    await page.click('#filterToggleBtn');
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'sim_desktop_filters.png') });
    console.log('Saved: sim_desktop_filters.png');

    // 3. Mobile Feed View
    console.log('Step 3: Loading mobile view...');
    await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
    await page.reload({ waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'sim_mobile_feed.png') });
    console.log('Saved: sim_mobile_feed.png');

    // 4. Open Login Modal
    console.log('Step 4: Triggering login modal...');
    const mobileCreateBtn = await page.$('#mobileCreateBtn');
    if (mobileCreateBtn) {
        await mobileCreateBtn.click();
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'sim_mobile_login_modal.png') });
        console.log('Saved: sim_mobile_login_modal.png');
        
        // Close modal
        await page.click('#loginModal .modal-close');
        await new Promise(r => setTimeout(r, 500));
    }

    // 5. Open Listing Creation Modal (Simulated Logged-in State)
    console.log('Step 5: Testing form category toggles...');
    await page.evaluate(() => {
        const mockUser = {
            id: 'simulated-user-123',
            name: 'Тестовый Студент',
            email: 'student@hata.kz',
            avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop',
            isAdmin: false
        };
        localStorage.setItem('hata_current_user', JSON.stringify(mockUser));
        sessionStorage.setItem('hata_current_user', JSON.stringify(mockUser));
        // Override db.getCurrentUser to return the mock user directly
        window.db.getCurrentUser = () => mockUser;
    });
    
    await page.click('#mobileCreateBtn');
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'sim_mobile_form_need_room.png') });
    console.log('Saved: sim_mobile_form_need_room.png');

    // Toggle category to "Я сдаю квартиру"
    await page.select('#formCategorySelect', 'have_room');
    await page.evaluate(() => {
        const select = document.getElementById('formCategorySelect');
        select.dispatchEvent(new Event('change'));
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'sim_mobile_form_have_room.png') });
    console.log('Saved: sim_mobile_form_have_room.png');

    console.log('Simulation complete! Closing browser...');
    await browser.close();
}

runSimulation().catch(err => {
    console.error('Simulation failed:', err);
    process.exit(1);
});
