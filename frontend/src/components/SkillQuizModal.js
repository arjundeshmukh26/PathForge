import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, fetchWithFallback } from '../config/api';
import AIProcessingIndicator from './AIProcessingIndicator';

const SkillQuizModal = ({ isOpen, skill, onClose, onPass, onFail }) => {
  const [quizData, setQuizData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [error, setError] = useState(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && skill) {
      fetchQuizData();
    } else {
      resetQuiz();
    }
  }, [isOpen, skill]);

  const resetQuiz = () => {
    setQuizData(null);
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setQuizResults(null);
    setError(null);
  };

  const fetchQuizData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchWithFallback(API_ENDPOINTS.getQuiz(skill));

      if (!response.ok) {
        throw new Error('Failed to load quiz questions');
      }

      const data = await response.json();
      setQuizData(data);
    } catch (error) {
      console.error('Quiz fetch error:', error);
      setError('Failed to load quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setIsLoading(true);

    try {
      // Check if all questions are answered
      const unansweredQuestions = quizData.questions.filter((_, index) => answers[index] === undefined);
      if (unansweredQuestions.length > 0) {
        alert(`Please answer all questions before submitting. ${unansweredQuestions.length} questions remaining.`);
        setIsLoading(false);
        return;
      }

      // Convert answers object to array with question IDs
      const answersArray = quizData.questions.map((question, index) => {
        const selectedOption = answers[index];
        
        // Validate the data before conversion
        const questionId = question.id;
        if (questionId === undefined || questionId === null) {
          throw new Error(`Question at index ${index} has invalid ID: ${questionId}`);
        }
        
        if (selectedOption === undefined || selectedOption === null) {
          throw new Error(`Answer for question ${questionId} is undefined or null`);
        }
        
        // Convert to integers, ensuring they're valid
        const parsedQuestionId = Number.isInteger(questionId) ? questionId : parseInt(questionId, 10);
        const parsedSelectedOption = Number.isInteger(selectedOption) ? selectedOption : parseInt(selectedOption, 10);
        
        if (isNaN(parsedQuestionId) || isNaN(parsedSelectedOption)) {
          throw new Error(`Invalid data - QuestionID: ${questionId} -> ${parsedQuestionId}, SelectedOption: ${selectedOption} -> ${parsedSelectedOption}`);
        }
        
        console.log(`Question ${parsedQuestionId}: selected option ${parsedSelectedOption}`);
        
        return {
          question_id: parsedQuestionId,
          selected_option: parsedSelectedOption
        };
      });

      console.log('Submitting quiz data:', {
        skill: skill,
        answers: answersArray,
        totalAnswers: answersArray.length
      });

      const submissionData = {
        skill: skill,
        answers: answersArray
      };

      console.log('Submitting quiz data:', submissionData);

      const response = await fetchWithFallback(API_ENDPOINTS.submitQuiz, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.detail || response.statusText || 'Failed to submit quiz';
        console.error('Quiz submission failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        });
        throw new Error(`Quiz submission failed (${response.status}): ${errorMessage}`);
      }

      const results = await response.json();
      setQuizResults(results);
      setShowResults(true);

      // Call parent callbacks
      if (results.passed) {
        onPass && onPass(skill, results);
      } else {
        onFail && onFail(skill, results);
      }
    } catch (error) {
      console.error('Quiz submission error:', error);
      setError('Failed to submit quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isQuizComplete = () => {
    return quizData && quizData.questions.every((_, index) => answers[index] !== undefined);
  };

  const getScoreColor = (score, total) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Skill Verification Quiz: {skill}
              </h2>
              {!showResults && (
                <p className="text-gray-600">
                  Complete this quiz to verify your {skill} knowledge. You need to score at least 3/5 to pass.
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="py-12">
              <AIProcessingIndicator 
                isVisible={true}
                message={showResults ? "Processing your answers..." : "Generating quiz questions"}
                className="mx-auto max-w-md"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          {showResults && quizResults && (
            <div className="space-y-6">
              {/* Results Summary */}
              <div className={`p-6 rounded-xl border-2 ${
                quizResults.passed 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="text-center">
                  <div className="text-4xl mb-4">
                    {quizResults.passed ? '🎉' : '📚'}
                  </div>
                  <h3 className={`text-2xl font-bold mb-2 ${
                    quizResults.passed ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {quizResults.passed ? 'Quiz Passed!' : 'More Study Needed'}
                  </h3>
                  <p className={`text-lg mb-4 ${getScoreColor(quizResults.score, quizResults.total_questions)}`}>
                    Score: {quizResults.score}/{quizResults.total_questions} 
                    ({Math.round((quizResults.score / quizResults.total_questions) * 100)}%)
                  </p>
                  <p className="text-gray-600">
                    {quizResults.passed 
                      ? `Congratulations! You've demonstrated solid ${skill} knowledge.`
                      : `You need at least ${quizResults.pass_threshold}/${quizResults.total_questions} correct answers to pass. Keep studying!`
                    }
                  </p>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Question Review</h4>
                {quizData.questions.map((question, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500">Q{index + 1}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                          {question.difficulty}
                        </span>
                        <div className={`w-4 h-4 rounded-full ${
                          answers[index] === quizResults.correct_answers[index] 
                            ? 'bg-green-500' 
                            : 'bg-red-500'
                        }`}></div>
                      </div>
                    </div>
                    <p className="text-gray-900 mb-3">{question.question}</p>
                    <div className="space-y-2 mb-3">
                      {question.options.map((option, optionIndex) => (
                        <div 
                          key={optionIndex} 
                          className={`p-2 rounded-lg border ${
                            optionIndex === quizResults.correct_answers[index]
                              ? 'bg-green-100 border-green-300 text-green-800'
                              : optionIndex === answers[index] && answers[index] !== quizResults.correct_answers[index]
                              ? 'bg-red-100 border-red-300 text-red-800'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="font-medium mr-2">{String.fromCharCode(65 + optionIndex)}.</span>
                            <span>{option}</span>
                            {optionIndex === quizResults.correct_answers[index] && (
                              <svg className="w-4 h-4 text-green-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {optionIndex === answers[index] && answers[index] !== quizResults.correct_answers[index] && (
                              <svg className="w-4 h-4 text-red-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {quizResults.explanations[index] && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-blue-800 text-sm">
                          <span className="font-medium">Explanation:</span> {quizResults.explanations[index]}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!showResults && !isLoading && !error && quizData && (
            <div>
              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Question {currentQuestion + 1} of {quizData.questions.length}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(quizData.questions[currentQuestion]?.difficulty)}`}>
                      {quizData.questions[currentQuestion]?.difficulty}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestion + 1) / quizData.questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Question */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {quizData.questions[currentQuestion]?.question}
                </h3>
                <div className="space-y-3">
                  {quizData.questions[currentQuestion]?.options.map((option, index) => (
                    <label
                      key={index}
                      className={`block p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        answers[currentQuestion] === index
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start">
                        <input
                          type="radio"
                          name={`question-${currentQuestion}`}
                          value={index}
                          checked={answers[currentQuestion] === index}
                          onChange={() => handleAnswerSelect(currentQuestion, index)}
                          className="mt-1 mr-3 text-blue-600"
                        />
                        <span className="flex-1">
                          <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                          {option}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!showResults && !isLoading && !error && quizData && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentQuestion === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Previous
              </button>

              <div className="text-sm text-gray-600">
                {Object.keys(answers).length}/{quizData.questions.length} answered
              </div>

              {currentQuestion < quizData.questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={!isQuizComplete()}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    isQuizComplete()
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        )}

        {showResults && (
          <div className="p-6 border-t border-gray-200 text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillQuizModal;