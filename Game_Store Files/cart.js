let selectedItems = [];
document.addEventListener('DOMContentLoaded', async () => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
        alert('Please login to view your cart');
        window.location.href = 'login.html';
        return;
    }

    await loadCartItems(userId);
    updateUserMenu();
});

async function loadCartItems(userId) {
    try {
        const response = await fetch(`http://localhost:3000/api/cart?userId=${userId}`);
        if (!response.ok) {
            throw new Error('Failed to load cart');
        }
        
        const cartData = await response.json();
        console.log('Cart data:', cartData);
        displayCartItems(cartData);
        updateCartSummary();
    } catch (error) {
        console.error('Error loading cart:', error);
        alert('Failed to load your cart. Please try again.');
    }
}

function displayCartItems(cartData) {
    const cartContainer = document.getElementById('cartContainer');
    
    if (!cartData.items || cartData.items.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart-message">
                Your cart is empty. <a href="index.html">Browse games</a>
            </div>
        `;
        return;
    }

    // Modify the checkbox creation to not be checked by default:
    cartContainer.innerHTML = cartData.items.map(item => `
        <div class="cart-item" data-game-id="${item.Game_ID}">
            <input type="checkbox" class="item-selector" 
                   data-price="${item.Price}" data-game-id="${item.Game_ID}">
            <img src="${item.ImageURL}" alt="${item.Title}" class="cart-item-image">
            <div class="cart-item-details">
                <h3>${item.Title}</h3>
                <div class="cart-item-price">$${item.Price.toFixed(2)}</div>
            </div>
            <button class="remove-btn" data-game-id="${item.Game_ID}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    const gameId = cartData.items[0].Game_ID; // Example gameId, adjust as needed
    

    // Add event listeners for checkboxes
    document.querySelectorAll('.item-selector').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const gameId = e.target.dataset.gameId;
            const price = parseFloat(e.target.dataset.price);
            const isChecked = e.target.checked;
            
            if (isChecked) {
                // Add to selectedItems if not already present
                if (!selectedItems.some(item => item.gameId === gameId)) {
                    selectedItems.push({ gameId, price });
                }
            } else {
                // Remove from selectedItems
                selectedItems = selectedItems.filter(item => item.gameId !== gameId);
            }
            
            updateCartSummary();
        });
    });

    
    // Add event listeners for remove buttons
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const gameId = e.target.dataset.gameId; // Get from clicked button
            await removeCartItem(userId, gameId);
        });
    });
}

async function updateCartItem(userId, gameId, quantityChange) {
    try {
        const response = await fetch('http://localhost:3000/api/cart/update-item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, gameId, quantityChange })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update cart');
        }
        
        await loadCartItems(userId); // Refresh cart
    } catch (error) {
        console.error('Error updating cart:', error);
        alert('Failed to update item. Please try again.');
    }
}

async function removeCartItem(userId, gameId) {
    try {
        const response = await fetch('http://localhost:3000/api/cart/remove-item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, gameId })
        });
        
        if (!response.ok) {
            throw new Error('Failed to remove item');
        }
        
        await loadCartItems(userId); // Refresh cart
    } catch (error) {
        console.error('Error removing item:', error);
        alert('Failed to remove item. Please try again.');
    }
}

function updateCartSummary() {
    
    const subtotal = selectedItems.reduce((sum, item) => sum + item.price, 0);
    const tax = subtotal * 0.1; // 10% tax for example
    const total = subtotal + tax;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
    document.getElementById('checkoutBtn').disabled = selectedItems.length === 0;
}

// User menu functionality (same as script.js)
function updateUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    if (user) {
        userMenu.querySelector('.username').textContent = user.userName || 'Account';
        userMenu.onclick = () => {
            if (confirm('Do you want to logout?')) {
                sessionStorage.removeItem('userId');
                sessionStorage.removeItem('user');
                window.location.href = 'index.html';
            }
        };
    } else {
        userMenu.querySelector('.username').textContent = 'Login';
        userMenu.onclick = () => window.location.href = 'login.html';
    }
}

// Replace the checkout button event listener in cart.js
document.getElementById('checkoutBtn').addEventListener('click', () => {
    if (selectedItems.length === 0) return;
    
    // Prepare order data
    const orderData = {
        items: selectedItems.map(item => {
            const cartItem = document.querySelector(`.cart-item[data-game-id="${item.gameId}"]`);
            return {
                gameId: item.gameId,
                title: cartItem.querySelector('h3').textContent,
                price: item.price,
                imageUrl: cartItem.querySelector('img').src
            };
        }),
        subtotal: selectedItems.reduce((sum, item) => sum + item.price, 0),
        tax: selectedItems.reduce((sum, item) => sum + item.price, 0) * 0.1,
        total: selectedItems.reduce((sum, item) => sum + item.price, 0) * 1.1
    };
    
    // Store in sessionStorage (clears when tab closes)
    sessionStorage.setItem('orderData', JSON.stringify(orderData));
    window.location.href = 'order.html';
});
