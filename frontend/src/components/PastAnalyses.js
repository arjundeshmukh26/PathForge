import React, { useState, useEffect } from 'react';
import { getAnalyses, deleteAnalysis, getAnalysisSummary, clearAnalyses } from '../utils/localStorage';

const PastAnalyses = ({ onLoadAnalysis }) => {
  const [analyses, setAnalyses] = useState([]);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = () => {
    const savedAnalyses = getAnalyses();
    setAnalyses(savedAnalyses);
  };

  const handleDelete = (id) => {
    if (deleteAnalysis(id)) {
      loadAnalyses(); // Refresh the list
    }
  };

  const handleClearAll = () => {
    if (clearAnalyses()) {
      loadAnalyses();
      setShowConfirmClear(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (analyses.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 4h.01M9 7h.01M9 11h.01M12 7h.01M12 11h.01M15 7h.01M15 11h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Past Analyses</h3>
          <p className="text-gray-600">Your completed resume analyses will appear here for easy access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-100 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-slate-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900">Past Analyses</h2>
            <span className="ml-2 px-2 py-1 bg-slate-800 text-white text-xs font-bold rounded-full">
              {analyses.length}
            </span>
          </div>
          
          {analyses.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowConfirmClear(true)}
                className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmClear && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm font-medium text-red-800">
                Clear all {analyses.length} saved analyses? This action cannot be undone.
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="text-sm text-white bg-red-600 hover:bg-red-700 font-medium px-3 py-1 rounded-lg transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analyses List */}
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {analyses.map((analysis) => {
          const summary = getAnalysisSummary(analysis);
          
          return (
            <div
              key={analysis.id}
              className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group"
              onClick={() => onLoadAnalysis(analysis)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Role and Level */}
                  <div className="flex items-center mb-2">
                    <h3 className="font-bold text-gray-900 group-hover:text-slate-700 transition-colors">
                      {summary.role}
                    </h3>
                    <span className="ml-3 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full capitalize">
                      {summary.level}
                    </span>
                  </div>

                  {/* Score and Stats */}
                  <div className="flex items-center space-x-4 mb-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(summary.score)}`}>
                      {Math.round(summary.score)}% Match
                    </div>
                    <div className="text-sm text-gray-600">
                      {summary.skillCount} skills found
                    </div>
                    {summary.missingSkillCount > 0 && (
                      <div className="text-sm text-gray-600">
                        {summary.missingSkillCount} gaps
                      </div>
                    )}
                  </div>

                  {/* Resume Preview */}
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                    {summary.resumePreview}
                  </p>

                  {/* Timestamp */}
                  <div className="flex items-center text-xs text-gray-400">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatDate(analysis.timestamp)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoadAnalysis(analysis);
                    }}
                    className="text-slate-600 hover:text-slate-800 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    title="View Analysis"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(analysis.id);
                    }}
                    className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete Analysis"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PastAnalyses;