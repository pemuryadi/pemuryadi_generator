import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role?: 'owner' | 'guest'; // Keep role for backwards compatibility if needed, but primary is tier now
  tier?: 'Free' | 'Essential' | 'Premium' | 'Ultimate' | 'SUPREME' | 'Titan' | 'owner';
  createdAt: string;
  tokens?: number;
  lastResetDate?: string; // Format: YYYY-MM-DD
  nip?: string;
  jenjang?: string;
  tahunPelajaran?: string;
  namaSekolah?: string;
  kepalaSekolah?: string;
  jenisNipKepalaSekolah?: string;
  nipKepalaSekolah?: string;
  nama?: string;
  jenisNipGuru?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  consumeToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  consumeToken: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const consumeToken = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) return false;
      
      const userData = userSnap.data() as UserProfile;
      const tier = userData.tier || userData.role || 'Free';
      const today = new Date().toISOString().split('T')[0];
      
      if (tier === 'owner') return true;

      let currentTokens = userData.tokens;
      
      // Handle Free Tier reset
      if (tier === 'Free') {
        if (userData.lastResetDate !== today) {
          currentTokens = 2; // Reset to 2 max for free
          await updateDoc(userRef, {
            tokens: 2,
            lastResetDate: today
          });
        } else if (currentTokens === undefined) {
          currentTokens = 2; // initial
        }
      }

      if (currentTokens && currentTokens > 0) {
        await updateDoc(userRef, {
          tokens: currentTokens - 1,
          lastResetDate: today
        });
        return true;
      }
      
      return false; // Not enough tokens
    } catch (e) {
      console.error("Error consuming token", e);
      return false;
    }
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
      }

      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, consumeToken }}>
      {children}
    </AuthContext.Provider>
  );
};
