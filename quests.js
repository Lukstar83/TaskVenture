// quests.js - D&D Style Quest System

class QuestEngine {
    constructor() {
        this.activeQuest = null;
        this.completedQuests = JSON.parse(localStorage.getItem('completedQuests') || '[]');
        this.availableQuests = this.generateAvailableQuests();
        this.currentScene = null;
        this.playerHP = 100;
        this.maxPlayerHP = 100;
        this.enemyHP = 0;
        this.maxEnemyHP = 0;
        this.pendingRoll = null;
        this.enemyHasAdvantage = false;
        this.playerHasAdvantage = false;
    }

    // Generate random quests based on character level
    generateAvailableQuests() {
        const questTemplates = [
            {
                id: 'goblin_camp',
                title: 'Goblin Camp Infiltration',
                description: 'A band of goblins has been raiding nearby villages. Infiltrate their camp and stop their leader.',
                difficulty: 'Easy',
                minLevel: 1,
                rewards: { xp: 50, coins: 25, items: ['Goblin Dagger', 'Leather Boots'] },
                scenes: [
                    {
                        id: 'approach',
                        text: 'You approach the goblin camp hidden in the forest. Smoke rises from their fires.',
                        options: [
                            { text: 'Sneak around the perimeter (Stealth)', skill: 'DEX', dc: 12 },
                            { text: 'Charge in boldly (Intimidation)', skill: 'CHA', dc: 14 },
                            { text: 'Study the camp layout (Investigation)', skill: 'INT', dc: 10 }
                        ]
                    },
                    {
                        id: 'combat',
                        text: 'The goblin chief notices you! Combat begins!',
                        combat: true,
                        enemy: { name: 'Goblin Chief', hp: 25, ac: 14, damage: '1d6+2' }
                    }
                ]
            },
            {
                id: 'forest_bandits',
                title: 'Forest Bandit Patrol',
                description: 'Bandits have been ambushing travelers on the forest road. Stop their operations.',
                difficulty: 'Easy',
                minLevel: 1,
                rewards: { xp: 45, coins: 20, items: ['Bandit Mask', 'Shortbow'] },
                scenes: [
                    {
                        id: 'encounter',
                        text: 'You spot bandits setting up an ambush ahead. They haven\'t noticed you yet.',
                        options: [
                            { text: 'Set up counter-ambush (Stealth)', skill: 'DEX', dc: 13 },
                            { text: 'Negotiate peaceful resolution (Persuasion)', skill: 'CHA', dc: 15 },
                            { text: 'Charge them directly (Athletics)', skill: 'STR', dc: 12 }
                        ]
                    }
                ]
            },
            {
                id: 'merchant_escort',
                title: 'Merchant Caravan Escort',
                description: 'A nervous merchant needs protection while traveling through dangerous territory.',
                difficulty: 'Easy',
                minLevel: 1,
                rewards: { xp: 40, coins: 30, items: ['Travel Rations', 'Merchant\'s Ring'] },
                scenes: [
                    {
                        id: 'journey',
                        text: 'Halfway through the journey, wolves emerge from the treeline, hungry and aggressive.',
                        combat: true,
                        enemy: { name: 'Pack of Wolves', hp: 20, ac: 12, damage: '1d4+1' }
                    }
                ]
            },
            {
                id: 'haunted_library',
                title: 'The Haunted Library',
                description: 'Ancient spirits guard forbidden knowledge in an abandoned library.',
                difficulty: 'Medium',
                minLevel: 2,
                rewards: { xp: 75, coins: 40, items: ['Scroll of Wisdom', 'Spectral Cloak'] },
                scenes: [
                    {
                        id: 'entrance',
                        text: 'The library doors creak open. Ghostly whispers echo through dusty halls.',
                        options: [
                            { text: 'Call out respectfully (Persuasion)', skill: 'CHA', dc: 13 },
                            { text: 'Search for clues (Investigation)', skill: 'INT', dc: 11 },
                            { text: 'Move quietly (Stealth)', skill: 'DEX', dc: 15 }
                        ]
                    }
                ]
            },
            {
                id: 'cursed_temple',
                title: 'The Cursed Temple',
                description: 'An ancient temple has awakened with dark magic. Cleanse it before the curse spreads.',
                difficulty: 'Medium',
                minLevel: 2,
                rewards: { xp: 80, coins: 45, items: ['Holy Symbol', 'Blessed Water'] },
                scenes: [
                    {
                        id: 'altar',
                        text: 'Dark energy swirls around a corrupted altar. Shadowy figures begin to materialize.',
                        combat: true,
                        enemy: { name: 'Shadow Wraith', hp: 35, ac: 15, damage: '1d8+3' }
                    }
                ]
            },
            {
                id: 'missing_villagers',
                title: 'The Missing Villagers',
                description: 'Several villagers have disappeared. Strange tracks lead to an old mine shaft.',
                difficulty: 'Medium',
                minLevel: 2,
                rewards: { xp: 70, coins: 35, items: ['Mining Pick', 'Rescue Medal'] },
                scenes: [
                    {
                        id: 'mine_entrance',
                        text: 'The mine is dark and filled with unnatural sounds. You hear muffled cries from deep within.',
                        options: [
                            { text: 'Light a torch and proceed carefully (Survival)', skill: 'WIS', dc: 12 },
                            { text: 'Use magic to illuminate the way (Arcana)', skill: 'INT', dc: 14 },
                            { text: 'Feel your way in darkness (Stealth)', skill: 'DEX', dc: 16 }
                        ]
                    },
                    {
                        id: 'rescue',
                        text: 'You find the villagers trapped by a cave troll!',
                        combat: true,
                        enemy: { name: 'Cave Troll', hp: 40, ac: 16, damage: '2d6+4' }
                    }
                ]
            },
            {
                id: 'dragons_riddle',
                title: 'The Dragon\'s Riddle',
                description: 'An ancient dragon offers treasure to those who can solve its riddle.',
                difficulty: 'Hard',
                minLevel: 3,
                rewards: { xp: 100, coins: 75, items: ['Dragon Scale Armor', 'Ring of Fire Resistance'] },
                scenes: [
                    {
                        id: 'riddle',
                        text: 'The dragon speaks: "I am not seen, but I am felt. I have no form, yet I can transform. What am I?"',
                        options: [
                            { text: 'Answer: Time', skill: 'INT', dc: 16 },
                            { text: 'Answer: Magic', skill: 'INT', dc: 14 },
                            { text: 'Try to bargain instead', skill: 'CHA', dc: 18 }
                        ]
                    }
                ]
            },
            {
                id: 'lich_tower',
                title: 'The Lich\'s Tower',
                description: 'A powerful lich has risen and threatens the realm. Only the bravest dare face such evil.',
                difficulty: 'Hard',
                minLevel: 4,
                rewards: { xp: 150, coins: 100, items: ['Lich Bane Sword', 'Crown of Protection'] },
                scenes: [
                    {
                        id: 'tower_ascent',
                        text: 'The tower pulses with necrotic energy. Undead guardians block your path to the top.',
                        combat: true,
                        enemy: { name: 'Ancient Lich', hp: 60, ac: 18, damage: '2d8+5' }
                    }
                ]
            },
            {
                id: 'elemental_chaos',
                title: 'Elemental Chaos',
                description: 'The elemental planes are merging with reality. Restore the balance before chaos consumes all.',
                difficulty: 'Hard',
                minLevel: 3,
                rewards: { xp: 120, coins: 80, items: ['Elemental Orb', 'Cloak of Elements'] },
                scenes: [
                    {
                        id: 'convergence',
                        text: 'Fire, ice, earth, and air swirl chaotically around you. An elemental lord emerges from the maelstrom.',
                        combat: true,
                        enemy: { name: 'Elemental Lord', hp: 50, ac: 17, damage: '2d6+4' }
                    }
                ]
            },
        // Wellness-focused quests
        {
            id: 'healing_springs',
            title: 'The Healing Springs',
            description: 'Discover ancient springs said to restore mind, body, and spirit.',
            difficulty: 'Easy',
            minLevel: 1,
            rewards: { xp: 35, coins: 20, items: ['Spring Water', 'Meditation Stone'] },
            scenes: [
                {
                    id: 'springs_discovery',
                    text: 'You find the mystical healing springs. The water glows with restorative energy.',
                    options: [
                        { text: 'Meditate by the springs (Wisdom)', skill: 'WIS', dc: 10 },
                        { text: 'Study the magical properties (Investigation)', skill: 'INT', dc: 12 },
                        { text: 'Take a healing bath (Constitution)', skill: 'CON', dc: 8 }
                    ]
                }
            ]
        },
        {
            id: 'monastery_peace',
            title: 'The Monastery of Inner Peace',
            description: 'Monks invite you to learn ancient techniques for mental clarity and emotional balance.',
            difficulty: 'Easy',
            minLevel: 1,
            rewards: { xp: 40, coins: 15, items: ['Mindfulness Bell', 'Breathing Technique Scroll'] },
            scenes: [
                {
                    id: 'monk_teachings',
                    text: 'The head monk offers to teach you the ways of inner peace and self-compassion.',
                    options: [
                        { text: 'Practice meditation (Wisdom)', skill: 'WIS', dc: 11 },
                        { text: 'Learn breathing techniques (Constitution)', skill: 'CON', dc: 9 },
                        { text: 'Study mindfulness principles (Intelligence)', skill: 'INT', dc: 13 }
                    ]
                }
            ]
        },
        {
            id: 'garden_therapy',
            title: 'The Therapeutic Garden',
            description: 'A wise druid tends a magical garden that heals emotional wounds through nature connection.',
            difficulty: 'Medium',
            minLevel: 2,
            rewards: { xp: 60, coins: 30, items: ['Healing Herbs', 'Nature\'s Blessing Amulet'] },
            scenes: [
                {
                    id: 'garden_work',
                    text: 'The druid invites you to help tend the garden while learning about emotional healing.',
                    options: [
                        { text: 'Plant seeds mindfully (Wisdom)', skill: 'WIS', dc: 12 },
                        { text: 'Connect with plant spirits (Charisma)', skill: 'CHA', dc: 14 },
                        { text: 'Study herbalism (Intelligence)', skill: 'INT', dc: 11 }
                    ]
                }
            ]
        },
        {
            id: 'stress_dragon',
            title: 'The Stress Dragon',
            description: 'A unique dragon feeds on stress and anxiety. Learn to tame it through self-care practices.',
            difficulty: 'Medium',
            minLevel: 2,
            rewards: { xp: 70, coins: 35, items: ['Stress Relief Potion', 'Dragon Calming Whistle'] },
            scenes: [
                {
                    id: 'dragon_encounter',
                    text: 'The Stress Dragon appears, growing larger as it senses your worries. You must find a way to calm it.',
                    options: [
                        { text: 'Practice deep breathing (Constitution)', skill: 'CON', dc: 13 },
                        { text: 'Use calming words (Charisma)', skill: 'CHA', dc: 15 },
                        { text: 'Channel peaceful thoughts (Wisdom)', skill: 'WIS', dc: 14 }
                    ]
                }
            ]
        }
        ];

        // Add daily quest if needed
        this.checkDailyQuest(questTemplates);

        // Filter quests based on character level and completion status
        return questTemplates.filter(quest => {
            const userLevel = window.user?.level || 1;
            const isCompleted = this.completedQuests.includes(quest.id);
            return quest.minLevel <= userLevel && !isCompleted;
        });
    }

    checkDailyQuest(questTemplates) {
        const today = new Date().toDateString();
        const lastDailyQuest = localStorage.getItem('lastDailyQuest');

        if (lastDailyQuest !== today) {
            // Generate a new daily quest
            const dailyQuests = [
                {
                    id: `daily_patrol_${Date.now()}`,
                    title: 'Daily Patrol',
                    description: 'Patrol the local area and report any suspicious activity.',
                    difficulty: 'Easy',
                    minLevel: 1,
                    rewards: { xp: 25, coins: 15, items: ['Scout\'s Report'] },
                    isDaily: true,
                    scenes: [
                        {
                            id: 'patrol',
                            text: 'During your patrol, you notice something unusual in the distance.',
                            options: [
                                { text: 'Investigate carefully (Perception)', skill: 'WIS', dc: 10 },
                                { text: 'Approach boldly (Athletics)', skill: 'STR', dc: 12 },
                                { text: 'Observe from hiding (Stealth)', skill: 'DEX', dc: 11 }
                            ]
                        }
                    ]
                },
                {
                    id: `daily_gathering_${Date.now()}`,
                    title: 'Resource Gathering',
                    description: 'Collect herbs and materials for the local healer.',
                    difficulty: 'Easy',
                    minLevel: 1,
                    rewards: { xp: 20, coins: 10, items: ['Healing Herbs', 'Crafting Materials'] },
                    isDaily: true,
                    scenes: [
                        {
                            id: 'gathering',
                            text: 'You venture into the wilderness to gather resources. Wild creatures guard the best spots.',
                            options: [
                                { text: 'Use nature knowledge (Survival)', skill: 'WIS', dc: 11 },
                                { text: 'Search systematically (Investigation)', skill: 'INT', dc: 13 },
                                { text: 'Take risks for better resources (Athletics)', skill: 'STR', dc: 14 }
                            ]
                        }
                    ]
                },
                {
                    id: `daily_training_${Date.now()}`,
                    title: 'Combat Training',
                    description: 'Practice your combat skills at the training grounds.',
                    difficulty: 'Easy',
                    minLevel: 1,
                    rewards: { xp: 30, coins: 5, items: ['Training Dummy Remains'] },
                    isDaily: true,
                    scenes: [
                        {
                            id: 'training',
                            text: 'The training master sets up increasingly difficult challenges.',
                            options: [
                                { text: 'Focus on strength training (Athletics)', skill: 'STR', dc: 12 },
                                { text: 'Practice agility drills (Acrobatics)', skill: 'DEX', dc: 12 },
                                { text: 'Study combat theory (Investigation)', skill: 'INT', dc: 10 }
                            ]
                        }
                    ]
                }
            ];

            // Pick a random daily quest
            const randomDaily = dailyQuests[Math.floor(Math.random() * dailyQuests.length)];
            questTemplates.push(randomDaily);
            localStorage.setItem('lastDailyQuest', today);
        }
    }

    startQuest(questId) {
        const quest = this.availableQuests.find(q => q.id === questId);
        if (!quest) return false;

        this.activeQuest = { ...quest };
        this.currentScene = quest.scenes[0];
        this.renderQuestInterface();
        return true;
    }

    makeChoice(choiceIndex) {
        if (!this.currentScene || !this.currentScene.options) return;

        const choice = this.currentScene.options[choiceIndex];
        if (!choice) return;

        // Disable choice buttons to prevent multiple clicks
        const buttons = document.querySelectorAll('.quest-option');
        buttons.forEach(btn => btn.disabled = true);

        // Use 3D dice for skill check if available
        if (typeof window.rollSkillCheck === 'function') {
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
            const buttons = document.querySelectorAll('.quest-option');
            buttons.forEach(btn => btn.disabled = false);
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
        const profile = JSON.parse(localStorage.getItem('tv_profile') || '{}');
        const score = profile.scores?.[ability] || 10;
        return Math.floor((score - 10) / 2);
    }

    getPlayerAC() {
        const profile = JSON.parse(localStorage.getItem('tv_profile') || '{}');
        const scores = profile.scores || {};
        const cls = profile.class || '';
        
        const dexMod = Math.floor((scores.DEX - 10) / 2);
        let baseAC = 10 + dexMod;
        
        // Class-based AC adjustments
        if (cls === 'Barbarian' && !window.user?.avatar?.armor) {
            const conMod = Math.floor((scores.CON - 10) / 2);
            baseAC = 10 + dexMod + conMod;
        } else if (cls === 'Monk' && !window.user?.avatar?.armor) {
            const wisMod = Math.floor((scores.WIS - 10) / 2);
            baseAC = 10 + dexMod + wisMod;
        }
        
        // Add armor bonus
        let armorBonus = 0;
        if (window.user?.avatar?.armor) {
            if (window.user.avatar.armor.includes('leather')) armorBonus = 1;
            else if (window.user.avatar.armor.includes('chain')) armorBonus = 3;
            else if (window.user.avatar.armor.includes('plate')) armorBonus = 6;
        }
        
        return baseAC + armorBonus;
    }

    getProficiencyBonus() {
        const level = window.user?.level || 1;
        return Math.ceil(level / 4) + 1;
    }

    getSpellAttackBonus() {
        const profile = JSON.parse(localStorage.getItem('tv_profile') || '{}');
        const cls = profile.class || '';
        const spellcastingClasses = {
            'Wizard': 'INT', 'Sorcerer': 'CHA', 'Warlock': 'CHA', 'Bard': 'CHA',
            'Cleric': 'WIS', 'Druid': 'WIS', 'Ranger': 'WIS', 'Paladin': 'CHA'
        };
        
        const spellcastingAbility = spellcastingClasses[cls];
        if (!spellcastingAbility) return 0;
        
        const spellMod = this.getAbilityModifier(spellcastingAbility);
        return this.getProficiencyBonus() + spellMod;
    }

    displayRollResult(choice, roll, modifier, total, success) {
        const resultDiv = document.getElementById('quest-results');
        const modifierText = modifier >= 0 ? `+${modifier}` : `${modifier}`;
        const resultText = success ? 'SUCCESS!' : 'FAILURE!';
        const resultClass = success ? 'success' : 'failure';

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
            const xpElement = document.getElementById('user-xp');
            if (xpElement) xpElement.textContent = window.user.xp;

            if (typeof window.updateUI === 'function') {
                window.updateUI();
            }

            // Save progress
            localStorage.setItem('tv_user', JSON.stringify(window.user));
        }

        // Progress to next scene or complete quest
        setTimeout(() => {
            if (this.activeQuest.scenes.length > 1) {
                this.currentScene = this.activeQuest.scenes[1];
                this.renderQuestInterface();
            } else {
                this.completeQuest();
            }
        }, 2000);
    }

    handleFailure(choice) {
        // Allow retry or different approach
        setTimeout(() => {
            const retryDiv = document.getElementById('quest-content') || document.querySelector('.scene-content');
            if (retryDiv) {
                retryDiv.innerHTML += `
                    <div class="retry-options">
                        <p>Your approach didn't work as planned. Try a different strategy:</p>
                        <button onclick="questEngine.renderQuestInterface()">Try Again</button>
                        <button onclick="questEngine.abandonQuest()">Retreat for Now</button>
                    </div>
                `;
            } else {
                console.log('Could not find retry container, quest may need to be restarted');
            }
        }, 2000);
    }

    completeQuest() {
        if (!this.activeQuest) return;

        // Mark quest as completed
        this.completedQuests.push(this.activeQuest.id);
        localStorage.setItem('completedQuests', JSON.stringify(this.completedQuests));

        // Award rewards
        const rewards = this.activeQuest.rewards;

        // Ensure user object exists and load from main app data
        if (!window.user) {
            // Try to load existing user data from main app
            const savedData = localStorage.getItem('taskventureData');
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
                        cape: ""
                    }
                };
            }
        }

        // Add XP and coins
        const oldXP = window.user.xp || 0;
        const oldCoins = window.user.coins || 0;

        window.user.xp = oldXP + rewards.xp;
        window.user.coins = oldCoins + rewards.coins;
        
        console.log(`💰 Coin update: ${oldCoins} + ${rewards.coins} = ${window.user.coins}`);

        // Initialize arrays if they don't exist
        if (!window.user.questItems) window.user.questItems = [];
        if (!window.user.cards) window.user.cards = [];
        if (!window.user.inventory) window.user.inventory = [];

        // Add items to quest inventory and collection
        rewards.items.forEach(item => {
            // Add to quest items inventory
            window.user.questItems.push(item);

            // Add to main inventory as well
            window.user.inventory.push(item);

            // Also create cards for the items
            const itemCard = {
                id: `quest_item_${Date.now()}_${Math.random()}`,
                name: item,
                rarity: 'Uncommon',
                type: 'Quest Item',
                effect: `Earned from completing: ${this.activeQuest.title}`,
                image: 'images/cards/cloak_clarity_common.png' // Default image for quest items
            };
            window.user.cards.push(itemCard);
        });

        // Check for level up based on XP using main app formula
        const newLevel = Math.floor(Math.sqrt(window.user.xp / 100)) + 1;
        if (newLevel > (window.user.level || 1)) {
            window.user.level = newLevel;
            console.log(`Level up! You are now level ${newLevel}`);
        }

        // Save to main app storage system (taskventureData is the primary one)
        localStorage.setItem('taskventureData', JSON.stringify(window.user));
        
        // Force sync with main app user object if it exists
        if (typeof window.loadUserData === 'function') {
            window.loadUserData();
        }

        console.log('Quest completed! Rewards added:', {
            xp: rewards.xp,
            coins: rewards.coins,
            items: rewards.items,
            totalXP: window.user.xp,
            totalCoins: window.user.coins,
            level: window.user.level,
            totalCards: window.user.cards.length
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
        if (typeof window.loadUserData === 'function') {
            window.loadUserData();
        }

        const xpElement = document.getElementById('user-xp');
        const levelElement = document.getElementById('user-level');
        const cardCountElement = document.getElementById('card-count');

        // Update currency display - convert total coins to different denominations
        const totalCoins = window.user.coins || 0;
        const platinum = Math.floor(totalCoins / 1000);
        const gold = Math.floor((totalCoins % 1000) / 100);
        const silver = Math.floor((totalCoins % 100) / 10);
        const copper = totalCoins % 10;

        const platinumElement = document.getElementById('platinum-coins');
        const goldElement = document.getElementById('gold-coins');
        const silverElement = document.getElementById('silver-coins');
        const copperElement = document.getElementById('copper-coins');

        if (xpElement) xpElement.textContent = window.user.xp;
        if (levelElement) levelElement.textContent = window.user.level || 1;
        if (cardCountElement) cardCountElement.textContent = window.user.cards ? window.user.cards.length : 0;

        if (platinumElement) platinumElement.textContent = platinum;
        if (goldElement) goldElement.textContent = gold;
        if (silverElement) silverElement.textContent = silver;
        if (copperElement) copperElement.textContent = copper;

        // Update XP bar using same formula as main app
        const xpForCurrentLevel = this.getXPForLevel ? this.getXPForLevel(window.user.level) : Math.pow(window.user.level, 2) * 100;
        const xpForNextLevel = this.getXPForLevel ? this.getXPForLevel(window.user.level + 1) : Math.pow(window.user.level + 1, 2) * 100;
        const xpProgress = (window.user.xp / xpForNextLevel) * 100;
        const xpFill = document.getElementById('xp-fill');
        const xpNextLevel = document.getElementById('xp-next-level');

        if (xpFill) xpFill.style.width = `${Math.min(xpProgress, 100)}%`;
        if (xpNextLevel) xpNextLevel.textContent = xpForNextLevel;

        // Force complete UI refresh
        if (typeof window.updateUI === 'function') {
            window.updateUI();
        }
        if (typeof window.renderCollection === 'function') {
            window.renderCollection();
        }
        if (typeof window.renderTasks === 'function') {
            window.renderTasks();
        }
    }

    showRewardMessage(rewards) {
        const messageDiv = document.createElement('div');
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
                messageDiv.style.animation = 'slideIn 0.3s ease-out reverse';
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
            console.log('Current User Stats:', {
                xp: window.user.xp,
                coins: window.user.coins,
                level: window.user.level,
                questItems: window.user.questItems ? window.user.questItems.length : 0,
                cards: window.user.cards ? window.user.cards.length : 0,
                completedQuests: this.completedQuests.length
            });
            return window.user;
        } else {
            console.log('No user data found');
            return null;
        }
    }

    showQuestCompletion() {
        const questContainer = document.getElementById('quest-container');
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
                        ${rewards.items.map(item => `<li><span class="reward-item">${item}</span> (Added to inventory & collection)</li>`).join('')}
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

    abandonQuest() {
        this.activeQuest = null;
        this.currentScene = null;
        this.returnToQuestList();
    }

    renderQuestInterface() {
        if (!this.activeQuest || !this.currentScene) return;

        const questContainer = document.getElementById('quest-container');

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
                        ${this.currentScene.options.map((option, index) => `
                            <button class="quest-option" onclick="questEngine.makeChoice(${index})">
                                ${option.text}
                                <span class="skill-info">(${option.skill} DC ${option.dc})</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div id="quest-results"></div>
                <button class="abandon-btn" onclick="questEngine.abandonQuest()">Abandon Quest</button>
            </div>
        `;
    }

    renderCombat() {
        const questContainer = document.getElementById('quest-container');
        const enemy = this.currentScene.enemy;

        // Initialize enemy HP if not already set
        if (this.enemyHP === 0) {
            this.enemyHP = enemy.hp;
            this.maxEnemyHP = enemy.hp;
        }

        questContainer.innerHTML = `
            <div class="combat-interface">
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
                <div class="combat-options">
                    <button onclick="questEngine.initiateCombatAction('attack')">Attack with Weapon</button>
                    <button onclick="questEngine.initiateCombatAction('spell')">Cast Spell</button>
                    <button onclick="questEngine.initiateCombatAction('defend')">Defend</button>
                </div>

                <!-- Integrated Dice Section -->
                <div id="combat-dice-section" class="combat-dice-section" style="display: none;">
                    <h4>Roll for Action</h4>
                    <div class="integrated-dice-container">
                        <div id="combat-dice-display" class="combat-dice-display"><img src="/images/nav/d20.png"></div>
                        <button id="combat-roll-btn" onclick="if(typeof roll3DDice === 'function') { roll3DDice(); } else { window.questEngine.processDiceRoll(Math.floor(Math.random() * 20) + 1); }" class="combat-roll-button">Roll D20</button>
                        <div id="combat-dice-result" class="combat-dice-result"></div>
                    </div>
                </div>

                <div id="combat-log"></div>
            </div>
        `;

        // Initialize dice after combat interface is rendered
        setTimeout(() => {
            if (typeof window.ensureDiceInitialized === 'function') {
                const result = window.ensureDiceInitialized();
                if (result) {
                    console.log('✅ Combat dice initialized successfully');
                } else {
                    console.log('❌ Combat dice initialization failed, using fallback');
                }
            }
        }, 200);
    }

    initiateCombatAction(actionType) {
        this.pendingRoll = { type: actionType };

        // Show the integrated dice section
        const diceSection = document.getElementById('combat-dice-section');
        if (diceSection) {
            diceSection.style.display = 'block';

            // Update the prompt text based on action type
            const actionText = actionType === 'attack' ? 'attack' : actionType === 'spell' ? 'cast your spell' : 'defend';
            diceSection.querySelector('h4').textContent = `Roll to ${actionText}!`;

            // Initialize the 3D dice in the combat dice display
            setTimeout(() => {
                this.initializeCombatDice();
            }, 100);
        }

        // Disable combat buttons temporarily
        const buttons = document.querySelectorAll('.combat-options button');
        buttons.forEach(btn => btn.disabled = true);
    }

    initializeCombatDice() {
        // Initialize dice specifically for combat using the combat dice display
        setTimeout(() => {
            if (typeof window.ensureDiceInitialized === 'function') {
                const result = window.ensureDiceInitialized();
                if (result) {
                    console.log('✅ Combat dice ready for rolling');
                } else {
                    console.warn('Combat dice failed to initialize, will use fallback rolls');
                    // Show fallback message in dice display
                    const diceDisplay = document.getElementById('combat-dice-display');
                    if (diceDisplay && !diceDisplay.querySelector('canvas')) {
                        diceDisplay.innerHTML = '<div style="color: #d4af37;">🎲 Dice Ready (2D Mode)</div>';
                    }
                }
            } else if (typeof window.initCombatDice === 'function') {
                window.initCombatDice();
            }
        }, 300);
    }

    // Main method to handle dice rolls (called from dice.js)
    processDiceRoll(diceResult) {
        return this.processCombatRoll(diceResult);
    }

    processCombatRoll(diceResult) {
        if (!this.pendingRoll) return;

        const { type } = this.pendingRoll;
        const logDiv = document.getElementById('combat-log');

        // Handle player advantage for attack/spell rolls
        let finalRoll = diceResult;
        if ((type === 'attack' || type === 'spell') && this.playerHasAdvantage) {
            const secondRoll = Math.floor(Math.random() * 20) + 1;
            finalRoll = Math.max(diceResult, secondRoll);
            logDiv.innerHTML += `<p><strong>🎯 You have ADVANTAGE!</strong> Rolled ${diceResult} and ${secondRoll}, taking ${finalRoll}!</p>`;
            this.playerHasAdvantage = false; // Reset advantage after use
        }

        switch (type) {
            case 'attack':
                this.resolveAttack(finalRoll);
                break;
            case 'spell':
                this.resolveSpell(finalRoll);
                break;
            case 'defend':
                this.resolveDefend(finalRoll);
                break;
        }

        this.pendingRoll = null;

        // Hide the integrated dice section
        const diceSection = document.getElementById('combat-dice-section');
        if (diceSection) {
            diceSection.style.display = 'none';
        }

        // Check if combat ends before re-enabling buttons
        if (this.enemyHP <= 0 || this.playerHP <= 0) {
            return; // Combat ended, don't re-enable buttons
        }

        // Re-enable combat buttons only if combat continues
        setTimeout(() => {
            const buttons = document.querySelectorAll('.combat-options button');
            buttons.forEach(btn => btn.disabled = false);
        }, 500);

        // Enemy attacks after a delay
        if (this.enemyHP > 0 && this.playerHP > 0) {
            setTimeout(() => this.enemyAttack(), 1500);
        }
    }

    resolveAttack(diceRoll) {
        const strModifier = this.getAbilityModifier('STR');
        const proficiencyBonus = this.getProficiencyBonus();
        const total = diceRoll + strModifier + proficiencyBonus;
        const enemy = this.currentScene.enemy;
        const logDiv = document.getElementById('combat-log');

        // Check for critical hit (natural 20)
        if (diceRoll === 20) {
            logDiv.innerHTML += `<p><strong>🎯 CRITICAL HIT!</strong> Natural 20!</p>`;
            const baseDamage = Math.floor(Math.random() * 8) + 1 + strModifier; // 1d8 + STR
            const critDamage = Math.floor(Math.random() * 8) + 1; // Extra 1d8 for crit
            const totalDamage = baseDamage + critDamage;
            this.enemyHP = Math.max(0, this.enemyHP - totalDamage);
            logDiv.innerHTML += `<p class="success">Critical damage! Dealt ${totalDamage} damage (${baseDamage} + ${critDamage} crit)!</p>`;

            if (this.enemyHP <= 0) {
                logDiv.innerHTML += `<p class="success"><strong>${enemy.name} defeated by a critical strike!</strong></p>`;
                setTimeout(() => this.completeQuest(), 2000);
                return;
            }
        }
        // Check for critical failure (natural 1)
        else if (diceRoll === 1) {
            logDiv.innerHTML += `<p><strong>💥 CRITICAL FAILURE!</strong> Natural 1!</p>`;
            logDiv.innerHTML += `<p class="failure">You stumble and leave yourself open to attack!</p>`;
            // Mark that enemy gets advantage on next attack
            this.enemyHasAdvantage = true;
            // Player takes 1 damage from stumbling
            this.playerHP = Math.max(0, this.playerHP - 1);
            logDiv.innerHTML += `<p class="failure">You take 1 damage from your fumble.</p>`;
            
            if (this.playerHP <= 0) {
                logDiv.innerHTML += `<p class="failure"><strong>Your critical failure was fatal!</strong></p>`;
                setTimeout(() => this.handleCombatDefeat(), 2000);
                return;
            }
        }
        // Normal attack resolution
        else {
            logDiv.innerHTML += `<p><strong>Attack Roll:</strong> ${diceRoll} + ${strModifier} + ${proficiencyBonus} = ${total} vs AC ${enemy.ac}</p>`;

            if (total >= enemy.ac) {
                const damage = Math.floor(Math.random() * 8) + 1 + strModifier; // 1d8 + STR
                this.enemyHP = Math.max(0, this.enemyHP - damage);
                logDiv.innerHTML += `<p class="success">Hit! Dealt ${damage} damage.</p>`;

                if (this.enemyHP <= 0) {
                    logDiv.innerHTML += `<p class="success"><strong>${enemy.name} defeated!</strong></p>`;
                    setTimeout(() => this.completeQuest(), 2000);
                    return;
                }
            } else {
                logDiv.innerHTML += `<p class="failure">Attack missed!</p>`;
            }
        }

        this.updateHealthBars();
    }

    resolveSpell(diceRoll) {
        const spellAttackBonus = this.getSpellAttackBonus();
        const total = diceRoll + spellAttackBonus;
        const enemy = this.currentScene.enemy;
        const logDiv = document.getElementById('combat-log');

        // Determine spellcasting ability for damage
        const profile = JSON.parse(localStorage.getItem('tv_profile') || '{}');
        const cls = profile.class || '';
        const spellcastingClasses = {
            'Wizard': 'INT', 'Sorcerer': 'CHA', 'Warlock': 'CHA', 'Bard': 'CHA',
            'Cleric': 'WIS', 'Druid': 'WIS', 'Ranger': 'WIS', 'Paladin': 'CHA'
        };
        const spellcastingAbility = spellcastingClasses[cls] || 'INT';
        const spellMod = this.getAbilityModifier(spellcastingAbility);

        // Check for critical hit (natural 20)
        if (diceRoll === 20) {
            logDiv.innerHTML += `<p><strong>🔮 CRITICAL SPELL!</strong> Natural 20!</p>`;
            const baseDamage = Math.floor(Math.random() * 10) + 1 + spellMod; // 1d10 + spell mod
            const critDamage = Math.floor(Math.random() * 10) + 1; // Extra 1d10 for crit
            const totalDamage = baseDamage + critDamage;
            this.enemyHP = Math.max(0, this.enemyHP - totalDamage);
            logDiv.innerHTML += `<p class="success">Critical magical damage! Dealt ${totalDamage} damage (${baseDamage} + ${critDamage} crit)!</p>`;

            if (this.enemyHP <= 0) {
                logDiv.innerHTML += `<p class="success"><strong>${enemy.name} obliterated by critical magic!</strong></p>`;
                setTimeout(() => this.completeQuest(), 2000);
                return;
            }
        }
        // Check for critical failure (natural 1)
        else if (diceRoll === 1) {
            logDiv.innerHTML += `<p><strong>💥 SPELL BACKFIRE!</strong> Natural 1!</p>`;
            logDiv.innerHTML += `<p class="failure">Your spell backfires spectacularly!</p>`;
            // Mark that enemy gets advantage on next attack
            this.enemyHasAdvantage = true;
            // Player takes magical backlash damage
            const backlashDamage = Math.floor(Math.random() * 4) + 1; // 1d4
            this.playerHP = Math.max(0, this.playerHP - backlashDamage);
            logDiv.innerHTML += `<p class="failure">Magical backlash deals ${backlashDamage} damage to you!</p>`;
            
            if (this.playerHP <= 0) {
                logDiv.innerHTML += `<p class="failure"><strong>Your spell backfire was fatal!</strong></p>`;
                setTimeout(() => this.handleCombatDefeat(), 2000);
                return;
            }
        }
        // Normal spell resolution
        else {
            logDiv.innerHTML += `<p><strong>Spell Attack Roll:</strong> ${diceRoll} + ${spellAttackBonus} = ${total} vs AC ${enemy.ac}</p>`;

            if (total >= enemy.ac) {
                const damage = Math.floor(Math.random() * 10) + 1 + spellMod; // 1d10 + spell mod
                this.enemyHP = Math.max(0, this.enemyHP - damage);
                logDiv.innerHTML += `<p class="success">Spell hits! Dealt ${damage} magical damage.</p>`;

                if (this.enemyHP <= 0) {
                    logDiv.innerHTML += `<p class="success"><strong>${enemy.name} defeated by magic!</strong></p>`;
                    setTimeout(() => this.completeQuest(), 2000);
                    return;
                }
            } else {
                logDiv.innerHTML += `<p class="failure">Spell missed!</p>`;
            }
        }

        this.updateHealthBars();
    }

    resolveDefend(diceRoll) {
        const logDiv = document.getElementById('combat-log');
        const healAmount = Math.floor(diceRoll / 4); // Defend gives small heal based on roll

        this.playerHP = Math.min(this.maxPlayerHP, this.playerHP + healAmount);
        logDiv.innerHTML += `<p class="success">You take a defensive stance and recover ${healAmount} HP.</p>`;

        this.updateHealthBars();
    }

    enemyAttack() {
        const logDiv = document.getElementById('combat-log');
        const enemy = this.currentScene.enemy;
        const enemyAttackBonus = 4; // Moderate attack bonus
        
        let attackRoll;
        let rollDescription = '';

        // Check if enemy has advantage from player's critical failure
        if (this.enemyHasAdvantage) {
            const roll1 = Math.floor(Math.random() * 20) + 1;
            const roll2 = Math.floor(Math.random() * 20) + 1;
            attackRoll = Math.max(roll1, roll2);
            rollDescription = `${roll1}, ${roll2} (advantage - taking higher)`;
            logDiv.innerHTML += `<p><strong>🎯 ${enemy.name} attacks with ADVANTAGE!</strong></p>`;
            this.enemyHasAdvantage = false; // Reset advantage after use
        } else {
            attackRoll = Math.floor(Math.random() * 20) + 1;
            rollDescription = attackRoll.toString();
        }

        const total = attackRoll + enemyAttackBonus;

        // Get player AC from character sheet calculation
        const playerAC = this.getPlayerAC();

        logDiv.innerHTML += `<p><strong>${enemy.name} attacks:</strong> ${rollDescription} + ${enemyAttackBonus} = ${total} vs AC ${playerAC}</p>`;

        // Check for enemy critical hit (natural 20)
        if (attackRoll === 20) {
            logDiv.innerHTML += `<p><strong>💀 ENEMY CRITICAL HIT!</strong></p>`;
            const baseDamage = Math.floor(Math.random() * 6) + 3; // 1d6+3
            const critDamage = Math.floor(Math.random() * 6) + 1; // Extra 1d6 for crit
            const totalDamage = baseDamage + critDamage;
            this.playerHP = Math.max(0, this.playerHP - totalDamage);
            logDiv.innerHTML += `<p class="failure">${enemy.name} scores a critical hit for ${totalDamage} damage (${baseDamage} + ${critDamage} crit)!</p>`;
        }
        // Check for enemy critical failure (natural 1)
        else if (attackRoll === 1) {
            logDiv.innerHTML += `<p><strong>😅 ${enemy.name} FUMBLES!</strong></p>`;
            logDiv.innerHTML += `<p class="success">${enemy.name} stumbles and creates an opening!</p>`;
            // Player gets advantage on next attack
            this.playerHasAdvantage = true;
        }
        // Normal attack resolution
        else if (total >= playerAC) {
            const damage = Math.floor(Math.random() * 6) + 3; // 1d6+3
            this.playerHP = Math.max(0, this.playerHP - damage);
            logDiv.innerHTML += `<p class="failure">${enemy.name} hits for ${damage} damage!</p>`;
        } else {
            logDiv.innerHTML += `<p class="success">${enemy.name} misses!</p>`;
        }

        if (this.playerHP <= 0) {
            logDiv.innerHTML += `<p class="failure"><strong>You have been defeated!</strong></p>`;
            // Disable combat buttons when defeated
            const buttons = document.querySelectorAll('.combat-options button');
            buttons.forEach(btn => btn.disabled = true);
            setTimeout(() => this.handleCombatDefeat(), 2000);
            return;
        }

        this.updateHealthBars();

        // Re-enable combat buttons after enemy attack if combat continues
        setTimeout(() => {
            if (this.playerHP > 0 && this.enemyHP > 0) {
                const buttons = document.querySelectorAll('.combat-options button');
                buttons.forEach(btn => btn.disabled = false);
            }
        }, 500);
    }

    updateHealthBars() {
        const playerFill = document.querySelector('.health-bar-container:first-child .health-fill');
        const playerText = document.querySelector('.health-bar-container:first-child .health-text');
        const enemyFill = document.querySelector('.health-bar-container:last-child .health-fill');
        const enemyText = document.querySelector('.health-bar-container:last-child .health-text');

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
        const questContainer = document.getElementById('quest-container');
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
        localStorage.setItem('completedQuests', JSON.stringify(this.completedQuests));
        this.availableQuests = this.generateAvailableQuests();
        this.renderQuestList();
        console.log('All quests reset - available for completion again');
    }

    renderQuestList() {
        const questContainer = document.getElementById('quest-container');

        if (!questContainer) {
            console.error('Quest container not found!');
            return;
        }

        questContainer.innerHTML = `
            <div class="quest-list">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h2>Available Quests</h2>
                    <button onclick="questEngine.resetAllQuests()" style="background: #dc3545; color: white; padding: 0.5rem 1rem; border: none; border-radius: 8px; cursor: pointer;">Reset All Quests (Testing)</button>
                </div>
                <div class="available-quests">
                    ${this.availableQuests.map(quest => `
                        <div class="quest-card ${quest.difficulty.toLowerCase()}">
                            <h3>${quest.title}</h3>
                            <p class="quest-description">${quest.description}</p>
                            <div class="quest-info">
                                <span class="difficulty">${quest.difficulty}</span>
                                <span class="rewards">+${quest.rewards.xp} XP, ${quest.rewards.coins} coins</span>
                            </div>
                            <button onclick="questEngine.startQuest('${quest.id}')">Begin Quest</button>
                        </div>
                    `).join('')}
                </div>

                <h3>Completed Quests (${this.completedQuests.length})</h3>
                <div class="completed-quests">
                    ${this.completedQuests.length > 0 ? 
                        this.completedQuests.map(questId => `
                            <div class="completed-quest">
                                <span>✅ ${questId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            </div>
                        `).join('') : 
                        '<p>No quests completed yet.</p>'
                    }
                </div>
            </div>
        `;
    }
}

// Initialize quest engine only if it doesn't exist
if (!window.questEngine) {
    window.questEngine = new QuestEngine();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for the quest container to be available
    setTimeout(() => {
        if (window.questEngine && document.getElementById('quest-container')) {
            window.questEngine.renderQuestList();
        }
    }, 500);
});

// Also initialize when showing the quests page
window.initializeQuestsPage = function() {
    // Ensure quest engine exists
    if (!window.questEngine) {
        window.questEngine = new QuestEngine();
    }

    if (window.questEngine && document.getElementById('quest-container')) {
        window.questEngine.renderQuestList();
    }
};