'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface AutocompleteProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export default function Autocomplete({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  className = '',
  autoFocus = false 
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!value) return options; // Show all if empty (or maybe limit?)
    return options.filter(option => 
      option.toLowerCase().includes(value.toLowerCase())
    );
  }, [options, value]);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % filteredOptions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="w-full rounded-sm border border-zinc-700 bg-black px-3 py-2 text-sm outline-none focus:border-blue-500 placeholder-zinc-600 transition-colors"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
        />
        {/* Optional: Indicator icon */}
        <div className="absolute right-2 top-2.5 text-zinc-600 pointer-events-none">
           {isOpen ? <ChevronDown size={14} className="rotate-180 transition-transform" /> : <ChevronDown size={14} className="transition-transform" />}
        </div>
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-50 mt-1.5 max-h-64 w-full overflow-auto rounded-sm border border-zinc-800 bg-zinc-950 py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] ring-1 ring-white/5 focus:outline-none animate-in fade-in slide-in-from-top-1 duration-200">
          {filteredOptions.map((option, index) => (
            <li
              key={`${option}-${index}`}
              className={`relative cursor-pointer select-none py-2.5 pl-4 pr-10 text-sm transition-all
                ${index === highlightedIndex ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'}`}
              onClick={() => handleSelect(option)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <span className={`block truncate ${index === highlightedIndex ? 'font-bold' : 'font-normal'}`}>{option}</span>
              {value === option && (
                <span className={`absolute inset-y-0 right-0 flex items-center pr-3 ${index === highlightedIndex ? 'text-white' : 'text-blue-500'}`}>
                  <Check size={16} strokeWidth={3} />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
