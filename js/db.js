const DB_NAME = 'WaterTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'waterIntake';

let db;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('date', 'date', { unique: false });
      }
    };
  });
}

function addWaterIntake(amount) {
  return openDB().then(() => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const now = new Date();
    const data = {
      amount: amount,
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

function getDailyIntake(date) {
  return openDB().then(() => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('date');
    return new Promise((resolve, reject) => {
      const request = index.getAll(date);
      request.onsuccess = () => {
        const intakes = request.result;
        const total = intakes.reduce((sum, intake) => sum + intake.amount, 0);
        resolve(total);
      };
      request.onerror = () => reject(request.error);
    });
  });
}

function getAllIntakes() {
  return openDB().then(() => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
}

function getIntakesByDate(date) {
  return openDB().then(() => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('date');
    return new Promise((resolve, reject) => {
      const request = index.getAll(date);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
}