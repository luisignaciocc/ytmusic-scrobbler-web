import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SetupStep {
  title: string;
  description: string;
  /** Shown under the step that is the user's next one. */
  action?: React.ReactNode;
}

/** The four steps of getting set up, with the user's position marked. */
export default function SetupSteps({
  steps,
  current,
}: {
  steps: SetupStep[];
  /** 1-based index of the step the user has to do next. */
  current: number;
}) {
  return (
    <ol className="space-y-1">
      {steps.map((step, index) => {
        const number = index + 1;
        const done = number < current;
        const active = number === current;
        const last = number === steps.length;
        return (
          <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
            {!last && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-4 top-9 -ml-px h-[calc(100%-2.25rem)] w-0.5",
                  done ? "bg-success" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                done && "bg-success text-background",
                active && "bg-primary text-primary-foreground",
                !done && !active && "bg-muted text-muted-foreground",
              )}
            >
              {done ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                number
              )}
              <span className="sr-only">
                {done ? " (done)" : active ? " (your next step)" : ""}
              </span>
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3
                className={cn(
                  "font-semibold",
                  !done && !active && "text-muted-foreground",
                )}
              >
                {step.title}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {step.description}
              </p>
              {active && step.action && (
                <div className="mt-3">{step.action}</div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
