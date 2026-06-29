import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NavBar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  return (
    <nav className="sticky top-0 z-50 border-b bg-brand-bg-300 border-brand-bg-700">
      <div className="px-6 sm:px-12">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <span className={`font-[nighty] text-2xl sm:text-5xl ${
                isAdmin && isAuthenticated
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-700 to-pink-400'
                  : ''
              }`}>
                Panzani Design
              </span>
            </div>

            {isAuthenticated && isAdmin && (
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                <Link
                  to="/officina"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    location.pathname === '/officina'
                      ? 'border-pink-700 text-pink-700 font-semibold'
                      : 'border-transparent text-brand-text/70 hover:border-pink-400 hover:text-pink-700'
                  }`}
                >
                  Officina
                </Link>
                <Link
                  to="/archivio"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    location.pathname === '/archivio'
                      ? 'border-pink-700 text-pink-700 font-semibold'
                      : 'border-transparent text-brand-text/70 hover:border-pink-400 hover:text-pink-700'
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
                  <span className="text-sm font-medium text-pink-700 bg-pink-100 px-3 py-1 rounded-full">
                    ✨ {user.username}
                  </span>
                )}
                <button
                  onClick={logout}
                  className="inline-flex items-center px-3 py-1.5 border border-brand-text-700 text-sm font-medium rounded-md text-brand-text bg-transparent hover:bg-brand-text-700 hover:text-white transition-colors cursor-pointer"
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

      {/* Mobile menu */}
      {isAuthenticated && isAdmin && (
        <div className="flex overflow-x-auto px-4 py-2 space-x-6 border-t border-brand-text-200 sm:hidden">
          <Link
            to="/officina"
            className={`text-sm font-medium whitespace-nowrap ${
              location.pathname === '/officina'
                ? 'text-pink-700 font-semibold underline underline-offset-4'
                : 'text-brand-text/70'
            }`}
          >
            Officina
          </Link>
          <Link
            to="/archivio"
            className={`text-sm font-medium whitespace-nowrap ${
              location.pathname === '/archivio'
                ? 'text-pink-700 font-semibold underline underline-offset-4'
                : 'text-brand-text/70'
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
