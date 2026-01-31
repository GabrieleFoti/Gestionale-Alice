import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { operators } from '../utils/mockData';
import OperatorColumn from '../components/OperatorColumn';
import toast from 'react-hot-toast';
import { fetchWithAuth } from '../utils/api';

const OperatorView = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [machines, setMachines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMachines = async () => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth('http://localhost:5000/api/cars');
      if (!response.ok) throw new Error('Errore nel caricamento delle macchine');
      const data = await response.json();
      // Filter only machines that are in progress or idle
      setMachines(data.filter(m => m.status !== 'completed'));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logout effettuato');
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 rounded-full border-b-2 border-blue-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
      {/* Main Content - Full Screen 5 Columns */}
      <div className="px-2 py-4 mx-auto w-full h-full sm:px-4 lg:px-6">
        <div className="grid grid-cols-1 h-full sm:grid-cols-3 lg:grid-cols-5">
          {operators.map((operator) => (
            <div key={operator.id} className="h-full">
              <OperatorColumn
                operator={operator}
                machines={machines}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OperatorView;


