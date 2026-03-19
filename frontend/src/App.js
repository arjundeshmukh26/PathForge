import React, { useState, useEffect } from 'react';
import './App.css';
import InteractiveResumeForm from './components/InteractiveResumeForm';
import InteractiveScoreCard from './components/InteractiveScoreCard';
import PastAnalyses from './components/PastAnalyses';
import SuggestedRoles from './components/SuggestedRoles';
import FullScreenLoader from './components/FullScreenLoader';
import { saveAnalysis, updateLearnedSkills, getAnalysis, isStorageAvailable } from './utils/localStorage';
import { API_ENDPOINTS, fetchWithFallback } from './config/api';

function App() {
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(null); // Track current role being analyzed
  const [showResults, setShowResults] = useState(false);
  const [showPastAnalyses, setShowPastAnalyses] = useState(false);
  const [error, setError] = useState(null);
  const [storageAvailable, setStorageAvailable] = useState(false);

  useEffect(() => {
    setStorageAvailable(isStorageAvailable());
  }, []);

  // Debug: Log when learned_skills change
  useEffect(() => {
    if (analysisData?.learned_skills !== undefined) {
      console.log('App.js: learned_skills updated:', analysisData.learned_skills.length, 'skills');
    }
  }, [analysisData?.learned_skills]);

  const handleAnalyze = async (formData) => {
    setIsAnalyzing(true);
    setCurrentAnalysis({ role: formData.role, level: formData.level });
    setError(null);
    setShowResults(false); // Hide previous results immediately
    
    try {
      const response = await fetchWithFallback(API_ENDPOINTS.analyze, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Analysis failed');
      }

      const data = await response.json();
        
        console.log('Analysis response data:', {
          session_id: data.session_id,
          role: data.role,
          level: data.level,
          resumeInResponse: data.resume ? `${data.resume.length} chars` : 'No resume in response'
        });
        
        // Ensure resume from form data is included in analysis data
        const analysisDataWithResume = {
          ...data,
          resume: formData.resume // Ensure resume text is preserved
        };
        
        console.log('Setting analysisData with resume:', {
          resumeLength: analysisDataWithResume.resume?.length || 0,
          resumePreview: analysisDataWithResume.resume?.substring(0, 100) || 'No resume'
        });
        
        setAnalysisData(analysisDataWithResume);
        setShowResults(true);
        
        // Save to localStorage if available (suggested roles will be added later)
        if (storageAvailable && data.session_id) {
          const analysisToSave = {
            id: data.session_id,
            session_id: data.session_id,
            resume: formData.resume,
            role: data.role,
            level: data.level,
            compatibility_score: data.compatibility_score,
            user_skills: data.user_skills,
            matched_skills: data.matched_skills,
            missing_skills: data.missing_skills,
            ai_summary: data.ai_summary,
            learned_skills: [], // Initialize with empty array
            timestamp: data.timestamp || new Date().toISOString()
          };
          
          console.log('Saving analysis to localStorage:', {
            id: analysisToSave.id,
            resumeLength: analysisToSave.resume?.length || 0,
            resumePreview: analysisToSave.resume?.substring(0, 100) || 'No resume'
          });
          
          if (!saveAnalysis(analysisToSave)) {
            console.warn('Failed to save analysis to localStorage');
          } else {
            console.log('Analysis saved successfully to localStorage');
          }
        }
        
        // Smooth scroll to results and clear loading after UI renders
        setTimeout(() => {
          const resultsElement = document.getElementById('results-section');
          if (resultsElement) {
            resultsElement.scrollIntoView({ behavior: 'smooth' });
          }
          
          // Clear loading state after results are shown and scroll completes
          setTimeout(() => {
            setIsAnalyzing(false);
            setCurrentAnalysis(null);
          }, 500);
        }, 100);

      return; // Success, exit the function
      
    } catch (error) {
      console.log('Analysis failed:', error.message);
      setError('Unable to connect to the analysis service. Please ensure the backend server is running.');
      setIsAnalyzing(false);
      setCurrentAnalysis(null);
    }
  };

  const handleSkillsUpdated = (updatedData) => {
    // Update analysis data with learned skills info
    const updatedAnalysis = {
      ...analysisData,
      ...updatedData,
      learned_skills: updatedData.learned_skills || []
    };
    
    setAnalysisData(updatedAnalysis);
    
    // Save learned skills progress to localStorage
    // Use the analysis ID for localStorage lookup (could be different from session_id)
    const analysisId = updatedAnalysis.id || updatedAnalysis.session_id;
    if (storageAvailable && analysisId && updatedAnalysis.learned_skills !== undefined) {
      const success = updateLearnedSkills(analysisId, updatedAnalysis.learned_skills);
      if (success) {
        console.log('Successfully updated learned skills in localStorage');
        
        // Force re-read from localStorage to ensure React state matches localStorage
        const freshAnalysis = getAnalysis(analysisId);
        if (freshAnalysis) {
          // Update React state with fresh localStorage data to ensure synchronization
          // Use the full fresh analysis to avoid state merge issues
          setAnalysisData({
            ...updatedAnalysis,
            learned_skills: freshAnalysis.learned_skills || [],
            compatibility_score: freshAnalysis.compatibility_score,
            missing_skills: freshAnalysis.missing_skills
          });
        }
      } else {
        console.warn('Failed to update learned skills in localStorage');
      }
    }
  };

  const startNewAnalysis = () => {
    setAnalysisData(null);
    setShowResults(false);
    setShowPastAnalyses(false);
    setError(null);
    setIsAnalyzing(false);
    setCurrentAnalysis(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadAnalysis = (analysis) => {
    console.log('Loading analysis from localStorage:', {
      id: analysis.id,
      session_id: analysis.session_id,
      learned_skills: analysis.learned_skills,
      resume_length: analysis.resume?.length || 0,
      resume_preview: analysis.resume?.substring(0, 100) || 'No resume text',
      role: analysis.role,
      level: analysis.level
    });
    
    // Ensure learned_skills is always an array and resume is included
    const analysisWithDefaults = {
      ...analysis,
      learned_skills: analysis.learned_skills || [],
      resume: analysis.resume || '' // Ensure resume text is available
    };
    
    console.log('Setting analysisData from localStorage with resume:', {
      resumeLength: analysisWithDefaults.resume?.length || 0,
      resumePreview: analysisWithDefaults.resume?.substring(0, 100) || 'No resume'
    });
    
    setAnalysisData(analysisWithDefaults);
    setShowResults(true);
    setShowPastAnalyses(false);
    
    // Smooth scroll to results
    setTimeout(() => {
      const resultsElement = document.getElementById('results-section');
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const togglePastAnalyses = () => {
    setShowPastAnalyses(!showPastAnalyses);
    setShowResults(false);
  };

  const handleSuggestedRolesLoaded = (suggestedRoles) => {
    // Update both state and localStorage with suggested roles
    if (analysisData && suggestedRoles) {
      const updatedData = {
        ...analysisData,
        suggested_roles: suggestedRoles
      };
      
      setAnalysisData(updatedData);
      
      // Update localStorage with suggested roles
      if (storageAvailable && analysisData.session_id) {
        saveAnalysis(updatedData);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Skill-Bridge</h1>
                <div className="text-xs text-gray-600">Career Navigator</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {storageAvailable && (
                <button
                  onClick={togglePastAnalyses}
                  className={`flex items-center space-x-2 px-4 py-2 font-semibold rounded-xl transition-all duration-200 ${
                    showPastAnalyses
                      ? 'bg-slate-900 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Past Analyses</span>
                </button>
              )}
              {showResults && (
                <button
                  onClick={startNewAnalysis}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all duration-200 hover:shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Analysis</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-bold text-red-800 mb-1">Analysis Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Past Analyses */}
      {showPastAnalyses && (
        <div className="max-w-4xl mx-auto px-6 py-8">
          <PastAnalyses onLoadAnalysis={handleLoadAnalysis} />
        </div>
      )}

      {/* Main Form */}
      {!showResults && !showPastAnalyses && (
        <InteractiveResumeForm 
          onAnalyze={handleAnalyze} 
          isAnalyzing={isAnalyzing} 
        />
      )}

      {/* Results Section */}
      {showResults && analysisData && (
        <div id="results-section" className="py-8">
          <div className="max-w-7xl mx-auto px-6">
            {/* Results Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Analysis Complete for {analysisData.role}
              </h2>
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span>{analysisData.matched_skills?.length || 0} skills matched</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span>{analysisData.missing_skills?.length || 0} skills to develop</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Analyzed {new Date(analysisData.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Interactive Score Card */}
            <div className="mb-8">
              <InteractiveScoreCard
                score={analysisData.compatibility_score}
                matchedSkills={analysisData.matched_skills}
                missingSkills={analysisData.missing_skills}
                totalSkills={(analysisData.matched_skills?.length || 0) + (analysisData.missing_skills?.length || 0)}
                sessionId={analysisData.session_id}
                onSkillsUpdated={handleSkillsUpdated}
                learnedSkills={analysisData.learned_skills || []}
              />
            </div>

            {/* AI Summary */}
            {analysisData.ai_summary && (
              <div className="mb-8">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">AI Assessment Summary</h3>
                      <div className="prose max-w-none text-gray-700 leading-relaxed">
                        <p>{analysisData.ai_summary}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Suggested Roles */}
            {analysisData.user_skills && analysisData.user_skills.length > 0 && (
              <div className="mb-8">
                <SuggestedRoles
                  userSkills={analysisData.user_skills}
                  currentRole={analysisData.role}
                  currentLevel={analysisData.level}
                  resumeText={analysisData.resume || ""}
                  suggestedRoles={analysisData.suggested_roles}
                  onSuggestedRolesLoaded={handleSuggestedRolesLoaded}
                  onAnalyzeRole={handleAnalyze}
                />
              </div>
            )}

            {/* Action Center */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-slate-50 to-gray-100 rounded-2xl p-8 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Ready to Level Up?</h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Start learning the missing skills to improve your compatibility score. 
                  Mark skills as learned to track your progress in real-time.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={startNewAnalysis}
                    className="px-6 py-3 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 text-gray-900 rounded-xl font-semibold transition-all duration-200"
                  >
                    Analyze Another Resume
                  </button>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Session saved automatically</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="font-bold text-gray-900">Skill-Bridge Career Navigator</span>
            </div>
            <p className="text-gray-600 text-sm">
              AI-powered career guidance with deterministic fallback. Built for reliability and growth.
            </p>
          </div>
        </div>
      </footer>

      {/* Full Screen Loader */}
      <FullScreenLoader 
        isVisible={isAnalyzing}
        message={currentAnalysis ? `Analyzing ${currentAnalysis.role} Role` : "Analyzing your profile..."}
        subMessage={currentAnalysis ? `Evaluating your skills for ${currentAnalysis.level} level position` : "Please wait while we process your request"}
      />
    </div>
  );
}

export default App;