"use client";

import { useEffect, useRef, useState } from "react";
import {
  createOnboardingDriver,
  hasCompletedOnboarding,
  resetOnboarding,
  markOnboardingCompleted,
} from "@/lib/onboarding/tour";
import type { Driver } from "driver.js";

export function useOnboarding(autoStart = false) {
  const [driverInstance, setDriverInstance] = useState<Driver | null>(null);
  const [isCompleted, setIsCompleted] = useState(true);
  // Avoid double-start in strict mode
  const started = useRef(false);

  useEffect(() => {
    const completed = hasCompletedOnboarding();
    setIsCompleted(completed);

    const d = createOnboardingDriver();
    setDriverInstance(d);

    // Auto-start for first-time users
    if (!completed && autoStart && !started.current) {
      started.current = true;
      // Delay so sidebar elements are mounted in the DOM
      const timer = setTimeout(() => d.drive(), 800);
      return () => {
        clearTimeout(timer);
        d.destroy();
      };
    }

    return () => {
      d.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTour = () => {
    if (driverInstance) driverInstance.drive();
  };

  const resetTour = () => {
    resetOnboarding();
    setIsCompleted(false);
    if (driverInstance) driverInstance.drive();
  };

  const completeTour = () => {
    markOnboardingCompleted();
    setIsCompleted(true);
    if (driverInstance) driverInstance.destroy();
  };

  return {
    driver: driverInstance,
    isCompleted,
    startTour,
    resetTour,
    completeTour,
    skipTour: completeTour,
  };
}
