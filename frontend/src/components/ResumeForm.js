import React, { useState, useEffect } from 'react';

const ResumeForm = ({ onAnalyze, loading, error }) => {
  const [formData, setFormData] = useState({
    resume: '',
    role: '',
    level: 'junior'
  });
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  // Fetch available roles on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      setLoadingRoles(true);
      try {
        const response = await fetch('http://localhost:8000/api/v1/roles');
        if (response.ok) {
          const data = await response.json();
          setAvailableRoles(data.roles || []);
        }
      } catch (err) {
        console.error('Failed to fetch roles:', err);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'resume') {
      setWordCount(value.trim().split(/\s+/).filter(word => word.length > 0).length);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.resume.trim()) {
      alert('Please enter your resume text');
      return;
    }
    
    if (!formData.role.trim()) {
      alert('Please select a job role');
      return;
    }

    onAnalyze(formData);
  };

  const isFormValid = formData.resume.trim() && formData.role.trim();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Enhanced Header with Stats */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 mb-6">
          <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Instant AI-Powered Analysis
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Resume Skills Analysis
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Discover your skill gaps, get personalized learning paths, and find the perfect roles that match your expertise.
        </p>
        
        {/* Stats */}
        <div className="flex items-center justify-center space-x-8 mt-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">100+</div>
            <div className="text-sm text-gray-600">Tech Roles</div>
          </div>
          <div className="w-px h-8 bg-gray-300"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">600+</div>
            <div className="text-sm text-gray-600">Skills Tracked</div>
          </div>
          <div className="w-px h-8 bg-gray-300"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">&lt;3s</div>
            <div className="text-sm text-gray-600">Analysis Time</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Form */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Upload Your Resume
              </h2>
              <p className="text-gray-600">
                Paste your resume content below to get started with the analysis
              </p>
            </div>

            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Resume Text Area */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label htmlFor="resume" className="block text-sm font-semibold text-gray-900">
                      Resume Content *
                    </label>
                    <div className="text-sm text-gray-500">
                      {wordCount} words
                    </div>
                  </div>
                  <div className="relative">
                    <textarea
                      id="resume"
                      name="resume"
                      value={formData.resume}
                      onChange={handleChange}
                      placeholder="Paste your complete resume here including experience, skills, education, and projects..."
                      className="w-full px-6 py-5 border-2 border-gray-200 rounded-xl text-sm leading-relaxed resize-vertical focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      rows="16"
                      required
                    />
                    <div className="absolute top-4 right-4">
                      <div className="bg-white rounded-lg px-2 py-1 shadow-sm border border-gray-200">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Technical skills & frameworks
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Project descriptions
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Work experience
                    </div>
                  </div>
                </div>

                {/* Role and Level Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="role" className="block text-sm font-semibold text-gray-900 mb-4">
                      Target Role *
                    </label>
                    {loadingRoles ? (
                      <div className="px-6 py-5 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 text-center">
                        <svg className="animate-spin w-5 h-5 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading roles...
                      </div>
                    ) : (
                      <div className="relative">
                        <select
                          id="role"
                          name="role"
                          value={formData.role}
                          onChange={handleChange}
                          className="w-full px-6 py-5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white appearance-none"
                          required
                        >
                          <option value="">Choose your target role</option>
                          {availableRoles.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-6 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="level" className="block text-sm font-semibold text-gray-900 mb-4">
                      Experience Level *
                    </label>
                    <div className="relative">
                      <select
                        id="level"
                        name="level"
                        value={formData.level}
                        onChange={handleChange}
                        className="w-full px-6 py-5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white appearance-none"
                        required
                      >
                        <option value="entry">Entry Level (0-1 years)</option>
                        <option value="junior">Junior (1-3 years)</option>
                        <option value="senior">Senior (3+ years)</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-6 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="p-5 border-2 border-red-200 rounded-xl bg-red-50">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-red-800">
                        <span className="font-semibold">Analysis Error:</span> {error}
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading || !isFormValid}
                    className={`
                      w-full flex items-center justify-center px-8 py-5 rounded-xl text-base font-semibold transition-all duration-200 shadow-lg
                      ${loading || !isFormValid 
                        ? 'bg-gray-400 text-white cursor-not-allowed shadow-none' 
                        : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transform hover:scale-[1.02]'
                      }
                    `}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing Resume...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Analyze My Skills
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column - Enhanced Info Panel */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden sticky top-8">
            {/* Panel Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-8 text-white">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">
                  Comprehensive Analysis
                </h3>
                <p className="text-gray-300 text-sm">
                  Get detailed insights in seconds
                </p>
              </div>
            </div>

            <div className="p-6">
              {/* Features List */}
              <div className="space-y-5">
                {[
                  {
                    icon: "🎯",
                    title: "Skills Detection",
                    description: "AI-powered extraction of 600+ technical skills",
                    color: "from-blue-500 to-blue-600"
                  },
                  {
                    icon: "📊",
                    title: "Match Analysis", 
                    description: "Precise compatibility scoring with target roles",
                    color: "from-green-500 to-green-600"
                  },
                  {
                    icon: "🔍",
                    title: "Gap Identification",
                    description: "Pinpoint exactly what skills you need to learn",
                    color: "from-amber-500 to-amber-600"
                  },
                  {
                    icon: "🗺️",
                    title: "Learning Roadmap",
                    description: "Step-by-step path to reach your goals",
                    color: "from-purple-500 to-purple-600"
                  },
                  {
                    icon: "💼",
                    title: "Role Suggestions",
                    description: "Alternative careers that fit your skillset",
                    color: "from-gray-500 to-gray-600"
                  }
                ].map((feature, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors duration-200">
                    <div className="text-2xl">{feature.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1">{feature.title}</div>
                      <div className="text-sm text-gray-600">{feature.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Stats */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">98%</div>
                    <div className="text-xs text-gray-600">Accuracy Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">&lt;3s</div>
                    <div className="text-xs text-gray-600">Average Time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeForm;