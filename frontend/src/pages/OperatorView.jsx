import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { operators } from '../utils/mockData';
import OperatorColumn from '../components/OperatorColumn';
import { useGetCars } from '../hooks/useCars';
import { useGetAllActiveSessions } from '../hooks/useSessions';

const OperatorView = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [machines, setMachines] = useState([]);
  const [activeMachines, setActiveMachines] = useState({});

  const { execute: fetchAllActive } = useGetAllActiveSessions({
    onSuccess: (sessions) => {
      const map = {};
      sessions.forEach(s => {
        map[s.operatorName] = s.carId;
      });
      setActiveMachines(map);
    }
  });

  const { execute: fetchMachines, loading: isLoading } = useGetCars({
    onSuccess: (data) => setMachines(data.filter(m => m.status !== 'completed'))
  });

  const refreshAll = useCallback(() => {
    fetchMachines();
    fetchAllActive();
  }, [fetchMachines, fetchAllActive]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-brand-bg">
        <div className="w-12 h-12 rounded-full border-b-2 animate-spin border-brand-text"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-brand-bg overflow-hidden p-2 sm:p-4 lg:p-6 w-full mx-auto">
      {/* Main Content - Full Screen 5 Columns */}
      <div className="flex-1 min-h-0 w-full">
        <div className="grid grid-cols-1 gap-3 h-full sm:grid-cols-3 lg:grid-cols-5">
          {operators.map((operator) => (
            <div key={operator.id} className="h-full min-h-0">
              <OperatorColumn
                operator={operator}
                machines={machines}
                activeMachineId={activeMachines[operator.name] || null}
                onSessionChange={refreshAll}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OperatorView;


