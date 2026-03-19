import React from 'react';
import ScoreCard from './ScoreCard';
import SkillsSection from './SkillsSection';
import SuggestedRoles from './SuggestedRoles';
import LearningRoadmap from './LearningRoadmap';

const Dashboard = ({ results, onNewAnalysis }) => {
  const {
    skills = [],
    matched = [],
    missing = [],
    score = 0,
    roadmap = []
  } = results;

  // Generate suggested roles based on match percentage
  const generateSuggestedRoles = () => {
    const currentMatchPercentage = Math.round(score);
    
    // Mock data for suggested roles (in a real app, this would come from the backend)
    const potentialRoles = [
      { role: 'Full Stack Developer', match: Math.min(100, currentMatchPercentage + 15), description: 'Combines frontend and backend development' },
      { role: 'Software Engineer', match: Math.min(100, currentMatchPercentage + 10), description: 'General software development across multiple technologies' },
      { role: 'Backend Developer', match: Math.min(100, currentMatchPercentage + 8), description: 'Server-side development and API design' },
      { role: 'Frontend Developer', match: Math.min(100, currentMatchPercentage + 5), description: 'User interface and user experience development' },
      { role: 'DevOps Engineer', match: Math.max(0, currentMatchPercentage - 10), description: 'Infrastructure, deployment, and system operations' }
    ];

    return potentialRoles
      .filter(role => role.match >= 60)
      .sort((a, b) => b.match - a.match)
      .slice(0, 3);
  };

  const suggestedRoles = generateSuggestedRoles();

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Analysis Results Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Analysis Complete
        </h2>
        <p className="text-gray-600">
          Here's your comprehensive skills analysis and recommendations
        </p>
      </div>

      {/* Score Section */}
      <ScoreCard
        score={score}
        totalSkills={skills.length}
        matchedCount={matched.length}
        missingCount={missing.length}
      />

      {/* Skills Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <SkillsSection
          title="Skills Found"
          skills={skills}
          variant="neutral"
          subtitle={`${skills.length} technical skills detected in your resume`}
          icon="📋"
        />
        
        <SkillsSection
          title="Skills Matched"
          skills={matched}
          variant="success"
          subtitle={`${matched.length} skills align with role requirements`}
          icon="✅"
        />
        
        <SkillsSection
          title="Skills to Develop"
          skills={missing}
          variant="warning"
          subtitle={`${missing.length} skills to focus on for this role`}
          icon="🎯"
        />
      </div>

      {/* Two Column Layout for Additional Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Suggested Roles */}
        {suggestedRoles.length > 0 && (
          <SuggestedRoles roles={suggestedRoles} />
        )}

        {/* Learning Roadmap */}
        {roadmap.length > 0 && (
          <LearningRoadmap roadmap={roadmap.slice(0, 3)} />
        )}
      </div>

      {/* Action Button */}
      <div className="text-center pt-8">
        <button
          onClick={onNewAnalysis}
          className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all duration-200"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Analyze Another Resume
        </button>
      </div>
    </div>
  );
};

export default Dashboard;