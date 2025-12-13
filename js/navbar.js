function createNavbar() {
  const navbar = document.createElement('nav');
  navbar.className = 'bottom-nav';
  navbar.innerHTML = `
    <a href="index.html" class="nav-link">Home</a>
    <a href="add-water.html" class="nav-link">Add Water</a>
    <a href="history.html" class="nav-link">History</a>
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