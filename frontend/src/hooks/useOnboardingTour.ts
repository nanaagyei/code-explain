import { useState, useEffect } from 'react';

const TOUR_KEY = 'codeexplain_onboarding_completed';

export function useOnboardingTour() {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem(TOUR_KEY);
    if (!hasCompletedTour) {
      const timer = setTimeout(() => setShowTour(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeTour = () => {
    localStorage.setItem(TOUR_KEY, 'true');
    setShowTour(false);
  };

  const resetTour = () => {
    localStorage.removeItem(TOUR_KEY);
    setShowTour(true);
  };

  return { showTour, completeTour, resetTour };
}
