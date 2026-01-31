import { useState, useEffect } from 'react';
import MachineCard from './MachineCard';
import toast from 'react-hot-toast';
import { fetchWithAuth } from '../utils/api';

const OfficinaView = () => {
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [machines, setMachines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const fetchMachines = async () => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth('http://localhost:5000/api/cars');
      if (!response.ok) throw new Error('Errore nel caricamento delle macchine');
      const data = await response.json();
      const filtered = data.filter(m => m.status !== 'completed');
      setMachines(filtered);
      if (selectedMachine && !filtered.find(m => m.id === selectedMachine.id)) {
        setSelectedMachine(null);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const handleAddNew = () => {
    setIsAddingNew(true);
    setSelectedMachine(null);
  };

  const handleCreated = () => {
    setIsAddingNew(false);
    setSelectedMachine(null);
    fetchMachines();
  };

  const handleUpdated = (updatedMachine) => {
    setMachines(prev => prev.map(m => m.id === updatedMachine.id ? updatedMachine : m));
    setSelectedMachine(updatedMachine);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left Side - Machine List */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow flex flex-col h-[70vh]">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Macchine</h2>
            <button
              onClick={handleAddNew}
              className="flex items-center px-3 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
            >
              <span className="mr-1">+</span> Nuova
            </button>
          </div>
          
          <div className="overflow-y-auto flex-grow divide-y divide-gray-200">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="w-8 h-8 rounded-full border-b-2 border-blue-600 animate-spin"></div>
              </div>
            ) : machines.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Nessuna macchina trovata
              </div>
            ) : (
              machines.map((machine) => (
                <button
                  key={machine.id}
                  onClick={() => {
                    setSelectedMachine(machine);
                    setIsAddingNew(false);
                  }}
                  className={`w-full p-4 text-left transition hover:bg-gray-50 ${
                    selectedMachine?.id === machine.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800">{machine.name || 'Senza Nome'}</p>
                      <p className="mt-1 text-xs text-gray-600 line-clamp-1">{machine.lavorazioni || 'Nessuna lavorazione'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      machine.status === 'in_progress' ? 'bg-green-100 text-green-700' : 
                      machine.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
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
      </div>

      {/* Right Side - Machine Detail */}
      <div className="lg:col-span-2">
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
          <div className="p-12 text-center text-gray-500 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center h-[70vh]">
            <div className="p-4 mb-4 bg-gray-50 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1.2 1.2 0 01.12.12l5.414 5.414a1.2 1.2 0 01.12.12V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-600">Gestione Officina</p>
            <p className="text-sm">Seleziona una macchina o aggiungine una nuova</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficinaView;

