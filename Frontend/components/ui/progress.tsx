import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
}

const widthClasses = [
  "w-0",
  "w-[5%]",
  "w-[10%]",
  "w-[15%]",
  "w-[20%]",
  "w-[25%]",
  "w-[30%]",
  "w-[35%]",
  "w-[40%]",
  "w-[45%]",
  "w-1/2",
  "w-[55%]",
  "w-[60%]",
  "w-[65%]",
  "w-[70%]",
  "w-3/4",
  "w-[80%]",
  "w-[85%]",
  "w-[90%]",
  "w-[95%]",
  "w-full",
] as const;

export function Progress({ value, className }: ProgressProps) {
  const width = Math.max(0, Math.min(100, value));
  const nearestStep = Math.round(width / 5);
  const progressWidthClass = widthClasses[nearestStep];

  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-200", className)}>
      <div className={cn("h-full rounded-full bg-slate-900 transition-all", progressWidthClass)} />
    </div>
  );
}
