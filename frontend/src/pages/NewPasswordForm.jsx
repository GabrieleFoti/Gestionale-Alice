import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const NewPasswordForm = ({ onSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { completeNewPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword) {
      toast.error('Inserisci una nuova password');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Le password non coincidono');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('La password deve essere di almeno 8 caratteri');
      return;
    }

    setIsLoading(true);
    try {
      await completeNewPassword(newPassword);
      toast.success('Password aggiornata! Accesso effettuato.');
      onSuccess?.();
    } catch (error) {
      toast.error(error.message || 'Errore nel cambio password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6 text-center">
        <div className="flex justify-center mb-3">
          <div className="flex justify-center items-center w-12 h-12 rounded-full bg-brand-text/10">
            <svg className="w-6 h-6 text-brand-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-bold text-brand-text">Imposta nuova password</h2>
        <p className="mt-1 text-sm opacity-70 text-brand-text">
          È necessario impostare una nuova password per continuare.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="newPassword" className="block mb-2 text-sm font-medium text-brand-text">
            Nuova password
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="px-4 py-3 w-full rounded-lg border transition outline-none bg-brand-bg-300 border-brand-text-500 bg-white/50 text-brand-text focus:ring-2 focus:ring-brand-text-900 focus:border-transparent placeholder-brand-text/50"
            placeholder="Minimo 8 caratteri"
            disabled={isLoading}
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-brand-text">
            Conferma password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="px-4 py-3 w-full rounded-lg border transition outline-none bg-brand-bg-300 border-brand-text-500 bg-white/50 text-brand-text focus:ring-2 focus:ring-brand-text-900 focus:border-transparent placeholder-brand-text/50"
            placeholder="Ripeti la password"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-3 w-full font-semibold tracking-wider text-white uppercase rounded-lg transition duration-200 bg-brand-text hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Salvataggio...' : 'Imposta password'}
        </button>
      </form>
    </div>
  );
};

export default NewPasswordForm;
