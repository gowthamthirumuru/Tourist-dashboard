document.addEventListener('DOMContentLoaded', function() {
    // --- Global State ---
    let allAlerts = [], allTeams = [], allProtocols = [], allContacts = [], allRegions = [];

    // --- DOM Elements ---
    const kpiContainer = document.getElementById('emergency-kpi-grid');
    const tabsContainer = document.getElementById('emergency-tabs');
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const emergenciesContainer = document.getElementById('active-emergencies');
    const teamsContainer = document.getElementById('response-teams');
    const protocolsContainer = document.getElementById('protocols');
    const regionsDropdown = document.getElementById('broadcast-regions');
    const contactsGrid = document.getElementById('contacts-grid');
    const sendBroadcastBtn = document.querySelector('.send-broadcast-btn');
    const radioModal = document.getElementById('radio-modal');
    const radioTeamName = document.getElementById('radio-team-name');
    const radioDisconnectBtn = document.getElementById('radio-disconnect-btn');
    const toast = document.getElementById('toast-notification');

    // --- TAB SWITCHING LOGIC ---
    tabsContainer.addEventListener('click', (e) => {
        if (!e.target.matches('.tab-link')) return;
        tabLinks.forEach(tab => tab.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        e.target.classList.add('active');
        const contentId = e.target.dataset.tab;
        if (document.getElementById(contentId)) {
            document.getElementById(contentId).classList.add('active');
        }
    });

    // --- DATA FETCHING ---
    async function fetchData() {
        try {
            const [alertsRes, teamsRes, protocolsRes, regionsRes, contactsRes] = await Promise.all([
                fetch('http://localhost:4000/api/alerts'),
                fetch('http://localhost:4000/api/teams'),
                fetch('http://localhost:4000/api/protocols'),
                fetch('http://localhost:4000/api/regions'),
                fetch('http://localhost:4000/api/contacts')
            ]);
            allAlerts = await alertsRes.json();
            allTeams = await teamsRes.json();
            allProtocols = await protocolsRes.json();
            allRegions = await regionsRes.json();
            allContacts = await contactsRes.json();
            renderAll();
        } catch (error) {
            console.error("Failed to fetch page data:", error);
            emergenciesContainer.innerHTML = '<p style="text-align:center; color:#888; padding: 20px;">Error loading page data. Is the backend server running?</p>';
        }
    }
    
    // --- MAIN RENDER FUNCTION ---
    function renderAll() {
        renderKPIs(allAlerts, allTeams);
        renderEmergencyCards(allAlerts);
        renderTeamCards(allTeams);
        renderProtocols(allProtocols);
        renderRegionsDropdown(allRegions);
        renderEmergencyContacts(allContacts);
    }

    // --- RENDER FUNCTIONS FOR EACH TAB ---
    function renderKPIs(alerts, teams) {
        const activeEmergencies = alerts.filter(a => a.status !== 'resolved').length;
        kpiContainer.innerHTML = `<div class="kpi-card kpi-active-emergencies"><div class="kpi-icon"><span class="material-icons">error</span></div><div><div class="kpi-value">${activeEmergencies}</div><div class="kpi-title">Active Emergencies</div></div></div><div class="kpi-card kpi-response-teams"><div class="kpi-icon"><span class="material-icons">groups</span></div><div><div class="kpi-value">${teams.length}</div><div class="kpi-title">Response Teams</div></div></div><div class="kpi-card kpi-avg-response-time"><div class="kpi-icon"><span class="material-icons">timer</span></div><div><div class="kpi-value">6.2 min</div><div class="kpi-title">Avg Response Time</div></div></div><div class="kpi-card kpi-system-status"><div class="kpi-icon"><span class="material-icons">analytics</span></div><div><div class="kpi-value">Operational</div><div class="kpi-title">System Status</div></div></div>`;
    }

    function renderEmergencyCards(alerts) {
        emergenciesContainer.innerHTML = '';
        alerts.filter(a => a.status !== 'resolved').forEach(item => {
            const card = document.createElement('div');
            card.className = `emergency-card ${item.priority.toLowerCase()}`;
            card.dataset.id = item.id;
            const assignedTeam = allTeams.find(team => team.name.includes(item.assignedTeam));
            const teamPhone = assignedTeam ? assignedTeam.phone : '';
            const teamStatusClass = item.status.toLowerCase().replace(/ /g, '-');
            const typeClass = item.type.toLowerCase().replace(/ /g, '-');
            card.innerHTML = `<div><div class="emergency-info-header"><span class="emergency-type-tag ${typeClass}">${item.type}</span><span>${item.priority}</span><span class="emergency-id">${item.id}</span></div><div class="tourist-info"><strong>${item.touristName}</strong><span>Assigned: ${item.assignedTeam} <span class="team-status-tag ${teamStatusClass}">${item.status}</span></span></div></div><div class="location-info"><strong>Location</strong><span>${item.location}</span></div><div class="time-info"><strong>Time Elapsed</strong><span class="time-elapsed">${Math.floor(Math.random() * 10) + 2} minutes</span></div><div class="actions-group"><button class="call-btn-final" data-action="call-team" data-phone="${teamPhone}"><span class="material-icons">call</span> Call Team</button><button class="track-btn-final" data-action="track-location" data-coords="${item.coords}" data-location="${item.location}"><span class="material-icons">my_location</span> Track Location</button><button class="radio-btn-final" data-action="radio-contact" data-team="${item.assignedTeam}"><span class="material-icons">cell_tower</span> Radio Contact</button><select class="update-status-dropdown"><option>Update Status</option><option value="responding">Responding</option><option value="investigating">Investigating</option></select><button class="resolve-btn" data-action="resolve"><span class="material-icons">check_circle</span> Resolve</button></div>`;
            emergenciesContainer.appendChild(card);
        });
    }

    function renderTeamCards(teams) {
        teamsContainer.innerHTML = '<div class="response-teams-grid"></div>';
        const grid = teamsContainer.querySelector('.response-teams-grid');
        teams.forEach(team => {
            const card = document.createElement('div');
            card.className = 'team-card-final';
            card.dataset.id = team.id;
            card.innerHTML = `<div class="team-card-header"><strong>${team.name}</strong><span class="team-status ${team.status}">${team.status}</span></div><div class="team-card-body"><div class="info-row"><span class="material-icons">location_on</span><span>${team.location}</span></div><div class="info-row"><span class="material-icons">groups</span><span>${team.members} members</span></div><div class="info-row"><span class="material-icons">timer</span><span>Response: ${team.responseTime}</span></div><div class="info-row"><span class="material-icons">star</span><span>Specialization: <strong>${team.specialization}</strong></span></div><div class="info-row"><span class="material-icons">medical_services</span><span>Equipment: ${team.equipment.join(', ')}</span></div></div><div class="team-card-footer"><button class="contact-btn" data-action="contact-team" data-phone="${team.phone}">Contact</button>${team.status === 'available' ? `<button class="dispatch-btn" data-action="dispatch">Dispatch</button>` : `<button class="recall-btn" data-action="recall">Recall</button>`}</div>`;
            grid.appendChild(card);
        });
    }

    function renderProtocols(protocols) {
        protocolsContainer.innerHTML = '';
        protocols.forEach(protocol => {
            const widget = document.createElement('div');
            widget.className = 'protocol-widget';
            const stepsHtml = protocol.steps.map(step => `<li>${step}</li>`).join('');
            widget.innerHTML = `<h3><span class="material-icons">gavel</span> ${protocol.type}</h3><ol class="protocol-steps">${stepsHtml}</ol>`;
            protocolsContainer.appendChild(widget);
        });
    }
    
    function renderRegionsDropdown(regions) {
        regionsDropdown.innerHTML = '<option value="">Select target regions...</option>';
        regions.forEach(region => {
            const option = document.createElement('option');
            option.value = region.id;
            option.textContent = region.name;
            regionsDropdown.appendChild(option);
        });
    }

    function renderEmergencyContacts(contacts) {
        contactsGrid.innerHTML = '';
        contacts.forEach(contact => {
            const card = document.createElement('div');
            card.className = 'contact-card';
            card.innerHTML = `<div class="contact-info"><strong>${contact.name}</strong><span>${contact.number}</span></div><div class="contact-actions"><span class="team-status active">${contact.status}</span><span class="material-icons call-icon" data-phone="${contact.number}">call</span></div>`;
            contactsGrid.appendChild(card);
        });
    }

    // --- EVENT LISTENERS ---
    emergenciesContainer.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        const action = button.dataset.action;
        const card = e.target.closest('.emergency-card');
        const alertId = card.dataset.id;
        if (action === 'call-team') { const phone = button.dataset.phone; if (phone) { window.location.href = `tel:${phone}` } else { alert('Contact not available.'); } }
        else if (action === 'track-location') { const coords = button.dataset.coords; const loc = button.dataset.location; if (coords && coords !== 'undefined' && coords !== 'null') { const [lat, lng] = coords.split(','); window.open(`map.html?lat=${lat}&lng=${lng}&location=${encodeURIComponent(loc)}`, '_blank'); } else { alert('Coordinates not available.'); } }
        else if (action === 'radio-contact') { radioTeamName.textContent = button.dataset.team; radioModal.classList.add('show'); }
        else if (action === 'resolve') { updateAlertStatus(alertId, 'resolved'); }
    });
    
    emergenciesContainer.addEventListener('change', (e) => {
        if (e.target.classList.contains('update-status-dropdown')) {
            const newStatus = e.target.value;
            if (newStatus) { const card = e.target.closest('.emergency-card'); updateAlertStatus(card.dataset.id, newStatus); }
        }
    });

    teamsContainer.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        const action = button.dataset.action;
        const card = e.target.closest('.team-card-final');
        const teamId = card.dataset.id;
        if (action === 'dispatch') updateTeamStatus(teamId, 'responding');
        if (action === 'recall') updateTeamStatus(teamId, 'available');
        if (action === 'contact-team') { const phone = button.dataset.phone; if (phone) { window.location.href = `tel:${phone}` } else { alert('Contact not available.'); } }
    });
    
    radioDisconnectBtn.addEventListener('click', () => { radioModal.classList.remove('show'); });

    sendBroadcastBtn.addEventListener('click', () => {
        const broadcastType = document.getElementById('broadcast-type').options[document.getElementById('broadcast-type').selectedIndex].text;
        const message = document.getElementById('broadcast-message').value;
        if (!broadcastType || !message) { alert('Please select a type and enter a message.'); return; }
        fetch('http://localhost:4000/api/broadcast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: broadcastType, message }) });
        showToast('Success', 'Broadcast sent successfully!');
    });

    contactsGrid.addEventListener('click', (e) => {
        if (e.target.matches('.call-icon')) { window.location.href = `tel:${e.target.dataset.phone}`; }
    });

    // --- API HELPER FUNCTIONS ---
    function updateAlertStatus(id, status) { fetch(`http://localhost:4000/api/alerts/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); }
    function updateTeamStatus(id, status) { fetch(`http://localhost:4000/api/teams/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); }

    // --- REAL-TIME UPDATES ---
    const socket = io('http://localhost:4000');
    socket.on('alert-updated', (updatedAlert) => { const i = allAlerts.findIndex(a => a.id === updatedAlert.id); if (i !== -1) allAlerts[i] = updatedAlert; renderAll(); });
    socket.on('team-updated', (updatedTeam) => { const i = allTeams.findIndex(t => t.id === updatedTeam.id); if (i !== -1) allTeams[i] = updatedTeam; renderAll(); });
    socket.on('new-broadcast', (data) => { showToast(data.type, data.message, 'campaign'); });

    function showToast(title, message, icon = 'info') {
        document.getElementById('toast-icon').textContent = icon;
        document.getElementById('toast-message').innerHTML = `<strong>${title}</strong><br>${message}`;
        toast.classList.add('show');
        setTimeout(() => { toast.classList.remove('show'); }, 5000);
    }

    // --- Initial Load ---
    fetchData();
});