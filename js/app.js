import { openDB, addDrink, getSettings, getDailyHydration, getTodaysDrinks, deleteLastDrink, deleteDrinkById, getWeeklyHydration, getDrinkTypeBreakdown, saveSettings } from './db.js';
import { DRINK_COEFFS } from './constants.js';
import { createNavbar } from './navbar.js';
import { capitalize, getDrinkIcon, showSnackbar } from './utils.js';

let remindersIntervalId = null;

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}

function initHome() {
  const statusDiv = document.getElementById('status');
  const progressText = document.getElementById('progressText');
  const progressSubtext = document.getElementById('progressSubtext');
  const goalText = document.getElementById('goalText');
  const progressLiquid = document.getElementById('progressLiquid');
  const progressCircle = document.getElementById('progressCircle');
  const goalCelebration = document.getElementById('goalCelebration');
  const todayHydration = document.getElementById('todayHydration');
  const streak = document.getElementById('streak');
  const timelineList = document.getElementById('timelineList');
  const quickBtns = document.querySelectorAll('.quick-btn');
  const locationLabel = document.getElementById('locationLabel');

  let currentGoal = 2000;

  function updateOnlineStatus() {
    if (navigator.onLine) {
      statusDiv.textContent = 'Online';
      statusDiv.className = 'status online';
    } else {
      statusDiv.textContent = 'Offline';
      statusDiv.className = 'status offline';
    }
  }

  function updateProgress() {
    const today = new Date().toISOString().split('T')[0];
    getSettings().then(settings => {
      currentGoal = settings.dailyGoal;
      // Update location label
      if (settings.location && settings.location.city) {
        locationLabel.textContent = `Location: ${settings.location.city}`;
      } else {
        locationLabel.textContent = '';
      }
      getDailyHydration(today).then(total => {
        const percentage = Math.min((total / currentGoal) * 100, 100);
        const remaining = currentGoal - total;
        progressText.textContent = `${Math.round(percentage)}%`;
        progressSubtext.textContent = `${total} / ${currentGoal} ml`;
        goalText.textContent = remaining > 0 ? `You need ${remaining} ml more` : 'Goal achieved!';
        progressLiquid.style.height = `${percentage * 1.8}px`; // 180px max
        todayHydration.textContent = total;
        // Simple streak calculation
        streak.textContent = total >= currentGoal ? '1' : '0';

        if (total >= currentGoal) {
          goalCelebration.style.display = 'block';
          progressCircle.classList.add('goal-reached');
        } else {
          goalCelebration.style.display = 'none';
          progressCircle.classList.remove('goal-reached');
        }
      });
    });
  }

  function updateTimeline() {
    getTodaysDrinks().then(drinks => {
      timelineList.innerHTML = '';
      if (drinks.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';
        emptyDiv.textContent = 'No drinks logged today';
        timelineList.appendChild(emptyDiv);
        return;
      }
      drinks.forEach(drink => {
        const item = document.createElement('div');
        item.className = 'timeline-item';

        const icon = getDrinkIcon(drink.drinkType);
        const iconDiv = document.createElement('div');
        iconDiv.className = 'timeline-icon';
        iconDiv.textContent = icon;
        item.appendChild(iconDiv);

        const details = document.createElement('div');
        details.className = 'timeline-details';

        const timeDiv = document.createElement('div');
        timeDiv.className = 'timeline-time';
        timeDiv.textContent = drink.time;
        details.appendChild(timeDiv);

        const nameDiv = document.createElement('div');
        nameDiv.className = 'timeline-name';
        nameDiv.textContent = capitalize(drink.drinkType);
        details.appendChild(nameDiv);

        const amountDiv = document.createElement('div');
        amountDiv.className = 'timeline-amount';
        amountDiv.textContent = drink.amount + ' ml';
        details.appendChild(amountDiv);

        item.appendChild(details);

        const hydrationDiv = document.createElement('div');
        hydrationDiv.className = 'timeline-hydration';
        hydrationDiv.textContent = '+' + drink.hydration;
        item.appendChild(hydrationDiv);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'timeline-delete';
        deleteBtn.textContent = '✕';
        deleteBtn.title = 'Delete drink';
        deleteBtn.addEventListener('click', () => {
          deleteDrinkById(drink.id).then(() => {
            updateProgress();
            updateTimeline();
          }).catch(err => console.error('Error deleting drink:', err));
        });
        item.appendChild(deleteBtn);

        timelineList.appendChild(item);
      });
    });
  }

  quickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      addDrink(type, 200).then(() => {
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
        }
        updateProgress();
        updateTimeline();
        showSnackbar('Drink added', 'Undo', () => {
          deleteLastDrink().then(() => {
            updateProgress();
            updateTimeline();
          });
        });
      });
    });
  });

  function scheduleReminders() {
    if ('Notification' in window && Notification.permission === 'granted') {
      getSettings().then(settings => {
        if (settings.notificationsEnabled) {
          // Only schedule if not already scheduled
          if (remindersIntervalId === null) {
            remindersIntervalId = setInterval(() => {
              new Notification('Daily Water Intake Tracker', {
                body: 'Time to hydrate 💧'
              });
              if ('vibrate' in navigator) {
                navigator.vibrate(500);
              }
            }, 2 * 60 * 60 * 1000); // 2 hours
          }
        } else {
          // Stop reminders if disabled
          if (remindersIntervalId !== null) {
            clearInterval(remindersIntervalId);
            remindersIntervalId = null;
          }
        }
      });
    }
  }

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
  updateProgress();
  updateTimeline();
  scheduleReminders();
}

function initAddDrink() {
  const drinkBtns = document.querySelectorAll('.drink-btn');
  const amountBtns = document.querySelectorAll('.amount-btn');
  const customAmount = document.getElementById('customAmount');
  const previewText = document.getElementById('previewText');
  const saveBtn = document.getElementById('saveBtn');
  let selectedDrink = null;
  let selectedAmount = null;

  const coeffs = DRINK_COEFFS || {};

  drinkBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      drinkBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDrink = btn.dataset.type;
      updatePreview();
    });
  });

  // Default to water on load
  const defaultBtn = document.querySelector('.drink-btn[data-type="water"]');
  if (defaultBtn) defaultBtn.click();

  amountBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      amountBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedAmount = parseInt(btn.dataset.amount);
      if (customAmount) customAmount.value = '';
      updatePreview();
    });
  });

  if (customAmount) {
    customAmount.addEventListener('input', () => {
      amountBtns.forEach(b => b.classList.remove('active'));
      selectedAmount = parseInt(customAmount.value) || null;
      updatePreview();
    });
  }

  function updatePreview() {
    if (selectedDrink && selectedAmount) {
      const hydration = Math.round(selectedAmount * (coeffs[selectedDrink] || 0.7));
      previewText.textContent = `Hydration gained: +${hydration} ml`;
      saveBtn.disabled = false;
    } else {
      previewText.textContent = 'Select drink and amount';
      saveBtn.disabled = true;
    }
  }

  saveBtn.addEventListener('click', () => {
    if (selectedDrink && selectedAmount) {
      const drinkType = selectedDrink || 'water';
      addDrink(drinkType, selectedAmount).then(() => {
        window.location.href = 'index.html';
      }).catch(() => {});
    }
  });
}

function initStatistics() {
  getSettings().then(settings => {
    const goal = settings.dailyGoal;

    getWeeklyHydration().then(weekData => {
      const barChart = document.getElementById('barChart');
      if (!barChart) return;
      barChart.innerHTML = "";

      const maxHydration = Math.max(...weekData.map(d => d.hydration), goal);
      let total = 0;

      weekData.forEach(data => {
        const bar = document.createElement('div');
        bar.className = 'bar';

        const height = (data.hydration / maxHydration) * 140; // chart height scale
        bar.style.height = `${height}px`;

        if (data.hydration >= goal) bar.classList.add('filled');

        const label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = new Date(data.date).toLocaleDateString('en', { weekday: 'short' });

        bar.appendChild(label);
        barChart.appendChild(bar);

        total += data.hydration;
      });

      const average = Math.round(total / 7);
      const weeklyTotalEl = document.getElementById('weeklyTotal');
      const dailyAverageEl = document.getElementById('dailyAverage');
      if (weeklyTotalEl) weeklyTotalEl.textContent = `Total: ${total} ml`;
      if (dailyAverageEl) dailyAverageEl.textContent = `Average: ${average} ml`;
    });

    getDrinkTypeBreakdown().then(breakdown => {
      const breakdownList = document.getElementById('breakdownList');
      if (!breakdownList) return;
      breakdownList.innerHTML = "";

      const totalHydration = Object.values(breakdown).reduce((sum, val) => sum + val, 0) || 1;

      const displayNames = {
        water: "Water",
        tea: "Tea",
        coffee: "Coffee",
        juice: "Juice",
        milk: "Milk",
        soda: "Soda",
        other: "Other"
      };

      Object.keys(breakdown).forEach(type => {
        const safeType = (type || "other").toLowerCase();
        const displayName = displayNames[safeType] || "Other";

        const item = document.createElement('div');
        item.className = 'breakdown-item';

        const percentage = Math.round((breakdown[type] / totalHydration) * 100);
        const width = (breakdown[type] / totalHydration) * 100;

        item.innerHTML = `
          <div class="breakdown-label">${displayName}</div>
          <div class="breakdown-bar">
            <div class="breakdown-fill" style="width: ${width}%"></div>
          </div>
          <div class="breakdown-value">${breakdown[type]} ml (${percentage}%)</div>
        `;

        breakdownList.appendChild(item);
      });
    });
  });
}

function mount() {
  createNavbar();
  registerServiceWorker();

  const page = window.location.pathname.split('/').pop() || 'index.html';
  if (page === '' || page === 'index.html') {
    initHome();
  } else if (page === 'add-drink.html') {
    initAddDrink();
  } else if (page === 'statistics.html') {
    initStatistics();
  } else if (page === 'settings.html') {
    // lazy import settings module initializer
    import('./settings.js').then(module => module.initSettings());
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}