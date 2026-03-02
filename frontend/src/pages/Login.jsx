import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Inserisci username e password');
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await login(username, password);
      
      if (success) {
        toast.success('Login effettuato con successo!');
        
        // We get the user role from the store/context after login
        // But login returns true on success, and context updates user state.
        // For immediate navigation, we can use a small delay or check the updated user.
        // Actually, the most reliable way is if login returned the role, but 
        // here we can just check what kind of user we are after the await.
      }
    } catch (error) {
      toast.error(error.message || 'Credenziali non valide');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (userData?.role === 'admin') {
        navigate('/officina');
      } else if (userData?.role === 'operator') {
        navigate('/operators');
      } else {
        navigate('/');
      }
    }
  }, [isAuthenticated, navigate, isLoading]);

  return (
    <div className="flex justify-center items-center w-full h-[80vh]">
      <div className="p-8 w-full max-w-md rounded-2xl border shadow-xl bg-brand-bg border-brand-bg-700">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-brand-text">Gestionale Alice</h1>
          <p className="opacity-80 text-brand-text">Accedi al sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block mb-2 text-sm font-medium text-brand-text">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="px-4 py-3 w-full rounded-lg border transition outline-none bg-brand-bg-300 border-brand-text-500 bg-white/50 text-brand-text focus:ring-2 focus:ring-brand-text-900 focus:border-transparent placeholder-brand-text/50"
              placeholder="Inserisci username"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-brand-text">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-3 w-full rounded-lg border transition outline-none bg-brand-bg-300 border-brand-text-500 bg-white/50 text-brand-text focus:ring-2 focus:ring-brand-text-900 focus:border-transparent placeholder-brand-text/50"
              placeholder="Inserisci password"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-3 w-full font-semibold tracking-wider text-white uppercase rounded-lg transition duration-200 bg-brand-bg-700 text-brand-bg bg-brand-text hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>

        <div className="mt-6 text-sm text-center opacity-60 text-brand-text">
          <p>Sistema di gestione officina</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
