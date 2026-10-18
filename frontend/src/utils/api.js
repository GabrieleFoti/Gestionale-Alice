export const AUTH_EXPIRED_EVENT = 'auth:expired';

/**
 * Restituisce true se il JWT è assente, malformato o già scaduto.
 * Il token non viene verificato (la firma la controlla il backend): serve solo
 * a non mostrare l'app con una sessione che il server rifiuterebbe.
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

/**
 * Centralized fetch utility that automatically adds Authorization header
 * @param {string} url - The API endpoint URL
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<Response>} - The fetch response
 */
export const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Sessione scaduta o token non valido: AuthContext fa logout e la route
  // protetta riporta al login.
  if (response.status === 401) {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }

  return response;
};
