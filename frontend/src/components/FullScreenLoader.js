import React from 'react';

const FullScreenLoader = ({ 
  isVisible, 
  message = "Analyzing your profile...", 
  subMessage = "Please wait while we process your request",
  currentStep = 1,
  totalSteps = 3 
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm"></div>
      
      {/* Loader Content */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-md w-full">
        <div className="text-center">
          {/* Main Spinner */}
          <div className="inline-block relative mb-6">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-2 w-12 h-12 border-2 border-blue-100 border-r-blue-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
          </div>
          
          {/* Progress indicator dots */}
          <div className="flex justify-center space-x-2 mb-6">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          
          {/* Text Content */}
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            {message}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {subMessage}
          </p>
          
          {/* Progress Steps */}
          <div className="mt-6 space-y-2">
            {/* Step 1: Processing */}
            <div className={`flex items-center text-sm ${currentStep >= 1 ? 'text-gray-600' : 'text-gray-400'}`}>
              {currentStep > 1 ? (
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : currentStep === 1 ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <div className="w-4 h-4 border-2 border-gray-300 rounded-full mr-2"></div>
              )}
              <span className={currentStep === 1 ? 'font-medium text-blue-600' : ''}>Processing resume content</span>
            </div>

            {/* Step 2: AI Analysis */}
            <div className={`flex items-center text-sm ${currentStep >= 2 ? 'text-gray-600' : 'text-gray-400'}`}>
              {currentStep > 2 ? (
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : currentStep === 2 ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <div className="w-4 h-4 border-2 border-gray-300 rounded-full mr-2"></div>
              )}
              <span className={currentStep === 2 ? 'font-medium text-blue-600' : ''}>AI skill extraction & analysis</span>
            </div>

            {/* Step 3: Final Processing */}
            <div className={`flex items-center text-sm ${currentStep >= 3 ? 'text-gray-600' : 'text-gray-400'}`}>
              {currentStep > 3 ? (
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : currentStep === 3 ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <div className="w-4 h-4 border-2 border-gray-300 rounded-full mr-2"></div>
              )}
              <span className={currentStep === 3 ? 'font-medium text-blue-600' : ''}>Generating compatibility report</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(100, (currentStep / totalSteps) * 100)}%` }}
              ></div>
            </div>
            <div className="text-center mt-2">
              <span className="text-xs text-gray-500">
                Step {Math.min(totalSteps, currentStep)} of {totalSteps}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullScreenLoader;