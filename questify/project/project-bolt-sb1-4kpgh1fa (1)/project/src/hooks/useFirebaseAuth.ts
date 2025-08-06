import { useState, useEffect } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db, isFirebaseConfigured } from '../lib/firebase';
import toast from 'react-hot-toast';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  userType?: 'student' | 'teacher';
  createdAt: Date;
  lastLoginAt: Date;
}

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured] = useState(isFirebaseConfigured());

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Load user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isConfigured]);

  const signInWithGoogle = async () => {
    if (!isConfigured) {
      toast.error('Firebase not configured. Using demo mode.');
      return createDemoUser('student');
    }

    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      console.log("Google login successful:", user.displayName);
      
      // Create or update user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || undefined,
        createdAt: new Date(),
        lastLoginAt: new Date()
      };

      // Check if user exists, if not create new profile
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), userProfile);
      } else {
        // Update last login time
        await setDoc(doc(db, 'users', user.uid), {
          ...userDoc.data(),
          lastLoginAt: new Date()
        }, { merge: true });
      }

      setUserProfile(userProfile);
      toast.success(`Welcome, ${user.displayName}!`);
      
      return { user, userProfile };
    } catch (error: any) {
      console.error("Google login failed:", error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Login cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Popup blocked. Please allow popups for this site.');
      } else if (error.code === 'auth/unauthorized-domain') {
        toast.error('Domain not authorized. Please check Firebase configuration.');
      } else {
        toast.error('Login failed. Please try again.');
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUserType = async (userType: 'student' | 'teacher') => {
    if (!user || !isConfigured) return;

    try {
      await setDoc(doc(db, 'users', user.uid), {
        userType,
        updatedAt: new Date()
      }, { merge: true });

      setUserProfile(prev => prev ? { ...prev, userType } : null);
      toast.success(`Profile updated as ${userType}`);
    } catch (error) {
      console.error('Error updating user type:', error);
      toast.error('Failed to update profile');
    }
  };

  const signOut = async () => {
    try {
      if (isConfigured) {
        await firebaseSignOut(auth);
      }
      setUser(null);
      setUserProfile(null);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  const createDemoUser = (userType: 'student' | 'teacher') => {
    const demoUser = {
      uid: `demo-${userType}-${Date.now()}`,
      email: `${userType}@demo.com`,
      displayName: userType === 'student' ? 'Demo Student' : 'Demo Teacher',
      photoURL: `https://ui-avatars.com/api/?name=${userType}&background=random`
    } as User;

    const demoProfile: UserProfile = {
      uid: demoUser.uid,
      email: demoUser.email || '',
      displayName: demoUser.displayName || '',
      photoURL: demoUser.photoURL || undefined,
      userType,
      createdAt: new Date(),
      lastLoginAt: new Date()
    };

    setUser(demoUser);
    setUserProfile(demoProfile);
    toast.success(`Welcome, ${demoProfile.displayName}!`);
    
    return { user: demoUser, userProfile: demoProfile };
  };

  return {
    user,
    userProfile,
    loading,
    isConfigured,
    signInWithGoogle,
    updateUserType,
    signOut,
    createDemoUser
  };
};