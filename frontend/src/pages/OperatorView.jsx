import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { operators } from '../utils/mockData';
import OperatorColumn from '../components/OperatorColumn';
import { useGetCars } from '../hooks/useCars';

const OperatorView = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [machines, setMachines] = useState([]);

  const { execute: fetchMachines, loading: isLoading } = useGetCars({
    filter: (m) => m.status !== 'completed',
    onSuccess: (data) => setMachines(data)
  });

  useEffect(() => {
    fetchMachines();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-brand-bg">
        <div className="w-12 h-12 rounded-full border-b-2 animate-spin border-brand-text"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-brand-bg overflow-hidden">
      {/* Main Content - Full Screen 5 Columns */}
      <div className="px-2 py-4 mx-auto w-full h-full sm:px-4 lg:px-6">
        <div className="grid grid-cols-1 gap-3 h-full sm:grid-cols-3 lg:grid-cols-5">
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


