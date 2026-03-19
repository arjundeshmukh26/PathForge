import React, { useState, useEffect } from 'react';
import ResumeSelector from './ResumeSelector';
import AIProcessingIndicator from './AIProcessingIndicator';
import { API_ENDPOINTS, fetchWithFallback } from '../config/api';

const SuggestedRoles = ({ 
  userSkills, 
  currentRole, 
  currentLevel, 
  resumeText, 
  suggestedRoles, 
  onSuggestedRolesLoaded,
  onAnalyzeRole 
}) => {
  console.log('SuggestedRoles rendered with resumeText:', {
    resumeTextLength: resumeText?.length || 0,
    resumeTextPreview: resumeText?.substring(0, 100) || 'No text'
  });

  const [suggestions, setSuggestions] = useState(suggestedRoles || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisMethod, setAnalysisMethod] = useState('');
  const [showResumeSelector, setShowResumeSelector] = useState(false);
  const [pendingRoleAnalysis, setPendingRoleAnalysis] = useState(null);
  const [analyzingRole, setAnalyzingRole] = useState(null); // Track which role is being analyzed

  useEffect(() => {
    // Use cached suggested roles if available, otherwise fetch
    if (suggestedRoles && suggestedRoles.length > 0) {
      setSuggestions(suggestedRoles);
      setAnalysisMethod('cached');
    } else if (userSkills && userSkills.length > 0) {
      fetchSuggestions();
    }
  }, [userSkills, currentRole, currentLevel, suggestedRoles]);

  // Clear analyzing state when component unmounts
  useEffect(() => {
    return () => {
      setAnalyzingRole(null);
    };
  }, []);

  // Auto-clear analyzing state after timeout to prevent stuck loading states
  useEffect(() => {
    if (analyzingRole) {
      const timeout = setTimeout(() => {
        setAnalyzingRole(null);
      }, 10000); // Clear after 10 seconds max (increased since App.js handles main loading)

      return () => clearTimeout(timeout);
    }
  }, [analyzingRole]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setError(null);

    const requestData = {
      user_skills: userSkills,
      current_role: currentRole,
      current_level: currentLevel,
      resume_text: resumeText
    };

    try {
      const response = await fetchWithFallback(API_ENDPOINTS.suggestRoles, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

        const data = await response.json();
        const fetchedSuggestions = data.suggested_roles || [];
        setSuggestions(fetchedSuggestions);
        setAnalysisMethod(data.analysis_method || '');
        
        // Notify parent component about loaded suggestions for caching
        if (onSuggestedRolesLoaded && fetchedSuggestions.length > 0) {
          onSuggestedRolesLoaded(fetchedSuggestions);
        }
        
      setIsLoading(false);
      return; // Success, exit function

    } catch (error) {
      console.log('Failed to fetch suggestions from API:', error.message);
      setError('Unable to fetch role suggestions. Please try again later.');
      setIsLoading(false);
    }
  };

  const handleAnalyzeRole = (role) => {
    console.log('handleAnalyzeRole called:', {
      role: role.role,
      resumeTextLength: resumeText?.length || 0,
      resumeTextPreview: resumeText?.substring(0, 100) || 'No text'
    });

    if (!onAnalyzeRole) {
      // Fallback to showing message if no callback provided
      alert(`To analyze the "${role.role}" role, please select it from the role dropdown above and click "Analyze Resume"`);
      return;
    }

    // Set loading state for this specific role
    setAnalyzingRole(role.role);

    // Always show resume selector to let user choose which resume to use
    console.log('Showing resume selector for user to choose resume');
    setPendingRoleAnalysis(role);
    setShowResumeSelector(true);
    // Don't clear loading state yet - will be cleared when modal closes or analysis starts
  };

  const performRoleAnalysis = (role, resume) => {
    // Create a new analysis request with the selected resume and different role
    const newAnalysisData = {
      resume: resume,
      role: role.role,
      level: currentLevel
    };

    console.log('Analyzing new role:', {
      role: newAnalysisData.role,
      level: newAnalysisData.level,
      resumeLength: newAnalysisData.resume.length
    });

    // Scroll to top smoothly before starting analysis
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Clear local loading state since App.js will handle the main loading
    setAnalyzingRole(null);
    
    // Start the analysis - App.js will show the full screen loader
    setTimeout(() => {
      onAnalyzeRole(newAnalysisData);
    }, 300); // Brief delay for smooth transition
  };

  const handleResumeSelected = (selectedResumeText) => {
    if (pendingRoleAnalysis && selectedResumeText) {
      performRoleAnalysis(pendingRoleAnalysis, selectedResumeText);
    }
    setPendingRoleAnalysis(null);
    setShowResumeSelector(false);
  };

  const handleCloseSelectorModal = () => {
    setShowResumeSelector(false);
    setPendingRoleAnalysis(null);
    setAnalyzingRole(null); // Clear loading state if user cancels
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'challenging':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getMatchColor = (percentage) => {
    if (percentage >= 70) return 'text-green-600 bg-green-50';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'frontend':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'backend':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
        );
      case 'devops':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'data':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'security':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'ai':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 002 2h2a2 2 0 012-2V6m0 0v6a2 2 0 01-2 2h-2a2 2 0 01-2 2v-2m0 0V6a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
          </svg>
        );
    }
  };

  if (!userSkills || userSkills.length === 0) {
    return null; // Don't render if no user skills available
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-100 px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-slate-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900">Other Roles That Match Your Profile</h2>
          </div>
          
          {analysisMethod === 'ai_enhanced' && (
            <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI-Enhanced
            </div>
          )}
        </div>
        
        <p className="text-gray-600 mt-2">
          Based on your skills and experience, here are alternative roles you might find interesting.
        </p>
      </div>

      {/* Analysis Starting Notification */}
      {analyzingRole && (
        <div className="mx-8 mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 animate-spin text-blue-600 mr-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div>
              <h4 className="font-semibold text-blue-800">
                Starting Analysis for {analyzingRole}
              </h4>
              <p className="text-blue-600 text-sm">
                Please wait while we analyze your compatibility with this role...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-8">
        {isLoading ? (
          <div className="py-8">
            <AIProcessingIndicator 
              isVisible={true}
              message="AI is analyzing role compatibility"
              className="mx-auto max-w-md"
            />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="mt-4 text-gray-600">{error}</p>
              <button
                onClick={fetchSuggestions}
                className="mt-4 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {suggestions.map((role, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl p-6 hover:shadow-md transition-all duration-200 border border-gray-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-600 rounded-xl flex items-center justify-center text-white">
                      {getCategoryIcon(role.category)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{role.role}</h3>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-sm text-gray-600 capitalize">
                          {role.category} Role
                        </span>
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${getDifficultyColor(role.transition_difficulty)}`}>
                          {role.transition_difficulty} Transition
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`px-4 py-2 rounded-full text-lg font-bold ${getMatchColor(role.match_percentage)}`}>
                    {role.match_percentage}% Match
                  </div>
                </div>

                <p className="text-gray-700 mb-4 leading-relaxed">{role.why_good_fit}</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Overlapping Skills */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Skills You Have ({role.key_overlapping_skills?.length || 0})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {role.key_overlapping_skills?.slice(0, 6).map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {role.key_overlapping_skills?.length > 6 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                          +{role.key_overlapping_skills.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Skills to Learn */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Skills to Learn ({role.skills_to_learn?.length || 0})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {role.skills_to_learn?.slice(0, 6).map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {role.skills_to_learn?.length > 6 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                          +{role.skills_to_learn.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Growth Potential and Market Outlook */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <svg className="w-4 h-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Growth Potential
                    </h4>
                    <p className="text-sm text-gray-600">{role.growth_potential}</p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <svg className="w-4 h-4 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Market Outlook
                    </h4>
                    <p className="text-sm text-gray-600">{role.market_outlook}</p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Ready to explore this path? Analyze your fit for this specific role.
                  </div>
                  <button
                    onClick={() => handleAnalyzeRole(role)}
                    disabled={analyzingRole !== null}
                    className={`px-6 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 ${
                      analyzingRole === role.role
                        ? 'bg-blue-600 text-white cursor-default'
                        : analyzingRole !== null
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-slate-600 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {analyzingRole === role.role ? (
                      <>
                        {/* Loading Spinner */}
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Starting Analysis...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Analyze This Role</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resume Selector Modal */}
      <ResumeSelector
        isOpen={showResumeSelector}
        onClose={handleCloseSelectorModal}
        onSelectResume={handleResumeSelected}
        currentResumeText={resumeText}
      />
    </div>
  );
};

export default SuggestedRoles;