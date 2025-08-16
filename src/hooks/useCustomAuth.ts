'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface CustomAuthState {
  isSignedIn: boolean;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  userUsername: string | null;
  isLoading: boolean;
}

export function useCustomAuth() {
  const { isSignedIn, userId, isLoaded, signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  // ✅ HYDRATION FIX: Prevent server-client mismatch
  const [mounted, setMounted] = useState(false);
  const [authState, setAuthState] = useState<CustomAuthState>({
    isSignedIn: false,
    userId: null,
    userEmail: null,
    userName: null,
    userFirstName: null,
    userLastName: null,
    userUsername: null,
    isLoading: true
  });

  // ✅ DUPLICATE PREVENTION: Use useRef to prevent re-renders
  const hasLoggedUserData = useRef(false);
  const currentUserId = useRef<string | null>(null);
  const loginInProgress = useRef(false);

  // ✅ HYDRATION FIX: Only run after client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ FIXED: Separate useEffect for auth state management
  useEffect(() => {
    if (!mounted || !isLoaded) {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      return;
    }

    if (isSignedIn && user) {
      const userData = {
        isSignedIn: true,
        userId: user.id,
        userEmail: user.primaryEmailAddress?.emailAddress || null,
        userName: user.firstName || user.username || 'User',
        userFirstName: user.firstName || null,
        userLastName: user.lastName || null,
        userUsername: user.username || null,
        isLoading: false
      };
      setAuthState(userData);
    } else {
      // ✅ FIXED: Reset login tracking when signed out
      hasLoggedUserData.current = false;
      currentUserId.current = null;
      loginInProgress.current = false;

      setAuthState({
        isSignedIn: false,
        userId: null,
        userEmail: null,
        userName: null,
        userFirstName: null,
        userLastName: null,
        userUsername: null,
        isLoading: false
      });
    }
  }, [isSignedIn, user, isLoaded, mounted]);

  // ✅ DUPLICATE PREVENTION: Separate useEffect for login data capture (runs only once per user)
  useEffect(() => {
    if (mounted && isLoaded && isSignedIn && user && authState.userId && !loginInProgress.current) {
      // ✅ FIXED: Only log if user changed and not already logged
      if (user.id !== currentUserId.current && !hasLoggedUserData.current) {
        loginInProgress.current = true; // Prevent concurrent calls
        logUserLoginData(authState);
      }
    }
  }, [mounted, isLoaded, isSignedIn, user?.id, authState.userId]);

  // ✅ ENHANCED: Function to log user login data with database save (with strict duplicate prevention)
  const logUserLoginData = async (userData: CustomAuthState) => {
    // ✅ STRICT DUPLICATE CHECK
    if (!userData.userId || hasLoggedUserData.current || loginInProgress.current === false) {
      loginInProgress.current = false;
      return;
    }

    try {
      // ✅ Get session info (create once per browser session)
      let sessionId = '';
      if (typeof window !== 'undefined') {
        sessionId = sessionStorage.getItem('user_session_id') || '';
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
          sessionStorage.setItem('user_session_id', sessionId);
        }
      }

      const loginData = {
        user_id: userData.userId,
        email_id: userData.userEmail,
        first_name: userData.userFirstName,
        last_name: userData.userLastName,
        username: userData.userUsername || userData.userName,
        full_name: `${userData.userFirstName || ''} ${userData.userLastName || ''}`.trim() || userData.userName,
        login_time: new Date().toISOString(),
        user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
        session_id: sessionId,
        timestamp: Date.now()
      };

      // ✅ SINGLE DATABASE CALL with error handling
      try {
        const response = await fetch('/api/log-user-login', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Duplicate-Check': 'true' // Custom header for duplicate prevention
          },
          body: JSON.stringify(loginData)
        });

        if (response.ok) {
          const result = await response.json();

          if (result.duplicate) {
            } else {
            }

          // Mark as logged regardless of duplicate status
          hasLoggedUserData.current = true;
          currentUserId.current = userData.userId;
        } else {
          const errorData = await response.json().catch(() => ({}));
          }
      } catch (dbError) {
        }

      } catch (error) {
      } finally {
      loginInProgress.current = false;
    }
  };

  const customSignOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // ✅ FIXED: Reset all login tracking on sign out
      hasLoggedUserData.current = false;
      currentUserId.current = null;
      loginInProgress.current = false;

      await signOut();

      // Clear local storage and cookies
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
      }

      router.push('/');
    } catch (error) {
      router.push('/');
    }
  };

  const getUserProfileData = () => ({
    userId: authState.userId,
    email: authState.userEmail,
    firstName: authState.userFirstName,
    lastName: authState.userLastName,
    username: authState.userUsername,
    displayName: authState.userName
  });

  // ✅ HYDRATION FIX: Return safe state until mounted
  if (!mounted) {
    return {
      isSignedIn: false,
      userId: null,
      userEmail: null,
      userName: null,
      userFirstName: null,
      userLastName: null,
      userUsername: null,
      isLoading: true,
      customSignOut,
      getUserProfileData,
      isAuthenticated: false,
      isLoaded: false
    };
  }

  return {
    ...authState,
    customSignOut,
    getUserProfileData,
    isAuthenticated: authState.isSignedIn,
    isLoaded: mounted && isLoaded
  };
}
