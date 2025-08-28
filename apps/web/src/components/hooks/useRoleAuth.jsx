import { useState, useEffect } from 'react';
import { User } from '@/api/entities';

export function useRoleAuth(allowedRoles) {
  const [authState, setAuthState] = useState({
    loading: true,
    isAuthorized: false,
    user: null,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await User.me();
        
        // Fix: Access role from profile
        const userRole = currentUser?.profile?.role || 'user';
        const isAuthorized = allowedRoles.includes(userRole);
        
        setAuthState({
          loading: false,
          isAuthorized,
          user: currentUser,
        });
      } catch (error) {
        // User is not logged in
        setAuthState({
          loading: false,
          isAuthorized: false,
          user: null,
        });
      }
    };

    checkAuth();
  }, [allowedRoles.join(',')]);

  return authState;
}