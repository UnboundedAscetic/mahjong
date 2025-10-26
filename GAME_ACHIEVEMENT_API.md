# Game Achievement API Requirements

## Overview

This document specifies the modifications required for the Mahjong Solitaire game to support achievement sharing functionality with the website. The game needs to send specific messages via the existing postMessage API when certain events occur during gameplay.

## Current Communication System

The game and website currently communicate through a postMessage API with the following existing message types:

### Existing Message Types
- `MAHJONG_LANGUAGE_CHANGE` - Language synchronization between game and website
- `MAHJONG_LANGUAGE_REQUEST` - Request for current language setting

### Message Structure (Current)
```javascript
{
  type: "MAHJONG_LANGUAGE_CHANGE",
  payload: {
    language: "en" | "zh" | "fr",
    source: "game" | "external" | "external-selector" | "mahjong-website"
  }
}
```

## New Required Message Types

The game must implement the following new message types to enable achievement sharing:

### 1. Game Completion Message

**Message Type:** `MAHJONG_GAME_COMPLETED`

**When to Send:** When a player successfully completes a mahjong layout (all tiles matched and removed).

**Message Structure:**
```javascript
{
  type: "MAHJONG_GAME_COMPLETED",
  payload: {
    // Required Fields
    layoutName: string,           // Name of the completed layout (e.g., "Turtle", "Dragon")
    layoutId: string,             // Unique identifier for the layout
    timeElapsed: number,          // Time in milliseconds (e.g., 125000)
    movesCount: number,           // Total number of moves made
    hintsUsed: number,            // Number of hints used during game
    undoCount: number,            // Number of undo operations used
    
    // Optional Fields
    difficulty: "beginner" | "intermediate" | "expert",  // Layout difficulty
    score: number,                // Final score if scoring system exists
    comboMax: number,             // Maximum combo achieved
    perfectGame: boolean,         // true if no hints/undo used
    timestamp: number             // Unix timestamp of completion
  }
}
```

**Example Payload:**
```javascript
{
  type: "MAHJONG_GAME_COMPLETED",
  payload: {
    layoutName: "Turtle",
    layoutId: "classic_turtle",
    timeElapsed: 125000,
    movesCount: 143,
    hintsUsed: 2,
    undoCount: 5,
    difficulty: "beginner",
    score: 1250,
    comboMax: 8,
    perfectGame: false,
    timestamp: 1704067200000
  }
}
```

### 2. Achievement Unlocked Message

**Message Type:** `MAHJONG_ACHIEVEMENT_UNLOCKED`

**When to Send:** When a player unlocks a specific achievement or milestone.

**Message Structure:**
```javascript
{
  type: "MAHJONG_ACHIEVEMENT_UNLOCKED",
  payload: {
    // Required Fields
    achievementId: string,        // Unique achievement identifier
    achievementName: string,      // Display name of achievement
    achievementType: "first_win" | "speed_demon" | "perfectionist" | "marathon" | "combo_master" | "explorer",
    description: string,          // Achievement description
    
    // Context Fields
    context: {
      layoutName?: string,        // Layout where achieved (if applicable)
      timeElapsed?: number,       // Associated time (if relevant)
      movesCount?: number,        // Associated moves (if relevant)
      value?: number,            // Numeric value (e.g., speed, combo count)
      threshold?: number         // Threshold that was met
    },
    
    // Optional Fields
    isNewAchievement: boolean,    // true if first time unlocking
    progress?: number,           // Progress percentage (for progressive achievements)
    totalRequired?: number,      // Total required for completion
    timestamp: number            // Unix timestamp of achievement
  }
}
```

**Example Payloads:**

**First Win Achievement:**
```javascript
{
  type: "MAHJONG_ACHIEVEMENT_UNLOCKED",
  payload: {
    achievementId: "first_win",
    achievementName: "First Victory",
    achievementType: "first_win",
    description: "Complete your first mahjong game",
    context: {
      layoutName: "Turtle",
      timeElapsed: 125000,
      movesCount: 143
    },
    isNewAchievement: true,
    timestamp: 1704067200000
  }
}
```

**Speed Achievement:**
```javascript
{
  type: "MAHJONG_ACHIEVEMENT_UNLOCKED",
  payload: {
    achievementId: "speed_demon_turtle",
    achievementName: "Turtle Speed Demon",
    achievementType: "speed_demon",
    description: "Complete Turtle layout in under 3 minutes",
    context: {
      layoutName: "Turtle",
      value: 145000,
      threshold: 180000
    },
    isNewAchievement: true,
    timestamp: 1704067500000
  }
}
```

**Perfectionist Achievement:**
```javascript
{
  type: "MAHJONG_ACHIEVEMENT_UNLOCKED",
  payload: {
    achievementId: "perfectionist",
    achievementName: "Perfectionist",
    achievementType: "perfectionist",
    description: "Complete a game without hints or undo",
    context: {
      layoutName: "Dragon",
      timeElapsed: 98000,
      movesCount: 87
    },
    isNewAchievement: true,
    timestamp: 1704068000000
  }
}
```

### 3. High Score Message

**Message Type:** `MAHJONG_HIGH_SCORE`

**When to Send:** When a player achieves a personal best score/time for a specific layout.

**Message Structure:**
```javascript
{
  type: "MAHJONG_HIGH_SCORE",
  payload: {
    // Required Fields
    layoutName: string,           // Layout name
    layoutId: string,             // Layout identifier
    scoreType: "time" | "moves" | "score",  // Type of record
    
    // Score Information
    newValue: number,             // New record value
    previousValue: number,        // Previous personal best
    improvement: number,          // Amount of improvement
    
    // Context
    context: {
      movesCount: number,         // Moves in this game
      hintsUsed: number,          // Hints used
      undoCount: number,          // Undo operations
      perfectGame: boolean        // Whether this was a perfect game
    },
    
    // Optional Fields
    rank?: number,                // Player's overall rank (if tracked)
    percentile?: number,          // Performance percentile
    timestamp: number             // Unix timestamp
  }
}
```

**Example Payload:**
```javascript
{
  type: "MAHJONG_HIGH_SCORE",
  payload: {
    layoutName: "Turtle",
    layoutId: "classic_turtle",
    scoreType: "time",
    newValue: 125000,
    previousValue: 145000,
    improvement: 20000,
    context: {
      movesCount: 143,
      hintsUsed: 0,
      undoCount: 2,
      perfectGame: false
    },
    timestamp: 1704067200000
  }
}
```

## Achievement Types

The game should track and send messages for the following achievement categories:

### Core Achievements
- **first_win** - Complete first game
- **speed_demon** - Complete layout under time threshold
- **perfectionist** - Complete game without hints/undo
- **marathon** - Complete multiple games in session
- **combo_master** - Achieve high combo count
- **explorer** - Try different layouts

### Layout-Specific Achievements
- Speed records for each layout
- Move efficiency records
- Perfect game completions

### Session Achievements
- Multiple wins in one session
- Total playtime milestones
- Streak achievements

## Implementation Guidelines

### 1. Message Sending

```javascript
// Helper function for sending messages to website
function sendToWebsite(type, payload) {
  try {
    window.postMessage({
      type: type,
      payload: payload
    }, '*');
  } catch (error) {
    console.error('Failed to send message to website:', error);
  }
}
```

### 2. Required Achievement Types Implementation

**First Win:**
```javascript
if (isFirstWin) {
  sendToWebsite('MAHJONG_ACHIEVEMENT_UNLOCKED', {
    achievementId: 'first_win',
    achievementName: 'First Victory',
    achievementType: 'first_win',
    description: 'Complete your first mahjong game',
    context: {
      layoutName: currentLayout.name,
      timeElapsed: gameTime,
      movesCount: totalMoves
    },
    isNewAchievement: true,
    timestamp: Date.now()
  });
}
```

**Game Completion:**
```javascript
// Always send when game is completed
sendToWebsite('MAHJONG_GAME_COMPLETED', {
  layoutName: currentLayout.name,
  layoutId: currentLayout.id,
  timeElapsed: gameTime,
  movesCount: totalMoves,
  hintsUsed: hintsUsed,
  undoCount: undoCount,
  difficulty: currentLayout.difficulty,
  perfectGame: (hintsUsed === 0 && undoCount === 0),
  timestamp: Date.now()
});
```

**High Score:**
```javascript
if (isPersonalBest) {
  sendToWebsite('MAHJONG_HIGH_SCORE', {
    layoutName: currentLayout.name,
    layoutId: currentLayout.id,
    scoreType: 'time',
    newValue: gameTime,
    previousValue: previousBest,
    improvement: previousBest - gameTime,
    context: {
      movesCount: totalMoves,
      hintsUsed: hintsUsed,
      undoCount: undoCount,
      perfectGame: (hintsUsed === 0 && undoCount === 0)
    },
    timestamp: Date.now()
  });
}
```

### 3. Error Handling

- Wrap all postMessage calls in try-catch blocks
- Validate payload structure before sending
- Include fallback values for optional fields
- Log errors for debugging purposes

### 4. Timing Considerations

- Send `MAHJONG_GAME_COMPLETED` immediately upon game completion
- Send achievement messages after the completion animation but before UI cleanup
- For high scores, verify the record before sending the message
- Include accurate timestamps for all events

### 5. Data Validation

Required fields must be included and properly formatted:

- **Strings:** Non-empty, meaningful values
- **Numbers:** Positive integers for time/moves/scores
- **Booleans:** True/false values for game state
- **Timestamps:** Unix timestamp in milliseconds

## Testing Scenarios

### Basic Functionality
1. Complete a simple game and verify `MAHJONG_GAME_COMPLETED` message
2. Unlock first win achievement and verify `MAHJONG_ACHIEVEMENT_UNLOCKED` message
3. Beat personal best and verify `MAHJONG_HIGH_SCORE` message

### Edge Cases
1. Game completion during website language changes
2. Multiple achievements in single game
3. Rapid game completions
4. Error handling when website is unavailable

### Message Validation
1. Verify all required fields are present
2. Check data types and value ranges
3. Confirm message structure matches specification
4. Test with different layouts and difficulty levels

## Website Integration Notes

The website will:
1. Listen for these new message types in the existing message handler
2. Trigger achievement celebration animations
3. Generate shareable images with achievement data
4. Display social sharing dialogs with pre-filled content
5. Store achievement progress in browser localStorage

## Compatibility

This implementation is fully backward compatible with existing game functionality and will not interfere with current language synchronization features.

---

**Implementation Priority:**
1. **High Priority:** `MAHJONG_GAME_COMPLETED` - Required for basic sharing
2. **Medium Priority:** `MAHJONG_ACHIEVEMENT_UNLOCKED` - Enhanced sharing experience  
3. **Low Priority:** `MAHJONG_HIGH_SCORE` - Advanced tracking features