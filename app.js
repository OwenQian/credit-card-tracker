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
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
});
