// sheet.js
(function(){
  // 1) Load and parse the tv_profile from localStorage
  function loadProfile(){
    const raw = localStorage.getItem('tv_profile');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch(err) {
      console.error('⚠️  Could not parse tv_profile:', err, raw);
      return null;
    }
  }

  // 2) Build and inject the HTML
  function renderSheet() {
    const p = loadProfile();
    console.log('🗡️ renderSheet() got profile:', p);

    const container = document.getElementById('sheet-container');
    if (!container) {
      console.error('⚠️  #sheet-container not found in your HTML');
      return;
    }

    if (!p) {
      container.innerHTML = `<p>No character profile found. Run the wizard first.</p>`;
      return;
    }

    const { name, race, class: cls, gender, scores: abilityScores } = p;
    if (!abilityScores) {
      container.innerHTML = `<p>Profile is incomplete. Something went wrong in the wizard.</p>`;
      return;
    }

    // Build stat list with modifier calculation
    const statList = Object.entries(abilityScores).map(([stat, val]) => {
      const mod = Math.floor((val - 10) / 2);
      const modDisplay = mod >= 0 ? `+${mod}` : mod;
      return `<li><strong>${stat.toUpperCase()}:</strong> ${val} (<em>${modDisplay}</em>)</li>`;
    }).join("");

    // Check if stat editing is enabled
    const editingEnabled = localStorage.getItem('editStatsEnabled') === 'true';

    // Inject the sheet HTML
    container.innerHTML = `
      <div class="char-sheet">
        <h2>${name}</h2>
        <p><strong>Race:</strong> ${race}</p>
        <p><strong>Gender:</strong> ${gender}</p>
        <p><strong>Class:</strong> ${cls}</p>
        <h3>Ability Scores</h3>
          <table class="stats-table">
            <thead>
             <tr><th>Stat</th><th>Score</th><th>Modifier</th></tr>
            </thead>
         <tbody>
         
    ${Object.entries(abilityScores).map(([stat, val]) => {
      const mod = Math.floor((val - 10) / 2);
      const modDisplay = mod >= 0 ? `+${mod}` : mod;
      const scoreContent = editingEnabled 
        ? `<input type="number" class="stat-input" data-stat="${stat}" value="${val}" min="1" max="30">`
        : val;
      const modContent = editingEnabled 
        ? `<input type="number" class="mod-input" data-stat="${stat}" value="${mod}" min="-10" max="10">`
        : modDisplay;
      return `<tr><td>${stat.toUpperCase()}</td><td>${scoreContent}</td><td>${modContent}</td></tr>`;
    }).join("")}
  </tbody>
</table>
      </div>
    `;

    // Add event listeners for editable inputs if editing is enabled
    if (editingEnabled) {
      addStatEditListeners();
    }
  }

  // Add event listeners for stat editing
  function addStatEditListeners() {
    const statInputs = document.querySelectorAll('.stat-input');
    const modInputs = document.querySelectorAll('.mod-input');

    statInputs.forEach(input => {
      input.addEventListener('change', function() {
        const stat = this.dataset.stat;
        const newValue = parseInt(this.value);
        if (newValue >= 1 && newValue <= 30) {
          updateStatInProfile(stat, 'score', newValue);
          // Auto-update modifier
          const newMod = Math.floor((newValue - 10) / 2);
          const modInput = document.querySelector(`.mod-input[data-stat="${stat}"]`);
          if (modInput) {
            modInput.value = newMod;
            updateStatInProfile(stat, 'modifier', newMod);
          }
        }
      });
    });

    modInputs.forEach(input => {
      input.addEventListener('change', function() {
        const stat = this.dataset.stat;
        const newValue = parseInt(this.value);
        if (newValue >= -10 && newValue <= 10) {
          updateStatInProfile(stat, 'modifier', newValue);
        }
      });
    });
  }

  // Update stat in profile
  function updateStatInProfile(stat, type, value) {
    const profile = loadProfile();
    if (!profile) return;

    if (type === 'score') {
      profile.scores[stat] = value;
    } else if (type === 'modifier') {
      profile.modifiers[stat] = value;
    }

    localStorage.setItem('tv_profile', JSON.stringify(profile));
  }

  // 3) Expose for app.js and auto‐render on load
  window.renderSheet = renderSheet;
  document.addEventListener('DOMContentLoaded', renderSheet);
})();
