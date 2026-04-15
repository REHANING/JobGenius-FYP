import React, { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  name, 
  size = 'md', 
  className = '' 
}) => {
  const [imageError, setImageError] = useState(false);
  const sizeClass = sizeClasses[size];
  const initials = name?.charAt(0).toUpperCase() || 'U';
  
  // If src is a relative path, prepend the backend URL
  // Server serves from 'uploads' directory, so paths like '/profile-pictures/file.jpg' are correct
  const imageSrc = src 
    ? (src.startsWith('http') 
        ? src 
        : src.startsWith('/') 
          ? `http://localhost:5000${src}`
          : `http://localhost:5000/${src}`)
    : null;

  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${className}`}>
      {imageSrc && !imageError ? (
        <img
          src={imageSrc}
          alt={name || 'User'}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <span className="text-white font-semibold">{initials}</span>
        </div>
      )}
    </div>
  );
};

export default Avatar;

