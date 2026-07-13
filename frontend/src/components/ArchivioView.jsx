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

const ArchivioView = () => {
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [machines, setMachines] = useState([]);
  const [showDetail, setShowDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { execute: fetchMachines, loading: isLoading } = useGetCars({
    onSuccess: (data) => {
      const completed = data
        .filter(m => m.status === 'completed')
        .sort((a, b) => new Date(b.archivedAt || 0) - new Date(a.archivedAt || 0));
      setMachines(completed);
      if (selectedMachine && !completed.find(m => m.id === selectedMachine.id)) {
        setSelectedMachine(null);
        setShowDetail(false);
      }
    }
  });

  const filteredMachines = machines.filter((machine) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      machine.plate?.toLowerCase().includes(query) ||
      machine.model?.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  const handleMachineSelect = (machine) => {
    setSelectedMachine(machine);
    setShowDetail(true);
  };

  const handleBackToList = () => setShowDetail(false);

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
    <div className="bg-white rounded-xl shadow-md h-full flex flex-col border border-pink-200">
      <div className="p-4 border-b border-pink-200 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Macchine Completate</h2>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cerca per targa o modello..."
          className="w-full px-3 py-2 min-h-[44px] text-sm border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
        />
      </div>
      <div className="overflow-y-auto flex-grow divide-y divide-pink-100">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-8 h-8 rounded-full border-b-2 border-pink-700 animate-spin"></div>
          </div>
        ) : filteredMachines.length > 0 ? (
          filteredMachines.map((machine) => (
            <button
              key={machine.id}
              onClick={() => handleMachineSelect(machine)}
              className={`w-full p-4 min-h-[60px] text-left transition-colors cursor-pointer active:bg-pink-100/70 ${
                selectedMachine?.id === machine.id
                  ? 'bg-pink-50 border-l-4 border-pink-700'
                  : 'hover:bg-pink-50/50'
              }`}
            >
              <div>
                <p className="font-semibold text-gray-900">{machine.name}</p>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{machine.lavorazioni}</p>
                {machine.totalMinutes > 0 && (
                  <p className="mt-1 text-xs font-semibold text-pink-700">
                    Totale: {Math.floor(machine.totalMinutes / 60)}h {machine.totalMinutes % 60}m
                  </p>
                )}
              </div>
            </button>
          ))
        ) : (
          <div className="p-8 text-center text-gray-400">
            <p>{searchQuery ? 'Nessun risultato' : 'Nessuna macchina completata'}</p>
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
    <div className="p-12 text-center bg-white rounded-xl shadow-md h-full flex items-center justify-center border border-pink-200">
      <p className="text-gray-400">Seleziona una macchina per vedere i dettagli</p>
    </div>
  );

  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden h-full">
        {showDetail ? (
          <div className="flex flex-col h-full">
            <BackButton onClick={handleBackToList} />
            <div className="flex-1 min-h-0">{detailCard}</div>
          </div>
        ) : machineList}
      </div>

      {/* Desktop */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:grid-rows-1 gap-6 h-full">
        <div className="lg:col-span-1 h-full">{machineList}</div>
        <div className="lg:col-span-2 h-full">{detailCard}</div>
      </div>
    </>
  );
};

export default ArchivioView;
