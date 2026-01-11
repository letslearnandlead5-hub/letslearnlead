# Admin Account Setup

This directory contains scripts for initial setup and maintenance.

## Creating Admin Account

Run this script on your VPS to create the initial admin account:

```bash
# On VPS
cd ~/letslearnlead/server

# Build the script
npm run build

# Run the admin creation script
node dist/scripts/createAdmin.js
```

**Default Credentials:**
- Email: `admin@letslearnandlead.com`
- Password: `Admin@12345` (change this in the script before running)

**IMPORTANT:**
1. Change the password in `createAdmin.ts` before running
2. Delete or secure this script after running it
3. Change the password immediately after first login

## Security Notes

- The script will NOT create a duplicate admin if one already exists
- Passwords are hashed with bcrypt before storage
- Make sure to change the default password in production
