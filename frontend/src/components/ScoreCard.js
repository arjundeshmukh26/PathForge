import React, { useState, useEffect } from 'react';

const ScoreCard = ({ score, totalSkills, matchedCount, missingCount }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 500);
    return () => clearTimeout(timer);
  }, [score]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-700';
    if (score >= 60) return 'text-blue-700';
    if (score >= 40) return 'text-amber-700';
    return 'text-red-700';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Needs Development';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'from-green-500 to-green-600';
    if (score >= 60) return 'from-blue-500 to-blue-600';
    if (score >= 40) return 'from-amber-500 to-amber-600';
    return 'from-red-500 to-red-600';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return '🎉';
    if (score >= 60) return '👍';
    if (score >= 40) return '📈';
    return '💪';
  };

  const stats = [
    {
      label: 'Skills Matched',
      value: matchedCount,
      description: 'Requirements met',
      icon: '✅',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Skills Missing', 
      value: missingCount,
      description: 'To develop',
      icon: '🎯',
      color: 'text-amber-600',
      bgColor: 'bg-amber-100'
    },
    {
      label: 'Total Skills',
      value: totalSkills,
      description: 'Detected',
      icon: '📊',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Skills Analysis Results</h2>
            <p className="text-gray-600 text-sm">Complete breakdown of your skill compatibility</p>
          </div>
          <div className="text-3xl">{getScoreIcon(score)}</div>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          {/* Enhanced Score Display */}
          <div className="lg:col-span-2 text-center lg:text-left">
            <div className="inline-flex flex-col items-center lg:items-start">
              {/* Animated Score Circle */}
              <div className="relative mb-6">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  {/* Progress Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="url(#scoreGradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - animatedScore / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" className={score >= 80 ? "text-green-500" : score >= 60 ? "text-blue-500" : score >= 40 ? "text-amber-500" : "text-red-500"} stopColor="currentColor" />
                      <stop offset="100%" className={score >= 80 ? "text-green-600" : score >= 60 ? "text-blue-600" : score >= 40 ? "text-amber-600" : "text-red-600"} stopColor="currentColor" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                      {Math.round(animatedScore)}%
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center lg:text-left">
                <div className="text-lg font-semibold text-gray-900 mb-2">
                  Role Compatibility Score
                </div>
                <div className={`text-sm font-medium ${getScoreColor(score)}`}>
                  {getScoreLabel(score)}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${stat.bgColor} mb-4`}>
                    <span className="text-xl">{stat.icon}</span>
                  </div>
                  <div className="mb-2">
                    <div className={`text-3xl font-bold ${stat.color} mb-1`}>
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                      {stat.description}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Progress Section */}
      <div className="bg-gray-50 px-8 py-6">
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span className="font-medium">Overall Compatibility</span>
            <span className="font-semibold">{Math.round(score)}% Match</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-3 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${getScoreBgColor(score)}`}
              style={{ width: `${Math.max(5, animatedScore)}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Needs Work</span>
          <span>Good Fit</span>
          <span>Perfect Match</span>
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;