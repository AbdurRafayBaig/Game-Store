// Load game data based on URL parameter (e.g., product.html?id=123)
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('gameId');
    if (gameId) {
        loadGameData(gameId);
    } else {
        window.location.href = 'index.html';
    }
});

// Fetch game data from backend

async function loadGameData(gameId) {
    try {
        // In a real app, this would fetch from your backend API
        const response = await fetch(`http://localhost:3000/api/games/${gameId}`);
        if (!response.ok) {
            const errorData = await response.text(); // or response.json() if server returns JSON
            throw new Error(`Server responded with ${response.status}: ${errorData}`);
        }
        const games = await response.json();
        displayGameData(games);
        
    } catch (error) {
        console.error('Error loading game:', error);
    }
}

// Display game data on the page
function displayGameData(game) {
    // Update basic info
    document.getElementById('gameTitle').textContent = game.Name;
    document.getElementById('gameGenre').textContent = game.Genre;
    document.getElementById('gamePlatform').textContent = game.Platform;
    document.getElementById('gameDescription').textContent = game.Description;
    
    // Update cover image
    document.getElementById('gameCover').src = game.ImageData;
    document.getElementById('gameCover').alt = game.Name;
    
    // Update price
    const finalPrice = game.Price * (1 - 10 / 100);
    document.getElementById('originalPrice').textContent = `$${game.Price.toFixed(2)}`;
    document.getElementById('finalPrice').textContent = `$${finalPrice.toFixed(2)}`;
    
    if (game.Price > 0) {
        document.getElementById('discountBadge').textContent = `-10%`;
    } else {
        document.getElementById('discountBadge').style.display = 'none';
    }
    
    // Load screenshots
    const screenshotGallery = document.getElementById('screenshotGallery');
    screenshotGallery.innerHTML = ''; // Clear previous content
    if (game.screenshots && Array.isArray(game.screenshots)) {
        game.screenshots.forEach(screenshot => {
            screenshotGallery.innerHTML += `
                <img src="${screenshot}" alt="${game.Name} Screenshot">
            `;
    
    })};
    
    // Update system requirements
    const minReq = game.minRequirements;
    document.getElementById('minRequirements').innerHTML = `
        <li><strong>OS:</strong> ${minReq.os}</li>
        <li><strong>CPU:</strong> ${minReq.cpu}</li>
        <li><strong>RAM:</strong> ${minReq.ram}</li>
        <li><strong>GPU:</strong> ${minReq.gpu}</li>
    `;
    
    const recReq = game.recRequirements;
    document.getElementById('recRequirements').innerHTML = `
        <li><strong>OS:</strong> ${recReq.os}</li>
        <li><strong>CPU:</strong> ${recReq.cpu}</li>
        <li><strong>RAM:</strong> ${recReq.ram}</li>
        <li><strong>GPU:</strong> ${recReq.gpu}</li>
    `;
}

// Tab switching functionality
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Remove active class from all buttons and panes
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked button and corresponding pane
        this.classList.add('active');
        const tabId = this.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});


// Add to cart functionality
document.getElementById('addToCart').addEventListener('click', function() {
    const gameId = new URLSearchParams(window.location.search).get('id');
    const gameTitle = document.getElementById('gameTitle').textContent;
    const finalPrice = parseFloat(
        document.getElementById('finalPrice').textContent.replace('$', '')
    );
    
    // In a real app, this would add to a cart system (sessionStorage or backend)
    
    // Reset quantity
    quantity = 1;
    document.getElementById('quantity').textContent = quantity;
});

// Add to cart functionality
document.getElementById('addToCart').addEventListener('click', async function() {
    try {
        // 1. Validate user
        const userId = sessionStorage.getItem('userId');
        if (!userId) {
            alert('Please login first');
            window.location.href = 'login.html';
            return;
        }

        // 2. Get item details
        const gameId = new URLSearchParams(window.location.search).get('gameId');
        const priceText = document.getElementById('finalPrice').textContent;
        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        // 3. Call API
        const response = await fetch('http://localhost:3000/api/cart/add-item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, gameId, price })
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to add to cart');
        }

        alert('Item added to cart successfully!');
        
    } catch (error) {
        console.error('Add to cart error:', error);
        alert(error.message || 'Failed to add to cart');
    }
});