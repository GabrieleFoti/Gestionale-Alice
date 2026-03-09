import { useState, useEffect } from "react";
import { useGetActiveSessions, useStartSession, useStopSession } from '../hooks/useSessions';
import { useUpdateCar, useCompleteCar } from '../hooks/useCars';

export default function SelectedMachineView({selectedMachine, handleBack, operatorName, hideHeader = false}) {

    const [note, setNote] = useState(selectedMachine.note);
    const [lavorazioni, setLavorazioni] = useState(selectedMachine.lavorazioni);
    const [isWorking, setIsWorking] = useState(false);
    const [noteError, setNoteError] = useState(false);

    // Hooks for API operations
    const { execute: checkActiveSessions } = useGetActiveSessions({
        onSuccess: (activeSessions) => {
            const mySession = activeSessions.find(s => s.operatorName === operatorName);
            if (mySession) {
                setIsWorking(true);
            }
        }
    });

    const { execute: startSession } = useStartSession({
        onSuccess: () => setIsWorking(true)
    });

    const { execute: stopSession } = useStopSession({
        onSuccess: () => setIsWorking(false)
    });

    const { execute: updateCar } = useUpdateCar();

    const { execute: completeCar } = useCompleteCar({
        onSuccess: () => handleBack()
    });

    useEffect(() => {
        checkActiveSessions(selectedMachine.id);
    }, [selectedMachine.id, operatorName]);

    const handleNoteChange = (e) => {
        setNote(e.target.value);
        if(e.target.value.length > 0){
            setNoteError(false);
        }
    };

    const handleWorkToggle = async () => {
        if (isWorking) {
            await stopSession(selectedMachine.id, operatorName);
        } else {
            await startSession(selectedMachine.id, operatorName);
        }
    };

    const handleSave = async () => {
        if(note.length === 0) return;
        
        await updateCar(selectedMachine.id, { note });
    };

    const handleComplete = async () => {
        // First, stop working if currently working
        if (isWorking) {
            await handleWorkToggle();
        }

        if(!note.length){
          setNoteError(true);
            return;
        }

        // Set machine status to completed
        await completeCar(selectedMachine.id);
    };


    const detailContent = (
        <div className="flex overflow-y-auto flex-col flex-grow justify-between p-4 space-y-4">
          <div className="flex flex-col space-y-2">
            <span className="pb-2 text-xl font-bold tracking-wider text-center uppercase border-b text-md text-brand-text border-brand-text-700">
              {selectedMachine.name}
            </span>
            <div>
              <label className="block mb-1 font-bold uppercase text-md text-brand-text/50">Lavorazioni:</label>
              <p className="text-md text-brand-text-700 p-2 rounded border border-brand-text-700 min-h-[60px]">
                {lavorazioni || "Nessuna lavorazione specificata"}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <label className="block font-bold uppercase text-md text-brand-text/50">Foto:</label>
              <p className="text-md text-brand-text">
                {selectedMachine.photo ? "✅" : "❌"}
              </p>
            </div>
            <div>
              <label className="block mb-1 font-bold uppercase text-md text-brand-text/50">
                Note:
              </label>
              <textarea
                className={`p-2 w-full text-sm text-brand-text bg-white/50 rounded border border-brand-text-700 outline-none resize-none focus:ring-1 focus:ring-brand-text ${noteError ? 'border-red-500' : ''}`}
                rows="4"
                value={note}
                onChange={handleNoteChange}
                placeholder="Inserisci note..."
                onBlur={handleSave}
              />
            </div>
          </div>
          <div className="mt-auto space-y-2">
            <button
              onClick={handleWorkToggle}
              className={`py-3 w-full text-sm font-bold rounded-lg border shadow-sm transition uppercase tracking-widest ${
                isWorking
                  ? 'text-white bg-red-600 border-red-700 hover:bg-red-700'
                  : 'text-brand-text-700 border-brand-text-700 hover:opacity-90'
              }`}
            >
              {isWorking ? 'Stop' : 'Avvia'}
            </button>
            <button
              onClick={handleComplete}
              className="py-3 w-full text-sm font-bold tracking-widest uppercase rounded-lg border shadow-sm transition text-brand-text-700 bg-brand-bg border-brand-text-700 hover:bg-brand-text-700/10"
            >
              Fine Lavori
            </button>
          </div>
        </div>
    );

    if (hideHeader) {
        return detailContent;
    }

    return (
        <div className="flex overflow-hidden flex-col h-full rounded-xl border shadow-md bg-brand-bg border-brand-text/20">
          {/* Detail Header */}
          <div className="flex items-center p-3 text-brand-bg bg-brand-text">
            <button onClick={handleBack} className="p-1 mr-2 rounded transition hover:opacity-80" disabled={isWorking}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="px-2 py-3 text-xs font-bold tracking-widest text-center uppercase text-brand-bg">
              {operatorName}
            </div>
          </div>
          {detailContent}
        </div>
    );
}