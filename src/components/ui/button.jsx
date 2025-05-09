import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../lib/utils';

export const Button = React.forwardRef(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary',
            'bg-muted text-foreground hover:bg-muted/90': variant === 'secondary',
            'hover:bg-muted': variant === 'ghost',
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4': size === 'md',
            'h-12 px-6 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

// Define prop types
Button.propTypes = {
  className: PropTypes.string, // className is optional and should be a string
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost']), // variant can be one of these values
  size: PropTypes.oneOf(['sm', 'md', 'lg']), // size can be one of these values
};

// Define default props (optional, since defaults are already set in the destructuring)
Button.defaultProps = {
  variant: 'primary',
  size: 'md',
};