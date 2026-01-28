import { DRINK_COEFFS, DEFAULT_SETTINGS } from './constants.js';

const DB_NAME = 'HydrationTrackerDB';
const DB_VERSION = 2;
const STORE_DRINKS = 'drinks';
const STORE_SETTINGS = 'settings';

let db;

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_DRINKS)) {
        const store = db.createObjectStore(STORE_DRINKS, { keyPath: 'id', autoIncrement: true });
        store.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };
  });
}

export function addDrink(drinkType, amount) {
  // Validate and sanitize drinkType
  if (!(drinkType in DRINK_COEFFS)) {
    drinkType = 'other';
  }

  // Validate amount: must be finite integer between 1 and 5000
  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount) || !Number.isInteger(numAmount) || numAmount < 1 || numAmount > 5000) {
    return Promise.reject(new Error('Amount must be an integer between 1 and 5000 ml'));
  }

  const coeff = DRINK_COEFFS[drinkType];
  const hydration = Math.round(numAmount * coeff);
  return openDB().then(() => {
    const transaction = db.transaction([STORE_DRINKS], 'readwrite');
    const store = transaction.objectStore(STORE_DRINKS);
    const now = new Date();
    const data = {
      drinkType: drinkType,
      amount: numAmount,
      hydration: hydration,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0]
    };
    return new Promise((resolve, reject) => {
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
}

export function getDailyHydration(date) {
  return openDB().then(() => {
    const transaction = db.transaction([STORE_DRINKS], 'readonly');
    const store = transaction.objectStore(STORE_DRINKS);
    const index = store.index('date');
    return new Promise((resolve, reject) => {
      const request = index.getAll(date);
      request.onsuccess = () => {
        const drinks = request.result;
        const total = drinks.reduce((sum, drink) => sum + drink.hydration, 0);
        resolve(total);
      };
      request.onerror = () => reject(request.error);
    });
  });
}

export function getTodaysDrinks() {
  const today = new Date().toISOString().split('T')[0];
  return openDB().then(() => {
    const transaction = db.transaction([STORE_DRINKS], 'readonly');
    const store = transaction.objectStore(STORE_DRINKS);
    const index = store.index('date');
    return new Promise((resolve, reject) => {
      const request = index.getAll(today);
      request.onsuccess = () => resolve(request.result.reverse()); // Reverse chronological
      request.onerror = () => reject(request.error);
    });
  });
}

export function getAllDrinks() {
  return openDB().then(() => {
    const transaction = db.transaction([STORE_DRINKS], 'readonly');
    const store = transaction.objectStore(STORE_DRINKS);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
}

export function getWeeklyHydration() {
  const today = new Date();
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    week.push(dateStr);
  }
  return Promise.all(week.map(date => getDailyHydration(date))).then(hydrations => {
    return week.map((date, i) => ({ date, hydration: hydrations[i] }));
  });
}

export function getDrinkTypeBreakdown() {
  return getAllDrinks().then(drinks => {
    const breakdown = {};
    drinks.forEach(drink => {
      const type = drink.drinkType || "other";
      if (!breakdown[type]) breakdown[type] = 0;
      breakdown[type] += drink.hydration;
    });
    return breakdown;
  });
}

export function deleteLastDrink() {
  return openDB().then(() => {
    const transaction = db.transaction([STORE_DRINKS], 'readwrite');
    const store = transaction.objectStore(STORE_DRINKS);
    return new Promise((resolve, reject) => {
      const request = store.openCursor(null, 'prev'); // Last added
      request.onsuccess = event => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          resolve();
        } else {
          reject('No drinks to delete');
        }
      };
      request.onerror = () => reject(request.error);
    });
  });
}

export function deleteDrinkById(id) {
  return openDB().then(() => {
    const transaction = db.transaction([STORE_DRINKS], 'readwrite');
    const store = transaction.objectStore(STORE_DRINKS);
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

export function getSettings() {
  return openDB().then(() => {
    const transaction = db.transaction([STORE_SETTINGS], 'readonly');
    const store = transaction.objectStore(STORE_SETTINGS);
    return new Promise((resolve, reject) => {
      const request = store.get('settings');
      request.onsuccess = () => {
        const settings = request.result || DEFAULT_SETTINGS;
        resolve(settings);
      };
      request.onerror = () => reject(request.error);
    });
  });
}

export function saveSettings(settings) {
  return openDB().then(() => {
    const transaction = db.transaction([STORE_SETTINGS], 'readwrite');
    const store = transaction.objectStore(STORE_SETTINGS);
    return new Promise((resolve, reject) => {
      const request = store.put({ key: 'settings', ...settings });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}
