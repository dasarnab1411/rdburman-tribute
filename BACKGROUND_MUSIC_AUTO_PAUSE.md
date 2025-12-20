# Background Music Auto-Pause Feature

## Overview

The background theme music (Pancham Da's theme) now automatically pauses when any video or audio content starts playing on the website.

## Implementation Details

### 1. Audio Player (Audio Tab)

**Location**: Audio collection section with Drive integration

**Function**: `playAudio(fileId, fileName, event)`

**Behavior**:

- When user clicks "▶ Play" button on any audio file
- Background music pauses immediately before audio loads
- Background music pauses again when audio starts playing (onplay event)
- Ensures smooth transition without audio overlap

**Code**:

```javascript
function playAudio(fileId, fileName, event) {
  // Pause background music when audio starts playing
  if (window.pauseBackgroundTheme) {
    window.pauseBackgroundTheme();
  }

  // ... audio loading code ...

  player.onplay = () => {
    // Pause background music when audio plays
    if (window.pauseBackgroundTheme) {
      window.pauseBackgroundTheme();
    }
  };
}
```

### 2. Video Section (About/Composing/Unreleased)

**Location**: Video tab with YouTube embeds

**Function**: `loadVideos()` → `createCard()` → click event listener

**Behavior**:

- When user clicks on video thumbnail to play
- Background music pauses before video iframe loads
- Applies to all three video categories:
  - About Pancham
  - Composing
  - Unreleased Songs

**Code**:

```javascript
wrapper.addEventListener("click", function () {
  // Pause background music when video starts playing
  if (window.pauseBackgroundTheme) {
    window.pauseBackgroundTheme();
  }

  // ... load video iframe ...
});
```

### 3. YouTube Player State Management

**Location**: YouTube IFrame API integration

**Function**: `onPlayerStateChange(event, playerId)`

**Behavior**:

- Monitors YouTube player state changes
- When player state changes to PLAYING (1)
- Background music pauses automatically
- Works for all YouTube embeds on the page

**Code**:

```javascript
function onPlayerStateChange(event, playerId) {
  const playerState = event.data;

  if (playerState === 1) {
    // Playing
    // Pause background music when video starts playing
    if (window.pauseBackgroundTheme) {
      window.pauseBackgroundTheme();
    }
    // ... rest of the logic ...
  }
}
```

### 4. Boss's Favourite Compositions

**Location**: My Boss tab → My Favourite Boss's Compositions section

**Function**: `openBossVideo(e, url, title)`

**Behavior**:

- When user clicks any song/composition link
- Background music pauses before video loads
- Applies to:
  - Title Music playlist
  - Background Music scores
  - Favourite Songs
  - Cabaret Tracks

**Code**:

```javascript
function openBossVideo(e, url, title) {
  if (e) e.preventDefault();

  // Pause background music when video starts playing
  if (window.pauseBackgroundTheme) {
    window.pauseBackgroundTheme();
  }

  // ... load video iframe ...
}
```

## Background Music Control Functions

### Available Functions:

1. **`pauseBackgroundTheme()`** - Pauses the background music
2. **`stopBackgroundTheme()`** - Stops and resets the background music

### Background Music Element:

```html
<audio
  id="bgTheme"
  loop
  preload="auto"
  src="Tune/Sagar - a theme music.mp3"
></audio>
```

### Control Buttons (Top-Right):

- ⏸ Pause Background Music
- ⏹ Stop Background Music

## User Experience Flow

### Scenario 1: Playing Audio

1. User navigates to Audio tab
2. User clicks on a folder and selects a song
3. User clicks "▶ Play" button
4. **Background music pauses automatically**
5. Selected audio starts playing
6. User can manually resume background music using top-right controls

### Scenario 2: Playing Video (Video Tab)

1. User navigates to Video tab
2. User clicks on any video thumbnail
3. **Background music pauses automatically**
4. Video loads and starts playing
5. User can manually resume background music using top-right controls

### Scenario 3: Playing Boss's Compositions

1. User navigates to My Boss tab
2. User clicks "My Favourite Boss's Compositions"
3. User clicks any song/composition link
4. **Background music pauses automatically**
5. Video loads and starts playing
6. User can manually resume background music using top-right controls

## Technical Notes

### Safety Checks:

All pause calls include safety checks:

```javascript
if (window.pauseBackgroundTheme) {
  window.pauseBackgroundTheme();
}
```

This ensures:

- No errors if function is not defined
- Graceful degradation if background music is not loaded
- Works across all browsers

### Multiple Trigger Points:

Background music pause is triggered at multiple points:

1. **Before loading** - When user clicks play/video
2. **On play event** - When media actually starts playing
3. **On state change** - When YouTube player state changes to PLAYING

This redundancy ensures the background music always pauses, regardless of timing or loading delays.

## Browser Compatibility

✅ **Tested and Working:**

- Chrome/Edge (Chromium)
- Firefox
- Safari
- Opera

✅ **Mobile Browsers:**

- Chrome Mobile
- Safari iOS
- Firefox Mobile

## Future Enhancements

### Potential Improvements:

1. **Auto-resume**: Resume background music when video/audio ends
2. **Volume ducking**: Lower background music volume instead of pausing
3. **User preference**: Remember user's choice to auto-pause or not
4. **Fade out/in**: Smooth fade transitions instead of abrupt pause

### Implementation Considerations:

- User preference storage (localStorage)
- Smooth audio transitions (Web Audio API)
- Cross-browser audio context handling
- Mobile autoplay restrictions

## Troubleshooting

### If Background Music Doesn't Pause:

1. **Check Console**: Look for JavaScript errors
2. **Verify Function**: Ensure `pauseBackgroundTheme()` is defined
3. **Check Audio Element**: Verify `bgTheme` audio element exists
4. **Browser Autoplay**: Some browsers block autoplay policies

### Debug Commands (Browser Console):

```javascript
// Check if function exists
typeof window.pauseBackgroundTheme;

// Check audio element
document.getElementById("bgTheme");

// Manually pause
window.pauseBackgroundTheme();

// Check if playing
!document.getElementById("bgTheme").paused;
```

## Related Files

- `/public/index.html` - Main implementation
- `/public/Tune/Sagar - a theme music.mp3` - Background music file
- `/KODEZI-CLI.md` - Project configuration
- `/SECURITY.md` - Security measures

---

**Last Updated**: November 30, 2025
**Feature Version**: 1.0
**Maintained By**: Arnab Das
