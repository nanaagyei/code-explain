import { useState, useEffect } from 'react';
import { XMarkIcon, ArrowRightIcon, ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector for the target element
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to CodeXplain!',
    description: 'Let\'s take a quick tour to help you get started with AI-powered code documentation.',
    target: 'body',
    position: 'bottom',
  },
  {
    id: 'upload',
    title: 'Upload Your Code',
    description: 'Click here to upload code files or connect a GitHub repository. We support Python, JavaScript, TypeScript, Go, Rust, Java, and C/C++.',
    target: '[data-tour="upload-button"]',
    position: 'bottom',
  },
  {
    id: 'repositories',
    title: 'Your Repositories',
    description: 'All your analyzed repositories appear here. Click any repository to explore its documentation.',
    target: '[data-tour="repositories-list"]',
    position: 'top',
  },
  {
    id: 'chat',
    title: 'AI Assistant',
    description: 'Have questions? Use the AI chat to ask anything about your code or get help understanding complex patterns.',
    target: '[data-tour="chat-button"]',
    position: 'left',
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
  isOpen: boolean;
}

export default function OnboardingTour({ onComplete, isOpen }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const step = TOUR_STEPS[currentStep];
    const targetEl = document.querySelector(step.target);
    
    if (targetEl && step.target !== 'body') {
      const rect = targetEl.getBoundingClientRect();
      setTargetRect(rect);
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setTargetRect(null);
    }
  }, [currentStep, isOpen]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  // Calculate tooltip position
  const getTooltipStyle = () => {
    if (!targetRect || step.target === 'body') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 16;
    const tooltipWidth = 320;
    const tooltipHeight = 180;

    switch (step.position) {
      case 'bottom':
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
        };
      case 'top':
        return {
          top: `${targetRect.top - tooltipHeight - padding}px`,
          left: `${Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
        };
      case 'left':
        return {
          top: `${targetRect.top + targetRect.height / 2 - tooltipHeight / 2}px`,
          left: `${targetRect.left - tooltipWidth - padding}px`,
        };
      case 'right':
        return {
          top: `${targetRect.top + targetRect.height / 2 - tooltipHeight / 2}px`,
          left: `${targetRect.right + padding}px`,
        };
      default:
        return {};
    }
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 transition-opacity duration-300" />

      {/* Spotlight on target */}
      {targetRect && step.target !== 'body' && (
        <div
          className="absolute bg-transparent rounded-lg ring-4 ring-blue-500 ring-offset-4 ring-offset-transparent transition-all duration-300"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute bg-white rounded-2xl shadow-2xl p-6 w-80 animate-fade-in"
        style={getTooltipStyle()}
      >
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-1">
            {TOUR_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentStep ? 'bg-blue-600' : idx < currentStep ? 'bg-blue-300' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">{step.description}</p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 transition"
          >
            Skip tour
          </button>
          <div className="flex space-x-2">
            {!isFirstStep && (
              <button
                onClick={handlePrev}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition flex items-center space-x-1"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition flex items-center space-x-1"
            >
              {isLastStep ? (
                <>
                  <CheckIcon className="w-4 h-4" />
                  <span>Get Started</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
