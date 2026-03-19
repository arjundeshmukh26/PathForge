import React from 'react';

/**
 * AI Processing Indicator
 * A lightweight loading indicator specifically for AI operations
 */
const AIProcessingIndicator = ({ 
  isVisible, 
  message = "AI is thinking...", 
  compact = false,
  className = "" 
}) => {
  if (!isVisible) return null;

  if (compact) {
    return (
      <div className={`inline-flex items-center space-x-2 ${className}`}>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
        </div>
        <span className="text-sm text-blue-600 font-medium">{message}</span>
      </div>
    );
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-3">
        {/* AI Brain Icon with Animation */}
        <div className="relative">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full animate-ping"></div>
        </div>

        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-blue-900 font-medium">{message}</span>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
          <p className="text-blue-700 text-sm mt-1">This may take a few moments...</p>
        </div>

        {/* Processing Animation */}
        <div className="relative">
          <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
};

export default AIProcessingIndicator;