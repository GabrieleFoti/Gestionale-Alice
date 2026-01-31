import { useState } from 'react';
import toast from 'react-hot-toast';

const MachineDetail = ({ machine, onUpdate }) => {
  const [lavorazioni, setLavorazioni] = useState(machine.lavorazioni);
  const [note, setNote] = useState(machine.note);
  const [isActive, setIsActive] = useState(machine.isActive);

  const handleStartStop = () => {
    const newStatus = !isActive;
    setIsActive(newStatus);
    toast.success(newStatus ? 'Lavoro avviato' : 'Lavoro fermato');
    
    // Update parent component
    onUpdate({ ...machine, isActive: newStatus });
  };

  const handleFinish = () => {
    toast.success('Lavoro terminato');
    // In a real app, this would update the machine status to completed
  };

  const handleSave = () => {
    toast.success('Modifiche salvate');
    onUpdate({ ...machine, lavorazioni, note });
  };

  return (
    <div className="sticky top-6 p-6 bg-white rounded-lg shadow-lg">
      {/* Machine Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-gray-800">{machine.name}</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isActive ? 'text-green-700 bg-green-100' : 'text-gray-600 bg-gray-100'
          }`}>
            {isActive ? 'In Lavorazione' : 'Fermo'}
          </span>
        </div>
      </div>

      {/* Lavorazioni */}
      <div className="mb-4">
        <label className="block mb-2 text-sm font-semibold text-gray-700">
          Lavorazioni:
        </label>
        <textarea
          value={lavorazioni}
          onChange={(e) => setLavorazioni(e.target.value)}
          className="px-3 py-2 w-full rounded-lg border border-gray-300 outline-none resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="3"
          placeholder="Inserisci lavorazioni..."
        />
      </div>

      {/* Note */}
      <div className="mb-4">
        <label className="block mb-2 text-sm font-semibold text-gray-700">
          Note:
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="px-3 py-2 w-full rounded-lg border border-gray-300 outline-none resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="3"
          placeholder="Inserisci note..."
        />
      </div>

      {/* Partial Hours */}
      {machine.partialHours && (
        <div className="p-3 mb-6 bg-blue-50 rounded-lg">
          <p className="text-sm font-semibold text-gray-700">Ore parziali:</p>
          <p className="text-lg font-bold text-blue-600">{machine.partialHours}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleStartStop}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition ${
            isActive
              ? 'text-white bg-yellow-500 hover:bg-yellow-600'
              : 'text-white bg-green-500 hover:bg-green-600'
          }`}
        >
          {isActive ? 'Stop' : 'Avvia'}
        </button>

        <button
          onClick={handleSave}
          className="px-4 py-3 w-full font-semibold text-white bg-blue-600 rounded-lg transition hover:bg-blue-700"
        >
          Salva Modifiche
        </button>

        <button
          onClick={handleFinish}
          className="px-4 py-3 w-full font-semibold text-white bg-gray-600 rounded-lg transition hover:bg-gray-700"
        >
          Termina Lavoro
        </button>
      </div>
    </div>
  );
};

export default MachineDetail;
