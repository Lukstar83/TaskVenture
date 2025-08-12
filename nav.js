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

  // 3) Show/hide header and stats based on page
  const showMainHeader = pageId === 'tasks-page';
  const showAvatarHeader = pageId === 'avatar-page';
  const showMainStats = ['tasks-page', 'character-sheet-page'].includes(pageId);
  const showAvatarStats = pageId === 'avatar-page';

  // Main header (for tasks and character sheet)
  const mainHeaderEl = document.querySelector('#tasks-page .header, #character-sheet-page .header');
  if (mainHeaderEl) mainHeaderEl.style.display = showMainHeader ? '' : 'none';

  // Avatar page header (separate header)
  const avatarHeaderEl = document.querySelector('#avatar-page .header');
  if (avatarHeaderEl) avatarHeaderEl.style.display = showAvatarHeader ? '' : 'none';

  // Main stats container
  const mainStatsEl = document.querySelector('#tasks-page .stats-container, #character-sheet-page .stats-container');
  if (mainStatsEl) mainStatsEl.style.display = showMainStats ? '' : 'none';

  // Avatar page stats container
  const avatarStatsEl = document.querySelector('#avatar-page .stats-container');
  if (avatarStatsEl) avatarStatsEl.style.display = showAvatarStats ? '' : 'none';
};
