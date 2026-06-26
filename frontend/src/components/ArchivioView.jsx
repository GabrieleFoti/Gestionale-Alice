import { useState, useEffect } from 'react';
import MachineCard from './MachineCard';
import { useGetCars } from '../hooks/useCars';

const BackButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex-none flex items-center gap-1 mb-3 text-sm font-medium text-brand-text/70 hover:text-brand-text"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
    Torna alla lista
  </button>
);

const ArchivioView = () => {
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [machines, setMachines] = useState([]);
  const [showDetail, setShowDetail] = useState(false);

  const { execute: fetchMachines, loading: isLoading } = useGetCars({
    onSuccess: (data) => {
      const completed = data.filter(m => m.status === 'completed');
      setMachines(completed);
      if (selectedMachine && !completed.find(m => m.id === selectedMachine.id)) {
        setSelectedMachine(null);
        setShowDetail(false);
      }
    }
  });

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  const handleMachineSelect = (machine) => {
    setSelectedMachine(machine);
    setShowDetail(true);
  };

  const handleBackToList = () => {
    setShowDetail(false);
  };

  const handleSuccess = () => {
    fetchMachines();
    setSelectedMachine(null);
    setShowDetail(false);
  };

  const handleDelete = () => {
    setSelectedMachine(null);
    setShowDetail(false);
  };

  const machineList = (
    <div className="bg-brand-bg rounded-lg shadow-lg h-full flex flex-col border border-brand-text/20">
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
              onClick={() => handleMachineSelect(machine)}
              className={`w-full p-4 text-left transition hover:bg-brand-text/5 ${
                selectedMachine?.id === machine.id ? 'bg-brand-text/10 border-l-4 border-brand-text' : ''
              }`}
            >
              <div>
                <p className="font-semibold text-brand-text">{machine.name}</p>
                <p className="mt-1 text-sm text-brand-text/70 line-clamp-2">{machine.lavorazioni}</p>
                {machine.totalMinutes > 0 && (
                  <p className="mt-1 text-sm font-semibold text-brand-text">
                    Totale: {Math.floor(machine.totalMinutes / 60)}h {machine.totalMinutes % 60}m
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
  );

  const detailCard = selectedMachine ? (
    <MachineCard
      machine={selectedMachine}
      admin={true}
      onSuccess={handleSuccess}
      onDelete={handleDelete}
    />
  ) : (
    <div className="p-12 text-center text-brand-text bg-brand-bg rounded-lg shadow-lg h-full flex items-center justify-center border border-brand-text/20">
      <p>Seleziona una macchina per vedere i dettagli</p>
    </div>
  );

  return (
    <>
      {/* Mobile: un pannello alla volta */}
      <div className="lg:hidden h-full">
        {showDetail ? (
          <div className="flex flex-col h-full">
            <BackButton onClick={handleBackToList} />
            <div className="flex-1 min-h-0">
              {detailCard}
            </div>
          </div>
        ) : (
          machineList
        )}
      </div>

      {/* Desktop: side-by-side */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6 h-full">
        <div className="lg:col-span-1 h-full">
          {machineList}
        </div>
        <div className="lg:col-span-2 h-full">
          {detailCard}
        </div>
      </div>
    </>
  );
};

export default ArchivioView;
