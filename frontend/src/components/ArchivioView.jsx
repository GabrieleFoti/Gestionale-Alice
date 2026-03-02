import { useState, useEffect } from 'react';
import MachineCard from './MachineCard';
import { useGetCars } from '../hooks/useCars';

const ArchivioView = () => {
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [machines, setMachines] = useState([]);

  const { execute: fetchMachines, loading: isLoading } = useGetCars({
    filter: (m) => m.status === 'completed',
    onSuccess: (data) => {
      setMachines(data);
      if (selectedMachine && !data.find(m => m.id === selectedMachine.id)) {
        setSelectedMachine(null);
      }
    }
  });

  useEffect(() => {
    fetchMachines();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left Side - Machine List */}
      <div className="lg:col-span-1">
        <div className="bg-brand-bg rounded-lg shadow-lg h-[70vh] flex flex-col border border-brand-text/20">
          <div className="p-4 border-b border-brand-text/20">
            <h2 className="text-lg font-semibold text-brand-text">Macchine Completate</h2>
          </div>
          <div className="overflow-y-auto flex-grow divide-y divide-brand-text-200">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="w-8 h-8 rounded-full border-b-2 border-brand-text animate-spin"></div>
              </div>
            ) : machines.length > 0 ? (
              machines.map((machine) => (
                <button
                  key={machine.id}
                  onClick={() => setSelectedMachine(machine)}
                  className={`w-full p-4 text-left transition hover:bg-brand-text/5 ${
                    selectedMachine?.id === machine.id ? 'bg-brand-text/10 border-l-4 border-brand-text' : ''
                  }`}
                >
                  <div>
                    <p className="font-semibold text-brand-text">{machine.name}</p>
                    <p className="mt-1 text-sm text-brand-text/70 line-clamp-2">{machine.lavorazioni}</p>
                    {machine.totalHours && (
                      <p className="mt-1 text-sm font-semibold text-brand-text">
                        Totale: {machine.totalHours}
                      </p>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-brand-text opacity-60">
                <p>Nessuna macchina completata</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Machine Detail */}
      <div className="lg:col-span-2">
        {selectedMachine ? (
          <MachineCard 
            machine={selectedMachine} 
            admin={true} 
            onSuccess={() => {
              fetchMachines();
              setSelectedMachine(null);
            }}
            onDelete={() => setSelectedMachine(null)}
          />
        ) : (
          <div className="p-12 text-center text-brand-text bg-brand-bg rounded-lg shadow-lg h-[70vh] flex items-center justify-center border border-brand-text/20">
            <p>Seleziona una macchina per vedere i dettagli</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivioView;

