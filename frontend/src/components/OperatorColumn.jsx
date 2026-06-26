import React, { useState } from 'react';
import SelectedMachineView from './SelectedMachineView';

const OperatorColumn = ({ operator, machines, activeMachineId, onSessionChange }) => {
  const [selectedMachine, setSelectedMachine] = useState(null);

  const handleMachineSelect = (machine) => {
    setSelectedMachine(machine);
  };

  const handleBack = () => {
    setSelectedMachine(null);
    if (onSessionChange) onSessionChange();
  };

  return (
    <div className="flex overflow-hidden flex-col w-full h-full rounded-xl border shadow-md bg-brand-bg border-brand-text-700">
      {/* Operator Name Header - always visible */}
      <div className="flex relative z-10 justify-center items-center px-2 py-3 h-16 font-bold tracking-widest text-center uppercase border-b shrink-0 bg-brand-bg-800 border-brand-text-700">
        {selectedMachine && (
          <button
            onClick={handleBack}
            className="absolute left-2 p-1 rounded transition hover:opacity-70 text-brand-text-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        )}
        <p className="text-brand-text-200">{operator.name}</p>
        {activeMachineId && !selectedMachine && (
          <span className="absolute right-2 w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" title="In lavorazione" />
        )}
      </div>

      {/* Content - machine grid or detail */}
      <div className="overflow-y-auto flex-1">
        {selectedMachine ? (
          <SelectedMachineView
            selectedMachine={selectedMachine}
            handleBack={handleBack}
            operatorName={operator.name}
            hideHeader={true}
            onSessionChange={onSessionChange}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 content-start p-4">
          {machines.map((machine, index) => {
            const isActive = machine && machine.id === activeMachineId;
            return (
              <button
                key={index}
                onClick={() => machine && handleMachineSelect(machine)}
                disabled={!machine}
                className={`
                  relative aspect-square rounded-2xl border-2 font-bold text-lg transition flex flex-col items-center justify-center text-center
                  ${!machine
                    ? 'opacity-50 cursor-not-allowed text-brand-text/20 bg-brand-text/5 border-brand-text-700/80'
                    : isActive
                    ? 'shadow-md text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border-green-500 ring-2 ring-green-400/50'
                    : 'shadow-sm text-brand-text-700 bg-brand-bg border-brand-text-700'
                  }
                `}
              >
                {isActive && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                )}
                <span>{machine.model}</span>
                <span>{machine.plate}</span>
                {isActive && (
                  <span className="mt-1 text-[9px] font-semibold tracking-widest uppercase text-green-600 dark:text-green-400">In corso</span>
                )}
              </button>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
};

export default OperatorColumn;
