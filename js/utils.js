export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getDrinkIcon(type) {
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

export function showSnackbar(message, actionText, actionCallback) {
  const snackbar = document.createElement('div');
  snackbar.className = 'snackbar';
  snackbar.innerHTML = `
    <div class="snackbar-message">${message}</div>
    <button class="snackbar-action">${actionText}</button>
  `;
  document.body.appendChild(snackbar);
  const btn = snackbar.querySelector('.snackbar-action');
  if (btn) {
    btn.addEventListener('click', () => {
      actionCallback();
      snackbar.remove();
    });
  }
  setTimeout(() => {
    if (snackbar.parentNode) snackbar.remove();
  }, 5000);
}
