/*
    This is the final, corrected script.
    The duplicate declaration of 'sidebarLinks' has been removed
    from the "Hamburger Menu Logic" section.
*/

// --- Interactive Sidebar ---
// This is the one and only time we declare sidebarLinks
const sidebarLinks = document.querySelectorAll('.sidebar-links li a');

sidebarLinks.forEach(link => {
    link.addEventListener('click', function() {
        // First, remove 'active' from all links for the main sidebar logic
        sidebarLinks.forEach(item => item.classList.remove('active'));
        // Then, add 'active' to the one that was clicked
        this.classList.add('active');
    });
});

// --- Notification Dropdown (Improved) ---
const notificationBell = document.getElementById('notification-bell');
const notificationDropdown = document.querySelector('.notification-dropdown');

notificationBell.addEventListener('click', function(event) {
    event.stopPropagation();
    notificationDropdown.classList.toggle('show');
});

window.addEventListener('click', function(event) {
    if (!notificationDropdown.contains(event.target)) {
        notificationDropdown.classList.remove('show');
    }
});

// --- Chart.js Integration: Bar Chart ---
const riskScoreCanvas = document.getElementById('riskScoreChart');
new Chart(riskScoreCanvas, {
  type: 'bar',
  data: {
    labels: ['Mumbai', 'Delhi', 'Agra', 'Jaipur', 'Goa'],
    datasets: [{
      label: 'Risk Score',
      data: [65, 59, 80, 81, 56],
      backgroundColor: 'rgba(2, 136, 209, 0.6)',
      borderColor: 'rgba(2, 136, 209, 1)',
      borderWidth: 1
    }]
  },
  options: {
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { display: false } }
  }
});

// --- Chart.js Integration: Line Chart ---
const densityCanvas = document.getElementById('densityChart');
new Chart(densityCanvas, {
  type: 'line',
  data: {
    labels: ['10am', '11am', '12pm', '1pm', '2pm', '3pm'],
    datasets: [{
      label: 'Tourist Density',
      data: [300, 450, 400, 550, 500, 650],
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  },
  options: {
    scales: { y: { beginAtZero: false } },
    plugins: { legend: { display: false } }
  }
});

// --- Dynamic Alerts ---
const alertsData = [
    { type: 'SOS', location: 'Gate A, Taj Mahal', time: '2m ago' },
    { type: 'Theft', location: 'Marine Drive, Mumbai', time: '15m ago'},
    { type: 'High Traffic', location: 'Hawa Mahal, Jaipur', time: '30m ago'},
    { type: 'Weather', location: 'Calangute Beach, Goa', time: '1h ago'}
];

const alertsListContainer = document.getElementById('alerts-list');

alertsData.forEach(alert => {
    const alertElement = document.createElement('div');
    alertElement.classList.add('alert-item');
    alertElement.innerHTML = `
        <h4>${alert.type}</h4>
        <p>${alert.location}</p>
        <span>${alert.time}</span>
    `;
    alertsListContainer.appendChild(alertElement);
});

// --- Leaflet.js Interactive Map ---
const map = L.map('interactive-map').setView([28.6139, 77.2090], 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const tajMahalCoords = [27.1751, 78.0421];
L.marker(tajMahalCoords).addTo(map)
    .bindPopup('<b>Taj Mahal</b><br>High tourist density reported.')
    .openPopup();

const gatewayCoords = [18.9220, 72.8347];
L.marker(gatewayCoords).addTo(map)
    .bindPopup('<b>Gateway of India</b><br>Moderate risk score.');

// --- Hamburger Menu Logic ---
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.querySelector('.sidebar');
const overlay = document.getElementById('overlay');
// We do NOT declare sidebarLinks again here, because it already exists from the top of the file.

menuToggle.addEventListener('click', function() {
    sidebar.classList.add('sidebar-visible');
    overlay.classList.add('show');
});

function hideSidebar() {
    sidebar.classList.remove('sidebar-visible');
    overlay.classList.remove('show');
}

overlay.addEventListener('click', hideSidebar);

// We use the existing sidebarLinks variable here.
sidebarLinks.forEach(link => {
    link.addEventListener('click', hideSidebar);
});