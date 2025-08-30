import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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
const db = getFirestore(app);

async function testLogin(email, password) {
  try {
    console.log(`Testing login for: ${email}`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log(`✅ Login successful for: ${email}`);
    console.log(`User UID: ${user.uid}`);
    
    // Check if user exists in Firestore
    const adminDoc = await getDoc(doc(db, 'adminUsers', user.uid));
    if (adminDoc.exists()) {
      console.log(`✅ Admin user found in Firestore:`, adminDoc.data());
      return true;
    }
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      console.log(`✅ Regular user found in Firestore:`, userDoc.data());
      return true;
    }
    
    console.log(`❌ User not found in Firestore`);
    return false;
  } catch (error) {
    console.error(`❌ Login failed for ${email}:`, error.message);
    return false;
  }
}

async function testAllUsers() {
  console.log('🧪 Testing all dummy users...\n');
  
  const testUsers = [
    { email: 'admin@tourasya.com', password: 'admin123456', type: 'admin' },
    { email: 'manager@tourasya.com', password: 'manager123', type: 'admin' },
    { email: 'support@tourasya.com', password: 'support123', type: 'admin' },
    { email: 'user1@tourasya.com', password: 'user123456', type: 'user' },
    { email: 'user2@tourasya.com', password: 'user123456', type: 'user' },
    { email: 'user3@tourasya.com', password: 'user123456', type: 'user' }
  ];
  
  for (const testUser of testUsers) {
    const success = await testLogin(testUser.email, testUser.password);
    console.log(`${success ? '✅' : '❌'} ${testUser.type.toUpperCase()}: ${testUser.email}\n`);
  }
  
  console.log('🎉 Test completed!');
}

testAllUsers().catch(console.error); 