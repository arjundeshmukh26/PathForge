import React from 'react';

const Header = ({ onNewAnalysis, showNewButton }) => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Skill-Bridge Career Navigator
            </h1>
          </div>
          
          {showNewButton && (
            <button
              onClick={onNewAnalysis}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              New Analysis
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;