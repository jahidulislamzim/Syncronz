'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase/client.js';
import { loginWithGoogle, logoutUser, loginWithEmail, registerWithEmail } from '../lib/firebase/auth.js';
import { createUserProfile } from '../lib/firebase/firestore.js';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAllowed, setIsAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState(null);
  const [initError, setInitError] = useState(null);
  const timeoutRef = useRef(null);

  // Safety timeout — never stay loading >15s
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setLoading(false);
    }, 15000);
    return () => clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    const envAdmin = process.env.NEXT_PUBLIC_ADMIN_EMAIL || null;
    setAdminEmail(envAdmin ? envAdmin.toLowerCase() : null);
  }, []);

  useEffect(() => {
    if (!auth) {
      setInitError('Firebase Auth unavailable');
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setIsAllowed(false);
        setLoading(false);
        return;
      }

      try {
        const resolvedAdmin = adminEmail || process.env.NEXT_PUBLIC_ADMIN_EMAIL || null;
        const emailLower = firebaseUser.email?.toLowerCase();

        let allowed = false;
        let isSuperAdmin = false;
        if (emailLower && resolvedAdmin && emailLower === resolvedAdmin.toLowerCase()) {
          isSuperAdmin = true;
        }

        let dbProfile = null;

        if (emailLower) {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          dbProfile = userDoc.exists() ? userDoc.data() : null;

          const isGoogleUser = firebaseUser.providerData.some(p => p.providerId === 'google.com');
          if (!dbProfile && isGoogleUser) {
            const q = query(collection(db, 'users'), where('email', '==', emailLower));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              dbProfile = querySnapshot.docs[0].data();
            }
          }

          if (dbProfile) {
            // Case 1: User exists in the users table
            if (dbProfile.isAuthorized || dbProfile.isAdmin || isSuperAdmin) {
              allowed = true;
            }
          } else {
            // Case 2: User is not found in the users table
            if (isSuperAdmin) {
              allowed = true;
            } else {
              // Check invited user table
              const inviteDoc = await getDoc(doc(db, 'invited_users', emailLower));
              if (inviteDoc.exists()) {
                const data = inviteDoc.data();
                if (data.status === 'pending' || data.status === 'accepted') {
                  await deleteDoc(doc(db, 'invited_users', emailLower));
                  allowed = true;
                }
              }
            }
          }
        }

        if (!allowed) {
          setIsAllowed(false);
          setProfile(null);
          setLoading(false);
          return;
        }

        await createUserProfile(
          firebaseUser.uid,
          firebaseUser.displayName || '',
          firebaseUser.photoURL || '',
          firebaseUser.email || ''
        ).catch(() => {});

        setProfile({
          uid: firebaseUser.uid,
          displayName: dbProfile?.displayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          photoURL: dbProfile?.photoURL || firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firebaseUser.uid)}`,
          lastActive: new Date().toISOString(),
          isAdmin: isSuperAdmin || !!dbProfile?.isAdmin
        });
        setIsAllowed(true);
      } catch {
        setIsAllowed(false);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [adminEmail]);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const handleSignInWithEmail = async (email, password) => {
    setLoading(true);
    try {
      await loginWithEmail(email, password);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const handleSignUpWithEmail = async (email, password, displayName) => {
    setLoading(true);
    try {
      await registerWithEmail(email, password, displayName);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await logoutUser();
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!auth.currentUser) return;
    try {
      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;
      
      const userDoc = await getDoc(doc(db, 'users', updatedUser.uid));
      const dbProfile = userDoc.exists() ? userDoc.data() : null;

      const emailLower = updatedUser.email?.toLowerCase();
      const resolvedAdmin = adminEmail || process.env.NEXT_PUBLIC_ADMIN_EMAIL || null;
      const isSuperAdmin = emailLower && resolvedAdmin && emailLower === resolvedAdmin.toLowerCase();

      setUser({ ...updatedUser });
      setProfile({
        uid: updatedUser.uid,
        displayName: dbProfile?.displayName || updatedUser.displayName || updatedUser.email?.split('@')[0] || 'User',
        photoURL: dbProfile?.photoURL || updatedUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(updatedUser.uid)}`,
        lastActive: new Date().toISOString(),
        isAdmin: isSuperAdmin || !!dbProfile?.isAdmin
      });
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      isAllowed, 
      loading, 
      adminEmail, 
      initError, 
      signIn: handleSignIn, 
      signInWithEmail: handleSignInWithEmail,
      signUpWithEmail: handleSignUpWithEmail,
      signOut: handleSignOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
