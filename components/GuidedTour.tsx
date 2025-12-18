import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft, Map } from 'lucide-react';
import { TourStep } from '../types';
import { useUIStore } from '../store/useUIStore';

interface GuidedTourProps {
  steps: TourStep[];
}

const GuidedTour: React.FC<GuidedTourProps> = ({ steps }) => {
  const { isTourOpen: isOpen, setTourOpen: setOpen } = useUIStore();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen && currentStep) {
      const timer = setTimeout(() => {
        const element = document.getElementById(currentStep.targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
          setTargetRect(element.getBoundingClientRect());
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentStepIndex, isOpen, windowSize, currentStep]);

  if (!isOpen || !targetRect) return null;

  const onClose = () => setOpen(false);
  const handleNext = () => currentStepIndex < steps.length - 1 ? setCurrentStepIndex(prev => prev + 1) : onClose();
  const handlePrev = () => currentStepIndex > 0 && setCurrentStepIndex(prev => prev - 1);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9990] pointer-events-none">
        <svg width="100%" height="100%">
          <defs><mask id="tour-mask"><rect x="0" y="0" width="100%" height="100%" fill="white" /><rect x={targetRect.left - 4} y={targetRect.top - 4} width={targetRect.width + 8} height={targetRect.height + 8} rx="8" fill="black" /></mask></defs>
          <rect x="0" y="0" width="100%" height="100%" fill="rgba(15, 23, 42, 0.75)" mask="url(#tour-mask)" />
        </svg>
      </div>
      <div className="fixed z-[9991] pointer-events-none border-2 border-blue-500 rounded-lg animate-pulse" style={{ top: targetRect.top - 4, left: targetRect.left - 4, width: targetRect.width + 8, height: targetRect.height + 8 }} />
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 border w-80 fixed z-[10000]" style={{ top: targetRect.bottom + 12 > window.innerHeight - 200 ? targetRect.top - 220 : targetRect.bottom + 12, left: Math.max(10, Math.min(window.innerWidth - 330, targetRect.left)) }}>
        <div className="flex justify-between items-start mb-4"><span className="text-xs font-bold text-slate-400">Passo {currentStepIndex + 1} / {steps.length}</span><button onClick={onClose}><X className="w-4 h-4" /></button></div>
        <h3 className="text-lg font-bold mb-2">{currentStep.title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">{currentStep.content}</p>
        <div className="flex justify-between items-center"><button onClick={handlePrev} disabled={currentStepIndex === 0}><ChevronLeft /></button><button onClick={handleNext} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">{currentStepIndex === steps.length - 1 ? 'Concluir' : 'Próximo'}</button></div>
      </div>
    </>,
    document.body
  );
};

export default GuidedTour;