const puppeteer = require('puppeteer');

async function runDiagnostics() {
    console.log('--- Starting Hata.kz JS Diagnostics ---');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const errors = [];
    const consoleLogs = [];

    // Capture uncaught page exceptions
    page.on('pageerror', err => {
        errors.push({ type: 'JS Error', message: err.message, stack: err.stack });
    });

    // Capture console errors and warnings
    page.on('console', msg => {
        const type = msg.type();
        if (type === 'error' || type === 'warning') {
            consoleLogs.push({ type: type.toUpperCase(), text: msg.text() });
        }
    });

    // Capture response status to identify 401 resources
    page.on('response', response => {
        if (response.status() === 401) {
            consoleLogs.push({ type: '401_RESOURCE', text: `401 Unauthorized: ${response.url()}` });
        }
    });

    // 1. Load the page
    console.log('1. Loading Hata.kz...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // 2. Open filters
    console.log('2. Opening filters drawer...');
    try {
        await page.click('#filterToggleBtn');
        await new Promise(r => setTimeout(r, 500));
    } catch (e) {
        errors.push({ type: 'Interaction Error', message: 'Failed to click #filterToggleBtn: ' + e.message });
    }

    // 3. Open Login modal
    console.log('3. Opening login modal...');
    try {
        const createBtn = await page.$('#mobileCreateBtn') || await page.$('#createListingBtn');
        if (createBtn) {
            await createBtn.click();
            await new Promise(r => setTimeout(r, 500));
        } else {
            errors.push({ type: 'DOM Error', message: 'Could not find #mobileCreateBtn or #createListingBtn' });
        }
    } catch (e) {
        errors.push({ type: 'Interaction Error', message: 'Failed to open login modal: ' + e.message });
    }

    // 4. Inject mock user and test listing form
    console.log('4. Setting mock user and opening listing form...');
    try {
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
            window.db.getCurrentUser = () => mockUser;
        });
        
        const createBtn = await page.$('#mobileCreateBtn') || await page.$('#createListingBtn');
        if (createBtn) {
            await createBtn.click();
            await new Promise(r => setTimeout(r, 500));
        }
    } catch (e) {
        errors.push({ type: 'Interaction Error', message: 'Failed to log in and open form: ' + e.message });
    }

    // 5. Toggle categories and trigger change events
    console.log('5. Toggling listing categories...');
    try {
        const selectExists = await page.$('#formCategorySelect');
        if (selectExists) {
            await page.select('#formCategorySelect', 'have_room');
            await page.evaluate(() => {
                const select = document.getElementById('formCategorySelect');
                select.dispatchEvent(new Event('change'));
            });
            await new Promise(r => setTimeout(r, 500));

            await page.select('#formCategorySelect', 'need_room');
            await page.evaluate(() => {
                const select = document.getElementById('formCategorySelect');
                select.dispatchEvent(new Event('change'));
            });
            await new Promise(r => setTimeout(r, 500));
        } else {
            errors.push({ type: 'DOM Error', message: 'Could not find #formCategorySelect inside listing modal' });
        }
    } catch (e) {
        errors.push({ type: 'Interaction Error', message: 'Failed to toggle category: ' + e.message });
    }

    console.log('\n--- Diagnostics Results ---');
    console.log('Front-end JavaScript Errors found:', errors.length);
    if (errors.length > 0) {
        console.error(JSON.stringify(errors, null, 2));
    }

    console.log('Console warnings/errors found:', consoleLogs.length);
    if (consoleLogs.length > 0) {
        console.warn(JSON.stringify(consoleLogs, null, 2));
    }

    await browser.close();
    console.log('---------------------------');
}

runDiagnostics().catch(err => {
    console.error('Diagnostic harness failed:', err);
    process.exit(1);
});
