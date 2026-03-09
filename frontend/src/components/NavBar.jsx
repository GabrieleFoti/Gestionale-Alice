import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NavBar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  // Se siamo nella pagina di login, non mostriamo la NavBar o la mostriamo in forma ridotta
  // In base alla richiesta: "se non sei loggato... vedi solo il logo"
  
  const isAdmin = user?.role === 'admin';

  return (
    <nav className="sticky top-0 z-50 border-b bg-brand-bg-300 border-brand-bg-700">
      <div className="px-12">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
                <span className="hidden font-[nighty] text-5xl sm:block">Panzani Design</span>
            </div>
            
            {isAuthenticated && isAdmin && (
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                <Link
                  to="/officina"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    location.pathname === '/officina'
                      ? 'border-brand-text-700 text-brand-text'
                      : 'border-transparent text-brand-text/70 hover:border-brand-text hover:text-brand-text'
                  }`}
                >
                  Officina
                </Link>
                <Link
                  to="/archivio"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    location.pathname === '/archivio'
                      ? 'border-brand-text-700 text-brand-text'
                      : 'border-transparent text-brand-text/70 hover:border-brand-text hover:text-brand-text'
                  }`}
                >
                  Archivio
                </Link>
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {isAdmin && (
                  <span className="text-sm font-medium text-brand-text/70">
                    {user.username} (Admin)
                  </span>
                )}
                  <button
                    onClick={logout}
                    className="inline-flex items-center px-3 py-1.5 border border-brand-text-700 text-sm font-medium rounded-md text-brand-text bg-transparent hover:bg-brand-text-700 hover:text-white transition-colors"
                  >
                    Logout
                  </button>
              </div>
            ) : (
              location.pathname !== '/login' && (
                  <Link
                    to="/login"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border border-transparent shadow-sm transition-all text-brand-bg bg-brand-text hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-text"
                  >
                    Accedi
                  </Link>
              )
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu (simplified) */}
      {isAuthenticated && isAdmin && (
        <div className="flex overflow-x-auto px-4 py-2 space-x-4 border-t border-brand-text-200 sm:hidden">
          <Link
            to="/officina"
            className={`text-sm font-medium ${
              location.pathname === '/officina' ? 'text-brand-text underline' : 'text-brand-text/70'
            }`}
          >
            Officina
          </Link>
          <Link
            to="/archivio"
            className={`text-sm font-medium ${
              location.pathname === '/archivio' ? 'text-brand-text underline' : 'text-brand-text/70'
            }`}
          >
            Archivio
          </Link>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
