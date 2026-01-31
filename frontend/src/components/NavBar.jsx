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
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="px-12">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
                <span className="hidden sm:block">PanzaniDesign</span>
            </div>
            
            {isAuthenticated && isAdmin && (
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                <Link
                  to="/officina"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    location.pathname === '/officina'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Officina
                </Link>
                <Link
                  to="/archivio"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    location.pathname === '/archivio'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
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
                  <span className="text-sm font-medium text-gray-500">
                    {user.username} (Admin)
                  </span>
                )}
                <button
                  onClick={logout}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              location.pathname !== '/login' && (
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md border border-transparent shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
        <div className="flex overflow-x-auto px-4 py-2 space-x-4 border-t border-gray-200 sm:hidden">
          <Link
            to="/officina"
            className={`text-sm font-medium ${
              location.pathname === '/officina' ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            Officina
          </Link>
          <Link
            to="/archivio"
            className={`text-sm font-medium ${
              location.pathname === '/archivio' ? 'text-blue-600' : 'text-gray-500'
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
