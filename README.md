
# TaskVenture - Just roll with it.

A fantasy-themed gamified task management app that turns your daily tasks into epic quests! Complete tasks to gain XP, level up, collect magical cards, and roll dice for bonus rewards.

## Features

### 🎮 Game Mechanics
- **XP System**: Gain experience points for completing tasks
- **Leveling**: Progress through levels as you accomplish more
- **Streak Tracking**: Build momentum with daily task completion streaks
- **Dice Rolling**: Roll a D20 for luck and bonus rewards

### 🃏 Card Collection
- **Rarity System**: Collect Common, Rare, Epic, and Legendary cards
- **Fantasy Theme**: Magical items like Cloaks of Clarity, Swords of Productivity
- **Card Effects**: Each card provides unique benefits and flavor text
- **Collection View**: Browse and admire your accumulated cards

### ⚔️ Task Management
- **Quest System**: Transform mundane tasks into heroic quests
- **Reward System**: Every completed task grants XP and a new card
- **Dynamic XP**: Longer tasks and streaks provide bonus experience
- **Persistent Storage**: Your progress is automatically saved

## File Structure

```
taskventure/
├── index.html          ← Main UI page with splash screen
├── styles.css          ← Fantasy-styled CSS with gradients and animations
├── app.js              ← Core game logic, UI management
├── dice.js             ← D20 rolling system with effects
├── utils.js            ← XP calculations, card generation, utilities
├── data/
│   ├── cards.json      ← Complete card database
│   └── users.json      ← User data template
├── attached_assets/    ← Logo and splash screen images
└── README.md           ← This file
```

## Getting Started

1. **Launch the App**: Open `index.html` in your browser
2. **Start Your Adventure**: Click "PLAY" on the splash screen
3. **Add Your First Quest**: Enter a task in the quest input field
4. **Complete Tasks**: Click "Complete Quest" to gain XP and cards
5. **Roll for Luck**: Use the dice roller for bonus effects
6. **Build Your Collection**: View your accumulated cards and track progress

## Game Mechanics Details

### XP and Leveling
- **Base XP**: 10 XP per completed task
- **Length Bonus**: +5 XP for tasks over 50 characters
- **Streak Bonus**: +2 XP per day in your current streak (max +20)
- **Dice Bonus**: 2x XP when you have an active critical success
- **Level Formula**: `floor(sqrt(XP / 100)) + 1`

### Card Rarity Distribution
- **Common**: 60% chance (Gray border)
- **Rare**: 25% chance (Blue border)
- **Epic**: 12% chance (Purple border)
- **Legendary**: 3% chance (Gold border)

### Dice Effects
- **Natural 20**: Critical Success! Grants 2x XP on next task
- **15-19**: Good roll! Immediate +5 XP bonus
- **10-14**: Neutral result with encouraging flavor text
- **2-9**: Low roll with motivational message
- **Natural 1**: Critical failure with humorous flavor (no penalty)

## Customization

### Adding New Cards
Edit `utils.js` and add entries to the `cardDatabase` array:

```javascript
{
    id: "unique_card_id",
    name: "Card Name",
    rarity: "Common|Rare|Epic|Legendary",
    type: "Weapon|Armor|Accessory|Consumable|Artifact|Scroll",
    effect: "Description of the card's magical properties"
}
```

### Adjusting XP Rewards
Modify the `calculateXPReward()` function in `utils.js` to change:
- Base XP values
- Streak bonus multipliers
- Task length bonuses
- Special condition rewards

### Styling Changes
Update `styles.css` CSS variables to customize the color scheme:

```css
:root {
    --primary-gold: #d4af37;
    --secondary-blue: #1e3a8a;
    --accent-red: #dc2626;
    /* ... other variables */
}
```

## Technical Details

- **Pure Vanilla JavaScript**: No external dependencies
- **Local Storage**: Progress automatically saved to browser
- **Responsive Design**: Works on desktop and mobile
- **CSS Animations**: Smooth transitions and hover effects
- **Fantasy UI**: Custom styling with gradients and borders

## Future Enhancements

- **Achievements System**: Special badges for milestones
- **Card Trading**: Exchange cards with other players
- **Quest Templates**: Pre-defined task categories
- **Statistics Dashboard**: Detailed progress analytics
- **Sound Effects**: Audio feedback for actions
- **Multiplayer Features**: Compete with friends

---

*May your tasks be legendary and your productivity epic!* ⚔️✨
