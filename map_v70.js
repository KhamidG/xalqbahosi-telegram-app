// Map State
let map;
let markers = [];

function initMap() {
  if (map) return;

  const defaultCenter = [41.2995, 69.2401]; // Tashkent
  map = L.map('map', {
    zoomControl: false,
    attributionControl: false
  }).setView(defaultCenter, 13);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(map);

  // Add custom zoom control to the bottom right
  L.control.zoom({
    position: 'bottomright'
  }).addTo(map);
}

function updateMarkers(locations) {
  if (!map) {
    console.error('UpdateMarkers: Map not initialized');
    return;
  }

  // Force map to recognize its container size
  map.invalidateSize();

  console.log(`Updating markers for ${locations.length} locations`);

  // Clear existing markers
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  const typeIcons = {
    'maktab': '🏫',
    'klinika': '🏥',
    'yo\'l': '🛣️',
    'suv': '💧',
    'default': '📍'
  };

  locations.forEach(loc => {
    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="
        background: white; 
        width: 36px; 
        height: 36px; 
        border-radius: 50%; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-size: 20px;
        border: 2px solid var(--tg-theme-button-color);
      ">${typeIcons[loc.type] || typeIcons.default}</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const marker = L.marker([loc.lat, loc.lon], { icon }).addTo(map);

    marker.on('click', () => {
      if (typeof onLocationClick === 'function') {
        onLocationClick(loc.id);
      }
    });

    markers.push(marker);
  });

  if (locations.length > 0) {
    const group = new L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.1));
  }
}
