// ===== TELEGRAM WEB APP INITIALIZATION =====
const tg = window.Telegram.WebApp;
tg.ready();

// ===== CONFIGURATION =====
// Use Firebase for real-time synchronization
const API_BASE = null; // Disabled - using Firebase instead

// ===== CLOUD STORAGE =====
const cloudStorage = {
  async getReviews() {
    try {
      if (window.firebaseDB) {
        return await window.firebaseDB.getReviews();
      } else {
        // Fallback to localStorage
        return JSON.parse(window.localStorage.getItem('xalq_reviews') || '[]');
      }
    } catch (err) {
      console.error('Error getting reviews:', err);
      return JSON.parse(window.localStorage.getItem('xalq_reviews') || '[]');
    }
  },

  async saveReview(review) {
    try {
      if (window.firebaseDB) {
        return await window.firebaseDB.addReview(review);
      } else {
        // Fallback to localStorage
        const reviews = JSON.parse(window.localStorage.getItem('xalq_reviews') || '[]');
        reviews.push(review);
        window.localStorage.setItem('xalq_reviews', JSON.stringify(reviews));
        return review;
      }
    } catch (err) {
      console.error('Error saving review:', err);
      // Fallback to localStorage
      const reviews = JSON.parse(window.localStorage.getItem('xalq_reviews') || '[]');
      reviews.push(review);
      window.localStorage.setItem('xalq_reviews', JSON.stringify(reviews));
      return review;
    }
  },

  async getLocations() {
    try {
      if (window.firebaseDB) {
        const locations = await window.firebaseDB.getLocations();
        console.log('Raw locations from Firebase:', locations);
        
        // If no locations in Firestore, initialize with demo data
        if (locations.length === 0) {
          console.log('No locations in Firestore, initializing with demo data...');
          for (const demoLocation of demoLocations) {
            await window.firebaseDB.addLocation(demoLocation);
          }
          const freshLocations = await window.firebaseDB.getLocations();
          console.log('Fresh locations after initialization:', freshLocations);
          return freshLocations;
        }
        
        // Ensure all locations have proper ID field
        const processedLocations = locations.map(loc => ({
          ...loc,
          id: loc.id || loc.locationId || loc._id || `loc_${Date.now()}_${Math.random()}`
        }));
        
        console.log('Processed locations:', processedLocations);
        return processedLocations;
      } else {
        // Fallback to localStorage
        return JSON.parse(window.localStorage.getItem('xalq_locations') || JSON.stringify(demoLocations));
      }
    } catch (err) {
      console.error('Error getting locations:', err);
      return JSON.parse(window.localStorage.getItem('xalq_locations') || JSON.stringify(demoLocations));
    }
  },

  async updateLocation(id, updates) {
    try {
      if (window.firebaseDB) {
        return await window.firebaseDB.updateLocation(id, updates);
      } else {
        // Fallback to localStorage
        const locations = JSON.parse(window.localStorage.getItem('xalq_locations') || JSON.stringify(demoLocations));
        const index = locations.findIndex(loc => loc.id === id);
        if (index !== -1) {
          locations[index] = { ...locations[index], ...updates };
          window.localStorage.setItem('xalq_locations', JSON.stringify(locations));
        }
        return true;
      }
    } catch (err) {
      console.error('Error updating location:', err);
      return false;
    }
  },

  async getAnnouncements() {
    try {
      if (window.firebaseDB) {
        return await window.firebaseDB.getAnnouncements();
      } else {
        // Fallback to localStorage
        return JSON.parse(window.localStorage.getItem('xalq_announcements') || '[]');
      }
    } catch (err) {
      console.error('Error getting announcements:', err);
      return JSON.parse(window.localStorage.getItem('xalq_announcements') || '[]');
    }
  },

  async saveAnnouncement(announcement) {
    try {
      if (window.firebaseDB) {
        return await window.firebaseDB.addAnnouncement(announcement);
      } else {
        // Fallback to localStorage
        const announcements = JSON.parse(window.localStorage.getItem('xalq_announcements') || '[]');
        announcements.unshift(announcement);
        window.localStorage.setItem('xalq_announcements', JSON.stringify(announcements));
        return announcement;
      }
    } catch (err) {
      console.error('Error saving announcement:', err);
      // Fallback to localStorage
      const announcements = JSON.parse(window.localStorage.getItem('xalq_announcements') || '[]');
      announcements.unshift(announcement);
      window.localStorage.setItem('xalq_announcements', JSON.stringify(announcements));
      return announcement;
    }
  }
};

// ===== DEBUG FUNCTIONS =====
async function testAPI() {
  console.log('Testing API...');
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    console.log('API Test Result:', data);
    safeAlert('API работает! ' + JSON.stringify(data));
  } catch (err) {
    console.error('API Test Error:', err);
    safeAlert('API ошибка: ' + err.message);
  }
}

// ===== SCREEN FUNCTIONS =====
function showStatsScreen() {
  console.log('showStatsScreen called!');
  showScreen('stats');
  loadStats();
  loadAnnouncements();
}

// ===== UTILITY FUNCTIONS =====
function clearAllData() {
  if (confirm('Barcha ma\'lumotlarni o\'chirishni hohlaysizmi?')) {
    localStorage.removeItem('xalq_reviews');
    localStorage.removeItem('xalq_locations');
    localStorage.removeItem('xalq_announcements');
    safeAlert('Barcha ma\'lumotlar o\'chirildi!');
    loadStats();
    loadAllLocations();
    loadAnnouncements();
  }
}

async function initializeDemoData() {
  if (confirm('Demo ma\'lumotlarni Firebase ga yuklashni hohlaysizmi?')) {
    try {
      if (window.firebaseDB) {
        console.log('Initializing demo data to Firebase...');
        
        // Add demo locations
        for (const demoLocation of demoLocations) {
          await window.firebaseDB.addLocation(demoLocation);
        }
        
        // Add demo announcements
        const demoNews = [
          {
            title: 'Yangi maktab ochildi',
            content: 'Bunyodkor tumanida 3-sonli maktab binosi qurilmoqda',
            type: 'success',
            createdAt: new Date().toISOString(),
            authorName: 'Admin'
          },
          {
            title: 'Yo\'l ta\'mirlanmoqda',
            content: 'Olmazor ko\'chasidagi yo\'l ta\'miri boshlandi',
            type: 'warning',
            createdAt: new Date().toISOString(),
            authorName: 'Admin'
          }
        ];
        
        for (const news of demoNews) {
          await window.firebaseDB.addAnnouncement(news);
        }
        
        safeAlert('Demo ma\'lumotlar muvaffaqiyatli yuklandi!');
        loadAllLocations();
        loadStats();
        loadAnnouncements();
      } else {
        safeAlert('Firebase hali yuklanmadi!');
      }
    } catch (err) {
      console.error('Error initializing demo data:', err);
      safeAlert('Xatolik yuz berdi: ' + err.message);
    }
  }
}

// ===== LOCAL STORAGE =====
const appStorage = {
  getReviews: () => JSON.parse(window.localStorage.getItem('xalq_reviews') || '[]'),
  saveReviews: (reviews) => window.localStorage.setItem('xalq_reviews', JSON.stringify(reviews)),
  getLocations: () => JSON.parse(window.localStorage.getItem('xalq_locations') || JSON.stringify(demoLocations)),
  saveLocations: (locations) => window.localStorage.setItem('xalq_locations', JSON.stringify(locations)),
  getAnnouncements: () => JSON.parse(window.localStorage.getItem('xalq_announcements') || '[]'),
  saveAnnouncements: (announcements) => window.localStorage.setItem('xalq_announcements', JSON.stringify(announcements))
};

// ===== HELPERS =====
function safeAlert(message) {
  try {
    if (tg.isVersionAtLeast('6.0')) {
      tg.showAlert(message);
    } else {
      alert(message);
    }
  } catch (e) {
    alert(message);
  }
}

function safePopup(message) {
  try {
    if (tg.isVersionAtLeast('6.2')) {
      tg.showPopup({ message });
    } else {
      alert(message);
    }
  } catch (e) {
    alert(message);
  }
}

// ===== STATE MANAGEMENT =====
const state = {
  currentScreen: 'welcome',
  userLocation: null,
  locations: [],
  selectedLocation: null,
  categories: [
    { id: 'infrastructure', name: 'Infratuzilma', icon: '🏗️' },
    { id: 'cleanliness', name: 'Tozalik', icon: '🧹' },
    { id: 'staff', name: 'Xodimlar', icon: '👨‍💼' },
    { id: 'wait_time', name: 'Kutish vaqti', icon: '⏱️' },
    { id: 'accessibility', name: 'Qulaylik', icon: '♿' }
  ],
  currentRating: 0,
  currentCategory: null,
  theme: tg.colorScheme === 'dark' ? 'dark' : 'light'
};

// ===== NAVIGATION =====
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(`screen-${screenId}`);
  if (screen) {
    screen.classList.add('active');
    state.currentScreen = screenId;

    // BackButton logic
    if (screenId === 'welcome') {
      tg.BackButton.hide();
    } else {
      tg.BackButton.show();
    }

    if (screenId === 'map') {
      // Always try to load locations when entering map
      if (typeof map !== 'undefined' && map) {
        loadAllLocations();
      } else {
        // Initialize map if it doesn't exist
        setTimeout(() => {
          initMap();
          loadAllLocations();
        }, 500); // Increased timeout for stability
      }
    }
  }
}

// Global back button handler
tg.BackButton.onClick(() => {
  const modal = document.getElementById('modal-review');
  if (modal.classList.contains('active')) {
    modal.classList.remove('active');
    tg.MainButton.hide();
    tg.MainButton.offClick(submitReview);
    return;
  }

  if (state.currentScreen === 'detail') {
    showScreen('map');
  } else if (state.currentScreen === 'map') {
    showScreen('welcome');
  } else if (state.currentScreen === 'admin-login') {
    showScreen('welcome');
  } else if (state.currentScreen === 'admin-dashboard') {
    showScreen('welcome');
  } else if (state.currentScreen === 'stats') {
    showScreen('welcome');
  }
});
// ===== DIRECT MAP VIEW (formerly Geolocation) =====
function handleGeolocation() {
  // Directly show map without waiting for location
  showScreen('map');
  tg.HapticFeedback.impactOccurred('medium');

  // Background check for user location just to center the map if available
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      state.userLocation = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      };
      // Center map on user if map exists
      if (typeof map !== 'undefined' && map) {
        map.setView([pos.coords.latitude, pos.coords.longitude], 13);
        if (typeof userMarker !== 'undefined' && userMarker) {
          userMarker.setLatLng([pos.coords.latitude, pos.coords.longitude]);
        }
      }
    },
    (err) => {
      console.log('Background location access denied or failed');
    }
  );
}

function renderStats(stats) {
  console.log('Rendering stats:', stats);
  const container = document.getElementById('stats-container');
  if (!container) {
    console.error('Stats container not found!');
    return;
  }
  
  // Calculate total reviews from locations
  const totalReviews = state.locations.reduce((sum, loc) => sum + (loc.reviewCount || 0), 0);
  
  // Calculate average rating
  const avgRating = state.locations.length > 0 
    ? (state.locations.reduce((sum, loc) => sum + parseFloat(loc.rating || 0), 0) / state.locations.length).toFixed(1)
    : 0;
  
  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-number">${stats.total || state.locations.length}</div>
      <div class="stat-label">Joylar</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${totalReviews}</div>
      <div class="stat-label">Fikrlar</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${avgRating}</div>
      <div class="stat-label">O'rtacha bahola</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">89</div>
      <div class="stat-label">Foydalanuvchilar</div>
    </div>
  `;
  console.log('Stats rendered');
}

// ===== API CALLS =====
async function loadNearbyLocations() {
  // Use demo data
  state.locations = demoLocations;
  if (typeof updateMarkers === 'function') {
    updateMarkers(state.locations);
  }
  if (typeof renderLocationsList === 'function') {
    renderLocationsList();
  }
}

async function loadAllLocations() {
  // Use demo data
  state.locations = demoLocations;
  if (typeof updateMarkers === 'function') {
    updateMarkers(state.locations);
  }
  if (typeof renderLocationsList === 'function') {
    renderLocationsList();
  }
}

async function loadCategories() {
  try {
    const response = await fetch(`${API_BASE}/api/categories`);
    const data = await response.json();
    if (data.success) {
      state.categories = data.data;
      renderCategories();
    }
  } catch (err) {
    console.error('Categories Error:', err);
  }
}

// ===== DEMO DATA =====
const demoLocations = [
  {
    id: 1,
    name: "Maktab №45",
    type: "maktab",
    address: "Bunyodkor ko'chasi, 15",
    lat: 41.3111,
    lon: 69.2797,
    rating: 4.5,
    reviews: 23
  },
  {
    id: 2,
    name: "Shifoxona №3",
    type: "klinika",
    address: "Olmazor ko'chasi, 8",
    lat: 41.3150,
    lon: 69.2834,
    rating: 4.2,
    reviews: 18
  },
  {
    id: 3,
    name: "Bogcha 'Bahor'",
    type: "bogcha",
    address: "Chilanzar ko'chasi, 22",
    lat: 41.3089,
    lon: 69.2765,
    rating: 4.8,
    reviews: 31
  }
];

// ===== API CALLS =====
async function loadStats() {
  console.log('Loading stats from cloud storage...');
  try {
    // Load locations from cloud storage
    const locations = await cloudStorage.getLocations();
    const reviews = await cloudStorage.getReviews();
    
    // Calculate stats
    const stats = {
      total: locations.length,
      maktab: locations.filter(l => l.type === 'maktab').length,
      klinika: locations.filter(l => l.type === 'klinika').length,
      suv: locations.filter(l => l.type === 'suv').length,
      yo_l: locations.filter(l => l.type === 'yo\'l').length
    };
    
    renderStats(stats);
    console.log('Stats calculated from cloud storage:', stats);
  } catch (err) {
    console.error('Stats calculation error:', err);
    // Fallback to demo data
    renderStats({ total: 12 });
  }
}

async function loadAllLocations() {
  console.log('Loading locations from cloud storage...');
  try {
    // Load from cloud storage
    state.locations = await cloudStorage.getLocations();
    console.log('Locations loaded from cloud storage:', state.locations.length);
  } catch (err) {
    console.error('Cloud storage error:', err);
    // Fallback to demo data
    state.locations = demoLocations;
  }
  
  // Update UI
  if (typeof updateMarkers === 'function') {
    updateMarkers(state.locations);
  }
  if (typeof renderLocationsList === 'function') {
    renderLocationsList();
  }
}

// ===== REVIEW UI LOGIC =====
function initReviewUI() {
  // Star Rating
  const stars = document.querySelectorAll('.star');
  stars.forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.dataset.value);
      state.currentRating = val;
      updateStarsUI(val);
      tg.HapticFeedback.selectionChanged();
    });
  });

  // Submit
  document.getElementById('btn-submit-review-fallback').addEventListener('click', submitReview);
  document.getElementById('btn-close-modal').addEventListener('click', () => {
    document.getElementById('modal-review').classList.remove('active');
    tg.MainButton.hide();
  });
}

function updateStarsUI(val) {
  document.querySelectorAll('.star').forEach(star => {
    const starVal = parseInt(star.dataset.value);
    star.classList.toggle('active', starVal <= val);
  });
}

function renderCategories() {
  const container = document.getElementById('categories-tags');
  container.innerHTML = state.categories.map(cat => `
    <div class="tag-chip" data-id="${cat.id}" onclick="selectCategory('${cat.id}')">
      ${cat.icon} ${cat.name}
    </div>
  `).join('');
}

function selectCategory(catId) {
  state.currentCategory = catId;
  tg.HapticFeedback.selectionChanged();
  document.querySelectorAll('.tag-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.id === catId);
  });
}

function handleFileSelect(input) {
  const preview = document.getElementById('file-preview');
  if (input.files && input.files[0]) {
    preview.textContent = '✅ ' + input.files[0].name;
    tg.HapticFeedback.impactOccurred('light');
  } else {
    preview.textContent = 'Fayl tanlanmagan';
  }
}

async function submitReview() {
  if (state.currentRating === 0) return safeAlert('Iltimos, yulduzchalar sonini tanlang');
  if (!state.currentCategory) return safeAlert('Kategoriyani tanlang');
  const text = document.getElementById('review-text').value;
  if (!text.trim()) return safeAlert('Izoh qoldiring');

  const btn = document.getElementById('btn-submit-review-fallback');
  btn.disabled = true;
  btn.textContent = 'Yuborilmoqda...';

  try {
    // Create review object
    const review = {
      locationId: state.selectedLocation.id,
      userId: tg.initDataUnsafe?.user?.id || 0,
      userName: tg.initDataUnsafe?.user?.first_name || 'Anonim',
      rating: state.currentRating,
      category: state.currentCategory,
      text: text,
      createdAt: new Date().toISOString()
    };

    console.log('Saving review to cloud:', review);

    // Save to cloud storage
    await cloudStorage.saveReview(review);

    // Update location rating
    const locations = await cloudStorage.getLocations();
    const location = locations.find(loc => loc.id === state.selectedLocation.id);
    if (location) {
      // Get all reviews for this location
      const reviews = await cloudStorage.getReviews();
      const locationReviews = reviews.filter(r => r.locationId === location.id);
      const avgRating = locationReviews.reduce((sum, r) => sum + r.rating, 0) / locationReviews.length;
      
      const ratingUpdates = {
        rating: avgRating.toFixed(1),
        reviewCount: locationReviews.length
      };
      
      await cloudStorage.updateLocation(location.id, ratingUpdates);
      
      // Update state.locations with new rating
      const stateLocationIndex = state.locations.findIndex(loc => loc.id === state.selectedLocation.id);
      if (stateLocationIndex !== -1) {
        state.locations[stateLocationIndex] = {
          ...state.locations[stateLocationIndex],
          ...ratingUpdates
        };
        console.log('Updated state location rating:', state.locations[stateLocationIndex]);
      }
      
      // Update selectedLocation too
      state.selectedLocation = {
        ...state.selectedLocation,
        ...ratingUpdates
      };
      
      console.log('Location rating updated to:', avgRating.toFixed(1));
    }

    tg.HapticFeedback.notificationOccurred('success');
    safePopup('Fikringiz uchun rahmat! Saqlandi bulut saqlashda.');

    document.getElementById('modal-review').classList.remove('active');
    document.getElementById('review-text').value = '';

    tg.MainButton.hide();
    
    // Refresh data
    loadAllLocations();
    loadStats(); // Refresh stats to update rating
    
  } catch (err) {
    console.error('Save Error:', err);
    tg.HapticFeedback.notificationOccurred('error');
    safeAlert('Yuborishda xatolik yuz berdi: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Yuborish';
    tg.MainButton.enable();
    tg.MainButton.hideProgress();
  }
}

// ===== APP INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded - initializing app...');
  
  // Check if Telegram WebApp is available
  if (!window.Telegram || !window.Telegram.WebApp) {
    console.error('Telegram WebApp not available!');
    return;
  }
  
  tg.expand(); // Expand to full height

  // Check if buttons exist
  const statsBtn = document.getElementById('btn-show-stats');
  const geoBtn = document.getElementById('btn-geo');
  const adminBtn = document.getElementById('btn-admin-view');
  
  console.log('Buttons found:', {
    stats: !!statsBtn,
    geo: !!geoBtn,
    admin: !!adminBtn
  });

  // Add event listeners with error handling
  if (geoBtn) {
    geoBtn.addEventListener('click', handleGeolocation);
    console.log('Geo button listener attached');
  }

  // Map Filter Listeners
  document.querySelectorAll('.map-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const type = chip.dataset.type;
      handleMapFilter(type);
      tg.HapticFeedback.selectionChanged();
    });
  });
  
  const searchBtn = document.getElementById('btn-search');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      safeAlert('Qidiruv funksiyasi tez orada qo\'shiladi!');
    });
  }

  initReviewUI();
  loadCategories();

  // Admin Panel Event Listeners
  if (adminBtn) {
    adminBtn.addEventListener('click', () => showScreen('admin-login'));
    console.log('Admin button listener attached');
  }
  
  const doLoginBtn = document.getElementById('btn-do-login');
  if (doLoginBtn) {
    doLoginBtn.addEventListener('click', handleAdminLogin);
  }
  
  const logoutBtn = document.getElementById('btn-admin-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleAdminLogout);
  }
  
  const saveLocationBtn = document.getElementById('btn-save-location');
  if (saveLocationBtn) {
    saveLocationBtn.addEventListener('click', saveNewLocation);
  }

  // API Test button - with error handling
  const testApiBtn = document.getElementById('btn-test-api');
  if (testApiBtn) {
    testApiBtn.addEventListener('click', testAPI);
    console.log('Test API button found and listener attached');
  } else {
    console.error('Test API button not found!');
  }

  // Stats button - with error handling
  if (statsBtn) {
    statsBtn.addEventListener('click', () => {
      console.log('Stats button clicked!');
      showScreen('stats');
      loadStats();
      loadAnnouncements();
    });
    console.log('Stats button listener attached');
  } else {
    console.error('Stats button not found!');
  }
  
  const postNewsBtn = document.getElementById('btn-post-news');
  if (postNewsBtn) {
    postNewsBtn.addEventListener('click', saveAnnouncement);
  }

  // Handle dark mode
  if (tg.colorScheme === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
  }

  console.log('Uzbek TMA Started successfully!');
});

// Bridge functions for map.js
async function onLocationClick(locationId) {
  console.log('onLocationClick called with locationId:', locationId);
  
  // Show loading state
  tg.MainButton.setText('Yuklanmoqda...');
  tg.MainButton.show();
  tg.MainButton.enable();

  try {
    console.log('Current state.locations:', state.locations);
    console.log('Looking for location with ID:', locationId);
    
    // Try to find location in current state first
    let location = state.locations.find(loc => loc.id === locationId);
    console.log('Found in state:', location);
    
    if (!location) {
      console.log('Not found in state, loading from cloud storage...');
      // If not found in state, try to load from cloud storage
      const locations = await cloudStorage.getLocations();
      console.log('Loaded from cloud storage:', locations);
      location = locations.find(loc => loc.id === locationId);
      console.log('Found in cloud storage:', location);
    }
    
    if (!location) {
      console.log('Not found in cloud storage, checking demo data...');
      // Fallback to demo data
      location = demoLocations.find(loc => loc.id === locationId);
      console.log('Found in demo data:', location);
    }
    
    if (location) {
      console.log('Location found, showing details:', location);
      state.selectedLocation = location;
      tg.MainButton.hide();
      showLocationDetail(location);
    } else {
      console.error('Location not found anywhere!');
      safeAlert('Joy topilmadi');
      tg.MainButton.hide();
    }
  } catch (err) {
    console.error('Location detail error:', err);
    // Fallback to demo data
    const location = demoLocations.find(loc => loc.id === locationId);
    console.log('Error fallback - found in demo:', location);
    if (location) {
      state.selectedLocation = location;
      tg.MainButton.hide();
      showLocationDetail(location);
    } else {
      safeAlert('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      tg.MainButton.hide();
    }
  }
}

function getCategoryName(catId) {
  const cat = state.categories.find(c => c.id === catId);
  return cat ? cat.name : catId;
}

function renderLocationDetail(loc) {
  const reviewsHtml = loc.recentReviews && loc.recentReviews.length > 0
    ? loc.recentReviews.map(r => `
        <div class="review-card">
          <div class="review-card-header">
            <span class="review-author">${r.userName}</span>
            <span class="review-stars">⭐ ${r.rating}</span>
          </div>
          <div class="review-tag">${getCategoryName(r.category)}</div>
          <p class="review-text">${r.text}</p>
          <div class="review-date">${new Date(r.createdAt).toLocaleDateString('uz-UZ')}</div>
        </div>
      `).join('')
    : `<div class="no-reviews">Hali fikrlar yo'q. Birinchi bo'ling!</div>`;

  document.getElementById('detail-content').innerHTML = `
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 24px; margin-bottom: 8px;">${loc.name}</h2>
      <p style="color: var(--tg-theme-hint-color); margin-bottom: 16px;">${loc.address}</p>
      
      <div style="display: flex; align-items: center; gap: 16px; background: var(--tg-theme-secondary-bg-color); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--glass-border);">
        <div style="text-align: center; border-right: 1px solid var(--glass-border); padding-right: 16px;">
          <div style="font-size: 32px; font-weight: 800; line-height: 1;">${Number(loc.rating || 0).toFixed(1)}</div>
          <div style="font-size: 12px; color: var(--tg-theme-hint-color); margin-top: 4px;">reyting</div>
        </div>
        <div>
          <div style="font-size: 14px; font-weight: 600;">${loc.reviewCount || 0} ta fikr</div>
          <div style="font-size: 12px; color: var(--tg-theme-hint-color);">haqiqiy foydalanuvchilardan</div>
        </div>
      </div>
    </div>

    <button onclick="openReviewModal()" class="btn-primary" style="margin-bottom: 32px;">Fikr qoldirish</button>

    <div class="reviews-section">
      <h3 style="margin-bottom: 16px; font-size: 18px;">So'nggi fikrlar</h3>
      ${reviewsHtml}
    </div>
  `;
}

function openReviewModal() {
  state.currentRating = 0;
  state.currentCategory = null;
  document.getElementById('review-text').value = '';
  updateStarsUI(0);

  // Ensure categories are rendered
  renderCategories();

  document.querySelectorAll('.tag-chip').forEach(t => t.classList.remove('active'));
  document.getElementById('modal-review').classList.add('active');

  // We rely on the on-screen buttons, so we hide Telegram Bottom Button
  tg.MainButton.hide();
}

function renderLocationsList(filteredLocations = null) {
  const listToRender = filteredLocations || state.locations;
  const container = document.getElementById('places-list');
  container.innerHTML = listToRender.map(loc => `
    <div class="premium-card" onclick="onLocationClick(${loc.id})" style="padding: 12px; margin-bottom: 8px; cursor: pointer;">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <p style="font-weight: 600; font-size: 15px;">${loc.name}</p>
          <p style="font-size: 13px; color: var(--tg-theme-hint-color);">${loc.type}</p>
        </div>
        <div style="text-align: right;">
          <p style="font-weight: 700; color: #f39c12;">⭐ ${Number(loc.rating || 0).toFixed(1)}</p>
        </div>
      </div>
    </div>
  `).join('');

  document.getElementById('bottom-sheet').classList.add('active');
}

function handleMapFilter(type) {
  // Update UI chips
  document.querySelectorAll('.map-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.type === type);
  });

  // Filter locations
  let filtered;
  if (type === 'all') {
    filtered = state.locations;
  } else {
    filtered = state.locations.filter(loc => loc.type === type);
  }

  // Update map and list
  updateMarkers(filtered);
  renderLocationsList(filtered);
}
// ===== ADMIN LOGIC =====
async function handleAdminLogin() {
  const login = document.getElementById('admin-login').value;
  const pass = document.getElementById('admin-password').value;

  if (!login || !pass) return safeAlert('Login va parolni kiriting');

  try {
    // Simulate login check for demo
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Demo credentials: admin/admin123
    if (login === 'admin' && pass === 'admin123') {
      tg.HapticFeedback.notificationOccurred('success');
      showScreen('admin-dashboard');
      renderAdminPlacesList();
      safeAlert('Admin panelga muvaffaqiyatli kirildi!');
    } else {
      safeAlert('Login yoki parol xato. Demo: admin/admin123');
    }
  } catch (err) {
    safeAlert('Login xatosi: ' + err.message);
  }
}

function handleAdminLogout() {
  showScreen('welcome');
  tg.HapticFeedback.impactOccurred('light');
}

async function saveNewLocation() {
  const name = document.getElementById('new-loc-name').value;
  const type = document.getElementById('new-loc-type').value;
  const address = document.getElementById('new-loc-address').value;
  const lat = parseFloat(document.getElementById('new-loc-lat').value);
  const lon = parseFloat(document.getElementById('new-loc-lon').value);

  if (!name || !lat || !lon) return safeAlert('Barcha maydonlarni toldiring');

  const btn = document.getElementById('btn-save-location');
  btn.disabled = true;
  btn.textContent = 'Saqlanmoqda...';

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Add to demo locations
    const newLocation = {
      id: demoLocations.length + 1,
      name,
      type,
      address,
      lat,
      lon,
      rating: 0,
      reviews: 0
    };
    demoLocations.push(newLocation);
    
    tg.HapticFeedback.notificationOccurred('success');
    safePopup('Joy muvaffaqiyatli saqlandi! Demo versiyada ko\'rsatiladi.');
    
    // Clear form
    document.getElementById('new-loc-name').value = '';
    document.getElementById('new-loc-address').value = '';
    document.getElementById('new-loc-lat').value = '';
    document.getElementById('new-loc-lon').value = '';
    
    // Refresh admin list
    renderAdminPlacesList();
    
  } catch (err) {
    safeAlert('Saqlashda xatolik yuz berdi');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Saqlash';
  }
}

async function loadCategories() {
  // Use demo categories
  const demoCategories = [
    { id: 'infrastructure', name: 'Infratuzilma', icon: '🏗️' },
    { id: 'cleanliness', name: 'Tozalik', icon: '🧹' },
    { id: 'staff', name: 'Xodimlar', icon: '👨‍💼' },
    { id: 'wait_time', name: 'Kutish vaqti', icon: '⏱️' },
    { id: 'accessibility', name: 'Qulaylik', icon: '♿' }
  ];
  state.categories = demoCategories;
  renderCategories();
}

function renderAdminPlacesList() {
  const container = document.getElementById('admin-places-list');
  container.innerHTML = state.locations.map(loc => `
    <div style="padding: 10px; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between;">
      <div>
        <strong>${loc.name}</strong><br>
        <span style="font-size: 12px; color: var(--tg-theme-hint-color);">${loc.type}</span>
      </div>
      <div style="color: #f39c12;">⭐ ${Number(loc.rating || 0).toFixed(1)}</div>
    </div>
  `).join('');
}

async function loadStats() {
  const container = document.getElementById('stats-container');
  container.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">Yuklanmoqda...</div>';

  try {
    const response = await fetch(`${API_BASE}/api/stats`);
    const data = await response.json();
    if (data.success) {
      const stats = data.data;
      const types = [
        { key: 'maktab', name: 'Maktablar', icon: '🏫' },
        { key: 'klinika', name: 'Shifoxonalar', icon: '🏥' },
        { key: 'yo\'l', name: 'Yo\'l loyihalari', icon: '🛣️' },
        { key: 'bogcha', name: 'Bog\'chalar', icon: '🧒' }
      ];

      container.innerHTML = types.map(t => `
        <div style="background: var(--tg-theme-secondary-bg-color); padding: 16px; border-radius: var(--radius-md); text-align: center;">
          <div style="font-size: 24px; margin-bottom: 4px;">${t.icon}</div>
          <div style="font-size: 20px; font-weight: 800;">${stats[t.key] || 0}</div>
          <div style="font-size: 11px; color: var(--tg-theme-hint-color); text-transform: uppercase; letter-spacing: 0.5px;">${t.name}</div>
        </div>
      `).join('');
    }
  } catch (err) {
    container.innerHTML = 'Yuklashda xato';
  }
}

function showLocationDetail(location) {
  state.selectedLocation = location;
  
  // Get reviews for this location from cloud storage
  cloudStorage.getReviews().then(reviews => {
    const locationReviews = reviews.filter(r => r.locationId === location.id);
    
    // Calculate current rating from reviews
    const currentRating = locationReviews.length > 0 
      ? (locationReviews.reduce((sum, r) => sum + r.rating, 0) / locationReviews.length).toFixed(1)
      : location.rating || 0;
    
    const detailContent = document.getElementById('detail-content');
    detailContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin-bottom: 8px;">${location.name}</h2>
        <p style="color: var(--tg-theme-hint-color); margin-bottom: 16px;">${location.address}</p>
        <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px;">
          <div style="text-align: center;">
            <div style="font-size: 24px; margin-bottom: 4px;">⭐</div>
            <div style="font-size: 18px; font-weight: bold;">${currentRating}</div>
            <div style="font-size: 12px; color: var(--tg-theme-hint-color);">Reyting</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; margin-bottom: 4px;">💬</div>
            <div style="font-size: 18px; font-weight: bold;">${location.reviewCount || locationReviews.length}</div>
            <div style="font-size: 12px; color: var(--tg-theme-hint-color);">Fikrlar</div>
          </div>
        </div>
        <button onclick="openReviewModal()" class="btn-primary" style="width: 100%; margin-bottom: 16px;">
          📝 Fikr qoldirish
        </button>
      </div>
      
      <div style="border-top: 1px solid var(--tg-theme-hint-color); padding-top: 16px;">
        <h3 style="margin-bottom: 12px;">So'nggi fikrlar (${locationReviews.length})</h3>
        ${locationReviews.length > 0 ? locationReviews.map(review => `
          <div style="background: var(--tg-theme-secondary-bg-color); padding: 12px; border-radius: var(--radius-sm); margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <strong style="color: var(--tg-theme-text-color);">${review.userName}</strong>
              <div style="display: flex; align-items: center; gap: 4px;">
                ${'⭐'.repeat(review.rating)}
                <span style="font-size: 12px; color: var(--tg-theme-hint-color);">${review.rating}.0</span>
              </div>
            </div>
            <p style="font-size: 13px; color: var(--tg-theme-text-color); margin-bottom: 8px;">${review.text}</p>
            <div style="font-size: 11px; color: var(--tg-theme-hint-color);">
              ${getCategoryName(review.category)} • ${new Date(review.createdAt).toLocaleDateString('uz-UZ')}
            </div>
          </div>
        `).join('') : '<div style="color: var(--tg-theme-hint-color); font-size: 13px;">Hozircha fikrlar yo\'q. Birinchi bo\'lib fikr qoldiring!</div>'}
      </div>
    `;
  });
  
  showScreen('detail');
}

function openReviewModal() {
  if (!state.selectedLocation) return;
  
  // Reset form
  state.currentRating = 0;
  state.currentCategory = null;
  document.getElementById('review-text').value = '';
  updateStarsUI(0);
  
  // Show modal
  document.getElementById('modal-review').classList.add('active');
  
  // Setup main button
  tg.MainButton.setText('Fikr yuborish');
  tg.MainButton.color = '#007AFF';
  tg.MainButton.show();
  tg.MainButton.enable();
  tg.MainButton.onClick(submitReview);
}

async function loadAnnouncements() {
  const container = document.getElementById('announcements-list');
  try {
    // Load from cloud storage
    const announcements = await cloudStorage.getAnnouncements();
    
    if (announcements.length > 0) {
      container.innerHTML = announcements.map(news => `
        <div style="background: var(--tg-theme-secondary-bg-color); padding: 16px; border-radius: var(--radius-md); margin-bottom: 12px; border-left: 4px solid ${news.type === 'success' ? '#2ecc71' : news.type === 'warning' ? '#f1c40f' : '#3498db'};">
          <h4 style="margin-bottom: 6px; font-size: 15px;">${news.title}</h4>
          <p style="font-size: 13px; color: var(--tg-theme-text-color); margin-bottom: 8px;">${news.content}</p>
          <div style="font-size: 10px; color: var(--tg-theme-hint-color);">${new Date(news.createdAt).toLocaleDateString('uz-UZ')}</div>
        </div>
      `).join('');
      console.log('Announcements loaded from cloud storage:', announcements.length);
    } else {
      // Fallback to demo announcements
      const demoNews = [
        {
          title: 'Yangi maktab ochildi',
          content: 'Bunyodkor tumanida 3-sonli maktab binosi qurilmoqda',
          type: 'success',
          createdAt: new Date()
        },
        {
          title: 'Yo\'l ta\'mirlanmoqda',
          content: 'Olmazor ko\'chasidagi yo\'l ta\'miri boshlandi',
          type: 'warning',
          createdAt: new Date()
        }
      ];
      
      container.innerHTML = demoNews.map(news => `
        <div style="background: var(--tg-theme-secondary-bg-color); padding: 16px; border-radius: var(--radius-md); margin-bottom: 12px; border-left: 4px solid ${news.type === 'success' ? '#2ecc71' : news.type === 'warning' ? '#f1c40f' : '#3498db'};">
          <h4 style="margin-bottom: 6px; font-size: 15px;">${news.title}</h4>
          <p style="font-size: 13px; color: var(--tg-theme-text-color); margin-bottom: 8px;">${news.content}</p>
          <div style="font-size: 10px; color: var(--tg-theme-hint-color);">${news.createdAt.toLocaleDateString('uz-UZ')}</div>
        </div>
      `).join('');
      console.log('Using demo announcements - no cloud data');
    }
  } catch (err) {
    console.error('Announcements error:', err);
    container.innerHTML = '<div style="color: var(--tg-theme-hint-color); font-size: 13px;">Yuklashda xato</div>';
  }
}

async function saveAnnouncement() {
  const title = document.getElementById('news-title').value;
  const content = document.getElementById('news-content').value;
  const type = document.getElementById('news-type').value;

  if (!title || !content) return safeAlert('Ma\'lumotlarni to\'ldiring');

  const btn = document.getElementById('btn-post-news');
  btn.disabled = true;
  btn.textContent = 'Yuborilmoqda...';

  try {
    // Create announcement object
    const announcement = {
      title: title,
      content: content,
      type: type,
      createdAt: new Date().toISOString(),
      authorName: tg.initDataUnsafe?.user?.first_name || 'Admin'
    };

    console.log('Saving announcement to cloud:', announcement);

    // Save to cloud storage
    await cloudStorage.saveAnnouncement(announcement);

    tg.HapticFeedback.notificationOccurred('success');
    safePopup('E\'lon muvaffaqiyatli joylandi! Saqlandi bulut saqlashda.');
    
    // Clear form
    document.getElementById('news-title').value = '';
    document.getElementById('news-content').value = '';
    
    // Refresh announcements
    loadAnnouncements();
    
  } catch (err) {
    console.error('Save announcement error:', err);
    safeAlert('Yuborishda xatolik yuz berdi: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'E\'lon qilish';
  }
}
