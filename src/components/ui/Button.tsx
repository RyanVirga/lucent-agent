import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = '', 
    variant = 'primary', 
    size = 'md', 
    isLoading = false, 
    leftIcon, 
    rightIcon, 
    children, 
    disabled, 
    ...props 
  }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    
    // Using rounded-xl to match system default radius (0.75rem)
    const radius = "rounded-xl";
    
    const variants = {
      primary: "bg-accent text-white hover:bg-accent-dark focus:ring-accent shadow-lg shadow-accent/20 border border-transparent",
      secondary: "bg-white text-text-primary border border-border hover:bg-gray-50 focus:ring-gray-200",
      outline: "bg-transparent text-accent border border-accent hover:bg-accent/5 focus:ring-accent",
      ghost: "bg-transparent text-text-secondary hover:bg-gray-100 hover:text-text-primary focus:ring-gray-200",
      danger: "bg-danger text-white hover:bg-red-600 focus:ring-danger shadow-sm border border-transparent",
    };
    
    const sizes = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2 gap-2",
      lg: "text-base px-6 py-3 gap-2.5",
      icon: "p-2",
    };

    const combinedClassName = [
      baseStyles,
      radius,
      variants[variant],
      sizes[size],
      className
    ].filter(Boolean).join(" ");

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";

