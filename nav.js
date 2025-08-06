// js/nav.js
window.showPage = function(pageId, linkEl) {
  // Play click sound if available
  if (window.playClickSound) {
    window.playClickSound();
  }

  // 1) Hide all pages & deactivate nav items
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // 2) Show the clicked page & activate its nav‐item
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
  }
  
  // Check if linkEl exists before trying to access its classList
  if (linkEl && linkEl.classList) {
    linkEl.classList.add('active');
  } else {
    // Fallback: find the correct nav item based on the page
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      const href = item.getAttribute('onclick');
      if (href && href.includes(pageId)) {
        item.classList.add('active');
      }
    });
  }

  // 3) Show header and stats only on specific pages
  const showHeaderAndStats = ['tasks-page', 'character-sheet-page', 'wellness-page'].includes(pageId);

  const headerEl = document.querySelector('header');
  if (headerEl) headerEl.style.display = showHeaderAndStats ? '' : 'none';

  const statsEl = document.querySelector('.stats-container');
  if (statsEl) statsEl.style.display = showHeaderAndStats ? '' : 'none';

  // 4) Show/hide hamburger menu only on base page
  const hamburgerMenu = document.getElementById('hamburger-menu');
  if (hamburgerMenu) {
    hamburgerMenu.style.display = pageId === 'tasks-page' ? 'block' : 'none';
  }

  // 4) Initialize dice if we're on the dice page
  if (pageId === 'dice-page' && typeof ensureDiceInitialized === 'function') {
    setTimeout(() => {
      ensureDiceInitialized();
    }, 100);
  }

  // 5) Initialize quests if we're on the quests page
  if (pageId === 'quests-page' && typeof initializeQuestsPage === 'function') {
    setTimeout(() => {
      initializeQuestsPage();
    }, 100);
  }
};

// Hamburger menu functionality
window.toggleHamburgerMenu = function() {
  const dropdown = document.getElementById('hamburger-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
};

// Close hamburger menu when clicking outside
document.addEventListener('click', function(event) {
  const hamburgerMenu = document.getElementById('hamburger-menu');
  const dropdown = document.getElementById('hamburger-dropdown');
  
  if (hamburgerMenu && dropdown && !hamburgerMenu.contains(event.target)) {
    dropdown.classList.remove('active');
  }
});
