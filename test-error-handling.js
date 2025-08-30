// Simple test to verify error handling
console.log('🧪 Testing error handling logic...');

// Simulate the Firebase error
const firebaseError = new Error('Firebase: Error (auth/invalid-credential).');

console.log('Original error:', firebaseError.message);

// Test our error handling logic
let errorMessage = 'Login failed. Please try again.';

if (firebaseError instanceof Error) {
  console.log('Processing error message:', firebaseError.message);
  
  if (firebaseError.message.includes('auth/invalid-credential')) {
    errorMessage = 'Incorrect email or password. Please check your credentials and try again.';
    console.log('✅ Matched auth/invalid-credential');
  } else if (firebaseError.message.includes('auth/user-not-found')) {
    errorMessage = 'No account found with this email address. Please check your email or create a new account.';
  } else if (firebaseError.message.includes('auth/wrong-password')) {
    errorMessage = 'Incorrect password. Please check your password and try again.';
  } else if (firebaseError.message.includes('auth/invalid-email')) {
    errorMessage = 'Please enter a valid email address.';
  } else if (firebaseError.message.includes('auth/too-many-requests')) {
    errorMessage = 'Too many failed login attempts. Please try again later.';
  } else if (firebaseError.message.includes('auth/user-disabled')) {
    errorMessage = 'This account has been disabled. Please contact support.';
  } else if (firebaseError.message.includes('auth/network-request-failed')) {
    errorMessage = 'Network error. Please check your internet connection and try again.';
  } else {
    errorMessage = 'Please enter correct login details.';
    console.log('❌ No specific error match found');
  }
} else {
  console.log('❌ Error is not an Error instance');
}

console.log('📝 Final error message:', errorMessage);
console.log('✅ Error handling test completed!'); 