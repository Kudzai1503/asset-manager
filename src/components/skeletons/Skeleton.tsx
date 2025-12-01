import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export default function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const baseStyles = "bg-stone-200 rounded";
  
  const variantStyles = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const animationClass = animate
    ? "animate-pulse"
    : "";

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${animationClass} ${className}`.trim()}
      style={style}
    />
  );
}

