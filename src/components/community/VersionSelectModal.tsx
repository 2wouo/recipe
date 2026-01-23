'use client';

import { Recipe, RecipeVersion } from '@/types';
import { X, ChevronRight, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface VersionSelectModalProps {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (version: RecipeVersion) => void;
}

export default function VersionSelectModal({ recipe, isOpen, onClose, onSelect }: VersionSelectModalProps) {
  if (!isOpen) return null;

  // Sort versions: newest first
  const sortedVersions = [...recipe.versions].reverse();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">공유할 버전 선택</h2>
          <button onClick={onClose}><X size={24} className="text-zinc-500 hover:text-white" /></button>
        </div>
        
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {sortedVersions.map((v, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(v)}
              className="w-full flex items-center justify-between p-4 rounded-md border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 hover:border-blue-500/50 transition-all group text-left"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white text-lg">v{v.version}</span>
                  {v.version === recipe.currentVersion && (
                    <span className="text-[10px] bg-blue-600/20 text-blue-400 px-1.5 py-0.5 rounded-full font-medium">대표</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                   <Clock size={12} />
                   {format(new Date(v.createdAt), 'yyyy.MM.dd HH:mm')}
                </div>
                {v.notes && <p className="text-xs text-zinc-400 mt-2 line-clamp-1 border-l-2 border-zinc-700 pl-2">{v.notes}</p>}
              </div>
              <ChevronRight size={18} className="text-zinc-600 group-hover:text-blue-500 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
