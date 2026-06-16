// Hata.kz - Main JavaScript Logic

document.addEventListener('DOMContentLoaded', () => {
    console.log('Hata.kz application initialized successfully.');

    // Navigation Active Link toggles
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            console.log(`Switched view mode to: ${link.textContent.trim()}`);
        });
    });

    // Search button handler
    const searchBtn = document.getElementById('searchBtn');
    const citySelect = document.getElementById('citySelect');
    const typeSelect = document.getElementById('typeSelect');
    const priceInput = document.getElementById('priceInput');

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const city = citySelect.options[citySelect.selectedIndex].text;
            const type = typeSelect.options[typeSelect.selectedIndex].text;
            const budget = priceInput.options[priceInput.selectedIndex].text;

            console.log(`Executing search: ${type} in ${city} with budget ${budget}`);
            alert(`Поиск: ${type} в г. ${city}, бюджет: ${budget}. Функция поиска будет добавлена в следующем обновлении!`);
        });
    }

    // Category card clicks
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const categoryName = card.querySelector('h3').textContent;
            console.log(`Category clicked: ${categoryName}`);
            alert(`Переход к разделу: ${categoryName}`);
        });
    });
});
