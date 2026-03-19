import React, { useState, useEffect } from 'react';
import './App.css';
import InteractiveResumeForm from './components/InteractiveResumeForm';
import InteractiveScoreCard from './components/InteractiveScoreCard';

function App() {
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async (formData) => {
    setIsAnalyzing(true);
    setError(null);
    
    const apiUrls = [
      'http://127.0.0.1:8000/api/v1/analyze',
      'http://localhost:8000/api/v1/analyze'
    ];
    
    for (const url of apiUrls) {
      try {
        const response = await fetch(url, {
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
        setAnalysisData(data);
        setShowResults(true);
        
        // Smooth scroll to results
        setTimeout(() => {
          const resultsElement = document.getElementById('results-section');
          if (resultsElement) {
            resultsElement.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);

        setIsAnalyzing(false);
        return; // Success, exit the function
        
      } catch (error) {
        console.log(`Failed to analyze with ${url}:`, error.message);
      }
    }
    
    // If all URLs failed
    setError('Unable to connect to the analysis service. Please ensure the backend server is running.');
    setIsAnalyzing(false);
  };

  const handleSkillsUpdated = (updatedData) => {
    setAnalysisData(updatedData);
  };

  const startNewAnalysis = () => {
    setAnalysisData(null);
    setShowResults(false);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

      {/* Main Form */}
      {!showResults && (
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
    </div>
  );
}

export default App;