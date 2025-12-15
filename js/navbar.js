function createNavbar() {
  const navbar = document.createElement('nav');
  navbar.className = 'bottom-nav';
  navbar.innerHTML = `
    <a href="index.html" class="nav-link">Home</a>
    <a href="add-drink.html" class="nav-link">Add Drink</a>
    <a href="statistics.html" class="nav-link">Statistics</a>
    <a href="settings.html" class="nav-link">⚙️</a>
  `;
  document.body.appendChild(navbar);

  // Highlight active link
  const currentPath = window.location.pathname.split('/').pop();
  const links = navbar.querySelectorAll('.nav-link');
  links.forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
}

document.addEventListener('DOMContentLoaded', createNavbar);