import { getSettings, saveSettings } from './db.js';

export function initSettings() {
  const goalBtns = document.querySelectorAll('.goal-btn');
  const customGoal = document.getElementById('customGoal');
  const saveCustomGoal = document.getElementById('saveCustomGoal');
  const notificationsToggle = document.getElementById('notificationsToggle');
  const testNotification = document.getElementById('testNotification');
  const useLocation = document.getElementById('useLocation');
  const locationStatus = document.getElementById('locationStatus');
  const clearLocation = document.getElementById('clearLocation');

  let currentSettings = {};

  function loadSettings() {
    getSettings().then(settings => {
      currentSettings = settings;
      // Highlight current goal
      goalBtns.forEach(btn => {
        if (parseInt(btn.dataset.goal) === settings.dailyGoal) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      // Set toggle
      if (settings.notificationsEnabled) {
        notificationsToggle.classList.add('active');
      } else {
        notificationsToggle.classList.remove('active');
      }
      // Set location
      updateLocationDisplay();
    });
  }

  function updateLocationDisplay() {
    const location = currentSettings.location;
    if (location) {
      if (location.city && location.country) {
        locationStatus.textContent = `${location.city}, ${location.country}`;
      } else {
        locationStatus.textContent = `Coordinates: ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`;
      }
      clearLocation.style.display = 'block';
    } else {
      locationStatus.textContent = 'Not set';
      clearLocation.style.display = 'none';
    }
  }

  goalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const goal = parseInt(btn.dataset.goal);
      currentSettings.dailyGoal = goal;
      saveSettings(currentSettings).then(() => {
        loadSettings();
      });
    });
  });

  saveCustomGoal.addEventListener('click', () => {
    const goal = parseInt(customGoal.value);
    if (goal >= 500 && goal <= 5000) {
      currentSettings.dailyGoal = goal;
      saveSettings(currentSettings).then(() => {
        customGoal.value = '';
        loadSettings();
      });
    }
  });

  notificationsToggle.addEventListener('click', () => {
    if (!currentSettings.notificationsEnabled) {
      // Turning ON
      if (!('Notification' in window)) {
        // silent fail; keep behavior minimal in module
        return;
      }
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          currentSettings.notificationsEnabled = true;
          saveSettings(currentSettings).then(() => {
            loadSettings();
          });
        }
      });
    } else {
      // Turning OFF
      currentSettings.notificationsEnabled = false;
      saveSettings(currentSettings).then(() => {
        loadSettings();
      });
    }
  });

  testNotification.addEventListener('click', () => {
    if (!('Notification' in window)) {
      return;
    }
    if (Notification.permission === 'granted') {
      new Notification('Daily Water Intake Tracker', {
        body: 'Time to hydrate 💧'
      });
      if ('vibrate' in navigator) {
        navigator.vibrate(500);
      }
    } else {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Daily Water Intake Tracker', {
            body: 'Time to hydrate 💧'
          });
          if ('vibrate' in navigator) {
            navigator.vibrate(500);
          }
        }
      });
    }
  });

  useLocation.addEventListener('click', () => {
    if (!('geolocation' in navigator)) {
      locationStatus.textContent = 'Geolocation not supported on this device.';
      return;
    }
    locationStatus.textContent = 'Locating…';
    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        // Try reverse geocode
        reverseGeocode(lat, lon).then(address => {
          const location = {
            lat: lat,
            lon: lon,
            city: address.city || null,
            country: address.country || null,
            updatedAt: new Date().toISOString()
          };
          currentSettings.location = location;
          saveSettings(currentSettings).then(() => {
            updateLocationDisplay();
            locationStatus.textContent = 'Saved';
            setTimeout(() => updateLocationDisplay(), 2000);
          });
        }).catch(() => {
          // Offline or failed
          const location = {
            lat: lat,
            lon: lon,
            city: null,
            country: null,
            updatedAt: new Date().toISOString()
          };
          currentSettings.location = location;
          saveSettings(currentSettings).then(() => {
            updateLocationDisplay();
            locationStatus.textContent = 'Saved coordinates (offline — city unavailable)';
            setTimeout(() => updateLocationDisplay(), 2000);
          });
        });
      },
      error => {
        let message = 'Unknown error';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Unavailable';
            break;
          case error.TIMEOUT:
            message = 'Timeout';
            break;
        }
        locationStatus.textContent = message;
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  });

  clearLocation.addEventListener('click', () => {
    currentSettings.location = null;
    saveSettings(currentSettings).then(() => {
      updateLocationDisplay();
    });
  });

  function reverseGeocode(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
    return fetch(url, {
      headers: {
        'User-Agent': 'Daily-Water-Intake-Tracker/1.0'
      }
    }).then(response => response.json()).then(data => {
      const address = data.address || {};
      return {
        city: address.city || address.town || address.village || null,
        country: address.country || null
      };
    });
  }

  loadSettings();
}