const express = require('express');
const sql = require('mssql/msnodesqlv8');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const config = {
    server: "DESKTOP-FN6N1S3\\SQLEXPRESS",
    database: "Game",
    driver: "msnodesqlv8",
    options: {
        trustedConnection: true,
        trustServerCertificate: true
    }
};

const ALL_TABLES = [
    'Inventory', 
    '[User]', 
    'Game', 
    'Shopping_Cart', 
    'Cart_Item', 
    '[Order]', 
    'order_details', 
    'Payment'
];

// Admin endpoint to fetch multiple tables
app.post('/api/admin/tables', async (req, res) => {
    try {
        const { tables } = req.body;
        const pool = await sql.connect(config);
        
        const results = {};
        
        for (const tableName of tables) {
            try {
                const result = await pool.request()
                    .query(`SELECT * FROM ${tableName}`);
                results[tableName] = result.recordset;
            } catch (err) {
                results[tableName] = { error: err.message };
            }
        }
        
        res.json(results);
    } catch (err) {
        console.error('Error fetching tables:', err);
        res.status(500).json({ error: 'Failed to fetch tables' });
    }
});

// Get all user IDs
app.get('/api/users/ids', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .query('SELECT User_id as id FROM [User]');
        res.json(result.recordset.map(user => user.id));
    } catch (err) {
        console.error('Error fetching user IDs:', err);
        res.status(500).json({ error: 'Failed to fetch user IDs' });
    }
});

// Get all game IDs
app.get('/api/games/ids', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .query('SELECT Game_ID as id FROM game');
        res.json(result.recordset.map(game => game.id));
    } catch (err) {
        console.error('Error fetching game IDs:', err);
        res.status(500).json({ error: 'Failed to fetch game IDs' });
    }
});

// API endpoint to fetch game by ID
app.get('/api/games/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const query = `SELECT * FROM game WHERE Game_ID = @gameId`;
        
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('gameId', sql.Int, gameId)
            .query(query);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Game not found' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error("SQL Error:", err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// User login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, pasword } = req.body;
        const pool = await sql.connect(config);
        
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM [User] WHERE Email = @email');
        
        if (result.recordset.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.recordset[0];
        if (user.Password !== pasword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        res.json({ 
            user: {
                userId: user.User_ID,
                userName: user.User_Name,
                email: user.email,
                role: user.Role
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// User signup endpoint
let userId;
app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const pool = await sql.connect(config);
        
        // Check if email exists
        const emailCheck = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT User_ID FROM [User] WHERE Email = @email');
        
        if (emailCheck.recordset.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Create new user
        const userResult = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, password)
            .query(`INSERT INTO [User] (User_Name, Email, [Password])
                    OUTPUT INSERTED.User_ID
                    VALUES (@name, @email, @password)`);
        
        userId = userResult.recordset[0].User_ID;

        // Create shopping cart for the user
        await pool.request()
            .input('userId', sql.Int, userId)
            .query('INSERT INTO Shopping_Cart (User_ID) VALUES (@userId)');
        
        res.status(201).json({ 
            success: true,
            userId: userId
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Signup failed' });
    }
});

// Add to cart endpoint
app.post('/api/cart/add-item', async (req, res) => {
    try {
        const { userId, gameId, price } = req.body;
        const pool = await sql.connect(config);

        // Get user's cart
        const cartResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT Cart_ID FROM Shopping_Cart WHERE User_ID = @userId');
        if (cartResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Cart not found' });
        }
        const cartId = cartResult.recordset[0].Cart_ID;

        // Add to cart
        await pool.request()
            .input('cartId', sql.Int, cartId)
            .input('gameId', sql.Int, gameId)
            .input('price', sql.Decimal(10,2), price)
            .query(`
                INSERT INTO Cart_Item (Cart_ID, Game_ID, Price)
                VALUES (@cartId, @gameId, @price)
            `);

        res.json({ success: true });
    } catch (err) {
        console.error('Add to cart error:', err);
        if (err.number === 2627) {
            return res.status(400).json({ error: 'Item already in cart' });
        }
        res.status(500).json({ error: 'Failed to add to cart' });
    }
});

// Get cart items with game details
app.get('/api/cart', async (req, res) => {
    try {
        const { userId } = req.query;
        const pool = await sql.connect(config);
        
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT 
                    ci.Cart_ID, 
                    ci.Game_ID, 
                    ci.Price,
                    g.Name as Title,
                    g.ImageData as ImageURL
                FROM Cart_Item ci
                JOIN Shopping_Cart sc ON ci.Cart_ID = sc.Cart_ID
                JOIN Game g ON ci.Game_ID = g.Game_ID
                WHERE sc.User_ID = @userId
            `);
        
        res.json({
            items: result.recordset,
            count: result.recordset.length
        });
    } catch (err) {
        console.error('Cart fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

// Update cart item quantity
app.post('/api/cart/update-item', async (req, res) => {
    try {
        const { userId, gameId, quantityChange } = req.body;
        const pool = await sql.connect(config);
        
        // Get cart ID
        const cartResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT Cart_ID FROM Shopping_Cart WHERE User_ID = @userId');
        
        if (cartResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Cart not found' });
        }
        const cartId = cartResult.recordset[0].Cart_ID;
        
        // Update quantity
        await pool.request()
            .input('cartId', sql.Int, cartId)
            .input('gameId', sql.Int, gameId)
            .query(`
                UPDATE Cart_Item 
                SET Price = Price * (1 + @quantityChange)
                WHERE Cart_ID = @cartId AND Game_ID = @gameId
            `);
        
        res.json({ success: true });
    } catch (err) {
        console.error('Update cart error:', err);
        res.status(500).json({ error: 'Failed to update cart' });
    }
});

// Remove item from cart
app.post('/api/cart/remove-item', async (req, res) => {
    try {
        const { userId, gameId } = req.body;
        const pool = await sql.connect(config);
        
        // Get cart ID
        const cartResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT Cart_ID FROM Shopping_Cart WHERE User_ID = @userId');
        
        if (cartResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Cart not found' });
        }
        const cartId = cartResult.recordset[0].Cart_ID;
        
        // Remove item
        await pool.request()
            .input('cartId', sql.Int, cartId)
            .input('gameId', sql.Int, gameId)
            .query('DELETE FROM Cart_Item WHERE Cart_ID = @cartId AND Game_ID = @gameId');
        
        res.json({ success: true });
    } catch (err) {
        console.error('Remove item error:', err);
        res.status(500).json({ error: 'Failed to remove item' });
    }
});

// Checkout endpoint
app.post('/api/cart/checkout', async (req, res) => {
    try {
        const { userId, selectedItems } = req.body;
        const pool = await sql.connect(config);
        
        // Get cart ID
        const cartResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT Cart_ID FROM Shopping_Cart WHERE User_ID = @userId');
        
        if (cartResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Cart not found' });
        }
        
        res.json({ 
            success: true,
            orderTotal: selectedItems.reduce((sum, item) => sum + item.price, 0)
        });
    } catch (err) {
        console.error('Checkout error:', err);
        res.status(500).json({ error: 'Checkout failed' });
    }
});

// Create order endpoint
app.post('/api/orders', async (req, res) => {
    const { userId, items, paymentMethod, iban, totalAmount } = req.body;
    let pool;
    try {
        pool = await sql.connect(config);
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        // Get cart ID
        const cartResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT Cart_ID FROM Shopping_Cart WHERE User_ID = @userId');
        
        if (cartResult.recordset.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Cart not found' });
        }
        const cartId = cartResult.recordset[0].Cart_ID;

        // Create order
        const orderResult = await pool.request()
            .input('userId', sql.Int, userId)
            .input('totalAmount', sql.Decimal(10,2), totalAmount)
            .query(`
                INSERT INTO [Order] (User_ID, Total_Amount, Status)
                OUTPUT INSERTED.Order_ID
                VALUES (@userId, @totalAmount, 'Pending')
            `);
        const orderId = orderResult.recordset[0].Order_ID;

        // Add order details
        for (const item of items) {
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .input('gameId', sql.Int, item.gameId)
                .input('price', sql.Decimal(10,2), item.price)
                .query(`
                    INSERT INTO order_details (Order_ID, Game_ID, Price)
                    VALUES (@orderId, @gameId, @price)
                `);
        }

        // Create payment record
        await pool.request()
            .input('orderId', sql.Int, orderId)
            .input('paymentMethod', sql.NVarChar, paymentMethod)
            .input('amount', sql.Decimal(10,2), totalAmount)
            .input('iban', sql.NVarChar, iban || '')
            .query(`
                INSERT INTO Payment (Order_ID, Payment_Method, Amount, IBAN)
                VALUES (@orderId, @paymentMethod, @amount, @iban)
            `);

        // Remove purchased items from cart
        const gameIds = items.map(item => parseInt(item.gameId));
        await pool.request()
            .input('cartId', sql.Int, cartId)
            .query(`
                DELETE FROM Cart_Item 
                WHERE Cart_ID = @cartId 
                AND Game_ID IN (${gameIds.map(id => id).join(',')})
            `);

        await transaction.commit();
        res.json({ success: true, orderId });
    } catch (err) {
        console.error('Order processing error:', err);
        if (pool && pool.transaction) await pool.transaction.rollback();
        res.status(500).json({ error: 'Order processing failed', details: err.message });
    } finally {
        if (pool) pool.close();
    }
});
// Get all games with featured status (for admin and search)
app.get('/api/games', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const query = `
            SELECT 
                Game_ID AS id, 
                Name AS title, 
                ImageData AS image, 
                Price AS finalPrice, 
                Featured,
                Genre,
                Platform,
                Description
            FROM Game
        `;
        const result = await pool.request().query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching all games:', err);
        res.status(500).json({ error: 'Failed to fetch games', details: err.message });
    }
});

// Update featured status
app.post('/api/games/update-featured', async (req, res) => {
    try {
        const { gameId, featured } = req.body;
        const pool = await sql.connect(config);
        
        const query = `
            UPDATE Game 
            SET Featured = @featured 
            WHERE Game_ID = @gameId
        `;
        await pool.request()
            .input('gameId', sql.Int, gameId)
            .input('featured', sql.Bit, featured)
            .query(query);
            
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating featured status:', err);
        res.status(500).json({ error: 'Failed to update featured status', details: err.message });
    }
});

// Add Game Endpoint
app.post('/api/games/add', async (req, res) => {
    const { name, price, imageData, genre, platform, description, featured } = req.body;
    
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('price', sql.Decimal(10,2), price)
            .input('imageData', sql.NVarChar, imageData)
            .input('genre', sql.NVarChar, genre)
            .input('platform', sql.NVarChar, platform)
            .input('description', sql.NVarChar, description)
            .input('featured', sql.Bit, featured)
            .query(`
                INSERT INTO Game (Name, Price, ImageData, Genre, Platform, Description, Featured)
                OUTPUT INSERTED.Game_ID
                VALUES (@name, @price, @imageData, @genre, @platform, @description, @featured)
            `);
        
        res.status(200).json({ 
            success: true, 
            gameId: result.recordset[0].Game_ID 
        });
    } catch (error) {
        console.error('Error adding game:', error);
        res.status(500).json({ 
            error: 'Failed to add game',
            details: error.message 
        });
    }
});

// Delete Game Endpoint
app.delete('/api/games/:gameId', async (req, res) => {
    const { gameId } = req.params;
    
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('gameId', sql.Int, gameId)
            .query(`
                DELETE FROM Game 
                WHERE Game_ID = @gameId
            `);
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Game not found' });
        }
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error deleting game:', error);
        res.status(500).json({ 
            error: 'Failed to delete game',
            details: error.message 
        });
    }
});

// Update Game Endpoint
app.get('/api/games/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('gameId', sql.Int, gameId)
            .query('SELECT * FROM Game WHERE Game_ID = @gameId');
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Game not found' });
        }
        
        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error fetching game:', error);
        res.status(500).json({ error: 'Failed to fetch game' });
    }
});

app.put('/api/games/:gameId', async (req, res) => {
    const { gameId } = req.params;
    const { name, price, imageData, genre, platform, description, featured } = req.body;
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('gameId', sql.Int, gameId)
            .input('name', sql.NVarChar, name)
            .input('price', sql.Decimal(10,2), price)
            .input('imageData', sql.NVarChar, imageData)
            .input('genre', sql.NVarChar, genre)
            .input('platform', sql.NVarChar, platform)
            .input('description', sql.NVarChar, description)
            .input('featured', sql.Bit, featured)
            .query(`
                UPDATE Game 
                SET 
                    Name = @name,
                    Price = @price,
                    ImageData = @imageData,
                    Genre = @genre,
                    Platform = @platform,
                    Description = @description,
                    Featured = @featured
                WHERE Game_ID = @gameId
            `);
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Game not found' });
        }
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error updating game:', error);
        res.status(500).json({ 
            error: 'Failed to update game',
            details: error.message 
        });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});