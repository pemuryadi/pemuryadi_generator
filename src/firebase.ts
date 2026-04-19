import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, onSnapshot, query, orderBy, limit, increment } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const photoURL = user.photoURL || user.providerData[0]?.photoURL || '';
    
    // Check if user exists in Firestore
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Create new user profile
      const role = user.email === 'p.e.muryadi@gmail.com' ? 'owner' : 'guest';
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: photoURL,
        role: role,
        createdAt: new Date().toISOString()
      });
    } else {
      // Update photoURL if it changed or was missing
      await updateDoc(userRef, {
        photoURL: photoURL,
        displayName: user.displayName || userSnap.data().displayName
      });
    }
  } catch (error: any) {
    console.error("Error logging in with Google:", error);
    if (error.code === 'auth/popup-blocked') {
      alert('Popup diblokir oleh browser. Silakan izinkan popup untuk login.');
    } else if (error.code === 'auth/unauthorized-domain') {
      alert('Domain ini tidak diizinkan untuk login. Silakan hubungi admin.');
    } else {
      alert('Gagal login: ' + error.message);
    }
    throw error;
  }
};

export const updateProfile = async (uid: string, data: Partial<any>) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
  } catch (error) {
    console.error("Error updating profile", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out", error);
    throw error;
  }
};

export const incrementFavorites = async () => {
  try {
    const statsRef = doc(db, 'system', 'stats');
    const statsSnap = await getDoc(statsRef);
    
    if (!statsSnap.exists()) {
      // Only admin can create, but we can try to increment if it exists
      // If it doesn't exist, we might need to create it manually from admin console or handle it here
      console.warn("Stats document does not exist yet.");
      return;
    }
    
    await updateDoc(statsRef, {
      favorites: increment(1)
    });
  } catch (error) {
    console.error("Error incrementing favorites", error);
  }
};

export const addActivityLog = async (msg: string, status: string, color: string) => {
  try {
    const logsRef = collection(db, 'activityLogs');
    const now = new Date();
    await addDoc(logsRef, {
      msg,
      status,
      color,
      time: now.toLocaleTimeString('en-US', { hour12: false }),
      timestamp: now.getTime()
    });
  } catch (error) {
    console.error("Error adding activity log", error);
  }
};
