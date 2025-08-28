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
        const isAuthorized = allowedRoles.includes(currentUser.role);
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
  }, [allowedRoles.join(',')]); // Rerun if allowedRoles change

  return authState;
}