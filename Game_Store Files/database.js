// List of available tables
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

function setupRowSelection() {
    document.querySelectorAll('#tablesContainer').forEach(container => {
        container.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            if (row && row.parentElement.tagName === 'TBODY') {
                // Clear previous selections
                document.querySelectorAll('#tablesContainer tr.selected').forEach(r => {
                    r.classList.remove('selected');
                });
                // Select clicked row
                row.classList.add('selected');
            }
        });
    });
}

// Update your DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is admin
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user || user.role !== 'Admin') {
        alert('Access denied. Admin privileges required.');
        window.location.href = 'index.html';
        return;
    }
    
    // Initialize UI
    createTableCheckboxes();
    updateUserMenu();
    setupRowSelection();
    
    // Set up event listeners
    document.getElementById('refreshBtn').addEventListener('click', loadSelectedTables);
    document.getElementById('addGameBtn').addEventListener('click', openAddGameModal);
    document.getElementById('updateGameBtn').addEventListener('click', openEditGameModal);
    document.getElementById('deleteGameBtn').addEventListener('click', handleDeleteGameButton);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('gameForm').addEventListener('submit', handleGameSubmit);
    
    // Load saved table selections from sessionStorage
    loadTableSelections();
});

// Open modal for adding a new game
function openAddGameModal() {
    const modal = document.getElementById('gameModal');
    const form = document.getElementById('gameForm');
    const modalTitle = document.getElementById('modalTitle');
    
    modalTitle.textContent = 'Add New Game';
    form.reset();
    document.getElementById('gameId').value = '';
    modal.style.display = 'flex';
}

// Close the modal
function closeModal() {
    document.getElementById('gameModal').style.display = 'none';
}

// Add this function for updating games
async function updateGame(gameId, gameData) {
    try {
        const response = await fetch(`http://localhost:3000/api/games/${gameId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gameData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error updating game:', error);
        throw error;
    }
}

// Update your handleGameSubmit function to handle both add and update


// Update handleGameSubmit to handle updates
async function handleGameSubmit(event) {
    event.preventDefault();
    
    const gameId = getSelectedGameId();
    const gameData = {
        name: document.getElementById('gameName').value,
        price: parseFloat(document.getElementById('gamePrice').value),
        imageData: document.getElementById('gameImage').value,
        genre: document.getElementById('gameGenre').value,
        platform: document.getElementById('gamePlatform').value,
        description: document.getElementById('gameDescription').value,
        featured: document.getElementById('gameFeatured').checked,
       // releaseDate: document.getElementById('gameReleaseDate').value
    };
    
    try {
        if (gameId) {
            // Update existing game
            const response = await fetch(`http://localhost:3000/api/games/${gameId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gameData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } else {
            // Add new game
            const response = await fetch('http://localhost:3000/api/games/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gameData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }
        
        closeModal();
        loadSelectedTables();
    } catch (error) {
        console.error('Error saving game:', error);
        alert('Failed to save game: ' + error.message);
    }
}

// Add this function to open modal for editing
async function openEditGameModal() {
    const selectedGameId = getSelectedGameId();
    alert('Selected Game ID: ' + selectedGameId);
    if (!selectedGameId) {
        alert('Please select a game to edit.');
        return;
    }
    
    try {
        // Fetch game details
        const response = await fetch(`http://localhost:3000/api/games/${selectedGameId}`,
            {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }

            }
        );
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const gameData = await response.json();

        // Populate form
        const modal = document.getElementById('gameModal');
        document.getElementById('modalTitle').textContent = 'Edit Game';
        populateEditForm(gameData);
        modal.style.display = 'flex';
    } catch (error) {
        console.error('Error fetching game details:', error);
        alert('Failed to load game details: ' + error.message);
    }
}
// Add this function to properly populate the edit form
function populateEditForm(gameData) {
    document.getElementById('gameId').value = gameData.id;
    document.getElementById('gameName').value = gameData.title;
    document.getElementById('gamePrice').value = gameData.finalPrice;
    document.getElementById('gameImage').value = gameData.image;
    document.getElementById('gameGenre').value = gameData.Genre;
    document.getElementById('gamePlatform').value = gameData.Platform;
    document.getElementById('gameDescription').value = gameData.Description;
    document.getElementById('gameFeatured').checked = gameData.Featured;
    }
// Delete a game (used by per-row buttons)
// Update your deleteGame function to match the server endpoint
async function deleteGame(gameId) {
    if (!confirm(`Are you sure you want to delete game with ID ${gameId}?`)) return;
    
    try {
        const response = await fetch(`http://localhost:3000/api/games/${gameId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        loadSelectedTables(); // Refresh tables
    } catch (error) {
        console.error('Error deleting game:', error);
        alert('Failed to delete game: ' + error.message);
    }
}
// Handle standalone Delete Game button (requires game selection)
function handleDeleteGameButton() {
    const selectedGameId = getSelectedGameId();
    if (!selectedGameId) {
        alert('Please select a game by clicking on its row first.');
        return;
    }
    deleteGame(selectedGameId);
}

// Placeholder for game selection logic (modify as needed)
function getSelectedGameId() {
    const selectedRow = document.querySelector('#tablesContainer tr.selected');
    if (selectedRow) {
        return selectedRow.querySelector('td:first-child').textContent;
    }
    return null;
}

function createTableCheckboxes() {
    const container = document.getElementById('tableCheckboxes');
    container.innerHTML = '';
    
    ALL_TABLES.forEach(table => {
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'table-checkbox';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `chk_${table}`;
        checkbox.value = table;
        
        const label = document.createElement('label');
        label.htmlFor = `chk_${table}`;
        label.textContent = table;
        
        checkbox.addEventListener('change', tableSelectionChanged);
        
        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(label);
        container.appendChild(checkboxContainer);
    });
}

function tableSelectionChanged() {
    const checkbox = this;
    const container = checkbox.closest('.table-checkbox');
    
    if (checkbox.checked) {
        container.classList.add('checked');
    } else {
        container.classList.remove('checked');
    }
    
    updateLoadingMessageVisibility();
    saveTableSelections();
}

function updateLoadingMessageVisibility() {
    const loadingElement = document.querySelector('#tablesContainer .loading');
    if (!loadingElement) return;
    
    const anySelected = Array.from(document.querySelectorAll('.table-checkbox input'))
        .some(checkbox => checkbox.checked);
    
    loadingElement.style.display = anySelected ? 'none' : 'block';
}

function saveTableSelections() {
    const selectedTables = Array.from(document.querySelectorAll('.table-checkbox input:checked'))
        .map(checkbox => checkbox.value);
    
    sessionStorage.setItem('adminSelectedTables', JSON.stringify(selectedTables));
}

function loadTableSelections() {
    const savedTables = JSON.parse(sessionStorage.getItem('adminSelectedTables')) || [];
    
    savedTables.forEach(table => {
        const checkbox = document.querySelector(`#chk_${table}`);
        if (checkbox) {
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change'));
        }
    });
    
    // If any tables were previously selected, load them
    if (savedTables.length > 0) {
        loadSelectedTables();
    }
}

async function loadSelectedTables() {
    const selectedTables = Array.from(document.querySelectorAll('.table-checkbox input:checked'))
        .map(checkbox => checkbox.value);
    
    if (selectedTables.length === 0) {
        document.getElementById('tablesContainer').innerHTML = `
            <div class="no-tables">No tables selected. Please check the tables you want to view.</div>
        `;
        return;
    }
    
    document.getElementById('tablesContainer').innerHTML = `
        <div class="loading">Loading selected tables...</div>
    `;
    
    try {
        const response = await fetch('http://localhost:3000/api/admin/tables', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tables: selectedTables })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const allTablesData = await response.json();
        
        // Filter to only show selected tables
        const filteredData = {};
        selectedTables.forEach(table => {
            if (allTablesData[table]) {
                filteredData[table] = allTablesData[table];
            }
        });
        
        displayTables(filteredData);
    } catch (error) {
        console.error('Database load error:', error);
        document.getElementById('tablesContainer').innerHTML = `
            <div class="error-message">
                Failed to load database: ${error.message}
                <br><br>
                Make sure:
                <ul>
                    <li>The server is running</li>
                    <li>The endpoint /api/admin/tables exists</li>
                    <li>You have proper database permissions</li>
                </ul>
            </div>
        `;
    }
}

async function addFeaturedGameControls() {
    try {
        // Fetch all games with featured status
        const response = await fetch('http://localhost:3000/api/games');
        if (!response.ok) throw new Error('Failed to fetch games');
        const games = await response.json();
        
        // Find the Game table section
        const gameTable = document.getElementById('table_Game');
        if (!gameTable) return;
        
        // Add featured toggle to each game row
        const tableBody = gameTable.querySelector('tbody');
        if (!tableBody) return;
        
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 0) {
                const gameId = cells[0].textContent;
                const game = games.find(g => g.id == gameId);
                if (!game) return;
                
                // Add featured toggle button
                const actionCell = document.createElement('td');
                const toggleBtn = document.createElement('button');
                toggleBtn.className = 'featured-toggle';
                toggleBtn.textContent = game.Featured ? '★ Featured' : '☆ Add to Featured';
                toggleBtn.dataset.gameId = gameId;
                toggleBtn.dataset.featured = game.Featured;
                
                toggleBtn.addEventListener('click', async () => {
                    const newFeaturedStatus = toggleBtn.dataset.featured === 'true' ? false : true;
                    
                    try {
                        const response = await fetch('http://localhost:3000/api/games/update-featured', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                gameId: gameId, 
                                featured: newFeaturedStatus 
                            })
                        });
                        
                        if (response.ok) {
                            toggleBtn.dataset.featured = newFeaturedStatus;
                            toggleBtn.textContent = newFeaturedStatus ? '★ Featured' : '☆ Add to Featured';
                            toggleBtn.classList.add('updated');
                            setTimeout(() => toggleBtn.classList.remove('updated'), 500);
                        }
                    } catch (error) {
                        console.error('Error updating featured status:', error);
                        alert('Failed to update featured status');
                    }
                });
                
                actionCell.appendChild(toggleBtn);
                row.appendChild(actionCell);
            }
        });
        
        // Add header for the new column
        const headerRow = gameTable.querySelector('thead tr');
        if (headerRow) {
            const actionHeader = document.createElement('th');
            actionHeader.textContent = 'Featured';
            headerRow.appendChild(actionHeader);
        }
    } catch (error) {
        console.error('Error adding featured controls:', error);
    }
}

function displayTables(tablesData) {
    const container = document.getElementById('tablesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (Object.keys(tablesData).length === 0) {
        container.innerHTML = `
            <div class="no-tables">No data available for selected tables</div>
        `;
        return;
    }
    
    for (const [tableName, tableData] of Object.entries(tablesData)) {
        const tableSection = document.createElement('div');
        tableSection.className = 'table-section';
        tableSection.id = `table_${tableName}`;
        tableSection.style.display = 'block';
        
        const tableHeader = document.createElement('div');
        tableHeader.className = 'table-header';
        tableHeader.textContent = tableName;
        
        const tableContent = document.createElement('div');
        tableContent.className = 'table-content';
        
        if (tableData.error) {
            tableContent.innerHTML = `
                <div class="error">
                    Error loading ${tableName}: ${tableData.error}
                </div>
            `;
        } else {
            const table = document.createElement('table');
            
            // Create header
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            
            if (tableData.length > 0) {
                Object.keys(tableData[0]).forEach(key => {
                    const th = document.createElement('th');
                    th.textContent = key;
                    headerRow.appendChild(th);
                });
            }
            
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            // Create body
            const tbody = document.createElement('tbody');
            tableData.forEach(row => {
                const tr = document.createElement('tr');
                Object.values(row).forEach(value => {
                    const td = document.createElement('td');
                    td.textContent = value !== null ? value.toString() : 'NULL';
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
            
            table.appendChild(tbody);
            tableContent.appendChild(table);
        }
        
        tableSection.appendChild(tableHeader);
        tableSection.appendChild(tableContent);
        container.appendChild(tableSection);
        
        // Add featured game controls if showing Game table
        if (tableName === 'Game') {
            addFeaturedGameControls();
        }
    }
}

function updateUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    if (user) {
        userMenu.querySelector('.username').textContent = user.name || 'Admin';
        userMenu.onclick = () => {
            if (confirm('Do you want to logout?')) {
                sessionStorage.removeItem('userId');
                sessionStorage.removeItem('user');
                window.location.href = 'index.html';
            }
        };
    }
}