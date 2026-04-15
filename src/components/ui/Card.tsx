import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'small';
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = false,
  onClick,
  variant = 'default'
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        ${variant === 'small' ? 'glass-card-sm' : 'glass-card'}
        ${hover ? 'cursor-pointer hover:scale-[1.02]' : ''}
        transition-all duration-300 ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
