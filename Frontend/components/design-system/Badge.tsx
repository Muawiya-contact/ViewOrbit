import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-semibold capitalize",
  {
    variants: {
      variant: {
        success: "bg-success/15 text-success",
        warning: "bg-warning/15 text-warning",
        pending: "bg-pending/15 text-pending",
        danger: "bg-danger/15 text-danger",
      },
    },
    defaultVariants: {
      variant: "pending",
    },
  },
);

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
