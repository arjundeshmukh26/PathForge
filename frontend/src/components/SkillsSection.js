import React from 'react';
import Badge from './Badge';

const SkillsSection = ({ title, skills, variant, subtitle, icon }) => {
  const getHeaderStyle = (variant) => {
    const styles = {
      neutral: 'bg-gradient-to-r from-gray-600 to-gray-700',
      success: 'bg-gradient-to-r from-green-600 to-green-700',
      warning: 'bg-gradient-to-r from-amber-600 to-amber-700'
    };
    return styles[variant] || styles.neutral;
  };

  const getEmptyStateIcon = (variant) => {
    const icons = {
      success: '✅',
      warning: variant === 'warning' && skills.length === 0 ? '🎉' : '🎯',
      neutral: '📋'
    };
    return icons[variant] || '📝';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden h-full">
      {/* Enhanced Header */}
      <div className={`px-6 py-4 ${getHeaderStyle(variant)} text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {icon && <span className="text-xl mr-3">{icon}</span>}
            <div>
              <h3 className="text-lg font-bold">
                {title}
              </h3>
              {skills.length > 0 && (
                <div className="text-sm text-white/80">
                  {skills.length} skill{skills.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
          <div className="bg-white/20 rounded-full px-3 py-1 text-sm font-semibold">
            {skills.length}
          </div>
        </div>
      </div>

      <div className="p-6">
        {subtitle && (
          <p className="text-sm text-gray-600 mb-6">
            {subtitle}
          </p>
        )}

        {/* Skills Display */}
        <div className="min-h-[200px]">
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {skills.map((skill, index) => (
                <Badge
                  key={index}
                  text={skill}
                  variant={variant}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <span className="text-2xl">
                  {getEmptyStateIcon(variant)}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-900 mb-1">
                {variant === 'warning' ? (
                  'Perfect Score!'
                ) : (
                  'No Skills Found'
                )}
              </div>
              <div className="text-xs text-gray-600">
                {variant === 'warning' ? (
                  'You have all required skills for this role'
                ) : (
                  'Try including more technical details in your resume'
                )}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Progress Indicator */}
        {skills.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                {variant === 'success' ? 'Matched Requirements' : 
                 variant === 'warning' ? 'Skills To Develop' : 
                 'Skills Identified'}
              </span>
              <div className="flex items-center text-xs text-gray-600">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  variant === 'success' ? 'bg-green-500' :
                  variant === 'warning' ? 'bg-amber-500' :
                  'bg-gray-400'
                }`}></div>
                {skills.length} total
              </div>
            </div>
            
            {/* Skill categories breakdown */}
            <div className="grid grid-cols-1 gap-2 mt-4">
              {variant === 'neutral' && (
                <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-600">Languages & Frameworks</span>
                  <span className="text-xs font-semibold text-gray-900">
                    {skills.filter(skill => 
                      ['JavaScript', 'Python', 'React', 'Node.js', 'Java', 'TypeScript', 'Vue.js', 'Angular'].some(tech => 
                        skill.toLowerCase().includes(tech.toLowerCase())
                      )
                    ).length}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillsSection;