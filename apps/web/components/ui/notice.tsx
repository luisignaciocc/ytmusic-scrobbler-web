import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

const styles = {
  success: { box: "bg-success-soft border-success/30", icon: "text-success", Icon: CheckCircle2 },
  warning: { box: "bg-warning-soft border-warning/30", icon: "text-warning", Icon: AlertTriangle },
  error: { box: "bg-danger-soft border-destructive/30", icon: "text-destructive", Icon: XCircle },
  info: { box: "bg-muted border-border", icon: "text-muted-foreground", Icon: Info },
} as const;

/** An inline message: the result of an action, or a state worth noticing. */
export default function Notice({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof styles;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { box, icon, Icon } = styles[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-lg border p-4 text-sm", box, className)}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", icon)} aria-hidden="true" />
      <div className="min-w-0 space-y-1">
        {title && <p className="font-semibold text-foreground">{title}</p>}
        {children && <div className="text-foreground/80">{children}</div>}
      </div>
    </div>
  );
}
