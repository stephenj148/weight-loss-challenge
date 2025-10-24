import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, UserRole, LoginFormData, RegisterFormData } from '../types';

export class AuthService {
  // Sign in with email and password
  static async signIn({ email, password, rememberMe }: LoginFormData): Promise<User> {
    try {
      // Set persistence based on remember me
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update last login time
      await this.updateLastLogin(firebaseUser.uid);

      // Get user data from Firestore
      const userData = await this.getUserData(firebaseUser.uid);
      return userData;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Register new user
  static async register({ email, password, displayName }: RegisterFormData): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(firebaseUser, { displayName });

      // Create user document in Firestore
      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName,
        role: 'regular', // Default role
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...userData,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });

      return userData;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error('Failed to sign out');
    }
  }

  // Get current user
  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await this.getUserData(firebaseUser.uid);
          callback(userData);
        } catch (error) {
          console.error('Error getting user data:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }

  // Get user data from Firestore
  static async getUserData(uid: string): Promise<User> {
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (!userDoc.exists()) {
      throw new Error('User data not found');
    }

    const data = userDoc.data();
    return {
      uid: data.uid,
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      createdAt: data.createdAt?.toDate() || new Date(),
      lastLoginAt: data.lastLoginAt?.toDate(),
    };
  }

  // Update last login time
  static async updateLastLogin(uid: string): Promise<void> {
    await setDoc(doc(db, 'users', uid), {
      lastLoginAt: serverTimestamp(),
    }, { merge: true });
  }

  // Update user role (admin only)
  static async updateUserRole(uid: string, role: UserRole): Promise<void> {
    await setDoc(doc(db, 'users', uid), {
      role,
    }, { merge: true });
  }

  // Check if user is admin
  static async isAdmin(uid: string): Promise<boolean> {
    const userData = await this.getUserData(uid);
    return userData.role === 'admin';
  }

  // Get error message from Firebase error code
  private static getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No user found with this email address';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      default:
        return 'An error occurred. Please try again';
    }
  }
}
