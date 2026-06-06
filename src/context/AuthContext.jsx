'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase/client.js';
import { loginWithGoogle, logoutUser } from '../lib/firebase/auth.js';
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

        if (emailLower) {
          if (resolvedAdmin && emailLower === resolvedAdmin.toLowerCase()) {
            allowed = true;
          } else {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            const existingProfile = userDoc.exists() ? userDoc.data() : null;

            if (existingProfile?.isAuthorized) {
              allowed = true;
            } else {
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
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firebaseUser.uid)}`,
          lastActive: new Date().toISOString(),
          isAdmin: !!(resolvedAdmin && firebaseUser.email?.toLowerCase() === resolvedAdmin.toLowerCase())
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
    } catch {
      setLoading(false);
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

  return (
    <AuthContext.Provider value={{ user, profile, isAllowed, loading, adminEmail, initError, signIn: handleSignIn, signOut: handleSignOut }}>
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
