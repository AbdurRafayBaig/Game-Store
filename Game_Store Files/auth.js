document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            
            tab.classList.add('active');
            const tabId = tab.dataset.tab;
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Login form submission
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const pasword = document.getElementById('loginPassword').value; 

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, pasword })
            });

            const data = await response.json();
            if (response.ok) {
                sessionStorage.setItem('userId', data.user.userId);
                sessionStorage.setItem('user', JSON.stringify({
                    userName: data.user.userName,
                    email: data.user.email,
                    role: data.user.role || 'user' // Default to 'user' if role not specified
                }));
                window.location.href = 'index.html';
            } else {
                alert(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    });

    // Signup form submission
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        // In signup form handler
        if (!name || !email || !password) {
            alert('Please fill all fields');
            return;
        }

        if (password.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();
            alert(data.userId);
            if (response.ok) {
                sessionStorage.setItem('userId', data.userId);
                alert('Account created successfully! Please login.');
                document.querySelector('.auth-tab[data-tab="login"]').click();
            } else {
                alert(data.error || 'Signup failed');
            }
        } catch (error) {
            console.error('Signup error:', error);
            alert('Signup failed. Please try again.');
        }
    });
});