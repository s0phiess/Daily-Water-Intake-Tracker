document.addEventListener('DOMContentLoaded', () => {
  const statusDiv = document.getElementById('status');
  const progressText = document.getElementById('progressText');
  const progressSubtext = document.getElementById('progressSubtext');
  const goalText = document.getElementById('goalText');
  const progressCircle = document.querySelector('.progress-circle');
  const addWaterBtn = document.getElementById('addWaterBtn');

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
    const goal = 2000;
    getDailyIntake(today).then(total => {
      const percentage = Math.min((total / goal) * 100, 100);
      const remaining = goal - total;
      progressText.textContent = `${Math.round(percentage)}%`;
      progressSubtext.textContent = `${total} / ${goal} ml`;
      goalText.textContent = remaining > 0 ? `You are ${remaining} ml away from your goal` : 'Goal achieved!';
      progressCircle.style.background = `conic-gradient(#3B82F6 0% ${percentage}%, #E5E7EB ${percentage}% 100%)`;
    });
  }

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();

  addWaterBtn.addEventListener('click', () => {
    window.location.href = 'add-water.html';
  });

  updateProgress();
});