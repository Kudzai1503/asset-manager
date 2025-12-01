import React from "react";

type ButtonVariant = "primary" | "secondary" | "toggle" | "toggle-active";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-stone-900 text-white hover:bg-stone-800 focus:ring-stone-700",
  secondary:
    "bg-white text-stone-800 border-2 border-stone-300 hover:bg-stone-50 hover:border-stone-400 focus:ring-stone-700",
  toggle:
    "text-stone-600 hover:text-stone-800 focus:ring-amber-400",
  "toggle-active":
    "bg-white text-stone-800 shadow-sm focus:ring-amber-400",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "py-2 px-3 text-sm",
  md: "py-2.5 px-4 text-sm",
  lg: "py-3 px-4 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const isToggle = variant === "toggle" || variant === "toggle-active";
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const borderRadius = isToggle ? "rounded-md" : "rounded-lg";
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const widthStyle = fullWidth ? "w-full" : "";

  const combinedClassName = `${baseStyles} ${borderRadius} ${variantStyle} ${sizeStyle} ${widthStyle} ${className}`.trim();

  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  );
}

