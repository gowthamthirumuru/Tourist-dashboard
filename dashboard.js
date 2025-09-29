document.addEventListener('DOMContentLoaded', function () {

    // --- Sidebar & Mobile Menu Logic ---
    const sidebarLinks = document.querySelectorAll('.sidebar-links li a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function () {
            sidebarLinks.forEach(item => item.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // --- Dashboard Specific Logic ---
    const API_BASE_URL = 'http://localhost:4000/api';

    function initializeDashboard() {
        Promise.all([
            fetch(`${API_BASE_URL}/alerts`).then(res => res.json()),
            fetch(`${API_BASE_URL}/teams`).then(res => res.json()),
            fetch(`${API_BASE_URL}/regions`).then(res => res.json())
        ]).then(([alerts, teams, regions]) => {
            renderLiveEmergencies(alerts);
            renderKPIs(alerts, teams);
            renderAvailableTeams(teams);
            renderPriorityNotifications(); // Uses hardcoded data as it's not in your db.json
            populateRegions(regions);
        }).catch(error => {
            console.error("Failed to load dashboard data:", error);
        });
    }

    function timeSince(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 60;
        if (interval > 1) {
            return Math.floor(interval) + " min ago";
        }
        return Math.floor(seconds) + " sec ago";
    }

    function renderLiveEmergencies(alerts) {
        const container = document.getElementById('live-emergencies-list');
        if (!container) return;
        
        const liveAlerts = alerts.filter(a => (a.priority === 'Critical' || a.priority === 'High') && a.status !== 'resolved').slice(0, 2);
        
        document.getElementById('live-active-count').textContent = `${liveAlerts.length} ACTIVE`;
        document.getElementById('command-center-active-text').textContent = `${liveAlerts.length} Active Emergencies`;

        container.innerHTML = liveAlerts.map(alert => {
             // Map "Lost Tourist" from db.json to "Tourist Missing" for display
             const displayType = alert.type === "Lost Tourist" ? "Tourist Missing" : alert.type;
             const typeClass = displayType.toLowerCase().replace(/ /g, '-');
             
             return `
                <div class="live-emergency-item">
                    <div class="emergency-details">
                        <div>
                            <strong>
                                <span class="emergency-type type-${typeClass}">${displayType}</span>
                                <span class="emergency-status">${alert.status.toUpperCase()}</span>
                            </strong>
                            <span>${alert.id} • <span class="emergency-time">${timeSince(new Date(alert.timestamp))}</span></span>
                        </div>
                        <div>
                            <strong>Tourist</strong>
                            <span>${alert.touristName}</span>
                        </div>
                        <div>
                            <strong>Location</strong>
                            <span>${alert.location}</span>
                        </div>
                    </div>
                    <span>Assigned Team: <strong>${alert.assignedTeam}</strong></span>
                    <div class="emergency-actions">
                        <button class="dispatch-btn">Dispatch</button>
                        <button title="Call"><span class="material-icons-outlined">call</span></button>
                        <button title="Locate"><span class="material-icons-outlined">my_location</span></button>
                    </div>
                </div>
             `;
        }).join('');
    }

    function renderKPIs(alerts, teams) {
        const activeEmergencies = alerts.filter(a => a.status !== 'resolved').length;
        const availableTeams = teams.filter(t => t.status === 'available').length;
        const totalTeams = teams.length;
        const respondingTeams = teams.filter(t => t.status === 'responding').length;

        const avgResponseTime = (teams.reduce((acc, team) => acc + (team.avgResponseTime || 0), 0) / teams.filter(t => t.avgResponseTime).length).toFixed(1);

        document.getElementById('kpi-active-emergencies').textContent = activeEmergencies;
        document.getElementById('kpi-available-teams').textContent = `${availableTeams}/${totalTeams}`;
        document.getElementById('kpi-responding-teams').textContent = `${respondingTeams} responding`;
        document.getElementById('kpi-response-time').textContent = `${avgResponseTime} min`;
    }

    function renderAvailableTeams(teams) {
        const container = document.getElementById('available-teams-list');
        if(!container) return;

        const available = teams.filter(t => t.status === 'available');
        const availableCount = document.getElementById('available-teams-count');
        if(availableCount) availableCount.textContent = `${available.length} Available`;

        container.innerHTML = available.slice(0, 4).map(team => `
            <div class="team-item">
                <div class="team-info">
                    <strong>${team.name} - ${team.specialization}</strong>
                    <span>${team.location} • ETA: ${Math.floor(Math.random() * 5) + 4} min</span>
                </div>
                <div class="team-actions">
                    <button class="deploy-btn">Deploy</button>
                    <button title="Call"><span class="material-icons-outlined">call</span></button>
                </div>
            </div>
        `).join('');
    }

    function renderPriorityNotifications() {
        const container = document.getElementById('notifications-list');
        if(!container) return;

        // NOTE: This data is hardcoded because it does not exist in your db.json
        const notifications = [
            { type: 'Weather', summary: 'Monsoon alert issued for Mumbai region - 47 tourists in affected area', time: '2 min ago'},
            { type: 'Capacity', summary: 'Taj Mahal at 95% tourist capacity - crowd control recommended', time: '5 min ago'},
            { type: 'System', summary: 'GPS tracking system experiencing delays in Jaipur region', time: '9 min ago'}
        ];

        container.innerHTML = notifications.map(notif => {
            const type = notif.type.toLowerCase();
            let actionText = "Take Action";
            if (type === 'weather') actionText = "Send Weather Advisory";
            if (type === 'capacity') actionText = "Deploy Crowd Control";
            if (type === 'system') actionText = "Technical Support";
            
            return `
                 <div class="notification-item ${type}">
                    <span class="notification-tag">${notif.type}</span>
                    <div class="notification-info">
                        <p>${notif.summary}</p>
                        <span>${notif.time}</span>
                    </div>
                    <button class="notification-action">${actionText}</button>
                </div>
            `;
        }).join('');
    }

    function populateRegions(regions) {
        const select = document.getElementById('broadcast-region-select');
        if (!select) return;
        select.innerHTML = '<option>Select region</option>';
        regions.forEach(region => {
            select.innerHTML += `<option value="${region.id}">${region.name}</option>`;
        });
    }

    initializeDashboard();
});