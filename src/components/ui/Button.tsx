import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  rounded?: "default" | "sm" | "lg" | "full";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      rounded = "default",
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    );

    const variantClasses = {
      default: "btn-primary",
      secondary: "btn-secondary",
      outline: "btn-outline",
      ghost: "btn-ghost",
      destructive:
        "bg-gradient-to-b from-destructive to-destructive/90 text-destructive-foreground hover:from-destructive/90 hover:to-destructive hover:scale-[1.02] shadow-lg hover:shadow-xl",
    };

    const sizeClasses = {
      default: "h-10 px-6 py-2",
      sm: "h-8 px-4 text-xs",
      lg: "h-12 px-8 py-3",
      icon: "h-10 w-10",
    };

    const roundedClasses = {
      default: "", // Usar el radio definido en las clases CSS (var(--radius))
      sm: "rounded-[16px]",
      lg: "rounded-[24px]",
      full: "rounded-full",
    };

    return (
      <button
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          roundedClasses[rounded],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
