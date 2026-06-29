import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useGetCarSessions } from '../hooks/useSessions';
import { useCreateCar, useUpdateCar, useDeleteCar, useCompleteCar, useRestoreCar } from '../hooks/useCars';

const MachineCard = ({ machine = {}, admin, operator, isNew = false, onCancel, onDelete, onSuccess }) => {
  const [model, setModel] = useState(machine.model || '');
  const [plate, setPlate] = useState(machine.plate || '');
  const [lavorazioni, setLavorazioni] = useState(machine.lavorazioni || '');
  const [note, setNote] = useState(machine.note || '');
  const [photo, setPhoto] = useState(machine.photo || false);
  const [assicurazione, setAssicurazione] = useState(machine.assicurazione || false);
  const [sessions, setSessions] = useState([]);

  const { execute: fetchSessions } = useGetCarSessions({ onSuccess: (data) => setSessions(data) });
  const { execute: createCar, loading: isCreating } = useCreateCar({ onSuccess: () => { if (onSuccess) onSuccess(); } });
  const { execute: updateCar, loading: isUpdating } = useUpdateCar({ onSuccess: () => { if (onSuccess) onSuccess(); } });
  const { execute: deleteCar, loading: isDeleting } = useDeleteCar({ onSuccess: () => { if (onDelete) onDelete(); if (onSuccess) onSuccess(); } });
  const { execute: completeCar, loading: isCompleting } = useCompleteCar({ onSuccess: () => { if (onSuccess) onSuccess(); } });
  const { execute: restoreCar, loading: isRestoring } = useRestoreCar({ onSuccess: () => { if (onSuccess) onSuccess(); } });

  const isSaving = isCreating || isUpdating || isDeleting || isCompleting || isRestoring;

  useEffect(() => {
    setModel(machine.model || '');
    setPlate(machine.plate || '');
    setLavorazioni(machine.lavorazioni || '');
    setNote(machine.note || '');
    setPhoto(machine.photo || false);
    setAssicurazione(machine.assicurazione || false);
  }, [machine.id]);

  useEffect(() => {
    if (!isNew && machine.id) fetchSessions(machine.id);
  }, [machine.id, isNew]);

  const formatDuration = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const totalMinutes = machine?.totalMinutes ?? sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

  const inputClass = "px-3 py-3 w-full text-sm rounded-lg border outline-none bg-pink-50 border-pink-200 text-gray-900 focus:ring-2 focus:ring-pink-700 focus:border-transparent placeholder-gray-400";
  const readonlyClass = "px-3 py-2.5 text-sm rounded-lg border text-gray-600 bg-pink-50 border-pink-100";
  const labelClass = "block mb-1 text-xs font-bold text-pink-700 uppercase tracking-wide";

  return (
    <div className="overflow-y-auto p-6 h-full rounded-xl border shadow-md bg-white border-pink-200">
      {/* Header */}
      <div className="flex justify-between items-start pb-4 mb-6 border-b border-pink-100">
        <div>
          {isNew ? (
            <h2 className="text-xl font-bold tracking-tight uppercase text-gray-900">Nuova Macchina</h2>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900">{machine.name}</h2>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                machine.status === 'in_progress' ? 'bg-green-100 text-green-700' :
                'bg-pink-100 text-pink-700'
              }`}>
                {machine.status === 'in_progress' ? 'In Lavorazione' : 'Completato'}
              </span>
            </>
          )}
        </div>
        {isNew && (
          <button onClick={onCancel} className="p-2.5 -mr-2.5 text-gray-300 hover:text-pink-600 active:bg-pink-50 rounded-lg transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {(isNew || admin) && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Modello:</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value.toUpperCase())}
                className={inputClass}
                placeholder="es. Huracan"
              />
            </div>
            <div>
              <label className={labelClass}>Targa:</label>
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                className={inputClass}
                placeholder="es. AA123BB"
              />
            </div>
          </div>
        )}

        <div>
          <label className={labelClass}>Lavorazioni:</label>
          {admin || isNew ? (
            <textarea
              value={lavorazioni}
              onChange={(e) => setLavorazioni(e.target.value)}
              className={inputClass}
              rows="3"
              placeholder="es. Verniciatura, lucidatura..."
            />
          ) : (
            <p className={readonlyClass}>{lavorazioni || 'Nessuna lavorazione'}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            {admin || isNew ? (
              <label className="flex gap-3 items-center min-h-[44px] cursor-pointer">
                <span className="text-xs font-bold text-pink-700 uppercase tracking-wide">Foto:</span>
                <input
                  type="checkbox"
                  checked={photo}
                  onChange={(e) => setPhoto(e.target.checked)}
                  className="w-5 h-5 accent-pink-700 cursor-pointer"
                />
              </label>
            ) : (
              <div className="flex gap-3 items-center">
                <span className="text-xs font-bold text-pink-700 uppercase tracking-wide">Foto:</span>
                <span className={`${readonlyClass} text-xs`}>{photo ? 'Sì' : 'No'}</span>
              </div>
            )}
          </div>
          <div>
            {admin || isNew ? (
              <label className="flex gap-3 items-center min-h-[44px] cursor-pointer">
                <span className="text-xs font-bold text-pink-700 uppercase tracking-wide">Assicurazione:</span>
                <input
                  type="checkbox"
                  checked={assicurazione}
                  onChange={(e) => setAssicurazione(e.target.checked)}
                  className="w-5 h-5 accent-pink-700 cursor-pointer"
                />
              </label>
            ) : (
              <div className="flex gap-3 items-center">
                <span className="text-xs font-bold text-pink-700 uppercase tracking-wide">Assicurazione:</span>
                <span className={`${readonlyClass} text-xs`}>{assicurazione ? 'Sì' : 'No'}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className={labelClass}>Note:</label>
          {operator ? (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={inputClass}
              rows="3"
            />
          ) : (
            <p className={readonlyClass}>{note || 'Nessuna nota'}</p>
          )}
        </div>

        {!isNew && (
          <div className="pt-4 border-t border-pink-100">
            <div className="flex justify-between items-center mb-4">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tempo Totale Lavorazione:</label>
              <span className="text-xl font-bold text-pink-700">{formatDuration(totalMinutes)}</span>
            </div>

            <div className="space-y-2">
              <label className={`${labelClass} mb-2`}>Dettaglio Lavoratori:</label>
              <div className="overflow-y-auto pr-2 space-y-2 max-h-40">
                {sessions.length === 0 ? (
                  <p className="text-xs italic text-gray-400">Nessuna sessione registrata</p>
                ) : (
                  sessions.map((session) => (
                    <div key={session.id} className="flex justify-between items-center p-2.5 rounded-lg border bg-pink-50 border-pink-100">
                      <div>
                        <p className="text-xs font-bold text-gray-900">{session.operatorName}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(session.startTime).toLocaleDateString()} {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-pink-700">
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
              className="flex-1 px-4 py-3 text-xs font-bold tracking-wider uppercase rounded-xl transition text-pink-700 bg-pink-50 hover:bg-pink-100 cursor-pointer"
            >
              Annulla
            </button>
          )}
          {admin && !isNew && (
            <button
              onClick={() => deleteCar(machine.id)}
              disabled={isSaving}
              className="p-3 text-red-600 bg-red-50 rounded-xl border border-red-100 shadow-sm transition hover:bg-red-100 disabled:opacity-50 cursor-pointer"
              title="Elimina Macchina"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <button
            onClick={async () => {
              if (isNew && (!model || !plate)) return toast.error('Modello e Targa sono obbligatori');
              const carData = { model, plate, lavorazioni, note, photo, assicurazione };
              if (isNew) await createCar(carData);
              else await updateCar(machine.id, carData);
            }}
            disabled={isSaving}
            className="px-4 py-3 flex-[2] font-bold text-white bg-pink-700 rounded-xl transition hover:bg-pink-800 disabled:opacity-50 uppercase text-xs tracking-wider shadow-md cursor-pointer"
          >
            {isSaving ? 'Salvataggio...' : isNew ? 'Crea Macchina' : 'Salva Modifiche'}
          </button>
          {!isNew && machine.status !== 'completed' && (
            <button
              onClick={() => completeCar(machine.id)}
              disabled={isSaving}
              className="p-3 text-green-600 bg-green-50 rounded-xl border border-green-100 shadow-sm transition hover:bg-green-100 disabled:opacity-50 cursor-pointer"
              title="Segna come Completata"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
          {!isNew && machine.status === 'completed' && (
            <button
              onClick={() => restoreCar(machine.id)}
              disabled={isSaving}
              className="p-3 text-orange-600 bg-orange-50 rounded-xl border border-orange-100 shadow-sm transition hover:bg-orange-100 disabled:opacity-50 cursor-pointer"
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
