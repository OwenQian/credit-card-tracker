// Data Store
class DataStore {
    constructor() {
        this.cards = this.load('cards') || [];
        this.perks = this.load('perks') || [];
        this.usage = this.load('usage') || {};
    }

    load(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error loading data:', e);
            return null;
        }
    }

    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Error saving data:', e);
        }
    }

    // Cards
    addCard(card) {
        card.id = Date.now().toString();
        this.cards.push(card);
        this.save('cards', this.cards);
        return card;
    }

    updateCard(id, updates) {
        const index = this.cards.findIndex(c => c.id === id);
        if (index !== -1) {
            this.cards[index] = { ...this.cards[index], ...updates };
            this.save('cards', this.cards);
            return this.cards[index];
        }
        return null;
    }

    deleteCard(id) {
        this.cards = this.cards.filter(c => c.id !== id);
        this.perks = this.perks.filter(p => p.cardId !== id);
        this.save('cards', this.cards);
        this.save('perks', this.perks);
    }

    getCard(id) {
        return this.cards.find(c => c.id === id);
    }

    // Perks
    addPerk(perk) {
        perk.id = Date.now().toString();
        this.perks.push(perk);
        this.save('perks', this.perks);
        return perk;
    }

    updatePerk(id, updates) {
        const index = this.perks.findIndex(p => p.id === id);
        if (index !== -1) {
            this.perks[index] = { ...this.perks[index], ...updates };
            this.save('perks', this.perks);
            return this.perks[index];
        }
        return null;
    }

    deletePerk(id) {
        this.perks = this.perks.filter(p => p.id !== id);
        this.save('perks', this.perks);
    }

    getPerk(id) {
        return this.perks.find(p => p.id === id);
    }

    // Usage tracking
    getUsageKey(perkId, year, month) {
        const perk = this.getPerk(perkId);
        if (!perk) return `${perkId}-${year}-${month}`;

        // For period-based perks, use period identifier instead of month
        switch (perk.cadence) {
            case 'monthly':
                return `${perkId}-${year}-${month}`;
            case 'quarterly':
                const quarter = Math.ceil(month / 3);
                return `${perkId}-${year}-Q${quarter}`;
            case 'semi-annually':
                const half = month <= 6 ? 'H1' : 'H2';
                return `${perkId}-${year}-${half}`;
            case 'annually':
                return `${perkId}-${year}`;
            default:
                return `${perkId}-${year}-${month}`;
        }
    }

    getUsage(perkId, year, month) {
        const key = this.getUsageKey(perkId, year, month);
        return this.usage[key] || 0;
    }

    incrementUsage(perkId, year, month) {
        const key = this.getUsageKey(perkId, year, month);
        this.usage[key] = (this.usage[key] || 0) + 1;
        this.save('usage', this.usage);
    }

    decrementUsage(perkId, year, month) {
        const key = this.getUsageKey(perkId, year, month);
        if (this.usage[key] > 0) {
            this.usage[key]--;
            this.save('usage', this.usage);
        }
    }

    resetUsageForPeriod(perkId, year, month) {
        const key = this.getUsageKey(perkId, year, month);
        delete this.usage[key];
        this.save('usage', this.usage);
    }
}

// App State
class App {
    constructor() {
        this.store = new DataStore();
        this.currentMonth = new Date();
        this.editingCardId = null;
        this.editingPerkId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderMonthDisplay();
        this.renderChecklist();
        this.renderCards();
        this.renderPerks();
        this.updateDataStats();
        this.initGoogleDrive();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Month navigation
        document.getElementById('prev-month').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('next-month').addEventListener('click', () => this.changeMonth(1));

        // Card management
        document.getElementById('add-card-btn').addEventListener('click', () => this.openCardModal());
        document.getElementById('card-form').addEventListener('submit', (e) => this.saveCard(e));

        // Perk management
        document.getElementById('add-perk-btn').addEventListener('click', () => this.openPerkModal());
        document.getElementById('perk-form').addEventListener('submit', (e) => this.savePerk(e));

        // Modal close buttons
        document.querySelectorAll('.close-btn, .cancel-btn').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        // Close modal on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModals();
            });
        });

        // Data management
        document.getElementById('export-btn').addEventListener('click', () => this.exportData());
        document.getElementById('import-file').addEventListener('change', (e) => this.importData(e));
        document.getElementById('clear-all-data-btn').addEventListener('click', () => this.clearAllData());
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    changeMonth(delta) {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + delta);
        this.renderMonthDisplay();
        this.renderChecklist();
    }

    renderMonthDisplay() {
        const options = { year: 'numeric', month: 'long' };
        document.getElementById('current-month-display').textContent =
            this.currentMonth.toLocaleDateString('en-US', options);
    }

    // Card Management
    openCardModal(cardId = null) {
        this.editingCardId = cardId;
        const modal = document.getElementById('card-modal');
        const form = document.getElementById('card-form');
        const title = document.getElementById('card-modal-title');

        form.reset();

        if (cardId) {
            const card = this.store.getCard(cardId);
            title.textContent = 'Edit Credit Card';
            document.getElementById('card-id').value = card.id;
            document.getElementById('card-name').value = card.name;
            document.getElementById('card-issuer').value = card.issuer || '';
            document.getElementById('card-color').value = card.color || '#3b82f6';
        } else {
            title.textContent = 'Add Credit Card';
        }

        modal.classList.add('active');
    }

    saveCard(e) {
        e.preventDefault();

        const cardData = {
            name: document.getElementById('card-name').value,
            issuer: document.getElementById('card-issuer').value,
            color: document.getElementById('card-color').value
        };

        if (this.editingCardId) {
            this.store.updateCard(this.editingCardId, cardData);
        } else {
            this.store.addCard(cardData);
        }

        this.closeModals();
        this.renderCards();
        this.renderPerks();
        this.updatePerkCardSelect();
    }

    deleteCard(id) {
        if (confirm('Delete this card and all its perks?')) {
            this.store.deleteCard(id);
            this.renderCards();
            this.renderPerks();
            this.renderChecklist();
        }
    }

    renderCards() {
        const container = document.getElementById('cards-list');

        if (this.store.cards.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No credit cards yet</h3>
                    <p>Add your first credit card to start tracking perks</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.store.cards.map(card => `
            <div class="card-item" style="border-left-color: ${card.color}">
                <div class="card-color-indicator" style="background-color: ${card.color}"></div>
                <h3>${this.escapeHtml(card.name)}</h3>
                <p>${card.issuer ? this.escapeHtml(card.issuer) : 'No issuer specified'}</p>
                <div class="card-actions">
                    <button class="btn btn-edit" onclick="app.openCardModal('${card.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="app.deleteCard('${card.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    // Perk Management
    openPerkModal(perkId = null) {
        this.editingPerkId = perkId;
        const modal = document.getElementById('perk-modal');
        const form = document.getElementById('perk-form');
        const title = document.getElementById('perk-modal-title');

        form.reset();
        this.updatePerkCardSelect();

        if (perkId) {
            const perk = this.store.getPerk(perkId);
            title.textContent = 'Edit Perk';
            document.getElementById('perk-id').value = perk.id;
            document.getElementById('perk-card').value = perk.cardId;
            document.getElementById('perk-name').value = perk.name;
            document.getElementById('perk-description').value = perk.description || '';
            document.getElementById('perk-limit').value = perk.limit || 1;
            document.getElementById('perk-cadence').value = perk.cadence;
        } else {
            title.textContent = 'Add Perk';
        }

        modal.classList.add('active');
    }

    updatePerkCardSelect() {
        const select = document.getElementById('perk-card');
        const currentValue = select.value;

        select.innerHTML = '<option value="">Select a card...</option>' +
            this.store.cards.map(card =>
                `<option value="${card.id}">${this.escapeHtml(card.name)}</option>`
            ).join('');

        if (currentValue) {
            select.value = currentValue;
        }
    }

    savePerk(e) {
        e.preventDefault();

        const perkData = {
            cardId: document.getElementById('perk-card').value,
            name: document.getElementById('perk-name').value,
            description: document.getElementById('perk-description').value,
            limit: parseInt(document.getElementById('perk-limit').value) || 1,
            cadence: document.getElementById('perk-cadence').value
        };

        if (this.editingPerkId) {
            this.store.updatePerk(this.editingPerkId, perkData);
        } else {
            this.store.addPerk(perkData);
        }

        this.closeModals();
        this.renderPerks();
        this.renderChecklist();
    }

    deletePerk(id) {
        if (confirm('Delete this perk?')) {
            this.store.deletePerk(id);
            this.renderPerks();
            this.renderChecklist();
        }
    }

    renderPerks() {
        const container = document.getElementById('perks-list');

        if (this.store.perks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No perks yet</h3>
                    <p>Add perks to your credit cards to start tracking</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.store.perks.map(perk => {
            const card = this.store.getCard(perk.cardId);
            const cardColor = card ? card.color : '#3b82f6';
            return `
                <div class="perk-item" style="border-left-color: ${cardColor}">
                    <h3>${this.escapeHtml(perk.name)}</h3>
                    <p><strong>Card:</strong> ${card ? this.escapeHtml(card.name) : 'Unknown'}</p>
                    ${perk.description ? `<p>${this.escapeHtml(perk.description)}</p>` : ''}
                    <p><strong>Limit:</strong> ${perk.limit} per period</p>
                    <p><strong>Resets:</strong> <span class="badge badge-${perk.cadence}">${this.formatCadence(perk.cadence)}</span></p>
                    <div class="perk-actions">
                        <button class="btn btn-edit" onclick="app.openPerkModal('${perk.id}')">Edit</button>
                        <button class="btn btn-danger" onclick="app.deletePerk('${perk.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Checklist
    renderChecklist() {
        const container = document.getElementById('perks-checklist');
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth() + 1;

        if (this.store.perks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No perks to track</h3>
                    <p>Add some perks to see your monthly checklist</p>
                </div>
            `;
            return;
        }

        // Group perks by card
        const perksByCard = {};
        this.store.perks.forEach(perk => {
            if (!perksByCard[perk.cardId]) {
                perksByCard[perk.cardId] = [];
            }
            perksByCard[perk.cardId].push(perk);
        });

        container.innerHTML = Object.entries(perksByCard).map(([cardId, perks]) => {
            const card = this.store.getCard(cardId);
            if (!card) return '';

            const perkItems = perks.map(perk => {
                const usage = this.store.getUsage(perk.id, year, month);
                const isCompleted = usage >= perk.limit;
                const isActive = this.isPerkActiveInMonth(perk, year, month);

                if (!isActive) return '';

                return `
                    <div class="perk-checklist-item ${isCompleted ? 'completed' : ''}">
                        <input type="checkbox"
                               class="perk-checkbox"
                               ${isCompleted ? 'checked' : ''}
                               onchange="app.togglePerkUsage('${perk.id}', ${year}, ${month}, this.checked)">
                        <div class="perk-info">
                            <h4>${this.escapeHtml(perk.name)}</h4>
                            ${perk.description ? `<p>${this.escapeHtml(perk.description)}</p>` : ''}
                        </div>
                        <div class="perk-usage">
                            <span class="usage-counter">${usage}/${perk.limit}</span>
                            <span class="badge badge-${perk.cadence}">${this.formatCadence(perk.cadence)}</span>
                        </div>
                    </div>
                `;
            }).filter(item => item !== '').join('');

            if (!perkItems) return '';

            return `
                <div class="checklist-card" style="border-left: 4px solid ${card.color}">
                    <div class="checklist-card-header">${this.escapeHtml(card.name)}</div>
                    ${perkItems}
                </div>
            `;
        }).filter(card => card !== '').join('');

        if (!container.innerHTML.trim()) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No active perks for this month</h3>
                    <p>Perks will appear here when they're active based on their reset cadence</p>
                </div>
            `;
        }
    }

    togglePerkUsage(perkId, year, month, checked) {
        const perk = this.store.getPerk(perkId);
        if (!perk) return;

        const currentUsage = this.store.getUsage(perkId, year, month);

        if (checked && currentUsage < perk.limit) {
            this.store.incrementUsage(perkId, year, month);
        } else if (!checked && currentUsage > 0) {
            this.store.decrementUsage(perkId, year, month);
        }

        this.renderChecklist();
    }

    isPerkActiveInMonth(perk, year, month) {
        // All perks are active in every month within their period
        // They'll show as completed once used, based on period-based usage tracking
        return true;
    }

    formatCadence(cadence) {
        const formats = {
            'monthly': 'Monthly',
            'quarterly': 'Quarterly',
            'semi-annually': 'Semi-Annually',
            'annually': 'Annually'
        };
        return formats[cadence] || cadence;
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        this.editingCardId = null;
        this.editingPerkId = null;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Data Management
    exportData() {
        const data = {
            cards: this.store.cards,
            perks: this.store.perks,
            usage: this.store.usage,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `credit-card-perks-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showStatus('import-status', 'Data exported successfully!', 'success');
        setTimeout(() => this.hideStatus('import-status'), 3000);
    }

    async importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // Validate data structure
            if (!data.cards || !data.perks || !data.usage) {
                throw new Error('Invalid backup file format');
            }

            // Confirm before overwriting
            if (!confirm('This will replace all current data. Continue?')) {
                event.target.value = '';
                return;
            }

            // Import data
            this.store.cards = data.cards;
            this.store.perks = data.perks;
            this.store.usage = data.usage;
            this.store.save('cards', this.store.cards);
            this.store.save('perks', this.store.perks);
            this.store.save('usage', this.store.usage);

            // Refresh UI
            this.renderCards();
            this.renderPerks();
            this.renderChecklist();
            this.updateDataStats();

            this.showStatus('import-status', 'Data imported successfully!', 'success');
            setTimeout(() => this.hideStatus('import-status'), 3000);
        } catch (error) {
            this.showStatus('import-status', `Import failed: ${error.message}`, 'error');
        }

        event.target.value = '';
    }

    clearAllData() {
        if (!confirm('This will permanently delete ALL your data (cards, perks, usage). This cannot be undone. Are you sure?')) {
            return;
        }

        if (!confirm('Are you REALLY sure? This action is irreversible!')) {
            return;
        }

        localStorage.clear();
        this.store.cards = [];
        this.store.perks = [];
        this.store.usage = {};

        this.renderCards();
        this.renderPerks();
        this.renderChecklist();
        this.updateDataStats();

        alert('All data has been cleared.');
    }

    updateDataStats() {
        document.getElementById('stat-cards').textContent = this.store.cards.length;
        document.getElementById('stat-perks').textContent = this.store.perks.length;
        document.getElementById('stat-usage').textContent = Object.keys(this.store.usage).length;
    }

    showStatus(elementId, message, type) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.className = `status-message ${type}`;
    }

    hideStatus(elementId) {
        const element = document.getElementById(elementId);
        element.className = 'status-message';
    }

    // Google Drive Integration
    initGoogleDrive() {
        this.gdriveManager = new GoogleDriveManager(this);
    }
}

// Google Drive Manager
class GoogleDriveManager {
    constructor(app) {
        this.app = app;
        this.CLIENT_ID = ''; // User needs to set this up
        this.API_KEY = ''; // User needs to set this up
        this.DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
        this.SCOPES = 'https://www.googleapis.com/auth/drive.file';
        this.FILE_NAME = 'credit-card-perks-data.json';
        this.tokenClient = null;
        this.gapiInited = false;
        this.gisInited = false;
        this.accessToken = null;
        this.fileId = localStorage.getItem('gdrive_file_id');
        this.autoSync = localStorage.getItem('auto_sync') === 'true';

        this.setupEventListeners();
        this.maybeInitialize();
    }

    setupEventListeners() {
        document.getElementById('gdrive-connect-btn').addEventListener('click', () => this.handleAuthClick());
        document.getElementById('gdrive-save-btn')?.addEventListener('click', () => this.saveToDrive());
        document.getElementById('gdrive-load-btn')?.addEventListener('click', () => this.loadFromDrive());
        document.getElementById('gdrive-disconnect-btn')?.addEventListener('click', () => this.handleSignoutClick());
        document.getElementById('auto-sync-checkbox')?.addEventListener('change', (e) => this.toggleAutoSync(e.target.checked));

        // Set initial auto-sync state
        const checkbox = document.getElementById('auto-sync-checkbox');
        if (checkbox) checkbox.checked = this.autoSync;
    }

    maybeInitialize() {
        // Check if Google APIs are loaded
        if (window.gapi && window.google) {
            this.gapiLoaded();
            this.gisLoaded();
        } else {
            // Wait for scripts to load
            window.addEventListener('load', () => {
                setTimeout(() => {
                    if (window.gapi) this.gapiLoaded();
                    if (window.google) this.gisLoaded();
                }, 1000);
            });
        }
    }

    gapiLoaded() {
        gapi.load('client', async () => {
            try {
                await gapi.client.init({
                    apiKey: this.API_KEY,
                    discoveryDocs: [this.DISCOVERY_DOC],
                });
                this.gapiInited = true;
                this.maybeEnableButtons();
            } catch (error) {
                console.log('GAPI init error:', error);
            }
        });
    }

    gisLoaded() {
        try {
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.CLIENT_ID,
                scope: this.SCOPES,
                callback: (resp) => {
                    if (resp.error) {
                        this.app.showStatus('sync-status', `Auth error: ${resp.error}`, 'error');
                        return;
                    }
                    this.accessToken = resp.access_token;
                    this.updateConnectionUI(true);
                },
            });
            this.gisInited = true;
            this.maybeEnableButtons();
        } catch (error) {
            console.log('GIS init error:', error);
        }
    }

    maybeEnableButtons() {
        // Only enable if user has configured API keys
        if (!this.CLIENT_ID || !this.API_KEY) {
            document.getElementById('gdrive-connect-btn').disabled = true;
            document.getElementById('gdrive-connect-btn').textContent = 'Configure API Keys First';
            const info = document.createElement('p');
            info.className = 'info-text';
            info.innerHTML = 'See README for instructions on setting up Google Drive sync.';
            document.getElementById('gdrive-not-connected').appendChild(info);
        }
    }

    handleAuthClick() {
        if (!this.CLIENT_ID || !this.API_KEY) {
            alert('Please configure your Google Drive API credentials first. See the README for instructions.');
            return;
        }

        this.tokenClient.callback = async (resp) => {
            if (resp.error) {
                this.app.showStatus('sync-status', `Auth error: ${resp.error}`, 'error');
                return;
            }
            this.accessToken = resp.access_token;
            this.updateConnectionUI(true);
            this.app.showStatus('sync-status', 'Connected to Google Drive!', 'success');
            setTimeout(() => this.app.hideStatus('sync-status'), 3000);
        };

        if (gapi.client.getToken() === null) {
            this.tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            this.tokenClient.requestAccessToken({ prompt: '' });
        }
    }

    handleSignoutClick() {
        const token = gapi.client.getToken();
        if (token !== null) {
            google.accounts.oauth2.revoke(token.access_token);
            gapi.client.setToken('');
        }
        this.accessToken = null;
        this.fileId = null;
        localStorage.removeItem('gdrive_file_id');
        localStorage.removeItem('auto_sync');
        this.updateConnectionUI(false);
        this.app.showStatus('sync-status', 'Disconnected from Google Drive', 'info');
        setTimeout(() => this.app.hideStatus('sync-status'), 3000);
    }

    updateConnectionUI(connected) {
        if (connected) {
            document.getElementById('gdrive-not-connected').style.display = 'none';
            document.getElementById('gdrive-connected').style.display = 'block';
            const token = gapi.client.getToken();
            if (token && token.email) {
                document.getElementById('gdrive-user-email').textContent = token.email;
            }
        } else {
            document.getElementById('gdrive-not-connected').style.display = 'block';
            document.getElementById('gdrive-connected').style.display = 'none';
        }
    }

    async saveToDrive() {
        if (!this.accessToken) {
            this.app.showStatus('sync-status', 'Please connect to Google Drive first', 'error');
            return;
        }

        try {
            const data = {
                cards: this.app.store.cards,
                perks: this.app.store.perks,
                usage: this.app.store.usage,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };

            const content = JSON.stringify(data, null, 2);
            const metadata = {
                name: this.FILE_NAME,
                mimeType: 'application/json',
            };

            let response;
            if (this.fileId) {
                // Update existing file
                response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${this.fileId}?uploadType=multipart`, {
                    method: 'PATCH',
                    headers: new Headers({ Authorization: 'Bearer ' + this.accessToken }),
                    body: content,
                });
            } else {
                // Create new file
                const boundary = '-------314159265358979323846';
                const delimiter = "\r\n--" + boundary + "\r\n";
                const close_delim = "\r\n--" + boundary + "--";

                const multipartRequestBody =
                    delimiter +
                    'Content-Type: application/json\r\n\r\n' +
                    JSON.stringify(metadata) +
                    delimiter +
                    'Content-Type: application/json\r\n\r\n' +
                    content +
                    close_delim;

                response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                    method: 'POST',
                    headers: new Headers({
                        'Authorization': 'Bearer ' + this.accessToken,
                        'Content-Type': 'multipart/related; boundary="' + boundary + '"'
                    }),
                    body: multipartRequestBody,
                });

                const result = await response.json();
                this.fileId = result.id;
                localStorage.setItem('gdrive_file_id', this.fileId);
            }

            if (response.ok) {
                const now = new Date().toLocaleString();
                document.getElementById('last-sync-time').textContent = now;
                this.app.showStatus('sync-status', 'Saved to Google Drive successfully!', 'success');
                setTimeout(() => this.app.hideStatus('sync-status'), 3000);
            } else {
                throw new Error('Save failed');
            }
        } catch (error) {
            this.app.showStatus('sync-status', `Save failed: ${error.message}`, 'error');
        }
    }

    async loadFromDrive() {
        if (!this.accessToken) {
            this.app.showStatus('sync-status', 'Please connect to Google Drive first', 'error');
            return;
        }

        try {
            // Find the file
            if (!this.fileId) {
                const searchResponse = await fetch(
                    `https://www.googleapis.com/drive/v3/files?q=name='${this.FILE_NAME}'`,
                    {
                        headers: new Headers({ Authorization: 'Bearer ' + this.accessToken }),
                    }
                );
                const searchResult = await searchResponse.json();

                if (!searchResult.files || searchResult.files.length === 0) {
                    this.app.showStatus('sync-status', 'No backup found on Google Drive', 'info');
                    return;
                }

                this.fileId = searchResult.files[0].id;
                localStorage.setItem('gdrive_file_id', this.fileId);
            }

            // Load the file
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files/${this.fileId}?alt=media`,
                {
                    headers: new Headers({ Authorization: 'Bearer ' + this.accessToken }),
                }
            );

            if (!response.ok) {
                throw new Error('Load failed');
            }

            const data = await response.json();

            // Validate and import
            if (!data.cards || !data.perks || !data.usage) {
                throw new Error('Invalid data format');
            }

            if (!confirm('This will replace all current data with data from Google Drive. Continue?')) {
                return;
            }

            this.app.store.cards = data.cards;
            this.app.store.perks = data.perks;
            this.app.store.usage = data.usage;
            this.app.store.save('cards', this.app.store.cards);
            this.app.store.save('perks', this.app.store.perks);
            this.app.store.save('usage', this.app.store.usage);

            this.app.renderCards();
            this.app.renderPerks();
            this.app.renderChecklist();
            this.app.updateDataStats();

            const now = new Date().toLocaleString();
            document.getElementById('last-sync-time').textContent = now;
            this.app.showStatus('sync-status', 'Loaded from Google Drive successfully!', 'success');
            setTimeout(() => this.app.hideStatus('sync-status'), 3000);
        } catch (error) {
            this.app.showStatus('sync-status', `Load failed: ${error.message}`, 'error');
        }
    }

    toggleAutoSync(enabled) {
        this.autoSync = enabled;
        localStorage.setItem('auto_sync', enabled.toString());

        if (enabled) {
            this.app.showStatus('sync-status', 'Auto-sync enabled', 'success');
            setTimeout(() => this.app.hideStatus('sync-status'), 2000);

            // Set up auto-save on data changes
            const originalSave = this.app.store.save.bind(this.app.store);
            this.app.store.save = (key, data) => {
                originalSave(key, data);
                if (this.autoSync && this.accessToken) {
                    this.saveToDrive();
                }
            };
        }
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
});
