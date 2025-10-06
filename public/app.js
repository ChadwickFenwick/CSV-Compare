class CSVCompareApp {
    constructor() {
        this.files = { file1: null, file2: null };
        this.csvData = { file1: null, file2: null };
        this.headers = { file1: [], file2: [] };
        this.comparisonResults = null;
        this.ruleCounter = 1;

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const file1Input = document.getElementById('file1');
        const file2Input = document.getElementById('file2');
        const uploadBtn = document.getElementById('upload-btn');
        const compareBtn = document.getElementById('compare-btn');
        const addRuleBtn = document.getElementById('add-rule-btn');

        file1Input.addEventListener('change', (e) => this.handleFileSelect(e, 'file1'));
        file2Input.addEventListener('change', (e) => this.handleFileSelect(e, 'file2'));

        this.setupDragAndDrop('upload-zone-1', 'file1');
        this.setupDragAndDrop('upload-zone-2', 'file2');

        uploadBtn.addEventListener('click', () => this.processFiles());
        compareBtn.addEventListener('click', () => this.runComparison());
        addRuleBtn.addEventListener('click', () => this.addComparisonRule());

        this.setupResultsTabs();
        this.setupExportButtons();
    }

    setupDragAndDrop(zoneId, fileKey) {
        const zone = document.getElementById(zoneId);
        const fileInput = document.getElementById(fileKey);

        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('dragover');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');

            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type === 'text/csv') {
                fileInput.files = files;
                this.handleFileSelect({ target: fileInput }, fileKey);
            } else {
                this.showError('Please drop a valid CSV file');
            }
        });

        zone.addEventListener('click', () => {
            fileInput.click();
        });
    }

    handleFileSelect(event, fileKey) {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            this.showError('Please select a valid CSV file');
            return;
        }

        this.files[fileKey] = file;
        this.updateFileDisplay(fileKey, file);
        this.checkUploadReadiness();
    }

    updateFileDisplay(fileKey, file) {
        const zone = document.getElementById(`upload-zone-${fileKey === 'file1' ? '1' : '2'}`);
        const info = document.getElementById(`${fileKey}-info`);

        zone.classList.add('uploaded');
        info.style.display = 'block';
        info.querySelector('.file-name').textContent = file.name;
        info.querySelector('.file-size').textContent = this.formatFileSize(file.size);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    checkUploadReadiness() {
        const uploadBtn = document.getElementById('upload-btn');
        uploadBtn.disabled = !(this.files.file1 && this.files.file2);
    }

    async processFiles() {
        this.showLoading('Processing CSV files...');

        try {
            const formData = new FormData();
            formData.append('file1', this.files.file1);
            formData.append('file2', this.files.file2);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const result = await response.json();
            this.csvData.file1 = result.files.file1.data;
            this.csvData.file2 = result.files.file2.data;

            await this.generatePreviews();
            this.populateColumnSelectors();
            this.showSection('mapping-section');

        } catch (error) {
            this.showError(`Failed to process files: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    async generatePreviews() {
        try {
            const [preview1, preview2] = await Promise.all([
                this.getPreview(this.csvData.file1),
                this.getPreview(this.csvData.file2)
            ]);

            this.headers.file1 = preview1.headers;
            this.headers.file2 = preview2.headers;

        } catch (error) {
            throw new Error(`Preview generation failed: ${error.message}`);
        }
    }

    async getPreview(csvData) {
        const response = await fetch('/api/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ csvData })
        });

        if (!response.ok) {
            throw new Error(`Preview failed: ${response.statusText}`);
        }

        return response.json();
    }

    populateColumnSelectors() {
        const selectors = [
            { element: document.getElementById('rule-0-col1'), headers: this.headers.file1 },
            { element: document.getElementById('rule-0-col2'), headers: this.headers.file2 }
        ];

        selectors.forEach(({ element, headers }) => {
            element.innerHTML = '<option value="">Select column...</option>';
            headers.forEach(header => {
                const option = document.createElement('option');
                option.value = header;
                option.textContent = header;
                element.appendChild(option);
            });
        });

        this.updateCompareButtonState();
    }

    addComparisonRule() {
        const rulesContainer = document.getElementById('comparison-rules');
        const ruleIndex = this.ruleCounter++;

        const ruleHTML = `
            <div class="rule-item" data-rule-index="${ruleIndex}">
                <div class="rule-header">
                    <h4>Fallback Rule ${ruleIndex}</h4>
                    <div>
                        <span class="rule-priority">Priority: ${ruleIndex + 1}</span>
                        <button class="remove-rule" onclick="app.removeRule(${ruleIndex})">Remove</button>
                    </div>
                </div>
                <div class="rule-config">
                    <div class="column-selector">
                        <label>First CSV Column:</label>
                        <select id="rule-${ruleIndex}-col1" class="column-select">
                            <option value="">Select column...</option>
                            ${this.headers.file1.map(h => `<option value="${h}">${h}</option>`).join('')}
                        </select>
                    </div>
                    <div class="column-selector">
                        <label>Second CSV Column:</label>
                        <select id="rule-${ruleIndex}-col2" class="column-select">
                            <option value="">Select column...</option>
                            ${this.headers.file2.map(h => `<option value="${h}">${h}</option>`).join('')}
                        </select>
                    </div>
                    <div class="rule-name">
                        <label>Rule Name:</label>
                        <input type="text" id="rule-${ruleIndex}-name" placeholder="e.g., Email Match" value="Fallback ${ruleIndex}">
                    </div>
                </div>
            </div>
        `;

        rulesContainer.insertAdjacentHTML('beforeend', ruleHTML);

        document.getElementById(`rule-${ruleIndex}-col1`).addEventListener('change', () => this.updateCompareButtonState());
        document.getElementById(`rule-${ruleIndex}-col2`).addEventListener('change', () => this.updateCompareButtonState());
    }

    removeRule(ruleIndex) {
        const ruleElement = document.querySelector(`[data-rule-index="${ruleIndex}"]`);
        if (ruleElement) {
            ruleElement.remove();
            this.updateCompareButtonState();
        }
    }

    updateCompareButtonState() {
        const compareBtn = document.getElementById('compare-btn');
        const rules = this.getComparisonRules();
        compareBtn.disabled = rules.length === 0 || !rules.some(rule => rule.column1 && rule.column2);
    }

    getComparisonRules() {
        const rules = [];
        const ruleElements = document.querySelectorAll('.rule-item');

        ruleElements.forEach(element => {
            const index = element.dataset.ruleIndex;
            const col1 = document.getElementById(`rule-${index}-col1`)?.value;
            const col2 = document.getElementById(`rule-${index}-col2`)?.value;
            const name = document.getElementById(`rule-${index}-name`)?.value;

            if (col1 && col2) {
                rules.push({ column1: col1, column2: col2, name: name || `Rule ${index}` });
            }
        });

        return rules;
    }

    async runComparison() {
        this.showLoading('Comparing CSV files...');

        try {
            const comparisonRules = this.getComparisonRules();

            const response = await fetch('/api/compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file1Data: this.csvData.file1,
                    file2Data: this.csvData.file2,
                    comparisonRules
                })
            });

            if (!response.ok) {
                throw new Error(`Comparison failed: ${response.statusText}`);
            }

            this.comparisonResults = await response.json();
            this.displayResults();
            this.showSection('results-section');

        } catch (error) {
            this.showError(`Comparison failed: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    displayResults() {
        const stats = this.comparisonResults.statistics;

        document.getElementById('total-records').textContent = stats.file1TotalRows;
        document.getElementById('matches-found').textContent = stats.matchesFound;
        document.getElementById('missing-records').textContent = stats.missingInFile1;
        document.getElementById('match-rate').textContent = `${stats.matchRate}%`;

        this.displayMissingRecords();
        this.displayMatches();
    }

    displayMissingRecords() {
        const container = document.getElementById('missing-table');
        const missingRecords = this.comparisonResults.missingInFile1;

        if (missingRecords.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 40px; color: #4caf50; font-size: 1.2rem;">🎉 All records from File 1 have matches in File 2!</p>';
            return;
        }

        const table = this.createDataTable(missingRecords.map(r => r.data), this.comparisonResults.file1Headers);
        container.innerHTML = '';
        container.appendChild(table);
    }

    displayMatches() {
        const container = document.getElementById('matches-table');
        const matches = this.comparisonResults.matches;

        if (matches.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 40px; color: #f56565; font-size: 1.2rem;">❌ No matches found between the files</p>';
            return;
        }

        const enrichedMatches = matches.map(match => ({
            'Match Rule': match.matchedOn,
            'Matched Value': match.value,
            ...match.file1Data
        }));

        const headers = ['Match Rule', 'Matched Value', ...this.comparisonResults.file1Headers];
        const table = this.createDataTable(enrichedMatches, headers);
        container.innerHTML = '';
        container.appendChild(table);
    }

    createDataTable(data, headers) {
        if (!data || data.length === 0) {
            const div = document.createElement('div');
            div.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">No data to display</p>';
            return div;
        }

        const table = document.createElement('table');

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        data.forEach(row => {
            const tr = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = row[header] || '';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        return table;
    }

    setupResultsTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    setupExportButtons() {
        document.getElementById('export-missing-btn').addEventListener('click', () => {
            this.exportData('missing');
        });

        document.getElementById('export-matches-btn').addEventListener('click', () => {
            this.exportData('matches');
        });
    }

    async exportData(type) {
        if (!this.comparisonResults) {
            this.showError('No comparison results to export');
            return;
        }

        try {
            let data, headers, filename;

            if (type === 'missing') {
                data = this.comparisonResults.missingInFile1.map(r => r.data);
                headers = this.comparisonResults.file1Headers;
                filename = 'missing-records.csv';
            } else if (type === 'matches') {
                data = this.comparisonResults.matches.map(match => ({
                    'Match Rule': match.matchedOn,
                    'Matched Value': match.value,
                    ...match.file1Data
                }));
                headers = ['Match Rule', 'Matched Value', ...this.comparisonResults.file1Headers];
                filename = 'matched-records.csv';
            }

            const response = await fetch('/api/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data, headers, filename })
            });

            if (!response.ok) {
                throw new Error(`Export failed: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            this.showError(`Export failed: ${error.message}`);
        }
    }

    showSection(sectionId) {
        document.querySelectorAll('.step-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');
    }

    showLoading(message) {
        document.getElementById('loading-text').textContent = message;
        document.getElementById('loading').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    showError(message) {
        const errorElement = document.getElementById('error-message');
        errorElement.querySelector('.error-text').textContent = message;
        errorElement.style.display = 'flex';

        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        document.getElementById('error-message').style.display = 'none';
    }
}

function hideError() {
    document.getElementById('error-message').style.display = 'none';
}

const app = new CSVCompareApp();

document.addEventListener('DOMContentLoaded', () => {
    const ruleSelects = document.querySelectorAll('.column-select');
    ruleSelects.forEach(select => {
        select.addEventListener('change', () => app.updateCompareButtonState());
    });
});