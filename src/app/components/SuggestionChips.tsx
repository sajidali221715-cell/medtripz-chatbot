"use client";

import React from 'react';

interface SuggestionChipsProps {
  suggestions?: string[];
  onSuggestionClick: (suggestion: string) => void;
  loading?: boolean;
}

const SuggestionChips: React.FC<SuggestionChipsProps> = ({ 
  suggestions = [], 
  onSuggestionClick,
  loading = false 
}) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2 mt-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSuggestionClick(suggestion)}
          disabled={loading}
          className="
            px-4 py-1.5 
            text-xs font-medium 
            bg-white border border-gray-200 
            text-gray-700 
            rounded-full 
            shadow-sm 
            hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 
            hover:scale-105 active:scale-95 
            transition-all duration-200 
            whitespace-nowrap
            disabled:opacity-50 disabled:cursor-not-allowed
            dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-blue-400
          "
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};

export default SuggestionChips;
