import React, { useState } from 'react';
import toast from 'react-hot-toast';
import SelectedMachineView from './SelectedMachineView';

const OperatorColumn = ({ operator, machines }) => {
  const [selectedMachine, setSelectedMachine] = useState(null);

  const handleMachineSelect = (machine) => {
    setSelectedMachine(machine);
  };

  const handleBack = () => {
    setSelectedMachine(null);
  };

  if (selectedMachine) {
    return (
      <SelectedMachineView
        selectedMachine={selectedMachine}
        handleBack={handleBack}
        operatorName={operator.name}
      />
    );
  }

  return (
    <div className="flex overflow-hidden flex-col h-full bg-white rounded-xl border border-gray-200 shadow-md">
      {/* Operator Name Header */}
      <div className="px-2 py-3 text-xs font-bold tracking-widest text-center text-white uppercase bg-gray-800">
        {operator.name}
      </div>

      {/* Machine Grid */}
      <div className="grid flex-grow grid-cols-2 gap-3 content-start p-4 min-h-[80vh]">
        {machines.map((machine, index) => {
          return (
            <button
              key={index}
              onClick={() => machine && handleMachineSelect(machine)}
              disabled={!machine}
              className={`
                aspect-square rounded-2xl border-2 font-bold text-lg transition flex items-center justify-center
                ${machine 
                  ? 'text-gray-800 bg-white border-gray-800 shadow-sm hover:bg-gray-800 hover:text-white' 
                  : 'text-gray-200 bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed'
                }
              `}
            >
              {machine.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OperatorColumn;
