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

    // Calculate derived stats
    const level = window.user?.level || 1;
    const proficiencyBonus = Math.ceil(level / 4) + 1;

    // Calculate AC (10 + DEX modifier + armor bonuses)
    const dexMod = Math.floor((abilityScores.DEX - 10) / 2);
    let baseAC = 10 + dexMod;

    // Class-based AC adjustments
    if (cls === 'Barbarian' && !window.user?.avatar?.armor) {
      // Unarmored Defense: 10 + DEX + CON
      const conMod = Math.floor((abilityScores.CON - 10) / 2);
      baseAC = 10 + dexMod + conMod;
    } else if (cls === 'Monk' && !window.user?.avatar?.armor) {
      // Unarmored Defense: 10 + DEX + WIS
      const wisMod = Math.floor((abilityScores.WIS - 10) / 2);
      baseAC = 10 + dexMod + wisMod;
    }

    // Add armor bonus if equipped
    let armorBonus = 0;
    if (window.user?.avatar?.armor) {
      if (window.user.avatar.armor.includes('leather')) armorBonus = 1;
      else if (window.user.avatar.armor.includes('chain')) armorBonus = 3;
      else if (window.user.avatar.armor.includes('plate')) armorBonus = 6;
    }

    const totalAC = baseAC + armorBonus;

    // Calculate Max HP (class hit die + CON modifier per level)
    const hitDice = {
      'Barbarian': 12, 'Fighter': 10, 'Paladin': 10, 'Ranger': 10,
      'Bard': 8, 'Cleric': 8, 'Druid': 8, 'Monk': 8, 'Rogue': 8, 'Warlock': 8,
      'Sorcerer': 6, 'Wizard': 6
    };

    const hitDie = hitDice[cls] || 8;
    const conMod = Math.floor((abilityScores.CON - 10) / 2);
    const maxHP = hitDie + (level - 1) * (Math.floor(hitDie / 2) + 1) + (conMod * level);

    // Determine spellcasting ability and calculate spell stats
    const spellcastingClasses = {
      'Wizard': 'INT', 'Sorcerer': 'CHA', 'Warlock': 'CHA', 'Bard': 'CHA',
      'Cleric': 'WIS', 'Druid': 'WIS', 'Ranger': 'WIS', 'Paladin': 'CHA'
    };

    const spellcastingAbility = spellcastingClasses[cls];
    let spellStats = '';

    if (spellcastingAbility) {
      const spellMod = Math.floor((abilityScores[spellcastingAbility] - 10) / 2);
      const spellAttackBonus = proficiencyBonus + spellMod;
      const spellSaveDC = 8 + proficiencyBonus + spellMod;

      spellStats = `
        <div class="spell-stats">
          <h4>Spellcasting</h4>
          <p><strong>Casting Ability:</strong> ${spellcastingAbility} (${spellMod >= 0 ? '+' : ''}${spellMod})</p>
          <p><strong>Spell Attack Bonus:</strong> +${spellAttackBonus}</p>
          <p><strong>Spell Save DC:</strong> ${spellSaveDC}</p>
        </div>
      `;
    }

    // Build stat list with modifier calculation
    const statList = Object.entries(abilityScores).map(([stat, val]) => {
      const mod = Math.floor((val - 10) / 2);
      const modDisplay = mod >= 0 ? `+${mod}` : mod;
      return `<li><strong>${stat.toUpperCase()}:</strong> ${val} (<em>${modDisplay}</em>)</li>`;
    }).join("");

    // Check if stat editing is enabled
    const editingEnabled = localStorage.getItem('editStatsEnabled') === 'true';

    // Get the character's avatar image using the same system as other pages
    const avatarSrc = window.TV_AVATAR ? window.TV_AVATAR.buildAvatarSrc(race, gender) : 'images/base_avatar.png';

    // Inject the sheet HTML
    container.innerHTML = `
      <div class="char-sheet">
        <div class="char-sheet-header">
          <div class="profile-avatar-container">
            <img src="${avatarSrc}" alt="Character Avatar" class="profile-avatar">
          </div>
          <div class="character-details">
            <h2>${name}</h2>
            <p><strong>Race:</strong> ${race}</p>
            <p><strong>Gender:</strong> ${gender}</p>
            <p><strong>Class:</strong> ${cls}</p>
          </div>
        </div>

        <div class="combat-stats">
          <h3>Combat Stats</h3>
          <div class="combat-grid">
            <div class="combat-stat">
              <strong>Armor Class:</strong> ${totalAC}
            </div>
            <div class="combat-stat">
              <strong>Max Hit Points:</strong> ${maxHP}
            </div>
            <div class="combat-stat">
              <strong>Proficiency Bonus:</strong> +${proficiencyBonus}
            </div>
            <div class="combat-stat">
              <strong>Level:</strong> ${level}
            </div>
          </div>
        </div>

        ${spellStats}

        <div class="ability-scores-section">
          <h3>Ability Scores</h3>
          <table class="stats-table">
            <thead>
             <tr><th>Ability</th><th>Score</th><th>Modifier</th></tr>
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
      </div>
    `;

    // Set the top of the avatar image to be roughly inline with the top of the circle
    const avatarElement = container.querySelector('.profile-avatar');
    if (avatarElement) {
      avatarElement.style.objectPosition = '0px -20px'; // Adjust this value as needed for visual alignment
    }

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
      // Assuming 'profile' might not have a 'modifiers' object initially
      // It's safer to check or initialize it.
      if (!profile.modifiers) {
        profile.modifiers = {};
      }
      profile.modifiers[stat] = value;
    }

    localStorage.setItem('tv_profile', JSON.stringify(profile));
  }

  // 3) Expose for app.js and auto‐render on load
  window.renderSheet = renderSheet;
  document.addEventListener('DOMContentLoaded', renderSheet);
})();