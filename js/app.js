document.addEventListener('DOMContentLoaded', () => {
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
        timelineList.innerHTML = '<div class="empty-state">No drinks logged today</div>';
        return;
      }
      drinks.forEach(drink => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        const icon = getDrinkIcon(drink.drinkType);
        item.innerHTML = `
          <div class="timeline-icon">${icon}</div>
          <div class="timeline-details">
            <div class="timeline-time">${drink.time}</div>
            <div class="timeline-name">${capitalize(drink.drinkType)}</div>
            <div class="timeline-amount">${drink.amount} ml</div>
          </div>
          <div class="timeline-hydration">+${drink.hydration}</div>
        `;
        timelineList.appendChild(item);
      });
    });
  }

  function getDrinkIcon(type) {
    const icons = {
      water: '💧',
      tea: '🍵',
      juice: '🧃',
      milk: '🥛',
      coffee: '☕',
      soda: '🥤',
      other: '🥤'
    };
    return icons[type] || '🥤';
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function showSnackbar(message, actionText, actionCallback) {
    const snackbar = document.createElement('div');
    snackbar.className = 'snackbar';
    snackbar.innerHTML = `
      <div class="snackbar-message">${message}</div>
      <button class="snackbar-action">${actionText}</button>
    `;
    document.body.appendChild(snackbar);
    snackbar.querySelector('.snackbar-action').addEventListener('click', () => {
      actionCallback();
      snackbar.remove();
    });
    setTimeout(() => {
      if (snackbar.parentNode) snackbar.remove();
    }, 5000);
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
          setInterval(() => {
            new Notification('Daily Water Intake Tracker', {
              body: 'Time to hydrate 💧'
            });
            if ('vibrate' in navigator) {
              navigator.vibrate(500);
            }
          }, 2 * 60 * 60 * 1000); // 2 hours
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
});