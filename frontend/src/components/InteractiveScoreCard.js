import React, { useState, useEffect } from 'react';
import { calculateCompatibilityScore, updateMissingSkills, debugScoring } from '../utils/scoringUtils';

const InteractiveScoreCard = ({ 
  score, 
  matchedSkills = [], 
  missingSkills = [], 
  totalSkills = 0,
  sessionId,
  onSkillsUpdated,
  learnedSkills: initialLearnedSkills = []
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [learnedSkills, setLearnedSkills] = useState(new Set(initialLearnedSkills));
  
  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const increment = score / 50;
      const animate = () => {
        if (current < score) {
          current += increment;
          setAnimatedScore(Math.min(current, score));
          requestAnimationFrame(animate);
        }
      };
      animate();
    }, 300);
    return () => clearTimeout(timer);
  }, [score]);

  // Update learned skills when prop changes (e.g., loading from localStorage)
  useEffect(() => {
    console.log('InteractiveScoreCard: Updating learned skills from prop:', initialLearnedSkills);
    setLearnedSkills(new Set(initialLearnedSkills || []));
  }, [initialLearnedSkills]);

  const getScoreData = (score) => {
    if (score >= 85) return {
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-500',
      label: 'Excellent Match',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };
    if (score >= 70) return {
      color: 'text-blue-700',
      bgColor: 'bg-blue-500',
      label: 'Strong Match',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2H4.237a2 2 0 00-1.789 1.106L.764 9.894A2 2 0 003.237 12H7v3a2 2 0 002 2h5.264z" />
        </svg>
      )
    };
    if (score >= 55) return {
      color: 'text-amber-700',
      bgColor: 'bg-amber-500',
      label: 'Good Potential',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    };
    return {
      color: 'text-slate-700',
      bgColor: 'bg-slate-500',
      label: 'Development Needed',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    };
  };

  const scoreData = getScoreData(score);

  const handleMarkAsLearned = async (skill) => {
    const newLearnedSkills = new Set([...learnedSkills, skill]);
    setLearnedSkills(newLearnedSkills);
    
    const apiUrls = [
      'http://127.0.0.1:8000/api/v1/update-skills',
      'http://localhost:8000/api/v1/update-skills'
    ];
    
    let serverUpdated = false;
    
    for (const url of apiUrls) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            learned_skills: Array.from(newLearnedSkills)
          })
        });
        
        if (response.ok) {
          const serverData = await response.json();
          
          // Include learned_skills in the update data since server might not return it
          const updatedData = {
            ...serverData,
            learned_skills: Array.from(newLearnedSkills)
          };
          
          console.log('Server update successful, calling onSkillsUpdated with:', {
            learned_skills: updatedData.learned_skills,
            learned_skills_length: updatedData.learned_skills.length
          });
          
          onSkillsUpdated && onSkillsUpdated(updatedData);
          serverUpdated = true;
          return; // Success
        } else if (response.status === 404) {
          console.log(`Session not found on server (${url}), using client-side update`);
          // Session doesn't exist on server, continue to fallback
        }
      } catch (error) {
        console.log(`Failed to update skills with ${url}:`, error.message);
      }
    }
    
    // Fallback: Update client-side when server session doesn't exist
    if (!serverUpdated) {
      console.log('Using client-side skill update fallback');
      
      const learnedSkillsArray = Array.from(newLearnedSkills);
      
      // Use centralized scoring utility for consistency
      const scoreCalculation = calculateCompatibilityScore(matchedSkills, missingSkills, learnedSkillsArray);
      const updatedMissingSkills = updateMissingSkills(missingSkills, learnedSkillsArray);
      
      // Debug logging for scoring transparency
      const debugInfo = debugScoring(matchedSkills, missingSkills, learnedSkillsArray);
      console.log('Client-side scoring debug:', debugInfo);
      
      const updatedData = {
        session_id: sessionId,
        compatibility_score: scoreCalculation.score,
        matched_skills: matchedSkills,
        missing_skills: updatedMissingSkills,
        learned_skills: learnedSkillsArray,
        user_skills: [...(matchedSkills.map(s => s.skill)), ...learnedSkillsArray]
      };
      
      console.log('Client-side fallback: Updated learned skills to', learnedSkillsArray);
      console.log('Client-side fallback: Score updated from ? to', scoreCalculation.score);
      
      onSkillsUpdated && onSkillsUpdated(updatedData);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'matched', label: 'Matched', icon: '✅' },
    { id: 'missing', label: 'Missing', icon: '🎯' }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-2xl ${scoreData.bgColor} flex items-center justify-center text-white`}>
              {scoreData.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Skills Analysis Complete
              </h2>
              <p className="text-slate-300">
                Comprehensive compatibility assessment
              </p>
            </div>
          </div>
          
          {/* Live Score Display */}
          <div className="text-center">
            <div className="text-5xl font-bold text-white mb-2">
              {Math.round(animatedScore)}%
            </div>
            <div className="text-slate-300 text-sm font-medium">
              {scoreData.label}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                selectedTab === tab.id
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-8">
        {selectedTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Skills Matched',
                value: matchedSkills.length,
                subtitle: 'Requirements met',
                color: 'text-emerald-600',
                bgColor: 'bg-emerald-50',
                progress: totalSkills > 0 ? (matchedSkills.length / totalSkills) * 100 : 0
              },
              {
                title: 'Skills Missing',
                value: missingSkills.length - learnedSkills.size,
                subtitle: 'To develop',
                color: 'text-amber-600',
                bgColor: 'bg-amber-50',
                progress: totalSkills > 0 ? ((missingSkills.length - learnedSkills.size) / totalSkills) * 100 : 0
              },
              {
                title: 'Total Skills',
                value: totalSkills,
                subtitle: 'Analyzed',
                color: 'text-slate-600',
                bgColor: 'bg-slate-50',
                progress: 100
              }
            ].map((stat, index) => (
              <div key={index} className={`${stat.bgColor} rounded-2xl p-6 border-2 border-transparent hover:border-slate-200 transition-all duration-300 hover:shadow-lg`}>
                <div className="text-center">
                  <div className={`text-4xl font-bold ${stat.color} mb-2`}>
                    {stat.value}
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    {stat.title}
                  </div>
                  <div className="text-xs text-gray-600 mb-4">
                    {stat.subtitle}
                  </div>
                  <div className="w-full bg-white rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${stat.color.replace('text-', 'bg-')}`}
                      style={{ width: `${stat.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTab === 'matched' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Your Matched Skills</h3>
              <p className="text-gray-600">Skills that align with your target role requirements</p>
            </div>
            {matchedSkills.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchedSkills.map((skill, index) => (
                  <div key={index} className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 hover:bg-emerald-100 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-emerald-900">{skill.skill}</h4>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-emerald-800">
                      Weight: {skill.weight}/5 | Requirement fulfilled
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📝</div>
                <p>No matched skills found</p>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'missing' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Skills to Develop</h3>
              <p className="text-gray-600">Click "Mark as Learned" when you've acquired a skill</p>
            </div>
            {missingSkills.filter(skill => !learnedSkills.has(skill.skill)).length > 0 ? (
              <div className="space-y-4">
                {missingSkills
                  .filter(skill => !learnedSkills.has(skill.skill))
                  .map((skill, index) => (
                  <div key={index} className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-amber-300 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                          <h4 className="text-xl font-bold text-gray-900">{skill.skill}</h4>
                          <div className="px-3 py-1 bg-amber-100 rounded-full">
                            <span className="text-xs font-bold text-amber-800">
                              Priority: {skill.weight}/5
                            </span>
                          </div>
                        </div>
                        
                        {skill.why_it_matters && (
                          <div className="bg-amber-50 rounded-xl p-4 mb-4">
                            <div className="text-sm text-amber-800">
                              <div className="font-semibold mb-1">Why this matters:</div>
                              <p>{skill.why_it_matters}</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4">
                          {skill.resources.map((resource, idx) => (
                            <a
                              key={idx}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors duration-200"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              {resource.title}
                            </a>
                          ))}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleMarkAsLearned(skill.skill)}
                        className="ml-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:scale-105"
                      >
                        Mark as Learned
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Perfect Match!</h3>
                <p className="text-gray-600">You have all the required skills for this role.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Progress Bar */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-100 px-8 py-6 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="text-lg font-bold text-gray-900">Overall Progress</div>
            <div className="text-sm text-gray-600">
              {matchedSkills.length} of {matchedSkills.length + missingSkills.length - learnedSkills.size} skills
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-700">{Math.round(animatedScore)}%</div>
            <div className="text-xs text-gray-600">Compatibility</div>
          </div>
        </div>
        
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div 
              className={`h-4 rounded-full transition-all duration-1000 ease-out ${scoreData.bgColor}`}
              style={{ width: `${Math.max(5, animatedScore)}%` }}
            ></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow">
              {Math.round(animatedScore)}% Match
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveScoreCard;