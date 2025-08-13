
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

  // Skills data
  const SKILLS = {
    'Acrobatics': 'DEX',
    'Animal Handling': 'WIS',
    'Arcana': 'INT',
    'Athletics': 'STR',
    'Deception': 'CHA',
    'History': 'INT',
    'Insight': 'WIS',
    'Intimidation': 'CHA',
    'Investigation': 'INT',
    'Medicine': 'WIS',
    'Nature': 'INT',
    'Perception': 'WIS',
    'Performance': 'CHA',
    'Persuasion': 'CHA',
    'Religion': 'INT',
    'Sleight of Hand': 'DEX',
    'Stealth': 'DEX',
    'Survival': 'WIS'
  };

  // Class features data
  const CLASS_FEATURES = {
    'Fighter': [
      { name: 'Fighting Style', description: 'You adopt a particular style of fighting as your specialty.' },
      { name: 'Second Wind', description: 'You have a limited well of stamina that you can draw on to protect yourself from harm.' },
      { name: 'Action Surge', description: 'You can push yourself beyond your normal limits for a moment.' }
    ],
    'Wizard': [
      { name: 'Spellcasting', description: 'As a student of arcane magic, you have a spellbook containing spells.' },
      { name: 'Arcane Recovery', description: 'You have learned to regain some of your magical energy by studying your spellbook.' }
    ],
    'Rogue': [
      { name: 'Expertise', description: 'You can double your proficiency bonus for certain skill checks.' },
      { name: 'Sneak Attack', description: 'You know how to strike subtly and exploit a foe\'s distraction.' },
      { name: 'Thieves\' Cant', description: 'You learned thieves\' cant, a secret mix of dialect, jargon, and code.' }
    ]
    // Add more classes as needed
  };

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
      const conMod = Math.floor((abilityScores.CON - 10) / 2);
      baseAC = 10 + dexMod + conMod;
    } else if (cls === 'Monk' && !window.user?.avatar?.armor) {
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

    // Calculate Max HP
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
    let spellStatsContent = '';

    if (spellcastingAbility) {
      const spellMod = Math.floor((abilityScores[spellcastingAbility] - 10) / 2);
      const spellAttackBonus = proficiencyBonus + spellMod;
      const spellSaveDC = 8 + proficiencyBonus + spellMod;

      spellStatsContent = `
        <div class="spell-stats">
          <h4>Spellcasting</h4>
          <p><strong>Casting Ability:</strong> ${spellcastingAbility} (${spellMod >= 0 ? '+' : ''}${spellMod})</p>
          <p><strong>Spell Attack Bonus:</strong> +${spellAttackBonus}</p>
          <p><strong>Spell Save DC:</strong> ${spellSaveDC}</p>
        </div>
      `;
    } else {
      spellStatsContent = `
        <div class="tab-section">
          <h3>No Spellcasting</h3>
          <p>This class does not have spellcasting abilities.</p>
        </div>
      `;
    }

    // Check if stat editing is enabled
    const editingEnabled = localStorage.getItem('editStatsEnabled') === 'true';

    // Get the character's avatar image
    const avatarSrc = window.TV_AVATAR ? window.TV_AVATAR.buildAvatarSrc(race, gender) : 'images/base_avatar.png';

    // Generate skills content
    const skillsContent = Object.entries(SKILLS).map(([skillName, ability]) => {
      const abilityMod = Math.floor((abilityScores[ability] - 10) / 2);
      const skillMod = abilityMod; // Basic skill modifier without proficiency for now
      const modDisplay = skillMod >= 0 ? `+${skillMod}` : skillMod;
      
      return `
        <div class="skill-item">
          <span class="skill-name">${skillName} (${ability})</span>
          <span class="skill-modifier">${modDisplay}</span>
        </div>
      `;
    }).join('');

    // Generate class features content
    const classFeatures = CLASS_FEATURES[cls] || [
      { name: 'Class Features', description: 'Features for this class will be added in future updates.' }
    ];
    
    const featuresContent = classFeatures.map(feature => `
      <div class="feature-item">
        <div class="feature-name">${feature.name}</div>
        <div class="feature-description">${feature.description}</div>
      </div>
    `).join('');

    // Inject the sheet HTML
    container.innerHTML = `
      <div class="char-sheet">
        <div class="char-sheet-header">
          <div class="profile-avatar-container">
            <img src="${avatarSrc}" alt="Character Avatar" class="profile-avatar">
          </div>
          <div class="character-details">
            <h2>${name}</h2>
            <p><strong>Race:</strong> ${race} | <strong>Class:</strong> ${cls}</p>
            <p><strong>Gender:</strong> ${gender} | <strong>Level:</strong> ${level}</p>
          </div>
        </div>

        <div class="sheet-tabs">
          <button class="tab-button active" onclick="switchTab(event, 'features-tab')">Features</button>
          <button class="tab-button" onclick="switchTab(event, 'combat-tab')">Combat</button>
          <button class="tab-button" onclick="switchTab(event, 'abilities-tab')">Abilities</button>
          <button class="tab-button" onclick="switchTab(event, 'skills-tab')">Skills</button>
          <button class="tab-button" onclick="switchTab(event, 'spells-tab')">Spells</button>
        </div>

        <div id="features-tab" class="tab-content active">
          <div class="tab-section">
            <h3>${race} Racial Traits</h3>
            <div class="features-list">
              <div class="feature-item">
                <div class="feature-name">Racial Features</div>
                <div class="feature-description">Your ${race} heritage grants you special abilities and traits that set you apart from other races.</div>
              </div>
            </div>
          </div>
          
          <div class="tab-section">
            <h3>${cls} Class Features</h3>
            <div class="features-list">
              ${featuresContent}
            </div>
          </div>
        </div>

        <div id="combat-tab" class="tab-content">
          <div class="tab-section">
            <h3>Combat Statistics</h3>
            <div class="combat-grid">
              <div class="combat-stat">
                <strong>Armor Class</strong>
                ${totalAC}
              </div>
              <div class="combat-stat">
                <strong>Hit Points</strong>
                ${maxHP}
              </div>
              <div class="combat-stat">
                <strong>Hit Dice</strong>
                1d${hitDie}
              </div>
              <div class="combat-stat">
                <strong>Proficiency Bonus</strong>
                +${proficiencyBonus}
              </div>
              <div class="combat-stat">
                <strong>Initiative</strong>
                ${dexMod >= 0 ? '+' : ''}${dexMod}
              </div>
              <div class="combat-stat">
                <strong>Speed</strong>
                30 ft
              </div>
            </div>
          </div>
        </div>

        <div id="abilities-tab" class="tab-content">
          <div class="tab-section">
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

        <div id="skills-tab" class="tab-content">
          <div class="tab-section">
            <h3>Skills</h3>
            <div class="skills-grid">
              ${skillsContent}
            </div>
          </div>
        </div>

        <div id="spells-tab" class="tab-content">
          ${spellStatsContent}
        </div>
      </div>
    `;

    // Add event listeners for editable inputs if editing is enabled
    if (editingEnabled) {
      addStatEditListeners();
    }
  }

  // Tab switching function
  window.switchTab = function(evt, tabName) {
    // Hide all tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));

    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));

    // Show selected tab content and mark button as active
    document.getElementById(tabName).classList.add('active');
    evt.currentTarget.classList.add('active');
  };

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
