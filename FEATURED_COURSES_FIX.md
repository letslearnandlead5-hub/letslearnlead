# Featured Courses Issue - Root Cause & Fix

## Problem Description
Courses marked as "hidden" (toggle OFF) in the Course Editor are still appearing on the homepage.

## Root Cause Analysis

### 1. Database vs UI Mismatch
The issue occurs when:
- The UI toggle shows the course as "hidden" (OFF state, gray background)
- But the database still has `featuredOnHome: true`
- This happens if the form wasn't saved after toggling, or if there's stale cache data

### 2. Code Issues Fixed

#### Issue #1: Ambiguous Boolean Handling
**Location:** `src/pages/admin/CourseEditor.tsx` line 61

**Before:**
```typescript
featuredOnHome: course.featuredOnHome || false,
```

**Problem:** This uses the `||` operator which can mask the actual boolean value.

**After:**
```typescript
featuredOnHome: course.featuredOnHome === true,
```

**Fix:** Explicitly checks if the value is `true`, ensuring proper boolean handling.

#### Issue #2: API Filter Enhancement
**Location:** `server/src/routes/courses.ts` lines 41-43

**Before:**
```typescript
if (featured === 'true') {
    filter.featuredOnHome = true;
}
```

**After:**
```typescript
if (featured === 'true') {
    filter.featuredOnHome = true;
} else if (featured === 'false') {
    filter.featuredOnHome = false;
}
```

**Fix:** Added explicit handling for `featured: 'false'` parameter for better API flexibility.

## How to Fix Existing Data

### Step 1: Check Current State
Run this command to see which courses are currently featured:

```bash
cd server
npm run check-featured
```

This will show:
- All courses marked as featured (featuredOnHome = true)
- All courses hidden from homepage (featuredOnHome = false)

### Step 2: Fix the Data
Run this interactive script to fix the data:

```bash
cd server
npm run fix-featured
```

Options available:
1. Hide all courses from homepage
2. Feature specific course(s) by ID
3. Hide specific course(s) by ID
4. Exit

### Step 3: Clear Cache
After fixing the data, clear the server cache by restarting the server:

```bash
cd server
npm run dev
```

Or in production:
```bash
pm2 restart all
```

## Prevention

### For Admins
1. After toggling the "Show on Homepage" switch, always click "Save Course"
2. Verify the change by checking the homepage
3. If a course still appears, use the fix scripts above

### For Developers
The code fixes ensure:
- Proper boolean value handling in the form
- Explicit true/false checks instead of truthy/falsy
- Better API filtering capabilities
- Cache invalidation on course updates

## Testing the Fix

1. Edit a course in the admin panel
2. Toggle "Show on Homepage" to OFF (gray)
3. Click "Save Course"
4. Check the homepage - course should NOT appear
5. Toggle it back to ON (blue)
6. Click "Save Course"
7. Check the homepage - course SHOULD appear

## Technical Details

### Database Schema
```typescript
featuredOnHome: {
    type: Boolean,
    default: false,
    index: true, // Indexed for fast homepage queries
}
```

### API Query
```typescript
// Homepage fetches with featured: 'true'
const response = await courseAPI.getAll({ featured: 'true' });

// Backend filters
if (featured === 'true') {
    filter.featuredOnHome = true;
}
```

### Cache Keys
```typescript
const cacheKey = `courses:${category || ''}:${level || ''}:${search || ''}:${medium || ''}:${featured || ''}`;
```

Cache is automatically invalidated on:
- Course creation
- Course update
- Course deletion

## Summary

The issue was caused by a combination of:
1. Ambiguous boolean handling in the form loader
2. Potential unsaved form data
3. Cached API responses

All issues have been fixed with:
1. Explicit boolean checks
2. Enhanced API filtering
3. Diagnostic and fix scripts for existing data
