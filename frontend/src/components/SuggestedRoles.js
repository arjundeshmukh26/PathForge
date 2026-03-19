import React from 'react';

const SuggestedRoles = ({ roles }) => {
  if (!roles || roles.length === 0) {
    return null;
  }

  const getRoleIcon = (role) => {
    const icons = {
      'Full Stack Developer': '🚀',
      'Software Engineer': '💻',
      'Backend Developer': '⚙️',
      'Frontend Developer': '🎨',
      'DevOps Engineer': '🔧'
    };
    return icons[role] || '💼';
  };

  const getMatchColor = (match) => {
    if (match >= 85) return 'from-green-500 to-green-600';
    if (match >= 70) return 'from-blue-500 to-blue-600';
    if (match >= 60) return 'from-amber-500 to-amber-600';
    return 'from-gray-500 to-gray-600';
  };

  const getMatchLabel = (match) => {
    if (match >= 85) return 'Excellent Fit';
    if (match >= 70) return 'Good Match';
    if (match >= 60) return 'Fair Match';
    return 'Worth Exploring';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-1">
              Suggested Career Paths
            </h3>
            <p className="text-indigo-100 text-sm">
              Roles that align with your current skillset
            </p>
          </div>
          <div className="bg-white/20 rounded-full p-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
            </svg>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Enhanced Roles List */}
        <div className="space-y-4">
          {roles.map((roleItem, index) => (
            <div 
              key={index} 
              className="group relative p-6 rounded-2xl border-2 border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-r from-gray-50 to-white hover:from-indigo-50 hover:to-purple-50"
            >
              {/* Role Rank Badge */}
              <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                {index + 1}
              </div>

              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Role Header */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-3xl">{getRoleIcon(roleItem.role)}</div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                        {roleItem.role}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getMatchColor(roleItem.match)}`}>
                          {roleItem.match}% Match
                        </span>
                        <span className="text-xs text-gray-600 font-medium">
                          {getMatchLabel(roleItem.match)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Role Description */}
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    {roleItem.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-700">Compatibility Score</span>
                      <span className="font-bold text-gray-900">{roleItem.match}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 bg-gradient-to-r ${getMatchColor(roleItem.match)}`}
                        style={{ width: `${roleItem.match}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Action Arrow */}
                <div className="ml-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Footer */}
        <div className="mt-8 p-4 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl border border-gray-200">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-gray-700 font-medium">
              <span className="font-semibold">Pro Tip:</span> Focus on developing missing skills for higher matches
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuggestedRoles;