import React, { useState } from 'react';

const Badge = ({ text, variant = 'neutral' }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getVariantClasses = (variant) => {
    const variants = {
      neutral: {
        base: 'bg-gray-100 text-gray-800 border border-gray-200',
        hover: 'hover:bg-gray-200 hover:shadow-sm hover:scale-105',
        icon: '🔸'
      },
      success: {
        base: 'bg-green-50 text-green-800 border border-green-200',
        hover: 'hover:bg-green-100 hover:shadow-sm hover:scale-105',
        icon: '✅'
      },
      warning: {
        base: 'bg-amber-50 text-amber-800 border border-amber-200',
        hover: 'hover:bg-amber-100 hover:shadow-sm hover:scale-105',
        icon: '🎯'
      },
      info: {
        base: 'bg-blue-50 text-blue-800 border border-blue-200',
        hover: 'hover:bg-blue-100 hover:shadow-sm hover:scale-105',
        icon: '📘'
      }
    };
    
    return variants[variant] || variants.neutral;
  };

  const variantStyle = getVariantClasses(variant);

  return (
    <span 
      className={`
        inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium
        ${variantStyle.base}
        ${variantStyle.hover}
        transition-all duration-200 cursor-pointer relative group
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Skill Icon */}
      <span className="mr-2 opacity-70 group-hover:opacity-100 transition-opacity">
        {variantStyle.icon}
      </span>
      
      {/* Skill Text */}
      <span className="font-semibold">
        {text}
      </span>

      {/* Hover Effect Indicator */}
      {isHovered && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-gray-900 rounded-full animate-pulse"></div>
      )}
    </span>
  );
};

export default Badge;