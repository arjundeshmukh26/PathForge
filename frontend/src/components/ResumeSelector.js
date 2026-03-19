import React, { useState, useEffect } from 'react';
import { getUniqueResumes } from '../utils/localStorage';

const ResumeSelector = ({ isOpen, onClose, onSelectResume, currentResumeText }) => {
  const [availableResumes, setAvailableResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset states when opening
      setSelectedResume('');
      setIsAnalyzing(false);
      
      // Get unique resumes from localStorage
      const uniqueResumes = getUniqueResumes();
      console.log('ResumeSelector: Found unique resumes:', uniqueResumes.length);
      
      const resumes = uniqueResumes.map(resume => ({
        id: resume.id,
        preview: resume.preview,
        fullText: resume.text,
        role: resume.role,
        level: resume.level,
        date: resume.timestamp,
        length: resume.length
      }));
      
      console.log('ResumeSelector: Processed resumes for selection:', resumes.length);
      setAvailableResumes(resumes);
      
      // Auto-select current resume if it matches one of the available resumes
      if (currentResumeText && currentResumeText.trim().length > 50) {
        const matchingResume = resumes.find(r => r.fullText.trim() === currentResumeText.trim());
        if (matchingResume) {
          setSelectedResume(matchingResume.id);
          console.log('ResumeSelector: Pre-selected matching current resume:', matchingResume.id);
        } else {
          console.log('ResumeSelector: Current resume text does not match any stored resumes');
        }
      }
    } else {
      // Reset states when closing
      setIsAnalyzing(false);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (selectedResume && onSelectResume) {
      setIsAnalyzing(true);
      const resume = availableResumes.find(r => r.id === selectedResume);
      
      // Show loading for a moment, then proceed
      setTimeout(() => {
        onSelectResume(resume.fullText);
        onClose();
        setIsAnalyzing(false);
      }, 600); // Brief delay to show loading state
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[80vh] w-full mx-4 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Resume for Analysis</h2>
          <p className="text-gray-600">
            Choose a resume from your previous analyses to use for the new role analysis.
          </p>
          {currentResumeText && currentResumeText.trim().length > 50 && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm font-medium">
                💡 A resume is currently loaded ({currentResumeText.length} characters). 
                The matching resume will be pre-selected below if available.
              </p>
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 relative">
          {/* Loading overlay when analyzing */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div className="text-center">
                <svg className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-blue-600 font-medium">Starting analysis...</p>
                <p className="text-blue-500 text-sm">Please wait a moment</p>
              </div>
            </div>
          )}
          {availableResumes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Resumes Found</h3>
              <p className="text-gray-500">
                No valid resumes found in your previous analyses. Please start a new analysis with a resume.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableResumes.map((resume) => (
                <div
                  key={resume.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    selectedResume === resume.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedResume(resume.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                        selectedResume === resume.id
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedResume === resume.id && (
                          <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-900">
                            Resume from {resume.role} ({resume.level})
                          </h4>
                          {currentResumeText && resume.fullText.trim() === currentResumeText.trim() && (
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                              Currently Loaded
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatDate(resume.date)} • {resume.length} characters
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3 ml-7">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {resume.preview}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
          <button
            onClick={onClose}
            disabled={isAnalyzing}
            className={`px-6 py-2 border rounded-lg transition-colors duration-200 ${
              isAnalyzing
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
          {availableResumes.length > 0 && (
            <button
              onClick={handleSubmit}
              disabled={!selectedResume || isAnalyzing}
              className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 ${
                isAnalyzing
                  ? 'bg-blue-600 text-white cursor-default'
                  : selectedResume
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Starting...</span>
                </>
              ) : (
                <span>Analyze Role</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeSelector;