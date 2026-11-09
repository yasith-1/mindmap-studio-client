import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { getToken, setToken, clearToken } from '../lib/auth.js';

/**
 * Owns the passwordless auth session. On mount, if a token is stored it
 * validates it against the backend (so a revoked/expired token quietly drops
 * the user back to guest mode). Exposes the two-step OTP flow plus logout.
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false); // finished the initial token check

  // Restore session from a stored token once on load.
  useEffect(() => {
    let alive = true;
    const token = getToken();
    if (!token) {
      setReady(true);
      return;
    }
    api
      .me()
      .then((res) => alive && setUser(res.user))
      .catch(() => alive && clearToken())
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  // Step 1 — send the 6-digit code to the email.
  const requestOtp = useCallback((email) => api.requestOtp(email), []);

  // Step 2 — verify the code; on success store the token and user.
  const verifyOtp = useCallback(async (email, code) => {
    const { token, user: u } = await api.verifyOtp(email, code);
    setToken(token);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return { user, ready, isAuthed: !!user, requestOtp, verifyOtp, logout };
}
