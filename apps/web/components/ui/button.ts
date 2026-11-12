import { cva, type VariantProps } from "class-variance-authority";

/**
 * Class names for anything that should look like a button (a <button>, a
 * link, an <a>). Sizes keep a comfortable touch target on phones.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        dark: "bg-foreground text-background shadow-sm hover:bg-foreground/85",
        outline:
          "border border-input bg-background text-foreground hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        danger:
          "border border-destructive/40 bg-background text-destructive hover:bg-danger-soft",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-5",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
