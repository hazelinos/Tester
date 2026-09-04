import { useEffect, useState } from 'react';

/**
 * Hook untuk Google Identity Services (GSI)
 * Mendeteksi apakah GSI sudah siap dan expose fungsi signIn
 */
export const useGoogleAuth = (onSuccess) => {
  const [ready, setReady] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isConfigured = clientId && clientId !== 'YOUR_GOOGLE_CLIENT_ID_HERE';

  useEffect(() => {
    if (!isConfigured) return;

    // GSI mungkin belum load — poll sampai siap
    const check = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback:  handleCredential,
          auto_select: false,
        });
        setReady(true);
      } else {
        setTimeout(check, 300);
      }
    };
    check();
  }, [clientId]);

  const handleCredential = (response) => {
    try {
      // Decode JWT payload (bagian tengah, base64url)
      const base64 = response.credential.split('.')[1]
        .replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      onSuccess({
        name:    payload.name,
        email:   payload.email,
        picture: payload.picture,
      });
    } catch (e) {
      console.error('Google auth error:', e);
    }
  };

  const signIn = (buttonEl) => {
    if (!ready || !buttonEl) return;
    window.google.accounts.id.renderButton(buttonEl, {
      theme:  'filled_black',
      size:   'large',
      width:  260,
      text:   'signin_with',
      shape:  'pill',
      locale: 'id',
    });
  };

  return { ready, isConfigured, signIn };
};
