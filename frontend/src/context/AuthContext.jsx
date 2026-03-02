import { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  CognitoUser,
  AuthenticationDetails,
} from 'amazon-cognito-identity-js';
import { userPool } from '../utils/cognito';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Stato FORCE_CHANGE_PASSWORD: contiene l'oggetto cognitoUser e gli userAttributes
  const [pendingNewPassword, setPendingNewPassword] = useState(null);

  // Ripristina sessione al caricamento
  useEffect(() => {
    const currentUser = userPool.getCurrentUser();
    if (!currentUser) {
      setLoading(false);
      return;
    }
    currentUser.getSession((err, session) => {
      if (err || !session?.isValid()) {
        setLoading(false);
        return;
      }
      const payload = session.getIdToken().decodePayload();
      const token = session.getIdToken().getJwtToken();
      localStorage.setItem('authToken', token);
      
      const role = payload.profile || payload['custom:profile'] || payload['custom:role'] || payload['cognito:groups']?.[0] || 'operator';
      
      setUser({
        username: payload['cognito:username'] || payload.email,
        email: payload.email,
        role: role,
      });
      setIsAuthenticated(true);
      setLoading(false);
    });
  }, []);

  /**
   * Login con Cognito.
   * Ritorna:
   *   - true  → login riuscito
   *   - { requireNewPassword: true } → utente FORCE_CHANGE_PASSWORD
   */
  const login = (username, password) => {
    return new Promise((resolve, reject) => {
      const authDetails = new AuthenticationDetails({
        Username: username,
        Password: password,
      });

      const cognitoUser = new CognitoUser({
        Username: username,
        Pool: userPool,
      });

      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (session) => {
          const payload = session.getIdToken().decodePayload();
          const token = session.getIdToken().getJwtToken();
          localStorage.setItem('authToken', token);
          console.log(payload)
          const role = payload.profile || payload['custom:profile'] || payload['custom:role'] || payload['cognito:groups']?.[0] || 'operator';
          
          const userData = {
            username: payload['cognito:username'] || payload.email || username,
            email: payload.email,
            role: role,
          };
          setUser(userData);
          setIsAuthenticated(true);
          resolve(true);
        },

        onFailure: (err) => {
          reject(new Error(err.message || 'Credenziali non valide'));
        },

        // Utente in stato FORCE_CHANGE_PASSWORD
        newPasswordRequired: (userAttributes, requiredAttributes) => {
          console.log(userAttributes, requiredAttributes)
          // Rimuovi attributi non modificabili
          delete userAttributes.email_verified;
          delete userAttributes.phone_number_verified;
          delete userAttributes['cognito:user_status'];
          delete userAttributes.email;
          setPendingNewPassword({ cognitoUser, userAttributes, requiredAttributes });
          resolve({ requireNewPassword: true });
        },
      });
    });
  };

  /**
   * Completa il cambio password obbligatorio (FORCE_CHANGE_PASSWORD).
   */
  const completeNewPassword = (newPassword) => {
    return new Promise((resolve, reject) => {
      if (!pendingNewPassword) {
        reject(new Error('Nessuna sessione di cambio password in sospeso'));
        return;
      }

      const { cognitoUser, userAttributes } = pendingNewPassword;

      cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, {
        onSuccess: (session) => {
          const payload = session.getIdToken().decodePayload();
          const token = session.getIdToken().getJwtToken();
          localStorage.setItem('authToken', token);
          
          const role = payload.profile || payload['custom:profile'] || payload['custom:role'] || payload['cognito:groups']?.[0] || 'operator';
          
          const userData = {
            username: payload['cognito:username'] || payload.email,
            email: payload.email,
            role: role,
          };
          setUser(userData);
          setIsAuthenticated(true);
          setPendingNewPassword(null);
          resolve(true);
        },
        onFailure: (err) => {
          reject(new Error(err.message || 'Errore nel cambio password'));
        },
      });
    });
  };

  const logout = () => {
    const currentUser = userPool.getCurrentUser();
    if (currentUser) currentUser.signOut();
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUser(null);
    setPendingNewPassword(null);
  };

  /**
   * Restituisce il token JWT (idToken) della sessione corrente.
   * Utile per le chiamate API autenticate.
   */
  const getToken = () => {
    const currentUser = userPool.getCurrentUser();
    if (!currentUser) return null;
    // getSession è asincrono, ma il token è già in cache se la sessione è valida
    let token = null;
    currentUser.getSession((err, session) => {
      if (!err && session?.isValid()) {
        token = session.getIdToken().getJwtToken();
      }
    });
    return token;
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        login,
        logout,
        completeNewPassword,
        pendingNewPassword: !!pendingNewPassword,
        get token() { return getToken(); },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
