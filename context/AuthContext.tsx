"use client";
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface UserData {
  email: string;
  username?: string;
  role: string;
  isSuperAdmin?: boolean;
  permissions?: string[];
  phone?: string;
  status?: string;
  uid: string;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  isAdmin: false
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  const checkUserAndRedirect = useCallback(async (firebaseUser: User | null) => {
    if (firebaseUser) {
      setUser(firebaseUser);
      console.log('Checking user data for:', firebaseUser.email);
      
      try {
        // Check if admin (only one admin allowed)
        const adminDoc = await getDoc(doc(db, 'adminUsers', firebaseUser.uid));
        if (adminDoc.exists()) {
          const adminData = adminDoc.data() as UserData;
          console.log('Admin user found:', adminData);
          setUserData(adminData);
          setIsAdmin(true);
          router.push('/admin');
          return;
        }
        
        // Check if regular user
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData;
          console.log('Regular user found:', userData);
          setUserData(userData);
          setIsAdmin(false);
          router.push('/home');
          return;
        }
        
        // User exists in auth but not in Firestore - sign them out
        console.log('User not found in Firestore, signing out');
        await signOut(auth);
        setUser(null);
        setUserData(null);
        setIsAdmin(false);
        router.push('/login');
      } catch (error) {
        console.error('Error checking user data:', error);
        await signOut(auth);
        setUser(null);
        setUserData(null);
        setIsAdmin(false);
        router.push('/login');
      }
    } else {
      setUser(null);
      setUserData(null);
      setIsAdmin(false);
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.email);
      await checkUserAndRedirect(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, checkUserAndRedirect]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('Attempting login for:', email);
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful for:', email);
      // The onAuthStateChanged will handle the redirect
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out user...');
      
      // Sign out from Firebase first
      await signOut(auth);
      console.log('Firebase signOut successful');
      
      // Clear local state
      setUser(null);
      setUserData(null);
      setIsAdmin(false);
      
      console.log('Local state cleared successfully');
      console.log('User logged out successfully');
      
      // AuthContext automatically handles redirect to /login
      router.push('/login');
      
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if there's an error, ensure local state is cleared
      setUser(null);
      setUserData(null);
      setIsAdmin(false);
      
      console.log('Local state cleared after error');
      
      // Redirect even on error
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData,
      loading, 
      login, 
      logout, 
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);