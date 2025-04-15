import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CaretUp, CaretDown, X } from '@phosphor-icons/react';

const BaseNode = ({ data, id, selected }: NodeProps) => {
  const { title, icon, inputs, outputs, content, onDelete } = data;
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div
      className={`relative rounded-lg border ${
        selected ? 'border-indigo-500 shadow-md' : 'border-gray-200'
      } bg-white text-gray-800 transition-all duration-200 ${
        isExpanded ? 'min-w-[240px]' : 'min-w-[180px]'
      }`}
    >
      <div
        className={`flex cursor-move items-center justify-between rounded-t-lg border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium`}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-indigo-500">{icon}</span>}
          <span className="truncate">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
          >
            {isExpanded ? (
              <CaretUp size={14} weight="bold" />
            ) : (
              <CaretDown size={14} weight="bold" />
            )}
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-red-500"
            >
              <X size={14} weight="bold" />
            </button>
          )}
        </div>
      </div>
      {isExpanded && content && (
        <div className="border-b border-gray-200 p-3 text-sm">{content}</div>
      )}
      
      {/* Input Handles - Left Side */}
      {inputs && inputs.length > 0 && (
        <div className="absolute left-0 top-0 h-full flex flex-col justify-center">
          {inputs.map((input, index) => {
            const yPosition = 50 + (index * 20);
            const percentPosition = Math.min(Math.max(yPosition / 100, 0.2), 0.8);
            
            return (
              <div 
                key={`input-${index}`} 
                className="relative"
                style={{ 
                  position: 'absolute', 
                  left: 0, 
                  top: `${percentPosition * 100}%`,
                  transform: 'translateY(-50%)'
                }}
              >
                <Handle
                  type="target"
                  position={Position.Left}
                  id={input.id}
                  className="h-3 w-3 rounded-full border-2 border-indigo-500 bg-white"
                  style={{ left: -7 }}
                />
                <span className="absolute left-4 text-xs text-gray-600 whitespace-nowrap">
                  {input.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Output Handles - Right Side */}
      {outputs && outputs.length > 0 && (
        <div className="absolute right-0 top-0 h-full flex flex-col justify-center">
          {outputs.map((output, index) => {
            const yPosition = 50 + (index * 20);
            const percentPosition = Math.min(Math.max(yPosition / 100, 0.2), 0.8);
            
            return (
              <div 
                key={`output-${index}`} 
                className="relative"
                style={{ 
                  position: 'absolute', 
                  right: 0, 
                  top: `${percentPosition * 100}%`,
                  transform: 'translateY(-50%)'
                }}
              >
                <span className="absolute right-4 text-xs text-gray-600 whitespace-nowrap">
                  {output.label}
                </span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={output.id}
                  className="h-3 w-3 rounded-full border-2 border-indigo-500 bg-white"
                  style={{ right: -7 }}
                />
              </div>
            );
          })}
        </div>
      )}
      
      {/* Content area with padding for handles */}
      <div className={`p-2 ${isExpanded ? 'block' : 'hidden'}`}>
        <div className="flex justify-between">
          <div className="w-16"></div> {/* Space for input labels */}
          <div className="flex-1 py-4"></div> {/* Content area */}
          <div className="w-16"></div> {/* Space for output labels */}
        </div>
      </div>
    </div>
  );
};

export default BaseNode; 