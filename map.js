document.addEventListener('DOMContentLoaded', function() {
    // --- Initialize Map ---
    const fullMap = L.map('full-map').setView([22.9734, 78.6569], 5); // Default view centered on India
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(fullMap);

    // --- Check URL for a specific location sent from another page ---
    const urlParams = new URLSearchParams(window.location.search);
    const lat = urlParams.get('lat');
    const lng = urlParams.get('lng');
    const locationName = urlParams.get('location');

    if (lat && lng) {
        // --- SCENARIO 1: A specific location was provided in the URL ---
        const targetCoords = [parseFloat(lat), parseFloat(lng)];
        
        // Center the map on that location and zoom in
        fullMap.setView(targetCoords, 14); 
        
        // Add a single, prominent marker
        L.marker(targetCoords).addTo(fullMap)
            .bindPopup(`<b>${locationName || 'Alert Location'}</b>`)
            .openPopup();
            
    } else {
        // --- SCENARIO 2: No location provided, so show all alerts ---
        fetchAllAlertsAndDisplayClustered();
    }
    
    // --- Function to fetch all alerts and display them in clusters ---
    async function fetchAllAlertsAndDisplayClustered() {
        try {
            const response = await fetch('http://localhost:4000/api/alerts');
            const alerts = await response.json();

            // Create a marker cluster group
            const markers = L.markerClusterGroup();

            alerts.forEach(alert => {
                if (alert.coords) {
                    const marker = L.marker(alert.coords)
                        .bindPopup(`<b>${alert.type}</b><br>${alert.location}`);
                    // Add marker to the cluster group instead of the map
                    markers.addLayer(marker);
                }
            });

            // Add the entire cluster group to the map
            fullMap.addLayer(markers);

        } catch (error) {
            console.error("Failed to fetch alerts for map:", error);
        }
    }
});