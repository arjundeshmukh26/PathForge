/**
 * Local Storage utility for managing past analyses
 */
import { calculateCompatibilityScore, updateMissingSkills } from './scoringUtils';

const STORAGE_KEYS = {
  ANALYSES: 'skill_bridge_analyses',
  SETTINGS: 'skill_bridge_settings'
};

// Maximum number of analyses to store
const MAX_ANALYSES = 10;

/**
 * Save an analysis to localStorage
 * @param {Object} analysis - Analysis data with session_id, results, timestamp
 */
export const saveAnalysis = (analysis) => {
  try {
    const savedAnalyses = getAnalyses();
    
    // Add timestamp if not present
    if (!analysis.timestamp) {
      analysis.timestamp = new Date().toISOString();
    }
    
    // Add unique ID if not present
    if (!analysis.id) {
      analysis.id = analysis.session_id || generateId();
    }
    
    // Ensure we preserve all important fields for complete cached analysis
    const completeAnalysis = {
      id: analysis.id,
      session_id: analysis.session_id,
      resume: analysis.resume,
      role: analysis.role,
      level: analysis.level,
      compatibility_score: analysis.compatibility_score,
      user_skills: analysis.user_skills,
      matched_skills: analysis.matched_skills,
      missing_skills: analysis.missing_skills,
      ai_summary: analysis.ai_summary,
      suggested_roles: analysis.suggested_roles || [], // Store suggested roles
      learned_skills: analysis.learned_skills || [], // Track learned skills
      timestamp: analysis.timestamp,
      last_updated: new Date().toISOString()
    };
    
    console.log('localStorage saveAnalysis - storing resume:', {
      id: completeAnalysis.id,
      resumeLength: completeAnalysis.resume?.length || 0,
      resumePreview: completeAnalysis.resume?.substring(0, 100) || 'No resume'
    });
    
    // Remove old analysis if it exists (update case)
    const existingIndex = savedAnalyses.findIndex(a => a.id === analysis.id);
    if (existingIndex !== -1) {
      // Preserve learned skills from existing analysis if not provided in update
      if (!analysis.learned_skills && savedAnalyses[existingIndex].learned_skills) {
        completeAnalysis.learned_skills = savedAnalyses[existingIndex].learned_skills;
      }
      savedAnalyses[existingIndex] = completeAnalysis;
    } else {
      // Add new analysis to the beginning
      savedAnalyses.unshift(completeAnalysis);
    }
    
    // Keep only the most recent MAX_ANALYSES
    const trimmedAnalyses = savedAnalyses.slice(0, MAX_ANALYSES);
    
    localStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(trimmedAnalyses));
    
    return true;
  } catch (error) {
    console.error('Failed to save analysis to localStorage:', error);
    return false;
  }
};

/**
 * Update learned skills for an existing analysis
 * @param {string} analysisId - Analysis ID
 * @param {Array} learnedSkills - Array of learned skill names
 * @returns {boolean} Success status
 */
export const updateLearnedSkills = (analysisId, learnedSkills) => {
  try {
    const analyses = getAnalyses();
    
    // Try to find by id first, then by session_id as fallback
    let analysisIndex = analyses.findIndex(a => a.id === analysisId);
    if (analysisIndex === -1) {
      analysisIndex = analyses.findIndex(a => a.session_id === analysisId);
    }
    
    if (analysisIndex === -1) {
      console.warn('Analysis not found for learned skills update. Tried ID:', analysisId);
      console.warn('Available analyses:', analyses.map(a => ({ id: a.id, session_id: a.session_id })));
      return false;
    }
    
    console.log('Updating learned skills for analysis:', analyses[analysisIndex].id || analyses[analysisIndex].session_id);
    
    // Update the learned skills and last_updated timestamp
    analyses[analysisIndex].learned_skills = learnedSkills;
    analyses[analysisIndex].last_updated = new Date().toISOString();
    
    // Recalculate compatibility score using centralized utility (ensures consistency)
    const matchedSkills = analyses[analysisIndex].matched_skills || [];
    const missingSkills = analyses[analysisIndex].missing_skills || [];
    
    // Use centralized scoring calculation
    const scoreCalculation = calculateCompatibilityScore(matchedSkills, missingSkills, learnedSkills);
    analyses[analysisIndex].compatibility_score = scoreCalculation.score;
    
    // Update missing skills by removing learned ones
    analyses[analysisIndex].missing_skills = updateMissingSkills(missingSkills, learnedSkills);
    
    console.log('localStorage scoring update:', {
      analysisId: analyses[analysisIndex].id,
      learnedSkillsCount: learnedSkills.length,
      scoreDetails: scoreCalculation,
      newScore: scoreCalculation.score,
      remainingMissingSkills: analyses[analysisIndex].missing_skills.length
    });
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(analyses));
    
    console.log('Successfully updated learned skills in localStorage');
    return true;
  } catch (error) {
    console.error('Failed to update learned skills:', error);
    return false;
  }
};

/**
 * Get all saved analyses from localStorage
 * @returns {Array} Array of saved analyses
 */
export const getAnalyses = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ANALYSES);
    if (!stored) return [];
    
    const analyses = JSON.parse(stored);
    
    // Sort by timestamp, most recent first
    return analyses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    console.error('Failed to retrieve analyses from localStorage:', error);
    return [];
  }
};

/**
 * Get a specific analysis by ID
 * @param {string} id - Analysis ID
 * @returns {Object|null} Analysis data or null if not found
 */
export const getAnalysis = (id) => {
  const analyses = getAnalyses();
  const found = analyses.find(a => a.id === id) || null;
  
  if (found) {
    console.log('localStorage getAnalysis - retrieved resume:', {
      id: found.id,
      resumeLength: found.resume?.length || 0,
      resumePreview: found.resume?.substring(0, 100) || 'No resume'
    });
  }
  
  return found;
};

/**
 * Delete an analysis from localStorage
 * @param {string} id - Analysis ID to delete
 * @returns {boolean} Success status
 */
export const deleteAnalysis = (id) => {
  try {
    const analyses = getAnalyses();
    const filteredAnalyses = analyses.filter(a => a.id !== id);
    
    localStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(filteredAnalyses));
    return true;
  } catch (error) {
    console.error('Failed to delete analysis:', error);
    return false;
  }
};

/**
 * Clear all saved analyses
 * @returns {boolean} Success status
 */
export const clearAnalyses = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.ANALYSES);
    return true;
  } catch (error) {
    console.error('Failed to clear analyses:', error);
    return false;
  }
};

/**
 * Get analysis summary for display
 * @param {Object} analysis - Full analysis object
 * @returns {Object} Summary with key info for listing
 */
export const getAnalysisSummary = (analysis) => {
  if (!analysis) return null;
  
  return {
    id: analysis.id,
    title: `${analysis.role} - ${analysis.level}`,
    role: analysis.role,
    level: analysis.level,
    score: analysis.compatibility_score || 0,
    timestamp: analysis.timestamp,
    resumePreview: analysis.resume ? analysis.resume.substring(0, 100) + '...' : '',
    skillCount: analysis.user_skills ? analysis.user_skills.length : 0,
    missingSkillCount: analysis.missing_skills ? analysis.missing_skills.length : 0
  };
};

/**
 * Export analyses data for backup
 * @returns {string} JSON string of all analyses
 */
export const exportAnalyses = () => {
  const analyses = getAnalyses();
  return JSON.stringify(analyses, null, 2);
};

/**
 * Import analyses from backup
 * @param {string} jsonData - JSON string of analyses
 * @returns {boolean} Success status
 */
export const importAnalyses = (jsonData) => {
  try {
    const importedAnalyses = JSON.parse(jsonData);
    
    if (!Array.isArray(importedAnalyses)) {
      throw new Error('Invalid format: expected array');
    }
    
    // Validate each analysis has required fields
    const validAnalyses = importedAnalyses.filter(analysis => 
      analysis.id && analysis.role && analysis.timestamp
    );
    
    localStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(validAnalyses));
    return true;
  } catch (error) {
    console.error('Failed to import analyses:', error);
    return false;
  }
};

/**
 * Save user settings
 * @param {Object} settings - User preferences
 */
export const saveSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Failed to save settings:', error);
    return false;
  }
};

/**
 * Get user settings
 * @returns {Object} User settings
 */
export const getSettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to retrieve settings:', error);
    return {};
  }
};

/**
 * Generate a unique ID
 * @returns {string} Unique identifier
 */
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Check if localStorage is available
 * @returns {boolean} LocalStorage availability
 */
export const isStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get storage usage info
 * @returns {Object} Storage usage statistics
 */
export const getStorageInfo = () => {
  if (!isStorageAvailable()) {
    return { available: false };
  }
  
  const analyses = getAnalyses();
  const settings = getSettings();
  
  try {
    const analysesSize = JSON.stringify(analyses).length;
    const settingsSize = JSON.stringify(settings).length;
    const totalSize = analysesSize + settingsSize;
    
    return {
      available: true,
      analysesCount: analyses.length,
      analysesSize: Math.round(analysesSize / 1024 * 100) / 100, // KB
      settingsSize: Math.round(settingsSize / 1024 * 100) / 100, // KB
      totalSize: Math.round(totalSize / 1024 * 100) / 100, // KB
      maxAnalyses: MAX_ANALYSES
    };
  } catch (error) {
    return { available: true, error: error.message };
  }
};

/**
 * Get unique resumes from stored analyses for resume selection
 * @returns {Array} Array of unique resume objects
 */
export const getUniqueResumes = () => {
  if (!isStorageAvailable()) {
    return [];
  }
  
  try {
    const analyses = getAnalyses();
    console.log('getUniqueResumes: Total analyses found:', analyses.length);
    
    const analysesWithResumes = analyses.filter(analysis => analysis.resume && analysis.resume.trim().length >= 50);
    console.log('getUniqueResumes: Analyses with valid resumes:', analysesWithResumes.length);
    
    if (analysesWithResumes.length > 0) {
      console.log('getUniqueResumes: Sample analysis resume length:', analysesWithResumes[0].resume?.length || 0);
    }
    
    const resumes = analysesWithResumes
      .map(analysis => ({
        id: analysis.id,
        text: analysis.resume,
        preview: analysis.resume.substring(0, 200) + (analysis.resume.length > 200 ? '...' : ''),
        role: analysis.role,
        level: analysis.level,
        timestamp: analysis.timestamp,
        length: analysis.resume.length
      }))
      .filter((resume, index, arr) => 
        // Remove duplicates based on resume content
        arr.findIndex(r => r.text === resume.text) === index
      )
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Most recent first
    
    console.log('getUniqueResumes: Final unique resumes count:', resumes.length);
    return resumes;
  } catch (error) {
    console.error('Failed to get unique resumes:', error);
    return [];
  }
};