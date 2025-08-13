
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

  // Class skill proficiencies
  const CLASS_SKILLS = {
    'Barbarian': ['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival'],
    'Bard': ['Deception', 'History', 'Investigation', 'Persuasion', 'Performance', 'Sleight of Hand'],
    'Cleric': ['History', 'Insight', 'Medicine', 'Persuasion', 'Religion'],
    'Druid': ['Arcana', 'Animal Handling', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival'],
    'Fighter': ['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Perception', 'Survival'],
    'Monk': ['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth'],
    'Paladin': ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion'],
    'Ranger': ['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival'],
    'Rogue': ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Performance', 'Persuasion', 'Sleight of Hand', 'Stealth'],
    'Sorcerer': ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion'],
    'Warlock': ['Arcana', 'Deception', 'History', 'Intimidation', 'Investigation', 'Nature', 'Religion'],
    'Wizard': ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion']
  };

  // Racial skill proficiencies
  const RACIAL_SKILLS = {
    'Human': [], // Standard human gets +1 to all abilities and extra skill, variant gets feat
    'Elf': ['Perception'], // Keen Senses trait
    'Half-Elf': [], // Gets 2 skills of choice (Skill Versatility)
    'Dwarf': [], // Gets tool proficiencies and combat training, not skills
    'Halfling': [], // No automatic skill proficiencies
    'Dragonborn': [], // No automatic skill proficiencies
    'Gnome': [], // Forest gnome gets minor illusion cantrip, rock gnome gets tinker tools
    'Half-Orc': ['Intimidation'], // Menacing trait
    'Tiefling': [] // No automatic skill proficiencies, gets spells from Infernal Legacy
  };

  // Racial traits data
  const RACIAL_TRAITS = {
    'Dragonborn': [
      { 
        name: 'Draconic Ancestry', 
        description: 'You have draconic ancestry. Choose one type of dragon from the Draconic Ancestry table. Your breath weapon and damage resistance are determined by the dragon type.' 
      },
      { 
        name: 'Breath Weapon', 
        description: 'You can use your action to exhale destructive energy. Your draconic ancestry determines the size, shape, and damage type of the exhalation. When you use your breath weapon, each creature in the area of the exhalation must make a saving throw, the type of which is determined by your draconic ancestry. The DC for this saving throw equals 8 + your Constitution modifier + your proficiency bonus. A creature takes 2d6 damage on a failed save, and half as much damage on a successful one. The damage increases to 3d6 at 6th level, 4d6 at 11th level, and 5d6 at 16th level. After you use your breath weapon, you can\'t use it again until you complete a short or long rest.' 
      },
      { 
        name: 'Damage Resistance', 
        description: 'You have resistance to the damage type associated with your draconic ancestry.' 
      },
      { 
        name: 'Languages', 
        description: 'You can speak, read, and write Common and Draconic.' 
      }
    ],
    'Dwarf': [
      { 
        name: 'Darkvision', 
        description: 'Accustomed to life underground, you have superior vision in dark and dim conditions. You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can\'t discern color in darkness, only shades of gray.' 
      },
      { 
        name: 'Dwarven Resilience', 
        description: 'You have advantage on saving throws against poison, and you have resistance against poison damage.' 
      },
      { 
        name: 'Dwarven Combat Training', 
        description: 'You have proficiency with battleaxes, handaxes, light hammers, and warhammers.' 
      },
      { 
        name: 'Tool Proficiency', 
        description: 'You gain proficiency with the artisan\'s tools of your choice: smith\'s tools, brewer\'s supplies, or mason\'s tools.' 
      },
      { 
        name: 'Stonecunning', 
        description: 'Whenever you make an Intelligence (History) check related to the origin of stonework, you are considered proficient in the History skill and add double your proficiency bonus to the check, instead of your normal proficiency bonus.' 
      },
      { 
        name: 'Languages', 
        description: 'You can speak, read, and write Common and Dwarvish.' 
      }
    ],
    'Elf': [
      { 
        name: 'Darkvision', 
        description: 'Accustomed to twilit forests and the night sky, you have superior vision in dark and dim conditions. You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can\'t discern color in darkness, only shades of gray.' 
      },
      { 
        name: 'Keen Senses', 
        description: 'You have proficiency in the Perception skill.' 
      },
      { 
        name: 'Fey Ancestry', 
        description: 'You have advantage on saving throws against being charmed, and magic can\'t put you to sleep.' 
      },
      { 
        name: 'Trance', 
        description: 'Elves don\'t need to sleep. Instead, they meditate deeply, remaining semiconscious, for 4 hours a day. (The Common word for such meditation is "trance.") While meditating, you can dream after a fashion; such dreams are actually mental exercises that have become reflexive through years of practice. After resting in this way, you gain the same benefit that a human does from 8 hours of sleep.' 
      },
      { 
        name: 'Languages', 
        description: 'You can speak, read, and write Common and Elvish.' 
      }
    ],
    'Halfling': [
      { 
        name: 'Lucky', 
        description: 'When you roll a 1 on the d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.' 
      },
      { 
        name: 'Brave', 
        description: 'You have advantage on saving throws against being frightened.' 
      },
      { 
        name: 'Halfling Nimbleness', 
        description: 'You can move through the space of any creature that is of a size larger than yours.' 
      },
      { 
        name: 'Languages', 
        description: 'You can speak, read, and write Common and Halfling.' 
      }
    ],
    'Human': [
      { 
        name: 'Extra Language', 
        description: 'You can speak, read, and write one extra language of your choice.' 
      },
      { 
        name: 'Extra Skill', 
        description: 'You gain proficiency in one skill of your choice.' 
      },
      { 
        name: 'Versatility', 
        description: 'Humans are the most adaptable and ambitious people among the common races. They have widely varying tastes, morals, and customs in the many different lands where they have settled.' 
      }
    ],
    'Gnome': [
      { 
        name: 'Darkvision', 
        description: 'Accustomed to life underground, you have superior vision in dark and dim conditions. You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can\'t discern color in darkness, only shades of gray.' 
      },
      { 
        name: 'Gnome Cunning', 
        description: 'You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic.' 
      },
      { 
        name: 'Languages', 
        description: 'You can speak, read, and write Common and Gnomish.' 
      }
    ],
    'Half-Elf': [
      { 
        name: 'Darkvision', 
        description: 'Thanks to your elf blood, you have superior vision in dark and dim conditions. You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can\'t discern color in darkness, only shades of gray.' 
      },
      { 
        name: 'Fey Ancestry', 
        description: 'You have advantage on saving throws against being charmed, and magic can\'t put you to sleep.' 
      },
      { 
        name: 'Skill Versatility', 
        description: 'You gain proficiency in two skills of your choice.' 
      },
      { 
        name: 'Extra Language', 
        description: 'You can speak, read, and write Common, Elvish, and one extra language of your choice.' 
      }
    ],
    'Half-Orc': [
      { 
        name: 'Darkvision', 
        description: 'Thanks to your orc blood, you have superior vision in dark and dim conditions. You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can\'t discern color in darkness, only shades of gray.' 
      },
      { 
        name: 'Menacing', 
        description: 'You gain proficiency in the Intimidation skill.' 
      },
      { 
        name: 'Relentless Endurance', 
        description: 'When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead. You can\'t use this feature again until you finish a long rest.' 
      },
      { 
        name: 'Savage Attacks', 
        description: 'When you score a critical hit with a melee weapon attack, you can roll one of the weapon\'s damage dice one additional time and add it to the extra damage of the critical hit.' 
      },
      { 
        name: 'Languages', 
        description: 'You can speak, read, and write Common and Orc.' 
      }
    ],
    'Tiefling': [
      { 
        name: 'Darkvision', 
        description: 'Thanks to your infernal heritage, you have superior vision in dark and dim conditions. You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can\'t discern color in darkness, only shades of gray.' 
      },
      { 
        name: 'Hellish Resistance', 
        description: 'You have resistance to fire damage.' 
      },
      { 
        name: 'Infernal Legacy', 
        description: 'You know the thaumaturgy cantrip. When you reach 3rd level, you can cast the hellish rebuke spell as a 2nd-level spell once with this trait and regain the ability to do so when you finish a long rest. When you reach 5th level, you can cast the darkness spell once with this trait and regain the ability to do so when you finish a long rest. Charisma is your spellcasting ability for these spells.' 
      },
      { 
        name: 'Languages', 
        description: 'You can speak, read, and write Common and Infernal.' 
      }
    ]
      { 
        name: 'Darkvision', 
        description: 'You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.' 
      },
      { 
        name: 'Keen Senses', 
        description: 'You have proficiency in the Perception skill.' 
      },
      { 
        name: 'Fey Ancestry', 
        description: 'You have advantage on saving throws against being charmed, and magic can\'t put you to sleep.' 
      },
      { 
        name: 'Trance', 
        description: 'Elves don\'t need to sleep. Instead, they meditate deeply, remaining semiconscious, for 4 hours a day.' 
      }
    ]
  };

  // Determine skill proficiencies
  function getSkillProficiencies(race, cls) {
    const proficiencies = new Set();
    
    // Add racial proficiencies
    const racialSkills = RACIAL_SKILLS[race] || [];
    racialSkills.forEach(skill => proficiencies.add(skill));
    
    // Add class proficiencies (for Fighter, typically choose 2 from the list)
    const classSkills = CLASS_SKILLS[cls] || [];
    if (cls === 'Fighter') {
      // For Fighter, we'll assume they picked Athletics and Intimidation as common choices
      proficiencies.add('Athletics');
      proficiencies.add('Intimidation');
    } else if (cls === 'Rogue') {
      // Rogue gets 4 skills from their list, let's pick common ones
      proficiencies.add('Stealth');
      proficiencies.add('Sleight of Hand');
      proficiencies.add('Investigation');
      proficiencies.add('Perception');
    } else if (cls === 'Ranger') {
      // Ranger gets 3 skills, let's pick common survival-oriented ones
      proficiencies.add('Survival');
      proficiencies.add('Nature');
      proficiencies.add('Perception');
    } else if (cls === 'Bard') {
      // Bard gets 3 skills from their list
      proficiencies.add('Persuasion');
      proficiencies.add('Performance');
      proficiencies.add('Deception');
    } else {
      // For other classes, add 2 skills from their available list
      const availableSkills = classSkills.slice(0, 2);
      availableSkills.forEach(skill => proficiencies.add(skill));
    }
    
    return Array.from(proficiencies);
  }

  // Class features data
  const CLASS_FEATURES = {
    'Fighter': [
      { name: 'Fighting Style', description: 'At 1st level, you adopt a particular style of fighting as your specialty. Choose one of the following options: Archery, Defense, Dueling, Great Weapon Fighting, Protection, or Two-Weapon Fighting.' },
      { name: 'Second Wind', description: 'You have a limited well of stamina that you can draw on to protect yourself from harm. On your turn, you can use a bonus action to regain hit points equal to 1d10 + your fighter level. Once you use this feature, you must finish a short or long rest before you can use it again.' },
      { name: 'Action Surge', description: 'Starting at 2nd level, you can push yourself beyond your normal limits for a moment. On your turn, you can take one additional action. Once you use this feature, you must finish a short or long rest before you can use it again. Starting at 17th level, you can use it twice before a rest, but only once on the same turn.' }
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
    const proficientSkills = getSkillProficiencies(race, cls);
    const skillsContent = Object.entries(SKILLS).map(([skillName, ability]) => {
      const abilityMod = Math.floor((abilityScores[ability] - 10) / 2);
      const isProficient = proficientSkills.includes(skillName);
      const skillMod = isProficient ? abilityMod + proficiencyBonus : abilityMod;
      const modDisplay = skillMod >= 0 ? `+${skillMod}` : skillMod;
      const proficiencyIcon = isProficient ? '⚫' : '⚪';
      
      return `
        <div class="skill-item ${isProficient ? 'proficient' : ''}">
          <span class="skill-name">
            <span class="proficiency-dot">${proficiencyIcon}</span>
            ${skillName} (${ability})
          </span>
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

    // Generate racial traits content
    const racialTraits = RACIAL_TRAITS[race] || [
      { name: 'Racial Traits', description: 'Racial traits for this race will be added in future updates.' }
    ];
    
    const racialTraitsContent = racialTraits.map(trait => `
      <div class="feature-item">
        <div class="feature-name">${trait.name}</div>
        <div class="feature-description">${trait.description}</div>
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
              ${racialTraitsContent}
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
