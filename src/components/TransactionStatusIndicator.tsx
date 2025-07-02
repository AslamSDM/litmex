import React from "react";
import { CheckCircle, AlertCircle, Circle, Loader2 } from "lucide-react";
import { TransactionStep } from "./hooks/useTransactionStatus";

interface TransactionStatusIndicatorProps {
  steps: TransactionStep[];
  className?: string;
}

const TransactionStatusIndicator: React.FC<TransactionStatusIndicatorProps> = ({
  steps,
  className = "",
}) => {
  return (
    <div className={`mt-4 ${className}`}>
      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.id} className="flex items-start">
            <div className="mr-3 mt-0.5">
              {step.status === "pending" && (
                <Circle className="h-5 w-5 text-white/50" />
              )}
              {step.status === "loading" && (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              )}
              {step.status === "success" && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {step.status === "error" && (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="flex flex-col">
              <span
                className={`text-sm font-medium ${
                  step.status === "pending"
                    ? "text-white/50"
                    : step.status === "loading"
                      ? "text-primary"
                      : step.status === "success"
                        ? "text-green-500"
                        : "text-red-500"
                }`}
              >
                {step.title}
              </span>
              <span
                className={`text-xs ${
                  step.status === "error" ? "text-red-400" : "text-white/60"
                }`}
              >
                {step.status === "error" && step.errorMessage
                  ? step.errorMessage
                  : step.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionStatusIndicator;
