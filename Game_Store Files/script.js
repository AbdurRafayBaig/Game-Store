// Function to create game card HTML
function createGameCard(game) {
    return `
        <div class="game-card">
            <img src="${game.image}" alt="${game.title}" class="game-image">
            <div class="game-info">
                <h3 class="game-title">${game.title}</h3>
                <div class="game-price">
                    ${game.discount > 0 ? 
                        `<div>
                            <span class="discount">-${game.discount}%</span>
                            <span class="original-price">$${game.originalPrice.toFixed(2)}</span>
                        </div>` 
                        : '<div></div>'
                    }
                    <span class="final-price">$${game.finalPrice.toFixed(2)}</span>
                </div>
            </div>
        </div>
    `;
}

var allUserIds = [];
var allGameIds = [];
var allGames = []; // Store all games for search suggestions
var featuredGames = []; // Store featured games

// Function to fetch all IDs
async function fetchAllIds() {
    try {
        // Fetch user IDs
        const usersResponse = await fetch('http://localhost:3000/api/users/ids');
        if (!usersResponse.ok) throw new Error('Failed to fetch user IDs');
        allUserIds = await usersResponse.json();
        // Fetch game IDs
        const gamesResponse = await fetch('http://localhost:3000/api/games/ids');
        if (!gamesResponse.ok) throw new Error('Failed to fetch game IDs');
        allGameIds = await gamesResponse.json();
    } catch (error) {
        console.error('Error loading IDs:', error);
        allUserIds = [];
        allGameIds = [];
    }
}

// Function to fetch all games and filter featured games
async function fetchAllGames() {
    try {
        const response = await fetch('http://localhost:3000/api/games');
        if (!response.ok) {
            throw new Error(`Failed to fetch games: ${response.status} ${response.statusText}`);
        }
        allGames = await response.json();
        console.log('Fetched all games:', allGames); // Debug log
        
        // Filter featured games
        featuredGames = allGames.filter(game => game.Featured == 1);
        console.log('Filtered featured games:', featuredGames); // Debug log
    } catch (error) {
        console.error('Error fetching all games:', error);
        allGames = [];
        featuredGames = [];
        // Display error message to user
        const featuredContainer = document.getElementById('featuredGames');
        if (featuredContainer) {
            featuredContainer.innerHTML = `
                <div class="error-message">
                    Failed to load games: ${error.message}
                    <br><br>
                    Please check your connection and try again.
                </div>
            `;
        }
    }
}

// Load featured games from featuredGames array
function loadFeaturedGames() {
    const featuredContainer = document.getElementById('featuredGames');
    featuredContainer.innerHTML = '<div class="loading">Loading featured games...</div>';

    try {
        if (featuredGames.length === 0) {
            featuredContainer.innerHTML = `
                <div class="no-games">
                    No featured games available. Check back later!
                </div>
            `;
            return;
        }
        
        featuredContainer.innerHTML = '';
        featuredGames.forEach(game => {
            featuredContainer.innerHTML += createGameCard({
                id: game.id,
                title: game.title,
                image: game.image,
                originalPrice: game.finalPrice * 1.2,
                finalPrice: game.finalPrice,
                discount: 20
            });
        });
        
        // Add click events to the new cards
        document.querySelectorAll('.game-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                const gameId = featuredGames[index].id;
                window.location.href = `product.html?gameId=${gameId}`;
            });
        });
    } catch (error) {
        console.error('Error loading featured games:', error);
        featuredContainer.innerHTML = `
            <div class="error-message">
                Failed to load featured games: ${error.message}
                <br><br>
                Please check your connection and try again.
            </div>
        `;
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    await fetchAllIds();
    await fetchAllGames(); // Fetch all games and filter featured games
    loadFeaturedGames(); // Load featured games from array
});

// Search functionality
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    
    if (searchTerm.length < 1) { // Show suggestions after 1 character
        searchResults.style.display = 'none';
        return;
    }
    
    const filteredGames = allGames.filter(game => 
        game.title.toLowerCase().includes(searchTerm)
    );
    
    displaySearchResults(filteredGames);
});

function displaySearchResults(games) {
    searchResults.innerHTML = '';
    
    if (games.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item">No games found</div>';
        searchResults.style.display = 'block';
        return;
    }
    
    games.forEach(game => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.innerHTML = `
            <img src="${game.image}" alt="${game.title}">
            <h4>${game.title}</h4>
        `;
        resultItem.addEventListener('click', () => {
            window.location.href = `product.html?gameId=${game.id}`; // Navigate to product page
        });
        searchResults.appendChild(resultItem);
    });
    
    searchResults.style.display = 'block';
}

// Close search results when clicking outside
document.addEventListener('click', function(e) {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.style.display = 'none';
    }
});

// Search on Enter key
searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch(this.value);
    }
});

function performSearch(term) {
    if (term.trim() === '') return;
    
    const filteredGames = allGames.filter(game => 
        game.title.toLowerCase().includes(term.toLowerCase())
    );
    
    const featuredContainer = document.getElementById('featuredGames');
    featuredContainer.innerHTML = '';
    
    if (filteredGames.length === 0) {
        featuredContainer.innerHTML = `
            <div class="no-games">
                No games found for "${term}"
            </div>
        `;
    } else {
        filteredGames.forEach(game => {
            featuredContainer.innerHTML += createGameCard({
                id: game.id,
                title: game.title,
                image: game.image,
                originalPrice: game.finalPrice * 1.2,
                finalPrice: game.finalPrice,
                discount: 20
            });
        });
        
        // Add click events to the new cards
        document.querySelectorAll('.game-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                const gameId = filteredGames[index].id;
                window.location.href = `product.html?gameId=${gameId}`;
            });
        });
    }
    
    document.querySelector('.featured h2').textContent = `Search Results for "${term}"`;
    searchResults.style.display = 'none';
}

// Update user menu based on login state
function updateUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const user = JSON.parse(sessionStorage.getItem('user'));
    const navLinks = document.querySelector('.nav-links');
    const existingDbLink = document.querySelector('a[href="database.html"]');
    if (existingDbLink) {
        existingDbLink.remove();
    }
    if (user) {
        userMenu.querySelector('.username').textContent = user.name;
        userMenu.onclick = () => {
            if (confirm('Do you want to logout?')) {
                sessionStorage.removeItem('userId');
                sessionStorage.removeItem('user');
                updateUserMenu();
            }
        };
        // Add Database link only for admin
        if (user.role === 'Admin') {
            const dbLink = document.createElement('a');
            dbLink.href = 'database.html';
            dbLink.textContent = 'DATABASE';
            
            // Insert after SUPPORT link
            const supportLink = document.querySelector('.nav-links a[href="#"]');
            if (supportLink) {
                supportLink.insertAdjacentElement('afterend', dbLink);
            } else {
                navLinks.appendChild(dbLink);
            }
        }
    } else {
        userMenu.querySelector('.username').textContent = 'Login';
        userMenu.onclick = () => window.location.href = 'login.html';
    }
}

// Call this on page load
document.addEventListener('DOMContentLoaded', updateUserMenu);