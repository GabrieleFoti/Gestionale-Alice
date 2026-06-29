import { useState, useEffect } from 'react';
import MachineCard from './MachineCard';
import { useGetCars } from '../hooks/useCars';

const BackButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex-none flex items-center gap-1.5 mb-3 px-2 min-h-[44px] text-sm font-medium text-pink-700 hover:text-pink-800 active:bg-pink-50 rounded-lg cursor-pointer transition-colors"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
    Torna alla lista
  </button>
);

const OfficinaView = () => {
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [machines, setMachines] = useState([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const { execute: fetchMachines, loading: isLoading } = useGetCars({
    onSuccess: (data) => {
      const active = data.filter(m => m.status !== 'completed');
      setMachines(active);
      if (selectedMachine) {
        const updated = active.find(m => m.id === selectedMachine.id);
        if (updated) {
          setSelectedMachine(updated);
        } else {
          setSelectedMachine(null);
          setShowDetail(false);
        }
      }
    }
  });

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  const handleAddNew = () => {
    setIsAddingNew(true);
    setSelectedMachine(null);
    setShowDetail(true);
  };

  const handleCreated = () => {
    setIsAddingNew(false);
    setSelectedMachine(null);
    setShowDetail(false);
    fetchMachines();
  };

  const handleMachineSelect = (machine) => {
    setSelectedMachine(machine);
    setIsAddingNew(false);
    setShowDetail(true);
  };

  const handleBackToList = () => {
    setShowDetail(false);
    setIsAddingNew(false);
  };

  const machineList = (
    <div className="bg-white rounded-xl shadow-md border border-pink-200 flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-pink-200">
        <h2 className="text-lg font-semibold text-gray-900">Macchine</h2>
        <button
          onClick={handleAddNew}
          className="flex items-center px-3 py-2 text-xs font-bold tracking-wider text-white uppercase rounded-lg transition-all bg-pink-700 hover:bg-pink-800 shadow-sm cursor-pointer"
        >
          <span className="mr-1 text-base leading-none">+</span> Nuova
        </button>
      </div>
      <div className="overflow-y-auto flex-grow divide-y divide-pink-100">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-8 h-8 rounded-full border-b-2 animate-spin border-pink-700"></div>
          </div>
        ) : machines.length === 0 ? (
          <div className="p-8 italic text-center text-gray-400">
            Nessuna macchina trovata
          </div>
        ) : (
          machines.map((machine) => (
            <button
              key={machine.id}
              onClick={() => handleMachineSelect(machine)}
              className={`w-full p-4 min-h-[60px] text-left transition-colors cursor-pointer active:bg-pink-100/70 ${
                selectedMachine?.id === machine.id
                  ? 'bg-pink-50 border-l-4 border-pink-700'
                  : 'hover:bg-pink-50/50'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-900">{machine.name || 'Senza Nome'}</p>
                  <p className="mt-1 text-xs text-gray-500 line-clamp-1">{machine.lavorazioni || 'Nessuna lavorazione'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                  machine.status === 'in_progress' ? 'bg-green-100 text-green-700' :
                  machine.status === 'completed' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {machine.status === 'in_progress' ? 'Attiva' :
                    machine.status === 'completed' ? 'Completata' : 'Ferma'}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden h-full">
        {showDetail ? (
          <div className="flex flex-col h-full">
            <BackButton onClick={handleBackToList} />
            <div className="flex-1 min-h-0">
              {isAddingNew ? (
                <MachineCard isNew={true} onCancel={handleBackToList} onSuccess={handleCreated} />
              ) : selectedMachine ? (
                <MachineCard
                  machine={selectedMachine}
                  admin={true}
                  onSuccess={() => fetchMachines()}
                  onDelete={() => { setSelectedMachine(null); setShowDetail(false); }}
                />
              ) : null}
            </div>
          </div>
        ) : machineList}
      </div>

      {/* Desktop */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6 h-full">
        <div className="lg:col-span-1 h-[90vh]">
          {machineList}
        </div>
        <div className="lg:col-span-2 h-full">
          {isAddingNew ? (
            <MachineCard isNew={true} onCancel={() => setIsAddingNew(false)} onSuccess={handleCreated} />
          ) : selectedMachine ? (
            <MachineCard
              machine={selectedMachine}
              admin={true}
              onSuccess={() => fetchMachines()}
              onDelete={() => setSelectedMachine(null)}
            />
          ) : (
            <div className="p-12 text-center bg-white rounded-xl shadow-md border border-pink-200 flex flex-col items-center justify-center h-full">
              <div className="p-4 mb-4 rounded-full bg-pink-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1.2 1.2 0 01.12.12l5.414 5.414a1.2 1.2 0 01.12.12V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-900">Gestione Officina</p>
              <p className="text-sm text-gray-400 mt-1">Seleziona una macchina o aggiungine una nuova</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OfficinaView;
