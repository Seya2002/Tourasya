const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Firebase project...');

// Check if firebase CLI is installed
try {
  execSync('firebase --version', { stdio: 'pipe' });
  console.log('✅ Firebase CLI is installed');
} catch (error) {
  console.log('❌ Firebase CLI not found. Please install it first:');
  console.log('npm install -g firebase-tools');
  process.exit(1);
}

// Check if we're logged in
try {
  execSync('firebase projects:list', { stdio: 'pipe' });
  console.log('✅ Firebase CLI is logged in');
} catch (error) {
  console.log('❌ Please login to Firebase first:');
  console.log('firebase login');
  process.exit(1);
}

// Initialize Firebase project if not already done
if (!fs.existsSync('.firebaserc')) {
  console.log('📝 Initializing Firebase project...');
  try {
    execSync('firebase init firestore', { 
      stdio: 'inherit',
      input: 'tourasya-453f1\n' // Project ID
    });
  } catch (error) {
    console.log('❌ Failed to initialize Firebase project');
    process.exit(1);
  }
}

// Deploy Firestore rules
console.log('📤 Deploying Firestore security rules...');
try {
  execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
  console.log('✅ Firestore rules deployed successfully!');
} catch (error) {
  console.log('❌ Failed to deploy Firestore rules');
  console.log('Make sure you have the correct project selected:');
  console.log('firebase use tourasya-453f1');
  process.exit(1);
}

console.log('🎉 Firebase setup complete!');
console.log('');
console.log('Next steps:');
console.log('1. Create admin users in the Firebase Console');
console.log('2. Add them to the adminUsers collection');
console.log('3. Create regular users in the users collection');
console.log('4. Test the login functionality'); 