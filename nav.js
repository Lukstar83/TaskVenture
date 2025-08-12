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
  document.getElementById(pageId).classList.add('active');
  linkEl.classList.add('active');

  // 3) Show header and stats only on specific pages
  const showHeaderAndStats = ['tasks-page', 'character-sheet-page'].includes(pageId);

  const headerEl = document.querySelector('header');
  if (headerEl) headerEl.style.display = showHeaderAndStats ? '' : 'none';

  const statsEl = document.querySelector('.stats-container');
  if (statsEl) statsEl.style.display = showHeaderAndStats ? '' : 'none';
};
