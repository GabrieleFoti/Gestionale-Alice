import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { fetchWithAuth } from '../utils/api';

export default function SelectedMachineView({selectedMachine, handleBack, operatorName}) {

    const [note, setNote] = useState(selectedMachine.note);
    const [lavorazioni, setLavorazioni] = useState(selectedMachine.lavorazioni);
    const [isWorking, setIsWorking] = useState(false);
    const [noteError, setNoteError] = useState(false);

    useEffect(() => {
        const checkActiveSession = async () => {
            try {
                const response = await fetchWithAuth(`http://localhost:5000/api/sessions/active/${selectedMachine.id}`);
                if (response.ok) {
                    const activeSessions = await response.json();
                    const mySession = activeSessions.find(s => s.operatorName === operatorName);
                    if (mySession) {
                        setIsWorking(true);
                    }
                }
            } catch (error) {
                console.error("Error checking active session:", error);
            }
        };
        checkActiveSession();
    }, [selectedMachine.id, operatorName]);

    const handleNoteChange = (e) => {
        setNote(e.target.value);
        if(e.target.value.length > 0){
            setNoteError(false);
        }
    };

    const handleWorkToggle = async () => {
        const url = `http://localhost:5000/api/sessions/${isWorking ? 'stop' : 'start'}`;
        try {
            const response = await fetchWithAuth(url, {
                method: 'POST',
                body: JSON.stringify({ carId: selectedMachine.id, operatorName })
            });

            if (response.ok) {
                setIsWorking(!isWorking);
                toast.success(isWorking ? 'Lavoro fermato' : 'Lavoro avviato');
            } else {
                throw new Error('Errore nella comunicazione col server');
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleSave = async () => {
        if(note.length === 0){
            setNoteError(true);
            return;
        }
        
        try {
            const response = await fetchWithAuth(`http://localhost:5000/api/cars/${selectedMachine.id}`, {
                method: 'PUT',
                body: JSON.stringify({ note })
            });

            if (response.ok) {
                toast.success('Modifiche salvate');
            } else {
                throw new Error('Errore nel salvataggio');
            }
        } catch (error) {
            toast.error(error.message);
        }
    };


    return (
        <div className="flex overflow-hidden flex-col h-full bg-white rounded-xl border border-gray-200 shadow-md">
        {/* Detail Header */}
        <div className="flex items-center p-3 text-white bg-gray-800">
          <button onClick={handleBack} className="p-1 mr-2 rounded transition hover:bg-gray-700" disabled={isWorking}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <span className="text-xs font-bold tracking-wider uppercase line-clamp-1">
            {selectedMachine.name}
          </span>
        </div>

        {/* Detail Content */}
        <div className="flex flex-col flex-grow justify-between p-4 space-y-4 align-center">
          <div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Lavorazioni:</label>
            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-100 min-h-[60px]">
              {lavorazioni || "Nessuna lavorazione specificata"}
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
              Note:
            </label>
            <textarea 
              className={`p-2 w-full text-sm text-gray-700 bg-white rounded border border-gray-200 outline-none resize-none focus:ring-1 focus:ring-blue-500 ${noteError ? 'border-red-500' : ''}`}
              rows="4"
              value={note}
              onChange={handleNoteChange}
              placeholder="Inserisci note..."
            />
          </div>
          </div>
          <div className="mt-auto space-y-2">
            <button 
              onClick={handleWorkToggle}
              className={`py-3 w-full text-sm font-bold rounded-lg border shadow-sm transition ${
                isWorking 
                  ? 'text-white bg-red-600 border-red-700 hover:bg-red-700' 
                  : 'text-gray-800 bg-gray-100 border-gray-300 hover:bg-gray-200'
              }`}
            >
              {isWorking ? 'Fine' : 'Avvia'}
            </button>
            <button 
              onClick={async () => {
                if (isWorking) {
                  await handleWorkToggle();
                }
                await handleSave();
                handleBack();
              }}
              className="py-3 w-full text-sm font-bold text-gray-800 bg-white rounded-lg border border-gray-300 shadow-sm transition hover:bg-gray-50"
            >
              Esci
            </button>
          </div>
        </div>
      </div>
    )
}