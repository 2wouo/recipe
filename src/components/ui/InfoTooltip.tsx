'use client';

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
}

export default function InfoTooltip({ text }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center ml-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-zinc-500 hover:text-blue-500 transition-colors"
        aria-label="도움말"
      >
        <HelpCircle size={16} />
      </button>
      
      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-zinc-800 border border-zinc-700 rounded-md shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
          <p className="text-xs text-zinc-300 leading-relaxed font-normal text-left">
            {text}
          </p>
          {/* Arrow */}
          <div className="absolute left-2 -bottom-1 w-2 h-2 bg-zinc-800 border-b border-r border-zinc-700 rotate-45 transform"></div>
        </div>
      )}
    </div>
  );
}
