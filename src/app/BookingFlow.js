"use client";
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { format, addDays, startOfToday } from 'date-fns';

export default function BookingFlow() {
  const [step, setStep] = useState(0); 
  const [selectedDate, setSelectedDate] = useState(startOfToday());

  const questions = [
    { id: 'goal', q: "Identify Your Objective", opts: ["Fat Loss", "Muscle Gain", "Hybrid Power"] },
    { id: 'experience', q: "Current Combat Level", opts: ["Beginner", "Intermediate", "Advanced"] },
    { id: 'schedule', q: "Commitment Level", opts: ["3 Days/Week", "5 Days/Week", "Daily"] }
  ];

  const days = Array.from({ length: 7 }).map((_, i) => addDays(startOfToday(), i));

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0a]">
      <div className="w-full max-w-4xl bg-neutral-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-md relative overflow-hidden">
        
        {/* Neon Progress Accent */}
        <div className="absolute top-0 left-0 h-[2px] bg-red-600 shadow-[0_0_10px_#dc2626] transition-all duration-500" 
             style={{ width: `${(step + 1) * 25}%` }} />

        {step < 3 ? (
          <div className="py-12 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 mb-4 text-red-500 font-mono text-xs tracking-[0.3em]">
              <Zap size={14} /> PROTOCOL 0{step + 1}
            </div>
            <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-10">{questions[step].q}</h2>
            <div className="grid gap-4 max-w-sm">
              {questions[step].opts.map(opt => (
                <button 
                  key={opt}
                  onClick={() => setStep(step + 1)}
                  className="group relative p-5 border border-white/10 bg-white/5 hover:border-red-600 transition-all text-left overflow-hidden"
                >
                  <div className="absolute inset-0 bg-red-600/0 group-hover:bg-red-600/5 transition-colors" />
                  <span className="relative font-bold uppercase tracking-widest text-sm">{opt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-12 border-b border-white/5 pb-6">
              <h2 className="text-2xl font-black italic tracking-tighter">SUSHANTH P</h2>
              <span className="text-[10px] bg-white/5 px-3 py-1 rounded text-neutral-400 font-mono tracking-tighter">IST (+05:30)</span>
            </div>

            <div className="text-center">
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.5em] mb-10">Select Deployment Date</p>
              <div className="flex justify-center gap-4">
                {days.map((day) => {
                  const isSelected = format(day, 'd') === format(selectedDate, 'd');
                  return (
                    <button
                      key={day.toString()}
                      onClick={() => setSelectedDate(day)}
                      className={`flex flex-col items-center justify-center w-20 h-20 rounded-full border-2 transition-all duration-300
                        ${isSelected ? 'border-red-600 bg-red-600 shadow-[0_0_25px_rgba(220,38,38,0.6)] scale-110' : 'border-white/10 hover:border-white/30'}`}
                    >
                      <span className="text-[9px] font-bold uppercase opacity-50">{format(day, 'MMM')}</span>
                      <span className="text-2xl font-black leading-none my-1">{format(day, 'd')}</span>
                      <span className="text-[9px] font-bold uppercase opacity-50">{format(day, 'EEE')}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button className="w-full mt-16 py-5 bg-red-600 text-white font-black uppercase tracking-[0.3em] hover:bg-red-700 hover:shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-all">
              Initialize Training
            </button>
          </div>
        )}
      </div>
    </div>
  );
}