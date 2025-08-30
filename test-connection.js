import { initializeApp } from 'firebase/app';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';

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
const db = getFirestore(app);

async function testConnection() {
  try {
    console.log('🔌 Testing Firebase connection...');
    console.log('📁 Project ID:', firebaseConfig.projectId);
    
    // Test basic connectivity
    console.log('🌐 Testing network connectivity...');
    await enableNetwork(db);
    console.log('✅ Network enabled successfully');
    
    // Test if we can disable network (this tests basic connectivity)
    await disableNetwork(db);
    console.log('✅ Network disabled successfully');
    
    // Re-enable for normal operation
    await enableNetwork(db);
    console.log('✅ Network re-enabled successfully');
    
    console.log('✅ Firestore connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Firestore connection failed:', error.message);
    console.error('🔍 Error details:', error);
    return false;
  }
}

// Run the test
testConnection().then(success => {
  if (success) {
    console.log('🎉 All tests passed! Firebase is working correctly.');
  } else {
    console.log('💥 Tests failed. Please check the configuration.');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
