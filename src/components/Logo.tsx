import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', showText = true, variant = 'dark', size = 'md' }: LogoProps) {
  const sizes = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src="https://i.ibb.co/xqRgbkwx/sign-ai-logo-final-site.png" 
        alt="Sign AI Logo" 
        className={`${sizes[size]} w-auto object-contain`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
