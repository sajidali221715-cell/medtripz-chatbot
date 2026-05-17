"use client";

import React from 'react';
import Link from 'next/link';

export type HealthcareCardData = {
  type: 'doctor' | 'hospital' | 'lab' | 'service';
  name: string;
  speciality?: string;
  hospital?: string;
  city: string;
  experience?: string;
  slug: string;
  profileUrl: string;
  appointmentUrl: string;
};

interface HealthcareCardProps {
  card: HealthcareCardData;
}

const HealthcareCard: React.FC<HealthcareCardProps> = ({ card }) => {
  const isArabic = /[\u0600-\u06FF]/.test(card.name);

  return (
    <div 
      dir={isArabic ? 'rtl' : 'ltr'}
      className="
        w-full max-w-[280px] 
        bg-white dark:bg-slate-800 
        border border-gray-100 dark:border-slate-700 
        rounded-xl shadow-md hover:shadow-lg 
        transition-all duration-300 transform hover:-translate-y-1 
        overflow-hidden flex flex-col
        animate-in fade-in zoom-in-95 duration-500
      "
    >
      {/* Icon/Header Section */}
      <div className="p-4 bg-gradient-to-br from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 border-b border-gray-50 dark:border-slate-700">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-bold text-gray-800 dark:text-white text-base leading-tight">
              {card.type === 'doctor' ? '👨‍⚕️' : card.type === 'hospital' ? '🏥' : '🧪'} {card.name}
            </h4>
            {card.speciality && (
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1 uppercase tracking-wide">
                {card.speciality}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        {card.hospital && (
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
            <span className="opacity-70">🏥</span>
            <span>{card.hospital} • {card.city}</span>
          </div>
        )}
        {!card.hospital && card.city && (
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
            <span className="opacity-70">📍</span>
            <span>{card.city}</span>
          </div>
        )}
        
        {card.experience && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            <span className="text-sm">⭐</span>
            <span>{card.experience} Experience</span>
          </div>
        )}
      </div>

      {/* Actions Section */}
      <div className="p-3 bg-gray-50 dark:bg-slate-900/50 flex flex-col gap-2">
        <Link 
          href={card.profileUrl}
          className="
            w-full py-2 text-center text-xs font-semibold 
            bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 
            text-gray-700 dark:text-slate-300 rounded-lg 
            hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors
          "
        >
          View Full Profile
        </Link>
        <Link 
          href={card.appointmentUrl}
          className="
            w-full py-2 text-center text-xs font-bold 
            bg-blue-600 text-white rounded-lg 
            hover:bg-blue-700 shadow-sm transition-colors
          "
        >
          Book Appointment
        </Link>
      </div>
    </div>
  );
};

export default HealthcareCard;
