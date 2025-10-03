# Bug Fixes - October 3, 2025

All bugs identified through Context7 Angular documentation analysis have been fixed.

## Critical Bugs Fixed ⚠️

### 1. Memory Leak in Timer Component
**File:** `src/app/features/timer/timer.component.ts`

**Issue:** The `watchForSessionCompletion()` method created an infinite `requestAnimationFrame` loop that was never cleaned up in `ngOnDestroy()`, causing a memory leak.

**Fix:**
- Added `animationFrameId` property to track the animation frame
- Store the frame ID when calling `requestAnimationFrame()`
- Cancel the animation frame in `ngOnDestroy()` using `cancelAnimationFrame()`

### 2. Keyboard Shortcut Modifier Logic Bug
**File:** `src/app/core/services/keyboard-shortcut.service.ts`

**Issue:** The modifier matching logic was incorrect. It used `!shortcut.modifiers?.ctrl || keyboardEvent.ctrlKey` which meant "match if ctrl is NOT required OR if ctrl is pressed". This caused false matches when modifiers were pressed but not required.

**Example:** A shortcut defined as just 'k' would incorrectly match 'Ctrl+K'.

**Fix:**
```typescript
// Before (buggy):
const ctrlMatches = !shortcut.modifiers?.ctrl || keyboardEvent.ctrlKey;

// After (correct):
const ctrlMatches = shortcut.modifiers?.ctrl ? keyboardEvent.ctrlKey : !keyboardEvent.ctrlKey;
```

Now modifiers must match exactly: if required, they must be pressed; if not required, they must NOT be pressed.

## Medium Priority Bugs Fixed 🔧

### 3. Deprecated `substr()` Method
**Files:** 
- `src/app/core/services/task.service.ts`
- `src/app/core/services/timer.service.ts`

**Issue:** Used deprecated `substr()` method which may be removed in future JavaScript versions.

**Fix:**
```typescript
// Before:
Math.random().toString(36).substr(2, 9)

// After:
Math.random().toString(36).slice(2, 11)
```

### 4. Missing Event Listener Cleanup
**File:** `src/app/core/services/keyboard-shortcut.service.ts`

**Issue:** A global `keydown` event listener was added to `document` but never removed, causing potential memory leaks in tests or if the service is destroyed.

**Fix:**
- Implemented `OnDestroy` interface
- Stored handler reference as a class property
- Removed event listener in `ngOnDestroy()`
- Extracted keyboard handling logic to separate method

### 5. Missing Error Handling in Async Methods
**File:** `src/app/features/timer/timer.component.ts`

**Issue:** Methods like `togglePlayPause()` and `handleSessionCompletion()` performed async operations without try-catch blocks, risking unhandled promise rejections.

**Fix:**
- Wrapped async operations in try-catch blocks
- Added console.error logging for debugging

### 6. Type Safety Issue in Wake Lock Service
**File:** `src/app/core/services/wake-lock.service.ts`

**Issue:** Used `(navigator as any).wakeLock` which bypassed TypeScript's type checking.

**Fix:**
- Created proper TypeScript interfaces for Wake Lock API:
  - `WakeLockSentinel` - for the lock object
  - `WakeLockAPI` - for the wakeLock interface
- Used intersection type for proper type safety: `Navigator & { wakeLock: WakeLockAPI }`

### 7. Potential Race Condition in Storage Migration
**File:** `src/app/core/services/storage.service.ts`

**Issue:** Schema migration in constructor could cause issues if multiple browser tabs run it simultaneously.

**Fix:**
- Implemented migration lock mechanism using localStorage
- Lock expires after 5 seconds to handle crashed tabs
- Other tabs wait and recheck if migration is needed
- Properly acquire and release lock with try-finally

## Test Results ✅

All 26 tests pass successfully:
```
Chrome Headless 141.0.0.0 (Linux 0.0.0): Executed 26 of 26 SUCCESS
```

## Angular Best Practices Applied 📚

Based on Context7 documentation:
1. ✅ Proper lifecycle hook cleanup (OnDestroy)
2. ✅ Memory leak prevention (animation frames, event listeners)
3. ✅ Type safety without `any` types
4. ✅ Error handling for async operations
5. ✅ Race condition prevention with locking
6. ✅ Modern JavaScript methods (slice vs substr)

## Files Modified

1. `src/app/features/timer/timer.component.ts`
2. `src/app/core/services/keyboard-shortcut.service.ts`
3. `src/app/core/services/task.service.ts`
4. `src/app/core/services/timer.service.ts`
5. `src/app/core/services/wake-lock.service.ts`
6. `src/app/core/services/storage.service.ts`
