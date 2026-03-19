import React from 'react';

const LearningRoadmap = ({ roadmap }) => {
  if (!roadmap || roadmap.length === 0) {
    return null;
  }

  const getSkillIcon = (skill) => {
    const icons = {
      'JavaScript': '⚡',
      'Python': '🐍', 
      'React': '⚛️',
      'Node.js': '🟢',
      'Docker': '🐳',
      'AWS': '☁️',
      'SQL': '🗃️',
      'Git': '🌿'
    };
    
    for (const [key, icon] of Object.entries(icons)) {
      if (skill.toLowerCase().includes(key.toLowerCase())) {
        return icon;
      }
    }
    return '📚';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-1">
              Learning Roadmap
            </h3>
            <p className="text-emerald-100 text-sm">
              Your personalized path to skill mastery
            </p>
          </div>
          <div className="bg-white/20 rounded-full p-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Enhanced Roadmap Timeline */}
        <div className="space-y-8">
          {roadmap.map((item, index) => (
            <div key={index} className="relative group">
              {/* Enhanced Progress Line */}
              {index < roadmap.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-20 bg-gradient-to-b from-emerald-300 to-emerald-100"></div>
              )}
              
              <div className="flex items-start gap-6">
                {/* Enhanced Step Circle */}
                <div className="relative">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-lg font-bold rounded-full shadow-lg group-hover:shadow-xl transition-shadow duration-200">
                    {index + 1}
                  </div>
                  {/* Skill Icon Overlay */}
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center text-sm shadow-sm">
                    {getSkillIcon(item.skill)}
                  </div>
                </div>
                
                {/* Enhanced Content Card */}
                <div className="flex-1 min-w-0 bg-gradient-to-r from-gray-50 to-emerald-50 rounded-2xl p-6 group-hover:shadow-md transition-shadow duration-200">
                  {/* Skill Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900">
                      {item.skill}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
                        Step {index + 1}
                      </span>
                      <span className="text-xs text-gray-500">
                        {item.steps.length} tasks
                      </span>
                    </div>
                  </div>
                  
                  {/* Learning Steps */}
                  <div className="space-y-3">
                    {item.steps.slice(0, 3).map((step, stepIndex) => (
                      <div key={stepIndex} className="flex items-start gap-3 group/step">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0 group-hover/step:bg-emerald-600 transition-colors"></div>
                        <div className="flex-1">
                          <span className="text-sm text-gray-700 leading-relaxed group-hover/step:text-gray-900 transition-colors">
                            {step}
                          </span>
                        </div>
                        <div className="opacity-0 group-hover/step:opacity-100 transition-opacity">
                          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                    
                    {item.steps.length > 3 && (
                      <div className="ml-5 pt-2 border-t border-emerald-200">
                        <span className="text-xs text-emerald-700 font-medium bg-emerald-100 px-2 py-1 rounded-full">
                          +{item.steps.length - 3} more learning steps
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress Indicator */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Estimated completion</span>
                      <span className="font-semibold text-emerald-700">2-4 weeks</span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                      <div className="bg-gradient-to-r from-emerald-400 to-teal-400 h-1 rounded-full w-0 group-hover:w-1/4 transition-all duration-500"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Footer with Action Cards */}
        <div className="mt-10 space-y-4">
          {/* Success Tips */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-emerald-900 mb-2">Success Strategy</h4>
                <p className="text-sm text-emerald-800 leading-relaxed">
                  Master one skill at a time, build projects to demonstrate learning, and maintain a portfolio showcasing your progress. Connect theory with practical application.
                </p>
              </div>
            </div>
          </div>

          {/* Resources Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900">Learning Resources</span>
              </div>
              <p className="text-xs text-gray-600">Find tutorials, courses, and documentation</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900">Community Support</span>
              </div>
              <p className="text-xs text-gray-600">Join developer communities and forums</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningRoadmap;