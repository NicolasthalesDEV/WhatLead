"use client";

import { useEffect, useState } from "react";
import {
  createOnboardingDriver,
  hasCompletedOnboarding,
  resetOnboarding,
  markOnboardingCompleted,
} from "@/lib/onboarding/tour";
import type { Driver } from "driver.js";

export function useOnboarding() {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isCompleted, setIsCompleted] = useState(true);

  useEffect(() => {
    // Verificar se já completou
    const completed = hasCompletedOnboarding();
    setIsCompleted(completed);

    // Criar instância do driver
    const driverInstance = createOnboardingDriver();
    setDriver(driverInstance);

    return () => {
      // Cleanup: destruir driver ao desmontar
      if (driverInstance) {
        driverInstance.destroy();
      }
    };
  }, []);

  const startTour = () => {
    if (driver) {
      driver.drive();
    }
  };

  const resetTour = () => {
    resetOnboarding();
    setIsCompleted(false);
    if (driver) {
      driver.drive();
    }
  };

  const completeTour = () => {
    markOnboardingCompleted();
    setIsCompleted(true);
    if (driver) {
      driver.destroy();
    }
  };

  const skipTour = () => {
    completeTour();
  };

  return {
    driver,
    isCompleted,
    startTour,
    resetTour,
    completeTour,
    skipTour,
  };
}
