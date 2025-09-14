import React from 'react';

const Avatar = ({ 
  src, 
  alt, 
  pseudo, 
  size = 'md', 
  className = '' 
}) => {
  // Tailles définies
  const sizes = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-sm', 
    lg: 'h-16 w-16 text-lg',
    xl: 'h-20 w-20 text-xl'
  };

  const sizeClass = sizes[size] || sizes.md;

  // Fonction pour obtenir les initiales
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  // En cas d'erreur de chargement d'image
  const handleImageError = (e) => {
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
  };

  return (
    <div className={`relative ${className}`}>
      {src ? (
        <>
          <img
            src={src}
            alt={alt || pseudo}
            className={`${sizeClass} rounded-full object-cover border border-gray-300`}
            onError={handleImageError}
          />
          {/* Fallback en cas d'erreur */}
          <div 
            className={`${sizeClass} rounded-full bg-blue-500 flex items-center justify-center text-white font-medium hidden`}
          >
            {getInitials(pseudo)}
          </div>
        </>
      ) : (
        <div 
          className={`${sizeClass} rounded-full bg-blue-500 flex items-center justify-center text-white font-medium`}
        >
          {getInitials(pseudo)}
        </div>
      )}
    </div>
  );
};

export default Avatar;