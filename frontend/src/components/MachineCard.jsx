import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { fetchWithAuth } from '../utils/api';

const MachineCard = ({ machine = {}, admin, operator, isNew = false, onCancel, onDelete, onSuccess }) => {
  const [model, setModel] = useState(machine.model || '');
  const [plate, setPlate] = useState(machine.plate || '');
  const [lavorazioni, setLavorazioni] = useState(machine.lavorazioni || '');
  const [note, setNote] = useState(machine.note || '');
  const [photo, setPhoto] = useState(machine.photo || false);
  const [isSaving, setIsSaving] = useState(false);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    if (!isNew && machine.id) {
      const fetchSessions = async () => {
        try {
          const response = await fetchWithAuth(`http://localhost:5000/api/sessions/car/${machine.id}`);
          if (response.ok) {
            const data = await response.json();
            setSessions(data);
          }
        } catch (error) {
          console.error("Error fetching sessions:", error);
        }
      };
      fetchSessions();
    }
  }, [machine.id, isNew]);

  const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const formatDuration = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const handleDelete = async () => {
    if (!window.confirm('Sei sicuro di voler eliminare questa macchina?')) return;

    setIsSaving(true);
    try {
      const response = await fetchWithAuth(`http://localhost:5000/api/cars/${machine.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Errore durante l\'eliminazione');
      
      toast.success('Macchina eliminata');
      if (onDelete) onDelete();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      const response = await fetchWithAuth(`http://localhost:5000/api/cars/${machine.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'completed' })
      });

      if (!response.ok) throw new Error('Errore durante il completamento');
      
      toast.success('Macchina completata');
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = async () => {
    setIsSaving(true);
    try {
      const response = await fetchWithAuth(`http://localhost:5000/api/cars/${machine.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'in_progress' })
      });

      if (!response.ok) throw new Error('Errore durante il ripristino');
      
      toast.success('Macchina riportata in lavorazione');
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (isNew && (!model || !plate)) {
      return toast.error('Modello e Targa sono obbligatori');
    }

    setIsSaving(true);
    try {
      const url = isNew 
        ? 'http://localhost:5000/api/cars' 
        : `http://localhost:5000/api/cars/${machine.id}`;
      
      const method = isNew ? 'POST' : 'PUT';
      
      const response = await fetchWithAuth(url, {
        method,
        body: JSON.stringify({ model, plate, lavorazioni, note, photo })
      });

      if (!response.ok) throw new Error('Errore durante il salvataggio');
      
      toast.success(isNew ? 'Macchina creata' : 'Modifiche salvate');
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="overflow-y-auto p-6 h-full bg-white rounded-lg border border-gray-100 shadow-lg">
      {/* Machine Header */}
      <div className="flex justify-between items-start pb-4 mb-6 border-b border-gray-200">
        <div>
          {isNew ? (
            <h2 className="text-xl font-bold tracking-tight text-gray-800 uppercase">Nuova Macchina</h2>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-800">{machine.name}</h2>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                machine.status === 'in_progress' ? 'bg-green-100 text-green-700' : 
                machine.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {machine.status === 'in_progress' ? 'In Lavorazione' : 'Completato'}
              </span>
            </>
          )}
        </div>
        {isNew && (
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Basic Info (only for new or if admin wants to edit) */}
        {(isNew || admin) && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-[10px] font-bold text-gray-400 uppercase">Modello:</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="es. Huracan"
              />
            </div>
            <div>
              <label className="block mb-1 text-[10px] font-bold text-gray-400 uppercase">Targa:</label>
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                className="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="es. AA123BB"
              />
            </div>
          </div>
        )}

        {/* Lavorazioni */}
        <div>
          <label className="block mb-1 text-[10px] font-bold text-gray-400 uppercase">Lavorazioni:</label>
          {admin || isNew ? (
            <textarea
              value={lavorazioni}
              onChange={(e) => setLavorazioni(e.target.value)}
              className="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 outline-none resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="es. Verniciatura, lucidatura..."
            />
          ) : (
            <p className="px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg border border-gray-100">{lavorazioni || 'Nessuna lavorazione'}</p>
          )}
        </div>
        {/* Foto */}
        <div className='flex gap-4 justify-start items-center'>
          <label className="block text-[12px] font-bold text-gray-400 uppercase">Foto:</label>
          {admin || isNew ? (
            <input
              type="checkbox"
              checked={photo}
              onChange={(e) => setPhoto(e.target.checked)}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          ) : (
            <p className="px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg border border-gray-100">{photo ? 'Si' : 'No'}</p>
          )}
        </div>
        {/* Note */}
        <div>
          <label className="block mb-1 text-[10px] font-bold text-gray-400 uppercase">
            Note:
          </label>
          {operator ? (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="px-3 py-2 w-full text-sm rounded-lg border border-gray-300 outline-none resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
            />
          ) : (
            <p className="px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg border border-gray-100">{note || 'Nessuna nota'}</p>
          )}
        </div>

        {/* Total Time - Only if not new */}
        {!isNew && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Tempo Totale Lavorazione:</label>
              <span className="text-xl font-bold text-blue-600">{formatDuration(totalMinutes)}</span>
            </div>
            
            {/* Session History */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Dettaglio Lavoratori:</label>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                {sessions.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Nessuna sessione registrata</p>
                ) : (
                  sessions.map((session) => (
                    <div key={session.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <p className="text-xs font-bold text-gray-700">{session.operatorName}</p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(session.startTime).toLocaleDateString()} {new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-gray-600">
                        {session.durationMinutes ? formatDuration(session.durationMinutes) : 'In corso...'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {(admin || isNew || operator) && (
        <div className="flex gap-3 mt-8">
          {isNew && (
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 text-xs font-bold tracking-wider text-gray-600 uppercase bg-gray-100 rounded-xl transition hover:bg-gray-200"
            >
              Annulla
            </button>
          )}
          {admin && !isNew && (
            <button
              onClick={handleDelete}
              disabled={isSaving}
              className="p-3 text-red-600 bg-red-50 rounded-xl border border-red-100 shadow-sm transition hover:bg-red-100 disabled:opacity-50"
              title="Elimina Macchina"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-3 flex-[2] font-bold text-white bg-blue-600 rounded-xl transition hover:bg-blue-700 disabled:opacity-50 uppercase text-xs tracking-wider shadow-md shadow-blue-200"
          >
            {isSaving ? 'Salvataggio...' : isNew ? 'Crea Macchina' : 'Salva Modifiche'}
          </button>
          {!isNew && machine.status !== 'completed' && (
            <button
              onClick={handleComplete}
              disabled={isSaving}
              className="p-3 text-green-600 bg-green-50 rounded-xl border border-green-100 shadow-sm transition hover:bg-green-100 disabled:opacity-50"
              title="Segna come Completata"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
          {!isNew && machine.status === 'completed' && (
            <button
              onClick={handleRestore}
              disabled={isSaving}
              className="p-3 text-orange-600 bg-orange-50 rounded-xl border border-orange-100 shadow-sm transition hover:bg-orange-100 disabled:opacity-50"
              title="Riporta in Lavorazione"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MachineCard;

