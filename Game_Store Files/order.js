document.addEventListener('DOMContentLoaded', () => {
    // Load order data from sessionStorage
    const orderData = JSON.parse(sessionStorage.getItem('orderData'));
    
    if (!orderData || !orderData.items || orderData.items.length === 0) {
        alert('No items selected for checkout');
        window.location.href = 'cart.html';
        return;
    }

    // Display selected items
    const itemsContainer = document.getElementById('selectedItemsContainer');
    itemsContainer.innerHTML = orderData.items.map(item => `
        <div class="order-item">
            <img src="${item.imageUrl}" alt="${item.title}" class="order-item-image">
            <div class="order-item-details">
                <h3 class="order-item-name">${item.title}</h3>
                <div class="order-item-price">$${item.price.toFixed(2)}</div>
            </div>
        </div>
    `).join('');

    // Update order summary
    document.getElementById('orderSubtotal').textContent = `$${orderData.subtotal.toFixed(2)}`;
    document.getElementById('orderTax').textContent = `$${orderData.tax.toFixed(2)}`;
    document.getElementById('orderTotal').textContent = `$${orderData.total.toFixed(2)}`;

    // Payment method selection
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    const ibanSection = document.getElementById('ibanSection');
    
    paymentMethods.forEach(method => {
        method.addEventListener('change', (e) => {
            ibanSection.classList.toggle('hidden', e.target.value !== 'Bank Transfer');
        });
    });
    
    // Button event listeners
    document.getElementById('cancelOrder').addEventListener('click', () => {
        window.location.href = 'cart.html';
    });
    // button event listener for confirm order
    document.getElementById('confirmOrder').addEventListener('click', async () => {
        const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');
        const iban = document.getElementById('iban').value;
        
        // Validate inputs
        if (!selectedMethod) {
            alert('Please select a payment method');
            return;
        }
        alert(iban);
        if ((selectedMethod.value === 'Bank Transfer' || selectedMethod.value === 'Credit Card' || selectedMethod.value === 'PayPal') && !iban) {
            alert('Please enter your IBAN for bank transfer');
            return;
        }

        // Process order
        try {
            const response = await fetch('http://localhost:3000/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: sessionStorage.getItem('userId'),
                    items: orderData.items,
                    paymentMethod: selectedMethod.value,
                    iban:  iban,
                    totalAmount: orderData.total
                })
            });
            
            if (!response.ok) throw new Error('Order failed');
            
            const result = await response.json();
            alert(`Order #${result.orderId} placed successfully!`);
            sessionStorage.removeItem('orderData');
            window.location.href = 'cart.html';
            
        } catch (error) {
            console.error('Order error:', error);
            alert(`Order failed: ${error.message}`);
        }
    });
    
    // Initialize payment method
    document.querySelector('input[name="paymentMethod"][value="Credit Card"]').checked = true;
});