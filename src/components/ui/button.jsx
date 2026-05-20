import React from 'react';
import { cn } from '../../lib/utils';

export const Button = React.forwardRef(({ className, variant = 'default', ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50",
        variant === 'default' && "bg-slate-900 text-slate-50 hover:bg-slate-900/90",
        variant === 'outline' && "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900",
        className
      )}
      {...props}
    />
  );
});
Button.displayName = "Button";
