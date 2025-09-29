document.addEventListener('DOMContentLoaded', function() {
    // --- DOM Elements ---
    const kpiContainer = document.getElementById('alerts-kpi-grid');
    const alertsListContainer = document.getElementById('alerts-list-final');
    const statusFilter = document.getElementById('status-filter');
    const searchInput = document.getElementById('search-input');
    const exportBtn = document.getElementById('export-btn');
    const moreFiltersBtn = document.getElementById('more-filters-btn');
    const filtersModal = document.getElementById('more-filters-modal');
    const closeFiltersBtn = document.getElementById('close-filters-btn');
    const priorityFilter = document.getElementById('priority-filter');
    let alertsData = []; // This will store the master list of alerts

    // --- RENDER FUNCTIONS ---
    function renderKPIs(data) {
        const total = data.length;
        const active = data.filter(a => a.status === 'active').length;
        const responding = data.filter(a => a.status === 'responding').length;
        const resolved = data.filter(a => a.status === 'resolved').length;

        kpiContainer.innerHTML = `
            <div class="kpi-card"><div class="kpi-icon-wrapper" style="background-color: #e3f2fd;"><span class="material-icons" style="color: #2196f3;">notifications</span></div><div class="kpi-details"><div class="kpi-title">Total Alerts</div><div class="kpi-value">${total}</div></div></div>
            <div class="kpi-card"><div class="kpi-icon-wrapper" style="background-color: #ffebee;"><span class="material-icons" style="color: #f44336;">error_outline</span></div><div class="kpi-details"><div class="kpi-title">Active</div><div class="kpi-value">${active}</div></div></div>
            <div class="kpi-card"><div class="kpi-icon-wrapper" style="background-color: #fff8e1;"><span class="material-icons" style="color: #ffa000;">running_with_errors</span></div><div class="kpi-details"><div class="kpi-title">Responding</div><div class="kpi-value">${responding}</div></div></div>
            <div class="kpi-card"><div class="kpi-icon-wrapper" style="background-color: #e8f5e9;"><span class="material-icons" style="color: #4caf50;">check_circle_outline</span></div><div class="kpi-details"><div class="kpi-title">Resolved</div><div class="kpi-value">${resolved}</div></div></div>
        `;
    }

    function renderAlerts(data) {
        alertsListContainer.innerHTML = '';
        if (data.length === 0) {
            alertsListContainer.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">No alerts match the current filters.</p>';
            return;
        }

        const getPrimaryActionButton = (alert) => {
            if (alert.status === 'resolved') {
                return `<button class="primary-action resolved-btn" disabled><span class="material-icons">check_circle</span> Resolved</button>`;
            }
            if (alert.type === 'SOS' || alert.type === 'Medical Emergency') {
                return `<button class="primary-action emergency-response-btn" data-action="go-to-emergency">Emergency Response</button>`;
            }
            return `<button class="primary-action update-status-btn" data-action="update-status">Update Status</button>`;
        };

        data.forEach(alert => {
            const card = document.createElement('div');
            card.className = 'alert-card-final';
            card.dataset.id = alert.id;
            const typeClass = alert.type.toLowerCase().replace(/ /g, '-');

            card.innerHTML = `
                <div class="alert-card-header-final">
                    <span class="alert-card-tag ${typeClass}">${alert.type}</span>
                    <span class="alert-card-status ${alert.status}">${alert.status}</span>
                    <span style="color: #888;">${alert.id}</span>
                    <span style="margin-left: auto; color: #888;">${new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div class="alert-card-body">
                    <div class="alert-info-group"><span class="material-icons">person</span><div class="alert-details"><h4>${alert.touristName}</h4><span>${alert.phone}</span></div></div>
                    <div class="alert-info-group"><span class="material-icons">location_on</span><div class="alert-details"><h4>${alert.location}</h4><span>Assigned to: ${alert.assignedTeam}</span></div></div>
                    <div class="alert-actions">
                        <button data-action="call" data-phone="${alert.phone}"><span class="material-icons">call</span> Call Tourist</button>
                        <button data-action="view-location" data-coords="${alert.coords}" data-location="${alert.location}"><span class="material-icons">visibility</span> View Location</button>
                        ${getPrimaryActionButton(alert)}
                    </div>
                </div>
                <div class="alert-card-summary">${alert.summary}</div>
            `;
            alertsListContainer.appendChild(card);
        });
    }

    // --- ADVANCED FILTERING LOGIC ---
    function applyFilters() {
        const selectedStatus = statusFilter.value;
        const selectedPriority = priorityFilter.value;
        const searchTerm = searchInput.value.toLowerCase();
        
        let filteredData = alertsData;

        if (selectedStatus !== 'all') {
            filteredData = filteredData.filter(alert => alert.status.toLowerCase() === selectedStatus);
        }
        if (selectedPriority !== 'all') {
            filteredData = filteredData.filter(alert => alert.priority === selectedPriority);
        }
        if (searchTerm) {
            filteredData = filteredData.filter(alert => 
                alert.touristName.toLowerCase().includes(searchTerm) ||
                alert.location.toLowerCase().includes(searchTerm) ||
                alert.id.toLowerCase().includes(searchTerm)
            );
        }
        renderAlerts(filteredData);
    }

    // --- DATA EXPORT FUNCTIONALITY ---
    function exportToCSV() {
        const headers = ['ID', 'Type', 'Status', 'Priority', 'Tourist', 'Phone', 'Location', 'Assigned Team', 'Summary', 'Timestamp'];
        
        const formatCSVField = (field) => {
            if (field === null || field === undefined) return '';
            const stringField = String(field);
            if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                return `"${stringField.replace(/"/g, '""')}"`;
            }
            return stringField;
        };

        const rows = alertsData.map(alert => [alert.id, alert.type, alert.status, alert.priority, alert.touristName, alert.phone, alert.location, alert.assignedTeam, alert.summary, alert.timestamp].map(formatCSVField).join(','));
        
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "tourist_alerts_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // --- EVENT LISTENERS ---
    statusFilter.addEventListener('change', applyFilters);
    searchInput.addEventListener('input', applyFilters);
    priorityFilter.addEventListener('change', applyFilters);
    exportBtn.addEventListener('click', exportToCSV);
    moreFiltersBtn.addEventListener('click', () => filtersModal.classList.add('show'));
    closeFiltersBtn.addEventListener('click', () => filtersModal.classList.remove('show'));

    alertsListContainer.addEventListener('click', function(event) {
        const button = event.target.closest('button');
        if (!button) return;
        const action = button.dataset.action;
        const card = button.closest('.alert-card-final');
        if (!card) return;
        const alertId = card.dataset.id;
        
        if (action === 'go-to-emergency') {
            window.location.href = `emergency.html?alertId=${alertId}`;
        }
        else if (action === 'update-status') {
            const currentAlert = alertsData.find(a => a.id === alertId);
            if (currentAlert.status === 'resolved') return;
            const statusCycle = {'active': 'responding', 'responding': 'investigating', 'investigating': 'resolved'};
            const nextStatus = statusCycle[currentAlert.status.toLowerCase()] || 'resolved';
            fetch(`http://localhost:4000/api/alerts/${alertId}/status`, {method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus })});
        }
        else if (action === 'call') {
            window.location.href = `tel:${button.dataset.phone}`;
        } else if (action === 'view-location') {
            const alert = alertsData.find(a => a.id === alertId);
            const coords = alert ? alert.coords : null;
            const locationName = alert ? alert.location : 'Unknown Location';
            if (coords) {
                window.open(`map.html?lat=${coords[0]}&lng=${coords[1]}&location=${encodeURIComponent(locationName)}`, '_blank');
            } else {
                alert('Coordinates not available for this alert.');
            }
        }
    });

    // --- INITIAL DATA LOAD & REAL-TIME CONNECTION ---
    async function initialLoad() {
        try {
            const response = await fetch('http://localhost:4000/api/alerts');
            alertsData = await response.json();
            renderKPIs(alertsData);
            renderAlerts(alertsData);
        } catch (error) { 
            console.error('Failed to fetch initial alerts:', error); 
            alertsListContainer.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">Error loading alerts. Is the backend server running?</p>';
        }
    }

    const socket = io('http://localhost:4000');
    socket.on('alert-updated', (updatedAlert) => {
        const index = alertsData.findIndex(a => a.id === updatedAlert.id);
        if (index !== -1) {
            alertsData[index] = updatedAlert;
            renderKPIs(alertsData);
            applyFilters();
        }
    });

    initialLoad();
});