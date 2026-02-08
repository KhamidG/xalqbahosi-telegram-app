// ===== TELEGRAM WEB APP INITIALIZATION =====
const tg = window.Telegram.WebApp;
tg.ready();

// ===== CONFIGURATION =====
// Use production API for Telegram Mini App
const API_BASE = 'https://85.198.80.141/api';

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

// ===== API CALLS =====
async function loadNearbyLocations() {
  try {
    const { latitude, longitude } = state.userLocation;
    const response = await fetch(`${API_BASE}/api/locations/nearby?lat=${latitude}&lon=${longitude}&radius=5000`);
    const data = await response.json();
    if (data.success && data.data.length > 0) {
      state.locations = data.data;
      updateMarkers(state.locations);
      renderLocationsList();
    } else {
      // If no nearby locations, load all
      loadAllLocations();
    }
  } catch (err) {
    console.error('API Error:', err);
    loadAllLocations();
  }
}

async function loadAllLocations() {
  try {
    const response = await fetch(`${API_BASE}/api/locations`);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    if (data.success) {
      state.locations = data.data;
      updateMarkers(state.locations);
      renderLocationsList();

      if (state.locations.length === 0) {
        safeAlert('Hozircha xaritada hech qanday joy belgilanmagan.');
      }
    } else {
      safeAlert('Ma\'lumotlarni yuklashda xatolik yuz berdi.');
    }
  } catch (err) {
    console.error('All Locations Error:', err);
    safeAlert(`Serverga ulanib bo'lmadi.\nURL: ${API_BASE}\nXato: ${err.message}`);
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

  const fileInput = document.getElementById('review-file');
  const file = fileInput.files[0];

  const btn = document.getElementById('btn-submit-review-fallback');
  btn.disabled = true;
  btn.textContent = 'Yuborilmoqda...';

  try {
    const formData = new FormData();
    formData.append('locationId', state.selectedLocation.id);
    formData.append('userId', tg.initDataUnsafe?.user?.id || 0);
    formData.append('userName', tg.initDataUnsafe?.user?.first_name || 'Anonim');
    formData.append('rating', state.currentRating);
    formData.append('category', state.currentCategory);
    formData.append('text', text);
    if (file) {
      formData.append('media', file);
    }

    const response = await fetch(`${API_BASE}/api/reviews`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    if (data.success) {
      tg.HapticFeedback.notificationOccurred('success');

      if (file) {
        safePopup('Fikringiz va isbotingiz qabul qilindi! AI tekshiruvi boshlandi.');
      } else {
        safePopup('Fikringiz uchun rahmat!');
      }

      document.getElementById('modal-review').classList.remove('active');
      document.getElementById('review-file').value = '';
      document.getElementById('file-preview').textContent = 'Fayl tanlanmagan';

      tg.MainButton.hide();
      loadAllLocations();
    }
  } catch (err) {
    tg.HapticFeedback.notificationOccurred('error');
    safeAlert('Yuborishda xatolik yuz berdi');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Yuborish';
    tg.MainButton.enable();
    tg.MainButton.hideProgress();
  }
}

// ===== APP INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  tg.expand(); // Expand to full height

  document.getElementById('btn-geo').addEventListener('click', handleGeolocation);

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
  document.getElementById('btn-admin-view').addEventListener('click', () => showScreen('admin-login'));
  document.getElementById('btn-do-login').addEventListener('click', handleAdminLogin);
  document.getElementById('btn-admin-logout').addEventListener('click', handleAdminLogout);
  document.getElementById('btn-save-location').addEventListener('click', saveNewLocation);

  document.getElementById('btn-show-stats').addEventListener('click', () => {
    showScreen('stats');
    loadStats();
    loadAnnouncements();
  });
  document.getElementById('btn-post-news').addEventListener('click', saveAnnouncement);

  // Handle dark mode
  if (tg.colorScheme === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
  }

  console.log('Uzbek TMA Started');
});

// Bridge functions for map.js
async function onLocationClick(locationId) {
  const url = `${API_BASE}/api/locations/${locationId}`;
  try {
    // Show loading state
    tg.MainButton.setText('Yuklanmoqda...');
    tg.MainButton.show();
    tg.MainButton.showProgress();

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Server xatosi: ${response.status}`);
    }

    const data = await response.json();

    tg.MainButton.hide();
    tg.MainButton.hideProgress();

    if (data.success) {
      state.selectedLocation = data.data;
      renderLocationDetail(state.selectedLocation);
      showScreen('detail');
      tg.HapticFeedback.impactOccurred('light');
    } else {
      safeAlert('Ma\'lumotlarni olishda xatolik: ' + (data.error || 'Noma\'lum xato'));
    }
  } catch (err) {
    tg.MainButton.hide();
    console.error('Error loading location details:', err);
    safeAlert(`Ma'lumotlarni yuklashda xatolik yuz berdi.\nURL: ${url}\nXato: ${err.message}`);
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
    const response = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password: pass })
    });
    const data = await response.json();

    if (data.success) {
      tg.HapticFeedback.notificationOccurred('success');
      showScreen('admin-dashboard');
      renderAdminPlacesList();
    } else {
      safeAlert(data.error);
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
    const response = await fetch(`${API_BASE}/api/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, lat, lon, address })
    });
    const data = await response.json();

    if (data.success) {
      tg.HapticFeedback.notificationOccurred('success');
      safePopup('Joy muvaffaqiyatli saqlandi!');
      // Clear form
      document.getElementById('new-loc-name').value = '';
      document.getElementById('new-loc-address').value = '';
      document.getElementById('new-loc-lat').value = '';
      document.getElementById('new-loc-lon').value = '';

      loadAllLocations(); // Refresh map data
      renderAdminPlacesList(); // Refresh admin list
    }
  } catch (err) {
    safeAlert('Saqlashda xato: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Saqlash';
  }
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

async function loadAnnouncements() {
  const container = document.getElementById('announcements-list');
  try {
    const response = await fetch(`${API_BASE}/api/announcements`);
    const data = await response.json();
    if (data.success) {
      container.innerHTML = data.data.map(news => `
        <div style="background: var(--tg-theme-secondary-bg-color); padding: 16px; border-radius: var(--radius-md); margin-bottom: 12px; border-left: 4px solid ${news.type === 'success' ? '#2ecc71' : news.type === 'warning' ? '#f1c40f' : '#3498db'};">
          <h4 style="margin-bottom: 6px; font-size: 15px;">${news.title}</h4>
          <p style="font-size: 13px; color: var(--tg-theme-text-color); margin-bottom: 8px;">${news.content}</p>
          <div style="font-size: 10px; color: var(--tg-theme-hint-color);">${new Date(news.createdAt).toLocaleDateString('uz-UZ')}</div>
        </div>
      `).join('') || '<div style="color: var(--tg-theme-hint-color); font-size: 13px;">Hozircha yangiliklar yo\'q.</div>';
    }
  } catch (err) {
    container.innerHTML = 'Yuklashda xato';
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
    const response = await fetch(`${API_BASE}/api/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, type })
    });
    const data = await response.json();

    if (data.success) {
      tg.HapticFeedback.notificationOccurred('success');
      safePopup('Yangilik muvaffaqiyatli e\'lon qilindi!');
      document.getElementById('news-title').value = '';
      document.getElementById('news-content').value = '';
    }
  } catch (err) {
    safeAlert('Saqlashda xato: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'E\'lon qilish';
  }
}
