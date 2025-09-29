document.addEventListener('DOMContentLoaded', function() {
    // --- Global State ---
    let allTeams = [], allRiskData = [];
    
    // --- DOM Elements ---
    const tabsContainer = document.getElementById('analytics-tabs');
    const tabLinks = document.querySelectorAll('#analytics-tabs .tab-link');
    const tabContents = document.querySelectorAll('.main-content .tab-content');
    const kpiContainer = document.getElementById('analytics-kpi-grid');
    const exportBtn = document.getElementById('export-report-btn');
    const dateRangeToggle = document.getElementById('date-range-toggle');
    const dateRangeMenu = document.getElementById('date-range-menu');
    const dateRangeText = dateRangeToggle.querySelector('span:first-child');

    // --- TAB SWITCHING LOGIC ---
    tabsContainer.addEventListener('click', (e) => {
        if (!e.target.matches('.tab-link')) return;
        tabLinks.forEach(tab => tab.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        e.target.classList.add('active');
        const contentId = e.target.dataset.tab;
        if (document.getElementById(contentId)) { document.getElementById(contentId).classList.add('active'); }
    });
    
    // --- DATA FETCHING ---
    async function fetchData() {
        try {
            const [teamsRes, riskRes] = await Promise.all([
                fetch('http://localhost:4000/api/teams'),
                fetch('http://localhost:4000/api/risk-assessment')
            ]);
            if (!teamsRes.ok || !riskRes.ok) { throw new Error('Network response was not ok.'); }
            allTeams = await teamsRes.json();
            allRiskData = await riskRes.json();
            renderAll();
        } catch (error) {
            console.error("Failed to fetch page data:", error);
            const incidentContainer = document.getElementById('incident-analysis');
            if (incidentContainer) {
                incidentContainer.innerHTML = '<p style="text-align:center; color:#888; padding:20px;">Error loading page data. Is the backend server running?</p>';
            }
        }
    }
    
    // --- MAIN RENDER FUNCTION ---
    function renderAll() {
        renderKPIs();
        renderIncidentCharts();
        renderTourismStats();
        renderTourismFlowChart();
        renderTeamPerformance(allTeams);
        renderRiskAssessment(allRiskData);
    }
    
    // --- RENDER FUNCTIONS FOR ALL TABS ---
    const incidentsData = [{ type: 'Theft/Robbery', count: 98, change: -2, color: '#dc3545' },{ type: 'Medical Emergency', count: 70, change: 5, color: '#ffc107' },{ type: 'Lost/Missing', count: 56, change: 8, color: '#0d6efd' },{ type: 'Scam/Fraud', count: 34, change: 12, color: '#6f42c1' },{ type: 'Other', count: 22, change: -3, color: '#198754' }];
    const tourismStatsData = { totalVisitors: '28.4K', internationalVisitors: '12.8K', statsList: [{ label: 'Peak Season Growth', value: '+24.5%', class: 'positive' },{ label: 'Average Stay Duration', value: '4.2 days' },{ label: 'Tourist Satisfaction', value: '4.6/5' },{ label: 'Repeat Visitors', value: '18.3%' }] };
    
    function renderKPIs() {
        kpiContainer.innerHTML = `<div class="kpi-card"><div class="kpi-icon-wrapper" style="background-color: #ffebee;"><span class="material-icons-outlined" style="color: #f44336;">error_outline</span></div><div class="kpi-details"><div class="kpi-title">Total Incidents</div><div class="kpi-value">2,847</div></div><div class="kpi-change positive">+12.5%</div></div><div class="kpi-card"><div class="kpi-icon-wrapper" style="background-color: #e8f5e9;"><span class="material-icons-outlined" style="color: #4caf50;">trending_up</span></div><div class="kpi-details"><div class="kpi-title">Resolution Rate</div><div class="kpi-value">94.2%</div></div><div class="kpi-change positive">+2.1%</div></div><div class="kpi-card"><div class="kpi-icon-wrapper" style="background-color: #e3f2fd;"><span class="material-icons-outlined" style="color: #2196f3;">timer</span></div><div class="kpi-details"><div class="kpi-title">Avg Response Time</div><div class="kpi-value">7.2 min</div></div><div class="kpi-change negative">-0.8 min</div></div><div class="kpi-card"><div class="kpi-icon-wrapper" style="background-color: #f3e5f5;"><span class="material-icons-outlined" style="color: #9c27b0;">sentiment_satisfied</span></div><div class="kpi-details"><div class="kpi-title">Tourist Satisfaction</div><div class="kpi-value">4.6/5</div></div><div class="kpi-change positive">+0.2</div></div>`;
    }

    function renderIncidentCharts() {
        new Chart(document.getElementById('incidentTrendsChart'), { type: 'line', data: { labels: ['02/01', '03/01', '04/01', '05/01', '06/01', '07/01'], datasets: [{ label: 'This Period', data: [12, 19, 15, 24, 18, 28, 22], borderColor: '#dc3545', tension: 0.4, borderWidth: 3 }, { label: 'Previous Period', data: [15, 17, 12, 20, 25, 19, 24], borderColor: '#4caf50', tension: 0.4, borderWidth: 3 }] }, options: { responsive: true, maintainAspectRatio: false } });
        const categoryChartCanvas = document.getElementById('incidentCategoriesChart');
        const categoryLegendContainer = document.getElementById('category-legend');
        const totalIncidents = incidentsData.reduce((sum, item) => sum + item.count, 0);
        categoryLegendContainer.innerHTML = '';
        incidentsData.forEach(item => {
            const percentage = ((item.count / totalIncidents) * 100).toFixed(0);
            const changeClass = item.change >= 0 ? 'positive' : 'negative';
            const changeSign = item.change >= 0 ? '+' : '';
            const legendItem = `<div class="category-legend-item"><div class="legend-label"><span class="legend-dot" style="background-color: ${item.color};"></span><span class="legend-text">${item.type}</span></div><div><span class="legend-value">${percentage}%</span><span class="legend-change ${changeClass}">${changeSign}${item.change}%</span></div></div>`;
            categoryLegendContainer.innerHTML += legendItem;
        });
        new Chart(categoryChartCanvas, { type: 'pie', data: { labels: incidentsData.map(d => d.type), datasets: [{ data: incidentsData.map(d => d.count), backgroundColor: incidentsData.map(d => d.color), borderWidth: 0, }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
        new Chart(document.getElementById('responseTimeChart'), { type: 'line', data: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'], datasets: [{ data: [8.5, 8.2, 9.0, 7.5, 6.8, 7.1, 7.2], borderColor: '#0d6efd', backgroundColor: 'rgba(13, 110, 253, 0.1)', fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
    }

    function renderTourismStats() {
        document.getElementById('total-visitors').innerHTML = `<div class="value">${tourismStatsData.totalVisitors}</div><div class="label">Total Visitors</div>`;
        document.getElementById('international-visitors').innerHTML = `<div class="value">${tourismStatsData.internationalVisitors}</div><div class="label">International</div>`;
        const listContainer = document.getElementById('tourism-stats-list');
        listContainer.innerHTML = '';
        tourismStatsData.statsList.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.label}</span><span class="value ${item.class || ''}">${item.value}</span>`;
            listContainer.appendChild(li);
        });
    }

    function renderTourismFlowChart() {
        new Chart(document.getElementById('touristFlowChart'), { type: 'line', data: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], datasets: [{ label: 'International', data: [2500, 2800, 3200, 3000, 3800, 4000], borderColor: '#0d6efd', backgroundColor: 'rgba(13, 110, 253, 0.2)', fill: true, tension: 0.4 }, { label: 'Domestic', data: [1200, 2200, 1800, 2200, 2500, 2800], borderColor: '#198754', backgroundColor: 'rgba(25, 135, 84, 0.2)', fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { stacked: true } } } });
    }

    function renderTeamPerformance(teams) {
        const tableBody = document.querySelector('#team-performance-table tbody');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        teams.forEach(team => {
            let perfClass = 'average';
            if (team.successRate >= 95) perfClass = 'excellent';
            else if (team.successRate >= 90) perfClass = 'good';
            const row = `<tr><td><strong>${team.name}</strong></td><td>${team.avgResponseTime} min</td><td>${team.incidentsHandled}</td><td>${team.successRate}%</td><td><span class="performance-tag performance-${perfClass}">${perfClass.charAt(0).toUpperCase() + perfClass.slice(1)}</span></td></tr>`;
            tableBody.innerHTML += row;
        });
        new Chart(document.getElementById('responseTimeDistributionChart'), { type: 'bar', data: { labels: teams.map(t => t.name), datasets: [{ label: 'Avg Response Time (min)', data: teams.map(t => t.avgResponseTime), backgroundColor: 'rgba(33, 150, 243, 0.7)' }] }, options: { plugins: { legend: { display: false } } } });
        new Chart(document.getElementById('successRateChart'), { type: 'bar', data: { labels: teams.map(t => t.name), datasets: [{ label: 'Success Rate (%)', data: teams.map(t => t.successRate), backgroundColor: 'rgba(76, 175, 80, 0.7)' }] }, options: { scales: { y: { min: 85 } }, plugins: { legend: { display: false } } } });
    }

    function renderRiskAssessment(data) {
        const tableBody = document.querySelector('#risk-assessment-table tbody');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        data.forEach(item => {
            const riskClass = `risk-${item.riskLevel.toLowerCase()}`;
            const row = `<tr><td><strong>${item.location}</strong></td><td>${item.riskScore}</td><td>${item.incidents}</td><td>${item.touristCount.toLocaleString()}</td><td><span class="risk-level-tag ${riskClass}">${item.riskLevel}</span></td></tr>`;
            tableBody.innerHTML += row;
        });
        new Chart(document.getElementById('riskScoreDistributionChart'), { type: 'bar', data: { labels: data.map(d => d.location), datasets: [{ label: 'Risk Score', data: data.map(d => d.riskScore), backgroundColor: 'rgba(220, 53, 69, 0.7)' }] }, options: { plugins: { legend: { display: false } } } });
        new Chart(document.getElementById('incidentTouristRatioChart'), { type: 'bar', data: { labels: data.map(d => d.location), datasets: [{ label: 'Incidents per 1000 Tourists', data: data.map(d => (d.incidents / d.touristCount * 1000).toFixed(2)), backgroundColor: 'rgba(255, 193, 7, 0.7)' }] }, options: { plugins: { legend: { display: false } } } });
    }
    
    // --- EVENT LISTENERS for header buttons ---
    exportBtn.addEventListener('click', exportReport);
    
    dateRangeToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        dateRangeMenu.classList.toggle('show');
    });

    dateRangeMenu.addEventListener('click', (event) => {
        if (event.target.classList.contains('dropdown-item')) {
            dateRangeText.textContent = event.target.textContent;
            dateRangeMenu.classList.remove('show');
        }
    });

    window.addEventListener('click', (event) => {
        if (dateRangeMenu && !dateRangeToggle.contains(event.target)) {
            dateRangeMenu.classList.remove('show');
        }
    });

    // --- DATA EXPORT FUNCTIONALITY ---
    function exportReport() {
        const activeTab = tabsContainer.querySelector('.tab-link.active');
        if (!activeTab) return;
        const tabId = activeTab.dataset.tab;
        let dataToExport = [];
        let headers = [];
        let filename = 'report.csv';
        
        if (tabId === 'team-performance') {
            headers = ['id', 'name', 'phone', 'status', 'location', 'members', 'avgResponseTime', 'incidentsHandled', 'successRate', 'specialization', 'equipment'];
            dataToExport = allTeams;
            filename = 'team_performance_report.csv';
        } else if (tabId === 'risk-assessment') {
            headers = ['location', 'riskScore', 'incidents', 'touristCount', 'riskLevel'];
            dataToExport = allRiskData;
filename = 'risk_assessment_report.csv';
        } else {
            alert('Export is only available for Team Performance and Risk Assessment tabs.');
            return;
        }
        exportToCSV(headers, dataToExport, filename);
    }

    function exportToCSV(headers, data, filename) {
        const formatCSVField = (field) => {
            if (field === null || field === undefined) return '';
            let stringField = Array.isArray(field) ? field.join('; ') : String(field);
            if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                return `"${stringField.replace(/"/g, '""')}"`;
            }
            return stringField;
        };
        const rows = data.map(item => headers.map(headerKey => formatCSVField(item[headerKey])).join(','));
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // --- Initial Load ---
    fetchData();
});