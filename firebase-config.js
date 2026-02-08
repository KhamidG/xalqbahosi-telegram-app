// ===== FIREBASE CONFIGURATION =====
// Firebase configuration for Xalq Bahosi app
const firebaseConfig = {
  apiKey: "AIzaSyDemoKey-ReplaceWithRealKey",
  authDomain: "xalq-bahosi.firebaseapp.com",
  projectId: "xalq-bahosi",
  storageBucket: "xalq-bahosi.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
if (typeof firebase === 'undefined') {
  // Load Firebase SDK
  const script = document.createElement('script');
  script.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
  document.head.appendChild(script);
  
  const firestoreScript = document.createElement('script');
  firestoreScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js';
  document.head.appendChild(firestoreScript);
}

// Initialize Firebase when loaded
window.addEventListener('load', () => {
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
  } else {
    console.error('Firebase failed to load');
  }
});

// ===== FIREBASE DATABASE =====
class FirebaseDB {
  constructor() {
    this.db = null;
    this.init();
  }

  async init() {
    // Wait for Firebase to load
    while (typeof firebase === 'undefined' || !firebase.firestore) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.db = firebase.firestore();
    console.log('Firestore initialized');
  }

  // Reviews
  async getReviews() {
    if (!this.db) await this.init();
    const snapshot = await this.db.collection('reviews').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async addReview(review) {
    if (!this.db) await this.init();
    const docRef = await this.db.collection('reviews').add(review);
    return { id: docRef.id, ...review };
  }

  // Locations
  async getLocations() {
    if (!this.db) await this.init();
    const snapshot = await this.db.collection('locations').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async updateLocation(id, updates) {
    if (!this.db) await this.init();
    await this.db.collection('locations').doc(id).update(updates);
  }

  // Announcements
  async getAnnouncements() {
    if (!this.db) await this.init();
    const snapshot = await this.db.collection('announcements').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async addAnnouncement(announcement) {
    if (!this.db) await this.init();
    const docRef = await this.db.collection('announcements').add(announcement);
    return { id: docRef.id, ...announcement };
  }
}

// Global Firebase instance
window.firebaseDB = new FirebaseDB();
