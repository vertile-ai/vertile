import { PlusCircle } from '@phosphor-icons/react';
import React, { useRef, useState } from 'react';

export const AnimatedDropdown = ({
  color = 'black',
  children,
}: {
  color?: string;
  children: any;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const iconRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative inline-block w-full h-full`}>
      <div ref={iconRef} className="flex items-center cursor-pointer">
        <PlusCircle
          color={color}
          weight="fill"
          onClick={toggleDropdown}
          className={`transition-transform duration-300 w-full h-full`}
          style={{ transform: isOpen ? 'rotate(225deg)' : '' }}
        />
      </div>

      <div
        className={`absolute left-0 mt-1 origin-top-right shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transition-all duration-200 ease-in-out ${
          isOpen
            ? 'transform opacity-100 scale-100'
            : 'transform opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {children}
      </div>
    </div>
  );
};
