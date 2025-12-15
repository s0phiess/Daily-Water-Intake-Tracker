document.addEventListener('DOMContentLoaded', () => {
  const goalBtns = document.querySelectorAll('.goal-btn');
  const customGoal = document.getElementById('customGoal');
  const saveCustomGoal = document.getElementById('saveCustomGoal');
  const notificationsToggle = document.getElementById('notificationsToggle');
  const testNotification = document.getElementById('testNotification');

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
    });
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
        alert('Notifications are not supported in this browser.');
        return;
      }
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          currentSettings.notificationsEnabled = true;
          saveSettings(currentSettings).then(() => {
            loadSettings();
          });
        } else {
          alert('Notification permission denied.');
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
      alert('Notifications are not supported in this browser.');
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
        } else {
          alert('Notification permission denied.');
        }
      });
    }
  });

  loadSettings();
});