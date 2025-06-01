import React, { useEffect, useRef, useState } from 'react';
import { CaretDown, CaretUp } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Dropdown {
  options: readonly string[];
  placeholder: string;
  label?: string;
  disabled?: boolean;
  onSelect: (selected: string) => void;
}

const Dropdown = ({
  options,
  placeholder,
  label,
  disabled,
  onSelect,
}: Dropdown) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<string>('');

  const dropdownRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const dropdownHeight = dropdownRef.current!.clientHeight;
    const inputRect =
      dropdownRef.current!.parentElement!.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const spaceBelow = windowHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;

    if (spaceBelow < dropdownHeight && spaceAbove >= dropdownHeight) {
      setIsOpen(false); // Close the dropdown if there's not enough space below
    }
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option: string) => {
    onSelect(option);
    setSelectedItem(option);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col items-start">
      {!!label && (
        <div
          className={`mr-2 font-semibold flex items-center justify-center h-full`}
        >
          {label}
        </div>
      )}
      <div
        className={`relative h-10 mt-1 w-full ${!disabled && 'cursor-pointer'} text-main-menu font-semibold`}
        onClick={toggleDropdown}
        ref={dropdownRef}
      >
        <input
          className="bg-white border focus:outline-none h-10 rounded-lg shadow cursor-pointer px-3 w-full"
          placeholder={placeholder}
          value={selectedItem}
          readOnly={true}
          disabled={!!disabled}
        />
        <div className="absolute right-1 top-0 flex items-center justify-center h-full">
          {isOpen ? (
            <CaretUp size={24} color="#b2c6dc" weight="bold" />
          ) : (
            <CaretDown size={24} color="#b2c6dc" weight="bold" />
          )}
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.ul
              initial={{ opacity: 0, maxHeight: 0 }}
              animate={{ opacity: 1, maxHeight: 200 }}
              exit={{ opacity: 0, maxHeight: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute z-50 left-0 w-full bg-white text-main-menu font-semibold border rounded shadow overflow-hidden"
              style={{ top: '100%' }}
            >
              {options.length === 0 ? (
                <motion.li className="px-4 py-2 text-gray-400 cursor-not-allowed">
                  No item available
                </motion.li>
              ) : (
                options.map((item) => (
                  <motion.li
                    key={item as string}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-200"
                    onClick={() => handleOptionClick(item)}
                  >
                    {item as string}
                  </motion.li>
                ))
              )}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dropdown;
