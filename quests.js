// quests.js - D&D Style Quest System

class QuestEngine {
    constructor() {
        this.activeQuest = null;
        this.completedQuests = JSON.parse(
            localStorage.getItem("completedQuests") || "[]",
        );
        this.availableQuests = this.generateAvailableQuests();
        this.currentScene = null;
        this.playerHP = 100;
        this.maxPlayerHP = 100;
        this.enemyHP = 0;
        this.maxEnemyHP = 0;
        this.pendingRoll = null;
        this.successfulActions = 0;
        this.maxSuccessfulActions = 3;
        this.enemyCannotAttack = false;
        this.playerDisengaged = false;
        this.playerAdvantage = false;
        this.enemyDisadvantage = false;
        this.hiddenAdvantage = false;
        this.enemyCannotTarget = false;
        this.enemyGrappled = false;
        this.tempACBonus = 0;
        this.positionAdvantage = false; // This seems unused, can be removed if not needed
    }

    // Generate random quests based on character level
    generateAvailableQuests() {
        const questTemplates = [
            {
                id: "goblin_camp",
                title: "Goblin Camp Infiltration",
                description:
                    "A band of goblins has been raiding nearby villages. Infiltrate their camp and stop their leader.",
                difficulty: "Easy",
                minLevel: 1,
                rewards: {
                    xp: 50,
                    coins: 25,
                    items: ["Goblin Dagger", "Leather Boots"],
                },
                scenes: [
                    {
                        id: "approach",
                        text: "You approach the goblin camp hidden in the forest. Smoke rises from their fires.",
                        options: [
                            {
                                text: "Sneak around the perimeter (Stealth)",
                                skill: "DEX",
                                dc: 12,
                            },
                            {
                                text: "Charge in boldly (Intimidation)",
                                skill: "CHA",
                                dc: 14,
                            },
                            {
                                text: "Study the camp layout (Investigation)",
                                skill: "INT",
                                dc: 10,
                            },
                        ],
                    },
                    {
                        id: "combat",
                        text: "The goblin chief notices you! Combat begins!",
                        combat: true,
                        enemy: {
                            name: "Goblin Chief",
                            hp: 25,
                            ac: 14,
                            damage: "1d6+2",
                        },
                    },
                ],
            },
            {
                id: "forest_bandits",
                title: "Forest Bandit Patrol",
                description:
                    "Bandits have been ambushing travelers on the forest road. Stop their operations.",
                difficulty: "Easy",
                minLevel: 1,
                rewards: {
                    xp: 45,
                    coins: 20,
                    items: ["Bandit Mask", "Shortbow"],
                },
                scenes: [
                    {
                        id: "encounter",
                        text: "You spot bandits setting up an ambush ahead. They haven't noticed you yet.",
                        options: [
                            {
                                text: "Set up counter-ambush (Stealth)",
                                skill: "DEX",
                                dc: 13,
                            },
                            {
                                text: "Negotiate peaceful resolution (Persuasion)",
                                skill: "CHA",
                                dc: 15,
                            },
                            {
                                text: "Charge them directly (Athletics)",
                                skill: "STR",
                                dc: 12,
                            },
                        ],
                    },
                ],
            },
            {
                id: "merchant_escort",
                title: "Merchant Caravan Escort",
                description:
                    "A nervous merchant needs protection while traveling through dangerous territory.",
                difficulty: "Easy",
                minLevel: 1,
                rewards: {
                    xp: 40,
                    coins: 30,
                    items: ["Travel Rations", "Merchant's Ring"],
                },
                scenes: [
                    {
                        id: "journey",
                        text: "Halfway through the journey, wolves emerge from the treeline, hungry and aggressive.",
                        combat: true,
                        enemy: {
                            name: "Pack of Wolves",
                            hp: 20,
                            ac: 12,
                            damage: "1d4+1",
                        },
                    },
                ],
            },
            {
                id: "haunted_library",
                title: "The Haunted Library",
                description:
                    "Ancient spirits guard forbidden knowledge in an abandoned library.",
                difficulty: "Medium",
                minLevel: 2,
                rewards: {
                    xp: 75,
                    coins: 40,
                    items: ["Scroll of Wisdom", "Spectral Cloak"],
                },
                scenes: [
                    {
                        id: "entrance",
                        text: "The library doors creak open. Ghostly whispers echo through dusty halls.",
                        options: [
                            {
                                text: "Call out respectfully (Persuasion)",
                                skill: "CHA",
                                dc: 13,
                            },
                            {
                                text: "Search for clues (Investigation)",
                                skill: "INT",
                                dc: 11,
                            },
                            {
                                text: "Move quietly (Stealth)",
                                skill: "DEX",
                                dc: 15,
                            },
                        ],
                    },
                ],
            },
            {
                id: "cursed_temple",
                title: "The Cursed Temple",
                description:
                    "An ancient temple has awakened with dark magic. Cleanse it before the curse spreads.",
                difficulty: "Medium",
                minLevel: 2,
                rewards: {
                    xp: 80,
                    coins: 45,
                    items: ["Holy Symbol", "Blessed Water"],
                },
                scenes: [
                    {
                        id: "altar",
                        text: "Dark energy swirls around a corrupted altar. Shadowy figures begin to materialize.",
                        combat: true,
                        enemy: {
                            name: "Shadow Wraith",
                            hp: 35,
                            ac: 15,
                            damage: "1d8+3",
                        },
                    },
                ],
            },
            {
                id: "missing_villagers",
                title: "The Missing Villagers",
                description:
                    "Several villagers have disappeared. Strange tracks lead to an old mine shaft.",
                difficulty: "Medium",
                minLevel: 2,
                rewards: {
                    xp: 70,
                    coins: 35,
                    items: ["Mining Pick", "Rescue Medal"],
                },
                scenes: [
                    {
                        id: "mine_entrance",
                        text: "The mine is dark and filled with unnatural sounds. You hear muffled cries from deep within.",
                        options: [
                            {
                                text: "Light a torch and proceed carefully (Survival)",
                                skill: "WIS",
                                dc: 12,
                            },
                            {
                                text: "Use magic to illuminate the way (Arcana)",
                                skill: "INT",
                                dc: 14,
                            },
                            {
                                text: "Feel your way in darkness (Stealth)",
                                skill: "DEX",
                                dc: 16,
                            },
                        ],
                    },
                    {
                        id: "rescue",
                        text: "You find the villagers trapped by a cave troll!",
                        combat: true,
                        enemy: {
                            name: "Cave Troll",
                            hp: 40,
                            ac: 16,
                            damage: "2d6+4",
                        },
                    },
                ],
            },
            {
                id: "dragons_riddle",
                title: "The Dragon's Riddle",
                description:
                    "An ancient dragon offers treasure to those who can solve its riddle.",
                difficulty: "Hard",
                minLevel: 3,
                rewards: {
                    xp: 100,
                    coins: 75,
                    items: ["Dragon Scale Armor", "Ring of Fire Resistance"],
                },
                scenes: [
                    {
                        id: "riddle",
                        text: 'The dragon speaks: "I am not seen, but I am felt. I have no form, yet I can transform. What am I?"',
                        options: [
                            { text: "Answer: Time", skill: "INT", dc: 16 },
                            { text: "Answer: Magic", skill: "INT", dc: 14 },
                            {
                                text: "Try to bargain instead",
                                skill: "CHA",
                                dc: 18,
                            },
                        ],
                    },
                ],
            },
            {
                id: "lich_tower",
                title: "The Lich's Tower",
                description:
                    "A powerful lich has risen and threatens the realm. Only the bravest dare face such evil.",
                difficulty: "Hard",
                minLevel: 4,
                rewards: {
                    xp: 150,
                    coins: 100,
                    items: ["Lich Bane Sword", "Crown of Protection"],
                },
                scenes: [
                    {
                        id: "tower_ascent",
                        text: "The tower pulses with necrotic energy. Undead guardians block your path to the top.",
                        combat: true,
                        enemy: {
                            name: "Ancient Lich",
                            hp: 60,
                            ac: 18,
                            damage: "2d8+5",
                        },
                    },
                ],
            },
            {
                id: "elemental_chaos",
                title: "Elemental Chaos",
                description:
                    "The elemental planes are merging with reality. Restore the balance before chaos consumes all.",
                difficulty: "Hard",
                minLevel: 3,
                rewards: {
                    xp: 120,
                    coins: 80,
                    items: ["Elemental Orb", "Cloak of Elements"],
                },
                scenes: [
                    {
                        id: "convergence",
                        text: "Fire, ice, earth, and air swirl chaotically around you. An elemental lord emerges from the maelstrom.",
                        combat: true,
                        enemy: {
                            name: "Elemental Lord",
                            hp: 50,
                            ac: 17,
                            damage: "2d6+4",
                        },
                    },
                ],
            },
        ];

        // Add daily quest if needed
        this.checkDailyQuest(questTemplates);

        // Filter quests based on character level and completion status
        return questTemplates.filter((quest) => {
            const userLevel = window.user?.level || 1;
            const isCompleted = this.completedQuests.includes(quest.id);
            return quest.minLevel <= userLevel && !isCompleted;
        });
    }

    checkDailyQuest(questTemplates) {
        const today = new Date().toDateString();
        const lastDailyQuest = localStorage.getItem("lastDailyQuest");

        if (lastDailyQuest !== today) {
            // Generate a new daily quest
            const dailyQuests = [
                {
                    id: `daily_patrol_${Date.now()}`,
                    title: "Daily Patrol",
                    description:
                        "Patrol the local area and report any suspicious activity.",
                    difficulty: "Easy",
                    minLevel: 1,
                    rewards: { xp: 25, coins: 15, items: ["Scout's Report"] },
                    isDaily: true,
                    scenes: [
                        {
                            id: "patrol",
                            text: "During your patrol, you notice something unusual in the distance.",
                            options: [
                                {
                                    text: "Investigate carefully (Perception)",
                                    skill: "WIS",
                                    dc: 10,
                                },
                                {
                                    text: "Approach boldly (Athletics)",
                                    skill: "STR",
                                    dc: 12,
                                },
                                {
                                    text: "Observe from hiding (Stealth)",
                                    skill: "DEX",
                                    dc: 11,
                                },
                            ],
                        },
                    ],
                },
                {
                    id: `daily_gathering_${Date.now()}`,
                    title: "Resource Gathering",
                    description:
                        "Collect herbs and materials for the local healer.",
                    difficulty: "Easy",
                    minLevel: 1,
                    rewards: {
                        xp: 20,
                        coins: 10,
                        items: ["Healing Herbs", "Crafting Materials"],
                    },
                    isDaily: true,
                    scenes: [
                        {
                            id: "gathering",
                            text: "You venture into the wilderness to gather resources. Wild creatures guard the best spots.",
                            options: [
                                {
                                    text: "Use nature knowledge (Survival)",
                                    skill: "WIS",
                                    dc: 11,
                                },
                                {
                                    text: "Search systematically (Investigation)",
                                    skill: "INT",
                                    dc: 13,
                                },
                                {
                                    text: "Take risks for better resources (Athletics)",
                                    skill: "STR",
                                    dc: 14,
                                },
                            ],
                        },
                    ],
                },
                {
                    id: `daily_training_${Date.now()}`,
                    title: "Combat Training",
                    description:
                        "Practice your combat skills at the training grounds.",
                    difficulty: "Easy",
                    minLevel: 1,
                    rewards: {
                        xp: 30,
                        coins: 5,
                        items: ["Training Dummy Remains"],
                    },
                    isDaily: true,
                    scenes: [
                        {
                            id: "training",
                            text: "The training master sets up increasingly difficult challenges.",
                            options: [
                                {
                                    text: "Focus on strength training (Athletics)",
                                    skill: "STR",
                                    dc: 12,
                                },
                                {
                                    text: "Practice agility drills (Acrobatics)",
                                    skill: "DEX",
                                    dc: 12,
                                },
                                {
                                    text: "Study combat theory (Investigation)",
                                    skill: "INT",
                                    dc: 10,
                                },
                            ],
                        },
                    ],
                },
            ];

            // Pick a random daily quest
            const randomDaily =
                dailyQuests[Math.floor(Math.random() * dailyQuests.length)];
            questTemplates.push(randomDaily);
            localStorage.setItem("lastDailyQuest", today);
        }
    }

    startQuest(questId) {
        const quest = this.availableQuests.find((q) => q.id === questId);
        if (!quest) return false;

        this.activeQuest = { ...quest };
        this.currentScene = quest.scenes[0];
        this.successfulActions = 0;
        this.tempACBonus = 0;
        this.positionAdvantage = false;
        this.enemyGrappled = false;
        this.playerDisengaged = false;
        this.playerAdvantage = false;
        this.enemyDisadvantage = false;
        this.hiddenAdvantage = false;
        this.enemyCannotTarget = false;

        // Reset combat state if starting a new combat quest
        this.playerHP = this.maxPlayerHP;
        this.enemyHP = 0; // Will be set in renderCombat

        this.renderQuestInterface();
        return true;
    }

    makeChoice(choiceIndex) {
        if (!this.currentScene || !this.currentScene.options) return;

        const choice = this.currentScene.options[choiceIndex];
        if (!choice) return;

        // Disable choice buttons to prevent multiple clicks
        const buttons = document.querySelectorAll(".quest-option");
        buttons.forEach((btn) => (btn.disabled = true));

        // Use 3D dice for skill check if available
        if (typeof window.rollSkillCheck === "function") {
            window.rollSkillCheck(choice.skill, choice.dc, (roll) => {
                this.processSkillCheck(choice, roll);
            });
        } else {
            // Fallback to simple roll
            const roll = this.rollD20();
            this.processSkillCheck(choice, roll);
        }
    }

    processSkillCheck(choice, roll) {
        const modifier = this.getAbilityModifier(choice.skill);
        const total = roll + modifier;
        const success = total >= choice.dc;

        this.displayRollResult(choice, roll, modifier, total, success);

        // Re-enable choice buttons
        setTimeout(() => {
            const buttons = document.querySelectorAll(".quest-option");
            buttons.forEach((btn) => (btn.disabled = false));
        }, 1000);

        // Handle success/failure
        if (success) {
            this.handleSuccess(choice);
        } else {
            this.handleFailure(choice);
        }
    }

    rollD20() {
        return Math.floor(Math.random() * 20) + 1;
    }

    getAbilityModifier(ability) {
        const profile = JSON.parse(localStorage.getItem("tv_profile") || "{}");
        const score = profile.scores?.[ability] || 10;
        return Math.floor((score - 10) / 2);
    }

    getCharacterWeapons() {
        const profile = JSON.parse(localStorage.getItem("tv_profile") || "{}");
        const cls = profile.class;

        const classWeapons = {
            Fighter: {
                melee: {
                    name: "Longsword",
                    damage: "1d8",
                    ability: "STR",
                    type: "slashing",
                },
                ranged: {
                    name: "Shortbow",
                    damage: "1d6",
                    ability: "DEX",
                    type: "piercing",
                    range: "80/320",
                },
            },
            Rogue: {
                melee: {
                    name: "Shortsword",
                    damage: "1d6",
                    ability: "DEX",
                    type: "piercing",
                },
                ranged: {
                    name: "Dagger",
                    damage: "1d4",
                    ability: "DEX",
                    type: "piercing",
                    range: "20/60",
                },
            },
            Wizard: {
                melee: {
                    name: "Dagger",
                    damage: "1d4",
                    ability: "DEX",
                    type: "piercing",
                },
                ranged: {
                    name: "Dagger",
                    damage: "1d4",
                    ability: "DEX",
                    type: "piercing",
                    range: "20/60",
                },
            },
            Sorcerer: {
                melee: {
                    name: "Dagger",
                    damage: "1d4",
                    ability: "DEX",
                    type: "piercing",
                },
                ranged: {
                    name: "Light Crossbow",
                    damage: "1d8",
                    ability: "DEX",
                    type: "piercing",
                    range: "80/320",
                },
            },
            Cleric: {
                melee: {
                    name: "Mace",
                    damage: "1d6",
                    ability: "STR",
                    type: "bludgeoning",
                },
                ranged: {
                    name: "Light Crossbow",
                    damage: "1d8",
                    ability: "DEX",
                    type: "piercing",
                    range: "80/320",
                },
            },
            Barbarian: {
                melee: {
                    name: "Greataxe",
                    damage: "1d12",
                    ability: "STR",
                    type: "slashing",
                },
                ranged: {
                    name: "Handaxe",
                    damage: "1d6",
                    ability: "STR",
                    type: "slashing",
                    range: "20/60",
                },
            },
            Ranger: {
                melee: {
                    name: "Longsword",
                    damage: "1d8",
                    ability: "STR",
                    type: "slashing",
                },
                ranged: {
                    name: "Longbow",
                    damage: "1d8",
                    ability: "DEX",
                    type: "piercing",
                    range: "150/600",
                },
            },
            Paladin: {
                melee: {
                    name: "Longsword",
                    damage: "1d8",
                    ability: "STR",
                    type: "slashing",
                },
                ranged: {
                    name: "Javelin",
                    damage: "1d6",
                    ability: "STR",
                    type: "piercing",
                    range: "30/120",
                },
            },
            Monk: {
                melee: {
                    name: "Unarmed Strike",
                    damage: "1d4",
                    ability: "DEX",
                    type: "bludgeoning",
                },
                ranged: {
                    name: "Dart",
                    damage: "1d4",
                    ability: "DEX",
                    type: "piercing",
                    range: "20/60",
                },
            },
            Bard: {
                melee: {
                    name: "Rapier",
                    damage: "1d8",
                    ability: "DEX",
                    type: "piercing",
                },
                ranged: {
                    name: "Shortbow",
                    damage: "1d6",
                    ability: "DEX",
                    type: "piercing",
                    range: "80/320",
                },
            },
            Druid: {
                melee: {
                    name: "Scimitar",
                    damage: "1d6",
                    ability: "DEX",
                    type: "slashing",
                },
                ranged: {
                    name: "Dart",
                    damage: "1d4",
                    ability: "DEX",
                    type: "piercing",
                    range: "20/60",
                },
            },
            Warlock: {
                melee: {
                    name: "Dagger",
                    damage: "1d4",
                    ability: "DEX",
                    type: "piercing",
                },
                ranged: {
                    name: "Light Crossbow",
                    damage: "1d8",
                    ability: "DEX",
                    type: "piercing",
                    range: "80/320",
                },
            },
        };

        return (
            classWeapons[cls] || {
                melee: {
                    name: "Unarmed Strike",
                    damage: "1",
                    ability: "STR",
                    type: "bludgeoning",
                },
                ranged: {
                    name: "Improvised Weapon",
                    damage: "1d4",
                    ability: "STR",
                    type: "bludgeoning",
                    range: "20/60",
                },
            }
        );
    }

    getCharacterSpells() {
        const profile = JSON.parse(localStorage.getItem("tv_profile") || "{}");
        const cls = profile.class;
        const level = window.user?.level || 1;

        const classSpells = {
            Wizard: {
                cantrip_attack: {
                    name: "Fire Bolt",
                    damage: "1d10",
                    ability: "INT",
                    type: "fire",
                    range: "120",
                },
                level1_attack:
                    level >= 1
                        ? {
                              name: "Magic Missile",
                              damage: "1d4+1",
                              ability: "INT",
                              type: "force",
                              auto_hit: true,
                          }
                        : null,
                bonus_spell: null,
            },
            Sorcerer: {
                cantrip_attack: {
                    name: "Fire Bolt",
                    damage: "1d10",
                    ability: "CHA",
                    type: "fire",
                    range: "120",
                },
                level1_attack:
                    level >= 1
                        ? {
                              name: "Chromatic Orb",
                              damage: "3d8",
                              ability: "CHA",
                              type: "elemental",
                              range: "90",
                          }
                        : null,
                bonus_spell:
                    level >= 3
                        ? {
                              name: "Quickened Spell",
                              damage: "1d10",
                              ability: "CHA",
                              type: "fire",
                          }
                        : null,
            },
            Warlock: {
                cantrip_attack: {
                    name: "Eldritch Blast",
                    damage: "1d10",
                    ability: "CHA",
                    type: "force",
                    range: "120",
                },
                level1_attack:
                    level >= 1
                        ? {
                              name: "Hex",
                              damage: "1d6",
                              ability: "CHA",
                              type: "necrotic",
                              bonus: true,
                          }
                        : null,
                bonus_spell: null,
            },
            Cleric: {
                cantrip_attack: {
                    name: "Sacred Flame",
                    damage: "1d8",
                    ability: "WIS",
                    type: "radiant",
                    save: "DEX",
                },
                level1_attack:
                    level >= 1
                        ? {
                              name: "Guiding Bolt",
                              damage: "4d6",
                              ability: "WIS",
                              type: "radiant",
                              range: "120",
                          }
                        : null,
                bonus_spell:
                    level >= 1
                        ? { name: "Healing Word", heal: "1d4", ability: "WIS" }
                        : null,
            },
            Druid: {
                cantrip_attack: {
                    name: "Produce Flame",
                    damage: "1d8",
                    ability: "WIS",
                    type: "fire",
                    range: "30",
                },
                level1_attack:
                    level >= 1
                        ? {
                              name: "Faerie Fire",
                              damage: "advantage",
                              ability: "WIS",
                              type: "utility",
                              save: "DEX",
                          }
                        : null,
                bonus_spell:
                    level >= 1
                        ? { name: "Healing Word", heal: "1d4", ability: "WIS" }
                        : null,
            },
            Bard: {
                cantrip_attack: {
                    name: "Vicious Mockery",
                    damage: "1d4",
                    ability: "CHA",
                    type: "psychic",
                    save: "WIS",
                },
                level1_attack:
                    level >= 1
                        ? {
                              name: "Dissonant Whispers",
                              damage: "3d6",
                              ability: "CHA",
                              type: "psychic",
                              save: "WIS",
                          }
                        : null,
                bonus_spell:
                    level >= 1
                        ? { name: "Healing Word", heal: "1d4", ability: "CHA" }
                        : null,
            },
        };

        return (
            classSpells[cls] || {
                cantrip_attack: null,
                level1_attack: null,
                bonus_spell: null,
            }
        );
    }

    getCharacterClass() {
        const profile = JSON.parse(localStorage.getItem("tv_profile") || "{}");
        return profile.class || "Fighter";
    }

    hasClassFeature(featureName) {
        const cls = this.getCharacterClass();
        const level = window.user?.level || 1;

        switch (featureName) {
            case "cunning_action":
                return cls === "Rogue";
            case "second_wind":
                return cls === "Fighter";
            case "bonus_spell":
                return ["Cleric", "Druid", "Sorcerer", "Warlock", "Wizard", "Bard", "Paladin", "Ranger"].includes(cls) && level >= 1;
            case "spell_attack":
                return ["Cleric", "Druid", "Sorcerer", "Warlock", "Wizard", "Bard"].includes(cls) || (["Paladin", "Ranger"].includes(cls) && level >= 2);
            case "ranged_attack":
                // Most classes can use ranged weapons, but let's check if they have appropriate stats
                return true; // For now, allow all classes to attempt ranged attacks
            default:
                return true; // Basic actions available to all
        }
    }

    isActionAvailable(actionType) {
        switch (actionType) {
            case "melee_attack":
            case "dash":
            case "disengage":
            case "dodge":
            case "hide":
            case "grapple":
            case "help":
                return true; // Available to all characters
            case "ranged_attack":
                return this.hasClassFeature("ranged_attack");
            case "spell_attack":
                return this.hasClassFeature("spell_attack");
            case "bonus_spell":
                return this.hasClassFeature("bonus_spell");
            case "cunning_action":
                return this.hasClassFeature("cunning_action");
            case "second_wind":
                return this.hasClassFeature("second_wind");
            default:
                return true;
        }
    }

    displayRollResult(choice, roll, modifier, total, success) {
        const resultDiv = document.getElementById("quest-results");
        const modifierText = modifier >= 0 ? `+${modifier}` : `${modifier}`;
        const resultText = success ? "SUCCESS!" : "FAILURE!";
        const resultClass = success ? "success" : "failure";

        resultDiv.innerHTML = `
            <div class="roll-result ${resultClass}">
                <h4>${choice.text}</h4>
                <p>Roll: ${roll} ${modifierText} = ${total} vs DC ${choice.dc}</p>
                <p><strong>${resultText}</strong></p>
            </div>
        `;
    }

    handleSuccess(choice) {
        // Award immediate XP for successful skill checks
        if (window.user) {
            window.user.xp = (window.user.xp || 0) + 5;

            // Update UI elements directly
            const xpElement = document.getElementById("user-xp");
            if (xpElement) xpElement.textContent = window.user.xp;

            if (typeof window.updateUI === "function") {
                window.updateUI();
            }

            // Save progress
            localStorage.setItem("tv_user", JSON.stringify(window.user));
        }

        // Track successful action
        this.successfulActions++;

        // Show next options after success
        setTimeout(() => {
            if (
                this.successfulActions < this.maxSuccessfulActions &&
                this.activeQuest.scenes.length > 1
            ) {
                this.showNextChoices();
            } else {
                // Either max successes reached or no more scenes
                if (this.activeQuest.scenes.length > 1) {
                    this.currentScene = this.activeQuest.scenes[1];
                    this.renderQuestInterface();
                } else {
                    this.completeQuest();
                }
            }
        }, 2000);
    }

    handleFailure(choice) {
        // Failed action triggers immediate combat if available
        setTimeout(() => {
            if (this.activeQuest.scenes.length > 1) {
                this.currentScene = this.activeQuest.scenes[1];
                this.renderQuestInterface();
            } else {
                // Allow retry if no combat scene
                const retryDiv =
                    document.getElementById("quest-content") ||
                    document.querySelector(".scene-content");
                if (retryDiv) {
                    retryDiv.innerHTML += `
                        <div class="retry-options">
                            <p>Your approach didn't work as planned. Try a different strategy:</p>
                            <button onclick="questEngine.renderQuestInterface()">Try Again</button>
                            <button onclick="questEngine.abandonQuest()">Retreat for Now</button>
                        </div>
                    `;
                }
            }
        }, 2000);
    }

    showNextChoices() {
        const questContainer = document.getElementById("quest-container");

        const advantageText =
            this.successfulActions === 1
                ? "Your success gives you a slight advantage. What's your next move?"
                : this.successfulActions === 2
                  ? "Your continued success puts you in a strong position. Choose wisely:"
                  : "You've achieved maximum advantage! One final decision before the confrontation:";

        const nextOptions = [
            {
                text: `Continue with stealth approach (${this.successfulActions + 1}/3 advantages)`,
                action: "stealth",
            },
            {
                text: `Gather more intelligence (${this.successfulActions + 1}/3 advantages)`,
                action: "intel",
            },
            {
                text: `Set up tactical position (${this.successfulActions + 1}/3 advantages)`,
                action: "tactics",
            },
            {
                text: `Proceed to confrontation (${this.successfulActions}/3 advantages)`,
                action: "combat",
            },
        ];

        questContainer.innerHTML = `
            <div class="active-quest">
                <h2>${this.activeQuest.title}</h2>
                <div class="scene-content">
                    <p class="scene-text">${advantageText}</p>
                    <div class="quest-options">
                        ${nextOptions
                            .map(
                                (option, index) => `
                            <button class="quest-option" onclick="questEngine.handleNextChoice('${option.action}')">
                                ${option.text}
                            </button>
                        `,
                            )
                            .join("")}
                    </div>
                </div>
                <div id="quest-results"></div>
                <button class="abandon-btn" onclick="questEngine.abandonQuest()">Abandon Quest</button>
            </div>
        `;
    }

    handleNextChoice(action) {
        if (action === "combat") {
            // Proceed to combat with current advantages
            if (this.activeQuest.scenes.length > 1) {
                this.currentScene = this.activeQuest.scenes[1];
                this.renderQuestInterface();
            } else {
                this.completeQuest();
            }
        } else {
            // Generate a skill check for the chosen action
            const skillChecks = {
                stealth: {
                    skill: "DEX",
                    dc: 12,
                    text: "Continue stealth approach",
                },
                intel: { skill: "INT", dc: 11, text: "Gather intelligence" },
                tactics: {
                    skill: "WIS",
                    dc: 13,
                    text: "Set up tactical advantage",
                },
            };

            const choice = skillChecks[action];
            if (choice) {
                // Disable choice buttons
                const buttons = document.querySelectorAll(".quest-option");
                buttons.forEach((btn) => (btn.disabled = true));

                // Roll for the action
                const roll = this.rollD20();
                this.processSkillCheck(choice, roll);
            }
        }
    }

    completeQuest() {
        if (!this.activeQuest) return;

        // Mark quest as completed
        this.completedQuests.push(this.activeQuest.id);
        localStorage.setItem(
            "completedQuests",
            JSON.stringify(this.completedQuests),
        );

        // Award rewards
        const rewards = this.activeQuest.rewards;

        // Ensure user object exists and load from main app data
        if (!window.user) {
            // Try to load existing user data from main app
            const savedData = localStorage.getItem("taskventureData");
            if (savedData) {
                window.user = JSON.parse(savedData);
            } else {
                window.user = {
                    xp: 0,
                    coins: 0,
                    level: 1,
                    questItems: [],
                    cards: [],
                    tasks: [],
                    inventory: [],
                    streak: 0,
                    restToken: false,
                    lastActiveDate: null,
                    avatar: {
                        armor: "",
                        weapon: "",
                        cape: "",
                    },
                };
            }
        }

        // Add XP and coins
        const oldXP = window.user.xp || 0;
        const oldCoins = window.user.coins || 0;

        window.user.xp = oldXP + rewards.xp;
        window.user.coins = oldCoins + rewards.coins;

        // Initialize arrays if they don't exist
        if (!window.user.questItems) window.user.questItems = [];
        if (!window.user.cards) window.user.cards = [];
        if (!window.user.inventory) window.user.inventory = [];

        // Add items to quest inventory and collection
        rewards.items.forEach((item) => {
            // Add to quest items inventory
            window.user.questItems.push(item);

            // Add to main inventory as well
            window.user.inventory.push(item);

            // Also create cards for the items
            const itemCard = {
                id: `quest_item_${Date.now()}_${Math.random()}`,
                name: item,
                rarity: "Uncommon",
                type: "Quest Item",
                effect: `Earned from completing: ${this.activeQuest.title}`,
                image: "images/cards/cloak_clarity_common.png", // Default image for quest items
            };
            window.user.cards.push(itemCard);
        });

        // Check for level up using D&D-style progression
        const oldLevel = window.user.level || 1;
        if (typeof calculateLevel === "function") {
            const newLevel = calculateLevel(window.user.xp);
            if (newLevel > oldLevel) {
                window.user.level = newLevel;
                console.log(`Level up! You are now level ${newLevel}`);
            }
        }

        // Save to main app storage system (taskventureData is the primary one)
        localStorage.setItem("taskventureData", JSON.stringify(window.user));

        console.log("Quest completed! Rewards added:", {
            xp: rewards.xp,
            coins: rewards.coins,
            items: rewards.items,
            totalXP: window.user.xp,
            totalCoins: window.user.coins,
            level: window.user.level,
            totalCards: window.user.cards.length,
        });

        // Show floating message with rewards
        this.showRewardMessage(rewards);

        // Force update all UI elements immediately and after a delay
        this.updateAllUIElements();
        setTimeout(() => this.updateAllUIElements(), 100);
        setTimeout(() => this.updateAllUIElements(), 500);

        // Show completion screen
        this.showQuestCompletion();
    }

    updateAllUIElements() {
        if (!window.user) return;

        // Ensure main app has the updated user data
        if (typeof window.loadUserData === "function") {
            window.loadUserData();
        }

        const xpElement = document.getElementById("user-xp");
        const levelElement = document.getElementById("user-level");
        const cardCountElement = document.getElementById("card-count");

        // Update currency display - convert total coins to different denominations
        const totalCoins = window.user.coins || 0;
        const platinum = Math.floor(totalCoins / 1000);
        const gold = Math.floor((totalCoins % 1000) / 100);
        const silver = Math.floor((totalCoins % 100) / 10);
        const copper = totalCoins % 10;

        const platinumElement = document.getElementById("platinum-coins");
        const goldElement = document.getElementById("gold-coins");
        const silverElement = document.getElementById("silver-coins");
        const copperElement = document.getElementById("copper-coins");

        if (xpElement) xpElement.textContent = window.user.xp;
        if (levelElement) levelElement.textContent = window.user.level || 1;
        if (cardCountElement)
            cardCountElement.textContent = window.user.cards
                ? window.user.cards.length
                : 0;

        if (platinumElement) platinumElement.textContent = platinum;
        if (goldElement) goldElement.textContent = gold;
        if (silverElement) silverElement.textContent = silver;
        if (copperElement) copperElement.textContent = copper;

        // Update XP bar using same formula as main app
        const xpForCurrentLevel = this.getXPForLevel
            ? this.getXPForLevel(window.user.level)
            : Math.pow(window.user.level, 2) * 100;
        const xpForNextLevel = this.getXPForLevel
            ? this.getXPForLevel(window.user.level + 1)
            : Math.pow(window.user.level + 1, 2) * 100;
        const xpProgress = (window.user.xp / xpForNextLevel) * 100;
        const xpFill = document.getElementById("xp-fill");
        const xpNextLevel = document.getElementById("xp-next-level");

        if (xpFill) xpFill.style.width = `${Math.min(xpProgress, 100)}%`;
        if (xpNextLevel) xpNextLevel.textContent = xpForNextLevel;

        // Force complete UI refresh
        if (typeof window.updateUI === "function") {
            window.updateUI();
        }
        if (typeof window.renderCollection === "function") {
            window.renderCollection();
        }
        if (typeof window.renderTasks === "function") {
            window.renderTasks();
        }
    }

    showRewardMessage(rewards) {
        const messageDiv = document.createElement("div");
        messageDiv.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 0.5rem;">Quest Rewards Earned!</div>
            <div>+${rewards.xp} XP</div>
            <div>+${rewards.coins} Coins</div>
            <div>${rewards.items.length} Items</div>
        `;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem;
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            border: 2px solid #15803d;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 1001;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;

        document.body.appendChild(messageDiv);

        // Remove message after 4 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = "slideIn 0.3s ease-out reverse";
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.parentNode.removeChild(messageDiv);
                    }
                }, 300);
            }
        }, 4000);
    }

    // Debug function to check current user stats
    checkStats() {
        if (window.user) {
            console.log("Current User Stats:", {
                xp: window.user.xp,
                coins: window.user.coins,
                level: window.user.level,
                questItems: window.user.questItems
                    ? window.user.questItems.length
                    : 0,
                cards: window.user.cards ? window.user.cards.length : 0,
                completedQuests: this.completedQuests.length,
            });
            return window.user;
        } else {
            console.log("No user data found");
            return null;
        }
    }

    showQuestCompletion() {
        const questContainer = document.getElementById("quest-container");
        const rewards = this.activeQuest.rewards;

        questContainer.innerHTML = `
            <div class="quest-completion">
                <h2>🎉 Quest Complete!</h2>
                <h3>${this.activeQuest.title}</h3>
                <div class="rewards">
                    <h4>Rewards Earned:</h4>
                    <ul>
                        <li><span class="reward-xp">+${rewards.xp} XP</span> (Added to your total)</li>
                        <li><span class="reward-coins">+${rewards.coins} Coins</span> (Added to your purse)</li>
                        ${rewards.items.map((item) => `<li><span class="reward-item">${item}</span> (Added to inventory & collection)</li>`).join("")}
                    </ul>
                </div>
                <div class="current-stats">
                    <h4>Your Current Stats:</h4>
                    <p>Total XP: <strong>${window.user?.xp || 0}</strong></p>
                    <p>Level: <strong>${window.user?.level || 1}</strong></p>
                    <p>Coins: <strong>${window.user?.coins || 0}</strong></p>
                    <p>Quest Items: <strong>${window.user?.questItems?.length || 0}</strong></p>
                </div>
                <button onclick="questEngine.returnToQuestList()">Return to Quest List</button>
            </div>
        `;

        this.activeQuest = null;
        this.currentScene = null;
    }

    retreatFromCombat() {
        this.hideDiceModal();
        this.activeQuest = null;
        this.currentScene = null;
        this.returnToQuestList();
    }

    abandonQuest() {
        this.hideDiceModal();
        this.activeQuest = null;
        this.currentScene = null;
        this.returnToQuestList();
    }

    renderQuestInterface() {
        if (!this.activeQuest || !this.currentScene) return;

        const questContainer = document.getElementById("quest-container");

        if (this.currentScene.combat) {
            this.renderCombat();
            return;
        }

        questContainer.innerHTML = `
            <div class="active-quest">
                <h2>${this.activeQuest.title}</h2>
                <div class="scene-content">
                    <p class="scene-text">${this.currentScene.text}</p>
                    <div class="quest-options">
                        ${this.currentScene.options
                            .map(
                                (option, index) => `
                            <button class="quest-option" onclick="questEngine.makeChoice(${index})">
                                ${option.text}
                                <span class="skill-info">(${option.skill} DC ${option.dc})</span>
                            </button>
                        `,
                            )
                            .join("")}
                    </div>
                </div>
                <div id="quest-results"></div>
                <button class="abandon-btn" onclick="questEngine.abandonQuest()">Abandon Quest</button>
            </div>
        `;
    }

    renderCombat() {
        const questContainer = document.getElementById("quest-container");
        const enemy = this.currentScene.enemy;

        // Initialize enemy HP if not already set
        if (this.enemyHP === 0) {
            this.enemyHP = enemy.hp;
            this.maxEnemyHP = enemy.hp;
        }

        questContainer.innerHTML = `
            <div class="combat-interface">
                <div class="combat-header">
                    <h2>Combat!</h2>
                    <div class="health-bars">
                        <div class="health-bar-container">
                            <h4>Your Health</h4>
                            <div class="health-bar">
                                <div class="health-fill" style="width: ${(this.playerHP / this.maxPlayerHP) * 100}%"></div>
                                <div class="health-text">${this.playerHP}/${this.maxPlayerHP}</div>
                            </div>
                        </div>
                        <div class="health-bar-container">
                            <h4>${enemy.name}</h4>
                            <div class="health-bar">
                                <div class="health-fill" style="width: ${(this.enemyHP / this.maxEnemyHP) * 100}%"></div>
                                <div class="health-text">${this.enemyHP}/${this.maxEnemyHP}</div>
                            </div>
                        </div>
                    </div>
                    <div class="enemy-info">
                        <h3>${enemy.name}</h3>
                        <p>AC: ${enemy.ac}</p>
                    </div>
                </div>
                <div class="combat-options">
                    ${this.generateCombatButton('melee_attack', '⚔️ Melee Attack')}
                    ${this.generateCombatButton('ranged_attack', '🏹 Ranged Attack')}
                    ${this.generateCombatButton('spell_attack', '✨ Spell Attack')}
                    ${this.generateCombatButton('dash', '🏃 Dash')}
                    ${this.generateCombatButton('disengage', '🚶 Disengage')}
                    ${this.generateCombatButton('dodge', '🛡️ Dodge')}
                    ${this.generateCombatButton('hide', '👤 Hide')}
                    ${this.generateCombatButton('grapple', '🤼 Grapple')}
                    ${this.generateCombatButton('help', '❤️ Help Self')}
                    ${this.generateCombatButton('bonus_spell', '🌟 Bonus Spell')}
                    ${this.generateCombatButton('cunning_action', '🗡️ Cunning Action')}
                    ${this.generateCombatButton('second_wind', '💨 Second Wind')}
                    <button class="retreat-btn" onclick="questEngine.retreatFromCombat()">🏃‍♂️ Retreat from Combat</button>
                </div>

                <!-- Integrated Dice Section -->
                <div id="combat-dice-section" style="display: none;">
                  <div id="combat-dice-display" class="dice-stage"></div>
                  <div class="dice-actions">
                    <button id="combat-roll-btn" class="combat-roll-button">ROLL DICE</button>
                  </div>
                  <div id="combat-dice-result" class="combat-dice-result"></div>
                </div>
                <div id="combat-log"></div>
            </div>
        `;

        // Initialize dice after combat interface is rendered
        setTimeout(() => {
            if (typeof window.ensureDiceInitialized === "function") {
                const result = window.ensureDiceInitialized();
                if (result) {
                    console.log("✅ Combat dice initialized successfully");
                } else {
                    console.log(
                        "❌ Combat dice initialization failed, using fallback",
                    );
                }
            }
        }, 200);
    }

    generateCombatButton(actionType, displayText) {
        const isAvailable = this.isActionAvailable(actionType);
        const className = isAvailable ? '' : 'unavailable';
        const onclick = isAvailable
            ? `questEngine.handleCombatAction({type: '${actionType}', name: '${displayText.replace(/[^a-zA-Z ]/g, '').trim()}'})`
            : `questEngine.showUnavailableAction('${displayText}')`;

        return `<button class="${className}" onclick="${onclick}">${displayText}</button>`;
    }

    showUnavailableAction(actionName) {
        showFloatingMessage(`${actionName} is not available to your character!`, 'error');
    }

    async handleCombatAction(action) {
        if (this.pendingRoll) return;

        // Check if action is available
        if (!this.isActionAvailable(action.type)) {
            this.showUnavailableAction(action.name);
            return;
        }

        this.currentAction = action;

        // Show dice and set up roll context
        const diceSection = document.getElementById("combat-dice-section");
        if (diceSection) {
            diceSection.style.display = "block";
        }

        // For attack actions, we need two-stage rolling (hit then damage)
        if (['melee_attack', 'ranged_attack', 'spell_attack'].includes(action.type)) {
            this.pendingRoll = { type: action.type, action: action, stage: 'hit' };
            this.setupHitRoll(action);
        } else {
            // Non-attack actions use single roll
            this.pendingRoll = { type: action.type, action: action, stage: 'single' };
            this.setupSingleRoll(action);
        }

        // Initialize dice if needed
        if (typeof window.ensureDiceInitialized === "function") {
            window.ensureDiceInitialized();
        }

        // Disable combat buttons temporarily
        const buttons = document.querySelectorAll(".combat-options button:not(.unavailable)");
        buttons.forEach((btn) => (btn.disabled = true));
    }

    setupHitRoll(action) {
        const resultDiv = document.getElementById("combat-dice-result");
        if (resultDiv) {
            resultDiv.innerHTML = `<p>Roll to HIT with ${action.name}. Click "ROLL DICE".</p>`;
        }

        const rollBtn = document.getElementById("combat-roll-btn");
        if (rollBtn) {
            rollBtn.disabled = false;
            rollBtn.onclick = () => {
                if (typeof window.roll3DDice === "function") {
                    window.roll3DDice('d20');
                } else {
                    // Fallback
                    const roll = Math.floor(Math.random() * 20) + 1;
                    this.processDiceRoll(roll); // This will call resolveMeleeAttack etc.
                }
            };
        }
    }

    setupSingleRoll(action) {
        const resultDiv = document.getElementById("combat-dice-result");
        if (resultDiv) {
            resultDiv.innerHTML = `<p>Perform ${action.name}. Click "ROLL DICE".</p>`;
        }

        const rollBtn = document.getElementById("combat-roll-btn");
        if (rollBtn) {
            rollBtn.disabled = false;
            rollBtn.onclick = () => {
                if (typeof window.roll3DDice === "function") {
                    // For non-attack actions, we might need different dice, but for now, let's assume d20 for general actions.
                    // Or, if the action implies damage, we might need a damage die. This needs more context.
                    // For now, let's default to d20 for simplicity or use a predefined damage die if available.
                    const actionType = action.type;
                    let dieToRoll = 'd20'; // Default to d20

                    if (actionType === 'second_wind') {
                        dieToRoll = 'd8'; // Example: Second Wind might use a d8 for healing
                    } else if (actionType === 'bonus_spell' && action.spell?.heal) {
                        dieToRoll = 'd4'; // Example: Bonus spell heal uses d4
                    }

                    window.roll3DDice(dieToRoll);
                } else {
                    // Fallback
                    const roll = Math.floor(Math.random() * 20) + 1;
                    this.processDiceRoll(roll);
                }
            };
        }
    }

    // Main method to handle dice rolls (called from dice.js)
    processDiceRoll(diceResult) {
        if (!this.pendingRoll) {
            console.warn("processDiceRoll called with no pending roll.");
            return;
        }

        const { type, action, stage } = this.pendingRoll;

        if (stage === 'hit') {
            // First stage: Hit roll
            const hitRoll = diceResult;
            const success = this.checkHit(hitRoll, action); // Implement checkHit logic

            if (success) {
                // Transition to damage roll
                this.pendingRoll.stage = 'damage';
                this.pendingRoll.hitRoll = hitRoll;
                this.setupDamageRoll(action, hitRoll);
            } else {
                // Miss
                this.resolveMiss(action, hitRoll);
                this.cleanupPendingRoll();
            }
        } else if (stage === 'damage') {
            // Second stage: Damage roll
            const damageRoll = diceResult;
            this.resolveDamage(action, this.pendingRoll.hitRoll, damageRoll);
            this.cleanupPendingRoll();
        } else if (stage === 'single') {
            // Single roll for non-attack actions
            this.processCombatRoll(diceResult); // Use the existing processCombatRoll for non-attack actions
            this.cleanupPendingRoll();
        }
    }

    // Helper to check if an attack hits
    checkHit(attackRoll, action) {
        const enemy = this.currentScene.enemy;
        const weapons = this.getCharacterWeapons();
        const spells = this.getCharacterSpells();

        let attackInfo = {};
        if (action.type === 'melee_attack') attackInfo = weapons.melee;
        else if (action.type === 'ranged_attack') attackInfo = weapons.ranged;
        else if (action.type === 'spell_attack') attackInfo = spells.cantrip_attack || spells.level1_attack;

        if (!attackInfo) return false;

        const abilityModifier = this.getAbilityModifier(attackInfo.ability);
        const proficiencyBonus = Math.ceil((window.user?.level || 1) / 4) + 1;
        const questBonus = this.successfulActions * 2;

        let totalAttackRoll = attackRoll + abilityModifier + proficiencyBonus + questBonus;

        // Apply advantage/disadvantage logic here if applicable to the hit roll itself
        // (e.g., if playerAdvantage was set before calling handleCombatAction)
        let advantageText = "";
        if (this.playerAdvantage) { // This logic might need refinement based on when advantage is applied
            const secondRoll = Math.floor(Math.random() * 20) + 1;
            if (secondRoll > attackRoll) {
                totalAttackRoll = secondRoll + abilityModifier + proficiencyBonus + questBonus;
                advantageText = ` (advantage: ${secondRoll})`;
            }
        }

        const logDiv = document.getElementById("combat-log");
        logDiv.classList.add("visible");

        logDiv.innerHTML += `<p><strong>${attackInfo.name} Attack:</strong> ${attackRoll}${advantageText} + ${abilityModifier} (${attackInfo.ability}) + ${proficiencyBonus} (prof) + ${questBonus} (quest) = ${totalAttackRoll} vs AC ${enemy.ac}</p>`;

        return totalAttackRoll >= enemy.ac;
    }

    // Helper to set up the damage roll stage
    setupDamageRoll(action, hitRoll) {
        const damageDie = this.getDamageDieForAction(action);
        const resultDiv = document.getElementById("combat-dice-result");
        if (resultDiv) {
            resultDiv.innerHTML = `<p>Hit with ${action.name}! Roll for damage. Click "ROLL DICE" for ${damageDie}.</p>`;
        }

        const rollBtn = document.getElementById("combat-roll-btn");
        if (rollBtn) {
            rollBtn.disabled = false;
            rollBtn.onclick = () => {
                if (typeof window.roll3DDice === "function") {
                    window.roll3DDice(damageDie);
                } else {
                    // Fallback damage roll
                    const damageRoll = this.rollWeaponDamage(this.getDamageStringForAction(action));
                    this.processDiceRoll(damageRoll);
                }
            };
        }
    }

    // Helper to get the damage die string for an action
    getDamageDieForAction(action) {
        const weapons = this.getCharacterWeapons();
        const spells = this.getCharacterSpells();
        let damageString = "";

        if (action.type === 'melee_attack') damageString = weapons.melee.damage;
        else if (action.type === 'ranged_attack') damageString = weapons.ranged.damage;
        else if (action.type === 'spell_attack') {
            const spell = spells.cantrip_attack || spells.level1_attack;
            if (spell) damageString = spell.damage;
        }

        // Extract the die part (e.g., '1d8' from '1d8+2')
        const dieMatch = damageString.match(/(\d+d\d+)/);
        return dieMatch ? dieMatch[0] : '1d6'; // Default to d6 if no die found
    }

    // Helper to get the full damage string for an action
    getDamageStringForAction(action) {
        const weapons = this.getCharacterWeapons();
        const spells = this.getCharacterSpells();

        if (action.type === 'melee_attack') return weapons.melee.damage;
        else if (action.type === 'ranged_attack') return weapons.ranged.damage;
        else if (action.type === 'spell_attack') {
            const spell = spells.cantrip_attack || spells.level1_attack;
            return spell ? spell.damage : "1d6"; // Default to 1d6
        }
        return "1d6"; // Default for other actions if needed
    }

    // Helper to resolve the damage after a hit
    resolveDamage(action, hitRoll, damageRoll) {
        const enemy = this.currentScene.enemy;
        const logDiv = document.getElementById("combat-log");
        logDiv.classList.add("visible");

        let totalDamage = damageRoll;
        let weaponOrSpellName = "";
        let weaponOrSpellType = "";

        const weapons = this.getCharacterWeapons();
        const spells = this.getCharacterSpells();

        if (action.type === 'melee_attack') {
            const weapon = weapons.melee;
            totalDamage += this.getAbilityModifier(weapon.ability);
            weaponOrSpellName = weapon.name;
            weaponOrSpellType = weapon.type;
        } else if (action.type === 'ranged_attack') {
            const weapon = weapons.ranged;
            totalDamage += this.getAbilityModifier(weapon.ability);
            weaponOrSpellName = weapon.name;
            weaponOrSpellType = weapon.type;
        } else if (action.type === 'spell_attack') {
            const spell = spells.cantrip_attack || spells.level1_attack;
            if (spell) {
                weaponOrSpellName = spell.name;
                weaponOrSpellType = spell.type;
                // For spells, damage might already include ability modifier or have special rules
                // Here, we add the ability modifier if it's not a direct damage spell like Magic Missile
                if (!spell.auto_hit && !spell.save) {
                    totalDamage += this.getAbilityModifier(spell.ability);
                }
            }
        }

        // Apply quest bonus damage
        totalDamage += this.successfulActions;

        // Add sneak attack damage for rogues
        if (
            action.type === 'melee_attack' &&
            this.hasClassFeature("sneak_attack") &&
            (this.playerAdvantage || this.hiddenAdvantage)
        ) {
            const sneakDamage = this.rollDice("1d6"); // Simplified sneak attack
            totalDamage += sneakDamage;
            logDiv.innerHTML += `<p class="success">Sneak Attack! Additional ${sneakDamage} damage!</p>`;
        }

        // Ensure damage is at least 1 if calculation results in 0 or less
        totalDamage = Math.max(1, totalDamage);

        this.enemyHP = Math.max(0, this.enemyHP - totalDamage);
        logDiv.innerHTML += `<p class="success">Hit! Dealt ${totalDamage} ${weaponOrSpellType} damage with ${weaponOrSpellName}.</p>`;

        if (this.enemyHP <= 0) {
            logDiv.innerHTML += `<p class="success"><strong>${enemy.name} defeated!</strong></p>`;
            setTimeout(() => this.completeQuest(), 2000);
            return;
        }

        this.updateHealthBars();
    }

    // Helper to resolve a miss
    resolveMiss(action, hitRoll) {
        const enemy = this.currentScene.enemy;
        const logDiv = document.getElementById("combat-log");
        logDiv.classList.add("visible");

        let weaponOrSpellName = "";
        const weapons = this.getCharacterWeapons();
        const spells = this.getCharacterSpells();

        if (action.type === 'melee_attack') weaponOrSpellName = weapons.melee.name;
        else if (action.type === 'ranged_attack') weaponOrSpellName = weapons.ranged.name;
        else if (action.type === 'spell_attack') {
            const spell = spells.cantrip_attack || spells.level1_attack;
            if (spell) weaponOrSpellName = spell.name;
        }

        logDiv.innerHTML += `<p class="failure">${weaponOrSpellName} attack missed!</p>`;
    }

    // Helper to clean up after a roll is processed
    cleanupPendingRoll() {
        this.pendingRoll = null;

        // Re-enable combat buttons only if combat continues
        if (this.playerHP > 0 && this.enemyHP > 0) {
            setTimeout(() => {
                const buttons = document.querySelectorAll(".combat-options button:not(.unavailable)");
                buttons.forEach((btn) => (btn.disabled = false));
            }, 500);
        } else {
            // If combat ended, ensure buttons are not re-enabled
        }

        // Enemy attacks after a delay (unless player used disengage or enemy is grappled and can't attack)
        if (this.enemyHP > 0 && this.playerHP > 0) {
            if (this.enemyGrappled && this.enemyCannotAttack) {
                // Enemy is grappled and cannot attack this turn
                console.log("Enemy grappled, cannot attack.");
            } else if (!this.playerDisengaged) {
                setTimeout(() => this.enemyAttack(), 1500);
            } else {
                // Player disengaged, no opportunity attack from enemy
                console.log("Player disengaged, no opportunity attack.");
                this.playerDisengaged = false; // Reset disengage state
            }
        }
    }

    // This method is now superseded by the two-stage rolling system.
    // The logic is integrated into checkHit and resolveDamage.
    resolveMeleeAttack(diceRoll) {
        console.warn("resolveMeleeAttack called directly, should use two-stage rolling.");
    }

    // This method is now superseded by the two-stage rolling system.
    resolveRangedAttack(diceRoll) {
        console.warn("resolveRangedAttack called directly, should use two-stage rolling.");
    }

    // This method is now superseded by the two-stage rolling system.
    resolveSpellAttack(diceRoll) {
        console.warn("resolveSpellAttack called directly, should use two-stage rolling.");
    }

    resolveDash(diceRoll) {
        const logDiv = document.getElementById("combat-log");
        logDiv.classList.add("visible");

        this.playerAdvantage = true; // Advantage on next action
        this.enemyDisadvantage = true; // Enemy disadvantage on attacks against player
        logDiv.innerHTML += `<p class="success">You dash effectively! Gain advantage on your next action and the enemy has disadvantage on attacks against you!</p>`;
        this.cleanupPendingRoll();
    }

    resolveDisengage(diceRoll) {
        const logDiv = document.getElementById("combat-log");
        logDiv.classList.add("visible");

        const dexModifier = this.getAbilityModifier("DEX");
        const total = diceRoll + dexModifier;

        // Assuming a DC of 12 for disengage
        if (total >= 12) {
            this.playerDisengaged = true;
            this.playerAdvantage = true; // Often disengage grants advantage on next attack if moving away
            logDiv.innerHTML += `<p class="success">Successfully disengaged! You can move without provoking opportunity attacks and gain advantage on your next action!</p>`;
        } else {
            logDiv.innerHTML += `<p class="failure">Failed to disengage properly. Enemy can still make opportunity attacks.</p>`;
            this.playerDisengaged = false;
        }
        this.cleanupPendingRoll();
    }

    resolveDodge(diceRoll) {
        const logDiv = document.getElementById("combat-log");
        logDiv.classList.add("visible");

        const dexModifier = this.getAbilityModifier("DEX");
        // The dodge bonus AC might be static or based on the roll + modifier.
        // Let's use a roll-based bonus for now.
        const dodgeBonus = Math.floor((diceRoll + dexModifier) / 3) + 2; // Example calculation

        this.tempACBonus = dodgeBonus; // Apply bonus AC for this round
        this.enemyDisadvantage = true; // Enemy has disadvantage on attacks against you
        logDiv.innerHTML += `<p class="success">You focus entirely on defense! Gain +${dodgeBonus} AC and enemy has disadvantage on attacks against you!</p>`;
        this.cleanupPendingRoll();
    }

    resolveHide(diceRoll) {
        const logDiv = document.getElementById("combat-log");
        logDiv.classList.add("visible");

        const dexModifier = this.getAbilityModifier("DEX");
        const total = diceRoll + dexModifier;

        // Assuming a DC of 15 for hiding against a watchful enemy
        if (total >= 15) {
            this.hiddenAdvantage = true;
            this.playerAdvantage = true; // Gain advantage on next attack
            this.enemyCannotTarget = true; // Enemy cannot target you directly this turn
            logDiv.innerHTML += `<p class="success">Successfully hidden! You have advantage on your next attack and the enemy cannot target you directly this turn!</p>`;
        } else {
            logDiv.innerHTML += `<p class="failure">Failed to hide effectively. You remain visible to the enemy.</p>`;
            this.hiddenAdvantage = false;
            this.enemyCannotTarget = false;
        }
        this.cleanupPendingRoll();
    }

    resolveGrapple(diceRoll) {
        const logDiv = document.getElementById("combat-log");
        logDiv.classList.add("visible");

        const strModifier = this.getAbilityModifier("STR");
        const total = diceRoll + strModifier;
        const enemy = this.currentScene.enemy;

        // Enemy's Athletics or Acrobatics check to resist grapple (assuming a base bonus of +3 for simplicity)
        const enemyDefense = Math.floor(Math.random() * 20) + 1 + 3;

        logDiv.innerHTML += `<p><strong>Grapple Attempt:</strong> ${diceRoll} + ${strModifier} = ${total} vs enemy Athletics/Acrobatics (${enemyDefense})</p>`;

        if (total > enemyDefense) {
            this.enemyGrappled = true;
            this.playerAdvantage = true; // Advantage on attacks against the grappled enemy
            this.enemyCannotAttack = true; // Enemy cannot attack while grappled
            logDiv.innerHTML += `<p class="success">Grapple successful! Enemy is restrained and cannot attack you. You have advantage on all rolls until they break free!</p>`;
        } else {
            logDiv.innerHTML += `<p class="failure">Grapple attempt failed! Enemy resists or breaks free.</p>`;
            this.enemyGrappled = false;
            this.enemyCannotAttack = false;
        }
        this.cleanupPendingRoll();
    }

    resolveHelp(diceRoll) {
        const logDiv = document.getElementById("combat-log");
        logDiv.classList.add("visible");

        // Help action grants advantage to an ally. Here, we'll help ourselves.
        this.playerAdvantage = true;
        // The roll itself might determine effectiveness, or it's just a flat advantage.
        // Let's add a small heal as a bonus from the "help" action.
        const healAmount = Math.floor(diceRoll / 5) + 1; // Example: heal based on roll
        this.playerHP = Math.min(this.maxPlayerHP, this.playerHP + healAmount);

        logDiv.innerHTML += `<p class="success">You take a moment to steady yourself or offer aid! Recover ${healAmount} HP and gain advantage on your next action!</p>`;
        this.updateHealthBars();
        this.cleanupPendingRoll();
    }

    resolveBonusSpell(diceRoll) {
        const spells = this.getCharacterSpells();
        const spell = spells.bonus_spell;
        const logDiv = document.getElementById("combat-log");
        logDiv.classList.add("visible");

        if (!spell) {
            logDiv.innerHTML += `<p class="failure">No bonus action spells available!</p>`;
            this.cleanupPendingRoll();
            return;
        }

        if (spell.heal) {
            const healAmount =
                this.rollWeaponDamage(spell.heal) +
                this.getAbilityModifier(spell.ability);
            this.playerHP = Math.min(
                this.maxPlayerHP,
                this.playerHP + healAmount,
            );
            logDiv.innerHTML += `<p class="success">Cast ${spell.name} as bonus action! Healed ${healAmount} HP.</p>`;
            this.updateHealthBars();
        } else {
            // Offensive bonus spell (e.g., Hex)
            const damage = this.rollWeaponDamage(spell.damage);
            this.enemyHP = Math.max(0, this.enemyHP - damage);
            logDiv.innerHTML += `<p class="success">Cast ${spell.name} as bonus action! Dealt ${damage} ${spell.type} damage.</p>`;
            this.updateHealthBars();

            if (this.enemyHP <= 0) {
                logDiv.innerHTML += `<p class="success"><strong>${enemy.name} defeated by bonus spell!</strong></p>`;
                setTimeout(() => this.completeQuest(), 2000);
                return;
            }
        }
        this.cleanupPendingRoll();
    }

    resolveCunningAction(diceRoll) {
        const logDiv = document.getElementById("combat-log");
        logDiv.classList.add("visible");

        if (!this.hasClassFeature("cunning_action")) {
            logDiv.innerHTML += `<p class="failure">Cunning Action not available!</p>`;
            this.cleanupPendingRoll();
            return;
        }

        // Rogue can use cunning action to disengage, dash, or hide as bonus action
        // For simplicity, let's default to disengage/dash functionality for now.
        // A more complex implementation would allow player to choose Cunning Action target (dash, disengage, hide)
        this.playerDisengaged = true; // Treat as disengage for movement
        this.playerAdvantage = true; // Also grant advantage on next action
        logDiv.innerHTML += `<p class="success">Cunning Action! You move swiftly and reposition, gaining advantage on your next action!</p>`;
        this.cleanupPendingRoll();
    }

    resolveSecondWind(diceRoll) {
        const logDiv = document.getElementById("combat-log");
        logDiv.classList.add("visible");

        if (!this.hasClassFeature("second_wind")) {
            logDiv.innerHTML += `<p class="failure">Second Wind not available!</p>`;
            this.cleanupPendingRoll();
            return;
        }

        // Second wind healing is typically 1d10 + Fighter level
        const fighterLevel = window.user?.level || 1; // Assume user level is fighter level for simplicity
        const healAmount = diceRoll + fighterLevel;
        this.playerHP = Math.min(this.maxPlayerHP, this.playerHP + healAmount);
        logDiv.innerHTML += `<p class="success">Second Wind! Regained ${healAmount} hit points!</p>`;
        this.updateHealthBars();
        this.cleanupPendingRoll();
    }

    rollWeaponDamage(damageString) {
        // Parse damage strings like "1d8", "2d6", "1d4+1"
        const match = damageString.match(/(\d+)d(\d+)(\+\d+)?/);
        if (!match) {
            return parseInt(damageString) || 1;
        }

        const numDice = parseInt(match[1]);
        const dieSize = parseInt(match[2]);
        const bonus = match[3] ? parseInt(match[3]) : 0;

        let total = bonus;
        for (let i = 0; i < numDice; i++) {
            total += Math.floor(Math.random() * dieSize) + 1;
        }

        return total;
    }

    rollDice(diceString) {
        return this.rollWeaponDamage(diceString);
    }

    enemyAttack() {
        const logDiv = document.getElementById("combat-log");
        const enemy = this.currentScene.enemy;

        // Check if enemy cannot target player (due to hiding)
        if (this.enemyCannotTarget) {
            logDiv.innerHTML += `<p class="success">${enemy.name} cannot find you to attack!</p>`;
            this.enemyCannotTarget = false; // Reset for next turn
            this.cleanupPendingRoll(); // Ensure combat buttons are re-enabled if no other action pending
            return;
        }

        // Check if enemy is grappled and tries to break free
        if (this.enemyGrappled) {
            // Logic for breaking grapple should be handled by the player's action, not enemy's turn directly.
            // If enemy is grappled, they can't attack.
            logDiv.innerHTML += `<p>${enemy.name} is grappled and cannot attack!</p>`;
            this.cleanupPendingRoll();
            return;
        }

        this.performEnemyAttack();
    }

    performEnemyAttack() {
        const logDiv = document.getElementById("combat-log");
        const enemy = this.currentScene.enemy;

        let attackRoll = this.rollD20();
        const enemyAttackBonus = 4; // Example attack bonus for enemy

        // Apply disadvantage if enemy has it
        if (this.enemyDisadvantage) {
            const secondRoll = this.rollD20();
            attackRoll = Math.min(attackRoll, secondRoll); // Take the lower roll
            logDiv.innerHTML += `<p>${enemy.name} attacks with disadvantage: ${Math.max(attackRoll, secondRoll)}, ${Math.min(attackRoll, secondRoll)} (taking ${attackRoll})</p>`;
            this.enemyDisadvantage = false; // Reset disadvantage
        }

        const total = attackRoll + enemyAttackBonus;

        // Calculate player AC with bonuses
        let playerAC = 10 + this.getAbilityModifier("DEX"); // Base AC

        // Add armor bonus if equipped
        if (window.user?.avatar?.armor) {
            if (window.user.avatar.armor.includes("leather")) playerAC += 1;
            else if (window.user.avatar.armor.includes("chain")) playerAC += 3;
            else if (window.user.avatar.armor.includes("plate")) playerAC += 6;
        }

        if (this.tempACBonus) {
            playerAC += this.tempACBonus;
            logDiv.innerHTML += `<p>Your defensive stance grants +${this.tempACBonus} AC this turn.</p>`;
            this.tempACBonus = 0; // Reset temporary AC bonus
        }

        logDiv.innerHTML += `<p><strong>${enemy.name} attacks:</strong> ${attackRoll} + ${enemyAttackBonus} = ${total} vs AC ${playerAC}</p>`;

        if (total >= playerAC) {
            // Enemy hits
            let damage = this.rollWeaponDamage(enemy.damage); // Use enemy's damage string
            this.playerHP = Math.max(0, this.playerHP - damage);
            logDiv.innerHTML += `<p class="failure">${enemy.name} hits for ${damage} damage!</p>`;

            if (this.playerHP <= 0) {
                logDiv.innerHTML += `<p class="failure"><strong>You have been defeated!</strong></p>`;
                // Disable combat buttons as the game is over
                const buttons = document.querySelectorAll(".combat-options button");
                buttons.forEach((btn) => (btn.disabled = true));
                setTimeout(() => this.handleCombatDefeat(), 2000);
                return;
            }
        } else {
            logDiv.innerHTML += `<p class="success">${enemy.name} misses!</p>`;
        }

        this.updateHealthBars();
        this.cleanupPendingRoll(); // Ensure buttons are re-enabled after enemy attack
    }

    updateHealthBars() {
        const playerFill = document.querySelector(
            ".health-bar-container:first-child .health-fill",
        );
        const playerText = document.querySelector(
            ".health-bar-container:first-child .health-text",
        );
        const enemyFill = document.querySelector(
            ".health-bar-container:last-child .health-fill",
        );
        const enemyText = document.querySelector(
            ".health-bar-container:last-child .health-text",
        );

        if (playerFill && playerText) {
            const playerPercent = (this.playerHP / this.maxPlayerHP) * 100;
            playerFill.style.width = `${playerPercent}%`;
            playerText.textContent = `${this.playerHP}/${this.maxPlayerHP}`;
        }

        if (enemyFill && enemyText) {
            const enemyPercent = (this.enemyHP / this.maxEnemyHP) * 100;
            enemyFill.style.width = `${enemyPercent}%`;
            enemyText.textContent = `${this.enemyHP}/${this.maxEnemyHP}`;
        }
    }

    handleCombatDefeat() {
        const questContainer = document.getElementById("quest-container");
        questContainer.innerHTML = `
            <div class="quest-completion" style="background: linear-gradient(135deg, #4a1a1a 0%, #2a1a1a 100%); border-color: #dc3545;">
                <h2>💀 Defeated!</h2>
                <h3>The ${this.currentScene.enemy.name} proved too strong this time.</h3>
                <p>But every defeat teaches valuable lessons. You retreat to fight another day.</p>
                <button onclick="questEngine.returnToQuestList()">Return to Quest List</button>
            </div>
        `;

        // Reset player HP for next quest
        this.playerHP = this.maxPlayerHP;
        this.activeQuest = null;
        this.currentScene = null;
    }

    returnToQuestList() {
        this.availableQuests = this.generateAvailableQuests();
        this.renderQuestList();
    }

    // Reset all completed quests (for testing purposes)
    resetAllQuests() {
        this.completedQuests = [];
        localStorage.setItem(
            "completedQuests",
            JSON.stringify(this.completedQuests),
        );
        this.availableQuests = this.generateAvailableQuests();
        this.renderQuestList();
        console.log("All quests reset - available for completion again");
    }

    renderQuestList() {
        const questContainer = document.getElementById("quest-container");

        if (!questContainer) {
            console.error("Quest container not found!");
            return;
        }

        questContainer.innerHTML = `
            <div class="quest-list">
                <div class="quest-header-controls">
                    <h2>Available Quests</h2>
                    <button onclick="questEngine.resetAllQuests()" class="reset-quests-btn">🔄</button>
                </div>
                <div class="available-quests">
                    ${this.availableQuests
                        .map(
                            (quest) => `
                        <div class="quest-card ${quest.difficulty.toLowerCase()}">
                            <h3>${quest.title}</h3>
                            <p class="quest-description">${quest.description}</p>
                            <div class="quest-info">
                                <span class="difficulty">${quest.difficulty}</span>
                                <span class="rewards">+${quest.rewards.xp} XP, ${quest.rewards.coins} coins</span>
                            </div>
                            <button onclick="questEngine.startQuest('${quest.id}')">Begin Quest</button>
                        </div>
                    `,
                        )
                        .join("")}
                </div>

                <h3>Completed Quests (${this.completedQuests.length})</h3>
                <div class="completed-quests">
                    ${
                        this.completedQuests.length > 0
                            ? this.completedQuests
                                  .map(
                                      (questId) => `
                            <div class="completed-quest">
                                <span>✅ ${questId.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                            </div>
                        `,
                                  )
                                  .join("")
                            : "<p>No quests completed yet.</p>"
                    }
                </div>
            </div>
        `;
    }

    // Method to hide the dice modal
    hideDiceModal() {
        const diceSection = document.getElementById("combat-dice-section");
        if (diceSection) {
            diceSection.style.display = "none";
        }
        const resultDiv = document.getElementById("combat-dice-result");
        if (resultDiv) {
            resultDiv.innerHTML = ''; // Clear previous results
        }
        const rollBtn = document.getElementById("combat-roll-btn");
        if (rollBtn) {
            rollBtn.onclick = null; // Clear the onclick handler
        }
    }
}

// Add floating message utility if not already defined
function showFloatingMessage(message, type = 'info') {
    if (typeof window.showFloatingMessage !== 'undefined') {
        window.showFloatingMessage(message, type);
        return;
    }

    // Fallback implementation
    const msg = document.createElement('div');
    msg.textContent = message;
    msg.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 1rem; border-radius: 8px;
        color: white; font-weight: bold; z-index: 1001; animation: slideIn 0.3s ease-out;
        background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
        border: 2px solid ${type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#2563eb'};
    `;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
}


// Initialize quest engine when DOM loads
document.addEventListener("DOMContentLoaded", () => {
    // Check if questEngine already exists to avoid reinitialization if this script is loaded multiple times
    if (!window.questEngine) {
        window.questEngine = new QuestEngine();
        // Render the quest list initially if the container is present
        setTimeout(() => {
            if (document.getElementById("quest-container")) {
                window.questEngine.renderQuestList();
            }
        }, 500); // Small delay to ensure DOM is ready
    }
});

// Also initialize when showing the quests page
window.initializeQuestsPage = function () {
    // Ensure quest engine exists
    if (!window.questEngine) {
        window.questEngine = new QuestEngine();
    }

    if (window.questEngine && document.getElementById("quest-container")) {
        window.questEngine.renderQuestList();
    }
};