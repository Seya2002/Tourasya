import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAf3gloqgGQuEaATmWjI5C19DOajlqw0iI",
  authDomain: "tourasya-6b68b.firebaseapp.com",
  projectId: "tourasya-6b68b",
  storageBucket: "tourasya-6b68b.firebasestorage.app",
  messagingSenderId: "384843517318",
  appId: "1:384843517318:web:c4da98c3ac7407de113007"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testLoginError(email, password, expectedError) {
  try {
    console.log(`Testing login with incorrect credentials: ${email}`);
    await signInWithEmailAndPassword(auth, email, password);
    console.log(`❌ Unexpected success for ${email}`);
  } catch (error) {
    console.log(`✅ Expected error for ${email}: ${error.message}`);
    
    // Test our error message mapping
    let userFriendlyMessage = 'Login failed. Please try again.';
    
    if (error.message.includes('user-not-found')) {
      userFriendlyMessage = 'No account found with this email address. Please check your email or create a new account.';
    } else if (error.message.includes('wrong-password')) {
      userFriendlyMessage = 'Incorrect password. Please check your password and try again.';
    } else if (error.message.includes('invalid-email')) {
      userFriendlyMessage = 'Please enter a valid email address.';
    } else if (error.message.includes('too-many-requests')) {
      userFriendlyMessage = 'Too many failed login attempts. Please try again later.';
    } else if (error.message.includes('user-disabled')) {
      userFriendlyMessage = 'This account has been disabled. Please contact support.';
    } else if (error.message.includes('network')) {
      userFriendlyMessage = 'Network error. Please check your internet connection and try again.';
    } else {
      userFriendlyMessage = 'Please enter correct login details.';
    }
    
    console.log(`📝 User-friendly message: ${userFriendlyMessage}`);
  }
}

async function testErrorHandling() {
  console.log('🧪 Testing login error handling...\n');
  
  const testCases = [
    {
      email: 'nonexistent@example.com',
      password: 'wrongpassword',
      description: 'Non-existent user'
    },
    {
      email: 'admin@tourasya.com',
      password: 'wrongpassword',
      description: 'Correct email, wrong password'
    },
    {
      email: 'invalid-email',
      password: 'password',
      description: 'Invalid email format'
    },
    {
      email: 'user1@tourasya.com',
      password: 'wrongpassword',
      description: 'Correct email, wrong password for regular user'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n--- Testing: ${testCase.description} ---`);
    await testLoginError(testCase.email, testCase.password);
  }
  
  console.log('\n🎉 Error handling test completed!');
  console.log('\n💡 Now test these scenarios in your browser:');
  console.log('1. Try logging in with wrong email/password');
  console.log('2. Try logging in with correct email but wrong password');
  console.log('3. Try logging in with invalid email format');
  console.log('4. Try logging in with correct credentials (should work)');
}

testErrorHandling().catch(console.error); 