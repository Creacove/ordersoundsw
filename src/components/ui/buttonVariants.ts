import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-transparent text-sm font-semibold tracking-[-0.02em] ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--accent))_100%)] text-primary-foreground shadow-[0_18px_36px_rgba(42,50,140,0.35)] hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(42,50,140,0.45)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_16px_30px_rgba(220,57,57,0.25)] hover:-translate-y-0.5 hover:bg-destructive/90",
        outline:
          "border-white/12 bg-white/[0.03] text-foreground hover:border-white/20 hover:bg-white/[0.06]",
        secondary:
          "border-white/8 bg-secondary/80 text-secondary-foreground hover:-translate-y-0.5 hover:bg-secondary/95",
        ghost: "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        accent:
          "bg-accent text-accent-foreground shadow-[0_18px_32px_rgba(154,59,220,0.28)] hover:-translate-y-0.5 hover:bg-accent/90",
        premium:
          "bg-[linear-gradient(135deg,#37207c_0%,#445bff_100%)] text-white shadow-[0_18px_36px_rgba(42,50,140,0.35)] hover:-translate-y-0.5 hover:brightness-110",
        success:
          "bg-[linear-gradient(135deg,#169b56_0%,#4ecf86_100%)] text-white shadow-[0_18px_32px_rgba(22,155,86,0.24)] hover:-translate-y-0.5",
        emerald: "bg-emerald-600 text-white hover:-translate-y-0.5 hover:bg-emerald-500 shadow-[0_16px_28px_rgba(16,185,129,0.24)]",
        purple: "bg-primary text-white hover:-translate-y-0.5 hover:bg-primary/90 shadow-[0_16px_28px_rgba(55,32,124,0.28)]",
        soft: "border-white/8 bg-primary/10 text-primary hover:bg-primary/18",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        xs: "h-8 rounded-lg px-2.5 text-xs",
        sm: "h-9 rounded-lg px-3.5 text-sm",
        lg: "h-12 rounded-2xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-base",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9",
      },
      rounded: {
        default: "rounded-xl",
        full: "rounded-full",
        lg: "rounded-2xl",
        none: "rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
    },
  }
);
