# Production Server Fix - Hidden Course Still Showing

## Safe Production Fix Steps

Since you're on a live server, follow these steps carefully:

### Step 1: List All Courses
First, see which courses are currently featured:

```bash
cd server
npm run list-courses
```

This will show you:
- Which courses are featured on homepage (✅)
- Which courses are hidden (❌)
- The course IDs

### Step 2: Hide Specific Course
Copy the course ID from the list above, then run:

```bash
npm run hide-course <COURSE_ID>
```

Example:
```bash
npm run hide-course 507f1f77bcf86cd799439011
```

### Step 3: Restart Server (if using PM2)
```bash
pm2 restart all
```

Or if using systemd:
```bash
sudo systemctl restart your-app-name
```

### Step 4: Verify
- Check your homepage
- The course should no longer appear
- The cache will be automatically cleared on server restart

## Alternative: Quick Database Fix via MongoDB Shell

If you have direct MongoDB access:

```bash
# Connect to MongoDB
mongosh "your-mongodb-connection-string"

# List featured courses
db.courses.find({ featuredOnHome: true }, { title: 1, featuredOnHome: 1 })

# Hide specific course by ID
db.courses.updateOne(
  { _id: ObjectId("YOUR_COURSE_ID") },
  { $set: { featuredOnHome: false } }
)

# Or hide all courses
db.courses.updateMany({}, { $set: { featuredOnHome: false } })
```

## Alternative: Fix via Admin Panel

1. Log into admin panel
2. Go to Course Management
3. Edit the problematic course
4. Toggle "Show on Homepage" to ON (blue)
5. Click "Save Course"
6. Toggle "Show on Homepage" to OFF (gray)
7. Click "Save Course" again
8. This will properly save the value

## What Changed in the Code

The fixes I made will prevent this issue going forward:

✅ **Fixed:** Boolean handling in course form
✅ **Fixed:** API filtering logic
✅ **Added:** Diagnostic scripts
✅ **Added:** Safe production scripts

## After the Fix

Once you've hidden the course:
1. The homepage will only show courses with toggle ON
2. Future toggles will work correctly
3. No need to restart server for future changes (cache auto-clears)

## Rollback Plan

If something goes wrong:
```bash
# Re-feature a course
npm run hide-course <COURSE_ID>  # This script can be modified to feature instead
```

Or via MongoDB:
```bash
db.courses.updateOne(
  { _id: ObjectId("YOUR_COURSE_ID") },
  { $set: { featuredOnHome: true } }
)
```

## Important Notes

⚠️ **Before running scripts on production:**
1. Make sure you have a database backup
2. Test on staging first if available
3. Run during low-traffic hours
4. Have rollback plan ready

✅ **Safe to run:**
- `npm run list-courses` - Read-only, no changes
- `npm run hide-course <ID>` - Only updates one course

⚠️ **Use with caution:**
- `npm run fix-featured` - Interactive, modifies data
- Direct MongoDB commands - Can affect multiple records

## Need Help?

If you're not comfortable running these scripts on production:
1. Use the Admin Panel method (safest)
2. Or share the course ID and I can provide the exact MongoDB command
3. Or wait for low-traffic time to test
