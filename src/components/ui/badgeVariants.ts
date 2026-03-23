import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-white/8 bg-secondary/80 text-secondary-foreground hover:bg-secondary/95",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "border-white/12 bg-white/[0.03] text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);
