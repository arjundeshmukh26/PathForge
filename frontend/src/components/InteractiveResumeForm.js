import React, { useState, useEffect } from 'react';

const InteractiveResumeForm = ({ onAnalyze, isAnalyzing = false }) => {
  const [formData, setFormData] = useState({
    resume: '',
    role: '',
    level: 'entry'
  });
  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState({});
  const [wordCount, setWordCount] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    const words = formData.resume.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [formData.resume]);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredRoles(roles);
    } else {
      setFilteredRoles(categories[selectedCategory] || []);
    }
  }, [selectedCategory, roles, categories]);

  const fetchRoles = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/roles');
      const data = await response.json();
      setRoles(data.roles);
      setCategories(data.categories);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.resume.trim()) {
      errors.resume = 'Resume is required';
    } else if (formData.resume.trim().length < 50) {
      errors.resume = 'Resume must be at least 50 characters long';
    }
    
    if (!formData.role.trim()) {
      errors.role = 'Please select a role';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onAnalyze(formData);
    }
  };

  const exampleResumes = {
    frontend: "Experienced Frontend Developer with 3+ years building responsive web applications using React, JavaScript, TypeScript, and modern CSS frameworks. Proficient in state management with Redux, API integration, and performance optimization. Strong experience with Git, webpack, and testing frameworks like Jest and Cypress.",
    backend: "Backend Engineer with expertise in Python, FastAPI, and PostgreSQL. Experienced in building RESTful APIs, microservices architecture, and cloud deployment on AWS. Familiar with Docker, Redis, and automated testing with pytest. Strong knowledge of database design and system architecture.",
    fullstack: "Full Stack Developer combining frontend React expertise with Node.js backend development. Experience with MongoDB, Express.js, authentication systems, and deployment pipelines. Skilled in JavaScript/TypeScript, REST APIs, and modern development practices including Git workflows and testing."
  };

  const loadExample = (type) => {
    setFormData(prev => ({
      ...prev,
      resume: exampleResumes[type],
      role: type === 'frontend' ? 'Frontend Engineer' : 
            type === 'backend' ? 'Backend Engineer' : 'Full Stack Engineer'
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Enhanced Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Skill-Bridge Career Navigator
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Get instant feedback on your resume, identify skill gaps, and receive personalized learning recommendations for your target role.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Form Section */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-slate-50 to-gray-100 px-8 py-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Resume Analysis</h2>
              <p className="text-gray-600">Paste your resume and select your target position</p>
            </div>

            <div className="p-8 space-y-8">
              {/* Resume Input */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-lg font-bold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Resume Content
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-600">
                      {wordCount} words
                    </div>
                    {wordCount >= 50 && (
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    )}
                  </div>
                </div>
                
                <div className="relative">
                  <textarea
                    name="resume"
                    value={formData.resume}
                    onChange={handleInputChange}
                    placeholder="Paste your resume text here... Include your experience, skills, education, and projects."
                    className={`w-full h-64 px-6 py-4 text-base border-2 rounded-2xl bg-gray-50 focus:bg-white focus:border-slate-500 focus:outline-none transition-all duration-200 resize-none ${
                      formErrors.resume ? 'border-red-400 bg-red-50' : 'border-gray-200'
                    }`}
                    disabled={isAnalyzing}
                  />
                  {wordCount > 0 && (
                    <div className="absolute bottom-4 right-6 flex items-center space-x-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        wordCount >= 100 ? 'bg-emerald-100 text-emerald-800' :
                        wordCount >= 50 ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {wordCount >= 100 ? 'Excellent length' :
                         wordCount >= 50 ? 'Good length' : 'Too short'}
                      </div>
                    </div>
                  )}
                </div>
                
                {formErrors.resume && (
                  <p className="text-red-600 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formErrors.resume}
                  </p>
                )}

                {/* Quick Examples */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-semibold text-gray-700">Quick Examples:</span>
                  {[
                    { label: 'Frontend Dev', type: 'frontend' },
                    { label: 'Backend Dev', type: 'backend' },
                    { label: 'Full Stack', type: 'fullstack' }
                  ].map((example) => (
                    <button
                      key={example.type}
                      type="button"
                      onClick={() => loadExample(example.type)}
                      className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-slate-700 transition-colors"
                      disabled={isAnalyzing}
                    >
                      {example.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-4">
                <label className="text-lg font-bold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 002 2h2a2 2 0 012-2V6m0 0v6a2 2 0 01-2 2h-2a2 2 0 01-2 2v-2m0 0V6a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                  </svg>
                  Target Role
                </label>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {['all', ...Object.keys(categories)].map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        selectedCategory === category
                          ? 'bg-slate-800 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      disabled={isAnalyzing}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>

                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className={`w-full px-6 py-4 text-base border-2 rounded-2xl bg-gray-50 focus:bg-white focus:border-slate-500 focus:outline-none transition-all duration-200 ${
                    formErrors.role ? 'border-red-400 bg-red-50' : 'border-gray-200'
                  }`}
                  disabled={isAnalyzing}
                >
                  <option value="">Select a role...</option>
                  {filteredRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                
                {formErrors.role && (
                  <p className="text-red-600 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formErrors.role}
                  </p>
                )}
              </div>

              {/* Experience Level */}
              <div className="space-y-4">
                <label className="text-lg font-bold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Experience Level
                </label>
                
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'entry', label: 'Entry Level', desc: '0-1 years' },
                    { value: 'junior', label: 'Junior', desc: '1-3 years' },
                    { value: 'senior', label: 'Senior', desc: '3+ years' }
                  ].map((level) => (
                    <label
                      key={level.value}
                      className={`relative cursor-pointer p-4 rounded-2xl border-2 transition-all duration-200 ${
                        formData.level === level.value
                          ? 'border-slate-800 bg-slate-50'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="level"
                        value={level.value}
                        checked={formData.level === level.value}
                        onChange={handleInputChange}
                        className="sr-only"
                        disabled={isAnalyzing}
                      />
                      <div className="text-center">
                        <div className="font-bold text-gray-900 mb-1">{level.label}</div>
                        <div className="text-sm text-gray-600">{level.desc}</div>
                      </div>
                      {formData.level === level.value && (
                        <div className="absolute top-2 right-2">
                          <div className="w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isAnalyzing || !formData.resume.trim() || !formData.role.trim()}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-6 px-8 rounded-2xl text-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] transform"
              >
                {isAnalyzing ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Analyzing Resume...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Analyze My Resume</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Benefits Panel */}
        <div className="lg:col-span-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white h-full">
            <div className="h-full flex flex-col">
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-4">What You'll Get</h3>
                <p className="text-slate-300 leading-relaxed">
                  Our AI-powered analysis provides comprehensive insights to accelerate your career growth.
                </p>
              </div>

              <div className="space-y-6 flex-1">
                {[
                  {
                    title: 'Skills Analysis',
                    description: 'Detailed breakdown of your current skills vs role requirements',
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    )
                  },
                  {
                    title: 'Gap Identification',
                    description: 'Prioritized list of skills to learn for your target role',
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C20.832 18.477 19.247 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    )
                  },
                  {
                    title: 'Learning Resources',
                    description: 'Curated learning paths with free resources and tutorials',
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C20.832 18.477 19.247 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    )
                  },
                  {
                    title: 'Progress Tracking',
                    description: 'Mark skills as learned and watch your compatibility score improve',
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )
                  }
                ].map((feature, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-bold mb-2">{feature.title}</h4>
                      <p className="text-slate-300 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-white/10 rounded-2xl">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">Free Analysis</div>
                  <div className="text-slate-300 text-sm">
                    Get instant feedback with AI-powered insights
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default InteractiveResumeForm;