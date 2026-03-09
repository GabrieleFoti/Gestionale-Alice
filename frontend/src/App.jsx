import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import OperatorView from './pages/OperatorView';
import OfficinaView from './components/OfficinaView';
import ArchivioView from './components/ArchivioView';
import NavBar from './components/NavBar';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-brand-bg-300">
        <div className="w-12 h-12 rounded-full border-b-2 animate-spin border-brand-text-700"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  const { loading } = useAuth();

  if (loading) return null;

  return (
    <div className="w-full h-full bg-brand-bg-300 text-brand-text-800">
      <NavBar />
      <main className="w-full h-full">
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route 
            path="/operators" 
            element={
              <ProtectedRoute>
                <OperatorView />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/officina" 
            element={
              <ProtectedRoute>
                <OfficinaView />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/archivio" 
            element={
              <ProtectedRoute>
                <ArchivioView />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

