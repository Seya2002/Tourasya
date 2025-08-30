// Test to verify error catching in async functions
async function testErrorCatching() {
  console.log('🧪 Testing error catching in async function...');
  
  try {
    // Simulate the login function
    console.log('Attempting login...');
    throw new Error('Firebase: Error (auth/invalid-credential).');
  } catch (error) {
    console.log('✅ Error caught successfully!');
    console.log('Error type:', typeof error);
    console.log('Error message:', error.message);
    
    let errorMessage = 'Login failed. Please try again.';
    
    if (error instanceof Error) {
      console.log('Processing error message:', error.message);
      
      if (error.message.includes('auth/invalid-credential')) {
        errorMessage = 'Incorrect email or password. Please check your credentials and try again.';
        console.log('✅ Setting invalid credential message');
      } else {
        errorMessage = 'Please enter correct login details.';
        console.log('❌ Using default error message');
      }
    }
    
    console.log('📝 Final error message:', errorMessage);
  }
}

testErrorCatching().catch(console.error); 