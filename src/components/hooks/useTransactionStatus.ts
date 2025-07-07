import { useState } from "react";

export type TransactionStep = {
  id: string;
  title: string;
  description: string;
  status: "pending" | "loading" | "success" | "error";
  errorMessage?: string;
};

export type TransactionStatus = {
  steps: TransactionStep[];
  currentStepId: string | null;
  isComplete: boolean;
  isError: boolean;
};

/**
 * Custom hook for managing transaction status steps and providing feedback to users
 */
export function useTransactionStatus(initialSteps: TransactionStep[]) {
  const [status, setStatus] = useState<TransactionStatus>({
    steps: initialSteps,
    currentStepId: initialSteps.length > 0 ? initialSteps[0].id : null,
    isComplete: false,
    isError: false,
  });

  // Update a specific step's status
  const updateStep = (stepId: string, update: Partial<TransactionStep>) => {
    setStatus((prevStatus) => {
      const stepIndex = prevStatus.steps.findIndex(
        (step) => step.id === stepId
      );

      if (stepIndex === -1) return prevStatus;

      const updatedSteps = [...prevStatus.steps];
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        ...update,
      };

      // Check if any steps have error status
      const hasError = updatedSteps.some((step) => step.status === "error");

      return {
        ...prevStatus,
        steps: updatedSteps,
        isError: hasError,
      };
    });
  };

  // Set a step as the current active step
  const setCurrentStep = (stepId: string) => {
    setStatus((prevStatus) => ({
      ...prevStatus,
      currentStepId: stepId,
    }));

    // Automatically set the step to loading state
    updateStep(stepId, { status: "loading" });
  };

  // Move to the next step in the sequence
  const nextStep = () => {
    setStatus((prevStatus) => {
      const currentIndex = prevStatus.steps.findIndex(
        (step) => step.id === prevStatus.currentStepId
      );

      if (currentIndex === -1 || currentIndex === prevStatus.steps.length - 1) {
        return {
          ...prevStatus,
          isComplete: true,
        };
      }

      const nextStepId = prevStatus.steps[currentIndex + 1].id;

      // Mark current step as success and next as loading
      const updatedSteps = [...prevStatus.steps];
      updatedSteps[currentIndex] = {
        ...updatedSteps[currentIndex],
        status: "success",
      };
      updatedSteps[currentIndex + 1] = {
        ...updatedSteps[currentIndex + 1],
        status: "loading",
      };

      return {
        ...prevStatus,
        currentStepId: nextStepId,
        steps: updatedSteps,
      };
    });
  };

  // Complete the transaction process
  const completeTransaction = () => {
    setStatus((prevStatus) => {
      // Mark current step as success if there is one
      const updatedSteps = [...prevStatus.steps];
      const currentIndex = prevStatus.steps.findIndex(
        (step) => step.id === prevStatus.currentStepId
      );

      if (currentIndex !== -1) {
        updatedSteps[currentIndex] = {
          ...updatedSteps[currentIndex],
          status: "success",
        };
      }

      return {
        ...prevStatus,
        steps: updatedSteps,
        isComplete: true,
      };
    });
  };

  // Handle transaction error
  const setError = (stepId: string, errorMessage?: string) => {
    updateStep(stepId, {
      status: "error",
      errorMessage: errorMessage || "An error occurred during this step",
    });

    setStatus((prevStatus) => ({
      ...prevStatus,
      isError: true,
    }));
  };

  // Clear all errors in the transaction
  const clearErrors = () => {
    setStatus((prevStatus) => {
      const updatedSteps = prevStatus.steps.map((step) =>
        step.status === "error"
          ? { ...step, status: "success" as const, errorMessage: undefined }
          : step
      );

      return {
        ...prevStatus,
        steps: updatedSteps,
        isError: false,
      };
    });
  };

  // Reset the transaction status
  const resetStatus = () => {
    setStatus({
      steps: initialSteps.map((step) => ({ ...step, status: "pending" })),
      currentStepId: initialSteps.length > 0 ? initialSteps[0].id : null,
      isComplete: false,
      isError: false,
    });
  };

  // Get the current active step
  const currentStep =
    status.steps.find((step) => step.id === status.currentStepId) || null;

  return {
    status,
    updateStep,
    setCurrentStep,
    nextStep,
    clearErrors,
    currentStep: status.currentStepId ? currentStep : null,
    completeTransaction,
    setError,
    resetStatus,
  };
}
