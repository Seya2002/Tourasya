# Firebase Setup Guide

## Issues Fixed

1. **Project ID Mismatch**: Updated Firebase config to use correct project ID (`tourasya-453f1`)
2. **Missing Security Rules**: Created Firestore security rules
3. **Authentication Issues**: Fixed Login component and AuthContext

## Steps to Deploy Firebase Rules

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Initialize Firebase Project
```bash
cd tourasya
firebase init firestore
```
- Select project: `tourasya-453f1`
- Use existing rules: `firestore.rules`
- Use existing indexes: `firestore.indexes.json`

### 4. Deploy Security Rules
```bash
firebase deploy --only firestore:rules
```

Or run the automated script:
```bash
node deploy-firebase.js
```

## Security Rules Explanation

The created rules allow:
- Users to read/write their own data
- Admins to manage all users and admin users
- Proper authentication checks

## Setting Up Users

### 1. Create Admin Users
1. Go to Firebase Console → Authentication
2. Create admin user accounts
3. Go to Firestore → adminUsers collection
4. Add documents with admin user UIDs containing:
```json
{
  "email": "admin@example.com",
  "role": "admin",
  "isSuperAdmin": true,
  "permissions": []
}
```

### 2. Create Regular Users
1. Go to Firebase Console → Authentication
2. Create regular user accounts
3. Go to Firestore → users collection
4. Add documents with user UIDs containing:
```json
{
  "email": "user@example.com",
  "username": "username",
  "phone": "+1234567890",
  "role": "user",
  "status": "active"
}
```

## Testing

1. Start the development server:
```bash
npm run dev
```

2. Navigate to `/login`
3. Test with admin credentials
4. Test with regular user credentials

## Troubleshooting

### Permission Denied Errors
- Make sure Firestore rules are deployed
- Verify user exists in correct collection
- Check authentication state

### Project ID Issues
- Verify `lib/firebase.ts` uses correct project ID
- Ensure service account key matches project

### Authentication Issues
- Check Firebase Console for user accounts
- Verify user documents exist in Firestore
- Check browser console for errors

## Files Modified

- `lib/firebase.ts` - Fixed project ID
- `components/Login/Login.tsx` - Added proper authentication
- `context/AuthContext.tsx` - Fixed state management
- `firestore.rules` - Created security rules
- `firebase.json` - Added Firebase config
- `firestore.indexes.json` - Added indexes config
- `deploy-firebase.js` - Added deployment script 