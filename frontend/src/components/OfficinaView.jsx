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

const OfficinaView = () => {
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [machines, setMachines] = useState([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const { execute: fetchMachines, loading: isLoading } = useGetCars({
    filter: (m) => m.status !== 'completed',
    onSuccess: (data) => {
      setMachines(data);
      if (selectedMachine) {
        const updatedSelected = data.find(m => m.id === selectedMachine.id);
        if (updatedSelected) {
          setSelectedMachine(updatedSelected);
        } else {
          setSelectedMachine(null);
          setShowDetail(false);
        }
      }
    }
  });

  useEffect(() => {
    fetchMachines();
  }, []);

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
    <div className="bg-brand-bg rounded-lg shadow-lg border border-brand-text-700 flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-brand-text-700">
        <h2 className="text-lg font-semibold text-brand-text">Macchine</h2>
        <button
          onClick={handleAddNew}
          className="flex items-center px-3 py-2 text-xs font-bold tracking-wider text-white uppercase rounded-lg transition-all bg-brand-text-700 hover:bg-brand-text-900 hover:opacity-90"
        >
          <span className="mr-1">+</span> Nuova
        </button>
      </div>
      <div className="overflow-y-auto flex-grow divide-y divide-brand-text-700">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-8 h-8 rounded-full border-b-2 animate-spin border-brand-text"></div>
          </div>
        ) : machines.length === 0 ? (
          <div className="p-8 italic text-center opacity-60 text-brand-text">
            Nessuna macchina trovata
          </div>
        ) : (
          machines.map((machine) => (
            <button
              key={machine.id}
              onClick={() => handleMachineSelect(machine)}
              className={`w-full p-4 text-left transition hover:bg-brand-text-500 ${
                selectedMachine?.id === machine.id ? 'bg-brand-text/10 border-l-4 border-brand-text' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-brand-text">{machine.name || 'Senza Nome'}</p>
                  <p className="mt-1 text-xs text-brand-text/70 line-clamp-1">{machine.lavorazioni || 'Nessuna lavorazione'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                  machine.status === 'in_progress' ? 'bg-green-100 text-green-700' :
                  machine.status === 'completed' ? 'bg-brand-text/20 text-brand-text' : 'bg-brand-text/5 text-brand-text/60'
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
      {/* Mobile: un pannello alla volta */}
      <div className="lg:hidden h-full">
        {showDetail ? (
          <div className="flex flex-col h-full">
            <BackButton onClick={handleBackToList} />
            <div className="flex-1 min-h-0">
              {isAddingNew ? (
                <MachineCard
                  isNew={true}
                  onCancel={handleBackToList}
                  onSuccess={handleCreated}
                />
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
        ) : (
          machineList
        )}
      </div>

      {/* Desktop: side-by-side */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6 h-full">
        <div className="lg:col-span-1 h-[90vh]">
          {machineList}
        </div>
        <div className="lg:col-span-2 h-full">
          {isAddingNew ? (
            <MachineCard
              isNew={true}
              onCancel={() => setIsAddingNew(false)}
              onSuccess={handleCreated}
            />
          ) : selectedMachine ? (
            <MachineCard
              machine={selectedMachine}
              admin={true}
              onSuccess={() => fetchMachines()}
              onDelete={() => setSelectedMachine(null)}
            />
          ) : (
            <div className="p-12 text-center text-brand-text bg-brand-bg rounded-lg shadow-lg border border-brand-text-700 flex flex-col items-center justify-center h-full">
              <div className="p-4 mb-4 rounded-full bg-brand-text/5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-brand-text/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1.2 1.2 0 01.12.12l5.414 5.414a1.2 1.2 0 01.12.12V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-brand-text">Gestione Officina</p>
              <p className="text-sm opacity-70">Seleziona una macchina o aggiungine una nuova</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OfficinaView;
