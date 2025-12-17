import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft, Map } from 'lucide-react';
import { TourStep } from '../types';

interface GuidedTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  onNavigate?: (moduleId: string) => void;
}

const GuidedTour: React.FC<GuidedTourProps> = ({ steps, isOpen, onClose, onComplete, onNavigate }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const currentStep = steps[currentStepIndex];

  // Monitor resize to recalculate positions
  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update target position when step changes
  useEffect(() => {
    if (isOpen && currentStep) {
      // Small timeout to allow UI to render/navigate before searching element
      const timer = setTimeout(() => {
        const element = document.getElementById(currentStep.targetId);

        // Auto-navigate functionality
        if (!element && currentStep.targetId.startsWith('nav-')) {
          // Attempt to navigate if the element isn't visible? 
          // In this logic, we assume the navigation bar is always visible.
        }

        if (element) {
          // Force scroll to center to prevent cutoff
          element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });

          const rect = element.getBoundingClientRect();
          setTargetRect(rect);
        } else {
          // If element not found, warn
          console.warn(`Tour target ${currentStep.targetId} not found`);
        }
      }, 300); // 300ms delay

      return () => clearTimeout(timer);
    }
  }, [currentStepIndex, isOpen, windowSize, currentStep]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // Skip step if target not found (fallback)
  if (!targetRect) {
    return null;
  }

  // Calculate Popover Position with Bounds Checking
  const getPopoverStyle = () => {
    const gap = 12;
    const popoverWidth = 320;
    const popoverHeight = 200; // Approx height for calculation

    let top = 0;
    let left = 0;

    // Preferred Position
    if (currentStep.position === 'right') {
      left = targetRect.right + gap;
      top = targetRect.top;
    } else if (currentStep.position === 'left') {
      left = targetRect.left - popoverWidth - gap;
      top = targetRect.top;
    } else if (currentStep.position === 'bottom') {
      left = targetRect.left;
      top = targetRect.bottom + gap;
    } else { // top
      left = targetRect.left;
      top = targetRect.top - popoverHeight - gap;
    }

    // Boundary Checks & Adjustments

    // Check Right Edge
    if (left + popoverWidth > window.innerWidth) {
      // Try flipping to left
      if (targetRect.left - popoverWidth - gap > 0) {
        left = targetRect.left - popoverWidth - gap;
      } else {
        // Align to right edge
        left = window.innerWidth - popoverWidth - 10;
      }
    }

    // Check Left Edge
    if (left < 0) {
      left = 10;
    }

    // Check Bottom Edge
    if (top + popoverHeight > window.innerHeight) {
      // Try flipping to top
      if (targetRect.top - popoverHeight - gap > 0) {
        top = targetRect.top - popoverHeight - gap;
      } else {
        // Stick to bottom edge
        top = window.innerHeight - popoverHeight - 10;
      }
    }

    // Check Top Edge
    if (top < 0) {
      top = 10;
    }

    return { top, left, position: 'fixed' as const, zIndex: 10000 };
  };

  const popoverStyle = getPopoverStyle();

  return createPortal(
    <>
      {/* Dimmed Overlay with a cutout using SVG mask */}
      <div className="fixed inset-0 z-[9990] pointer-events-none">
        <svg width="100%" height="100%">
          <defs>
            <mask id="tour-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {/* The Hole */}
              <rect
                x={targetRect.left - 4}
                y={targetRect.top - 4}
                width={targetRect.width + 8}
                height={targetRect.height + 8}
                rx="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(15, 23, 42, 0.75)"
            mask="url(#tour-mask)"
          />
        </svg>
      </div>

      {/* Target Highlight Border (Visual only) */}
      <div
        className="fixed z-[9991] pointer-events-none border-2 border-blue-500 rounded-lg animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.5)]"
        style={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
        }}
      />

      {/* Popover Card */}
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-700 w-80 animate-in zoom-in-95 duration-200"
        style={popoverStyle}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg text-blue-600 dark:text-blue-400">
              <Map className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Passo {currentStepIndex + 1} de {steps.length}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{currentStep.title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          {currentStep.content}
        </p>

        <div className="flex justify-between items-center">
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex gap-1">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-colors ${idx === currentStepIndex ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-blue-600/20 transition-all active:scale-95"
          >
            {currentStepIndex === steps.length - 1 ? 'Concluir' : 'Próximo'}
            {currentStepIndex !== steps.length - 1 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};

export default GuidedTour;