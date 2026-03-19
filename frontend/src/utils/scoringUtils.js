/**
 * Utility functions for consistent compatibility score calculations
 * Ensures weight-based scoring is used throughout the application
 */

/**
 * Calculate compatibility score using weight-based algorithm (consistent with backend)
 * 
 * @param {Array} matchedSkills - Array of matched skills with weights
 * @param {Array} missingSkills - Array of missing skills with weights  
 * @param {Array} learnedSkills - Array of skill names that have been learned
 * @returns {Object} Score calculation details
 */
export const calculateCompatibilityScore = (matchedSkills = [], missingSkills = [], learnedSkills = []) => {
  // Ensure we have arrays to work with
  const matched = Array.isArray(matchedSkills) ? matchedSkills : [];
  const missing = Array.isArray(missingSkills) ? missingSkills : [];
  const learned = Array.isArray(learnedSkills) ? learnedSkills : [];
  
  // Calculate total weight from all original skills (matched + missing)
  const totalWeight = matched.reduce((sum, skill) => sum + (skill.weight || 1), 0) + 
                     missing.reduce((sum, skill) => sum + (skill.weight || 1), 0);
  
  if (totalWeight === 0) {
    return {
      score: 0,
      totalWeight: 0,
      matchedWeight: 0,
      learnedWeight: 0,
      totalMatchedWeight: 0,
      details: 'No skills to evaluate'
    };
  }
  
  // Calculate original matched weight
  const matchedWeight = matched.reduce((sum, skill) => sum + (skill.weight || 1), 0);
  
  // Calculate learned skills weight (from missing skills that were learned)
  const learnedSkillsSet = new Set(learned);
  const learnedWeight = missing
    .filter(skill => learnedSkillsSet.has(skill.skill))
    .reduce((sum, skill) => sum + (skill.weight || 1), 0);
  
  // Total matched weight = originally matched + newly learned
  const totalMatchedWeight = matchedWeight + learnedWeight;
  
  // Weight-based score calculation
  const rawScore = (totalMatchedWeight / totalWeight) * 100;
  
  // Ensure score is between 0 and 100, rounded to 1 decimal place
  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore * 10) / 10));
  
  return {
    score: finalScore,
    totalWeight,
    matchedWeight,
    learnedWeight,
    totalMatchedWeight,
    rawScore,
    details: `${totalMatchedWeight}/${totalWeight} weighted skills matched`
  };
};

/**
 * Update missing skills by removing learned ones
 * 
 * @param {Array} missingSkills - Original missing skills array
 * @param {Array} learnedSkills - Array of learned skill names
 * @returns {Array} Updated missing skills array
 */
export const updateMissingSkills = (missingSkills = [], learnedSkills = []) => {
  if (!Array.isArray(missingSkills) || !Array.isArray(learnedSkills)) {
    return missingSkills || [];
  }
  
  const learnedSkillsSet = new Set(learnedSkills);
  return missingSkills.filter(skill => !learnedSkillsSet.has(skill.skill));
};

/**
 * Validate and normalize skills data structure
 * 
 * @param {Array} skills - Skills array to validate
 * @returns {Array} Validated skills array
 */
export const validateSkillsData = (skills) => {
  if (!Array.isArray(skills)) {
    return [];
  }
  
  return skills.filter(skill => {
    return skill && 
           typeof skill === 'object' && 
           typeof skill.skill === 'string' && 
           skill.skill.trim() !== '';
  }).map(skill => ({
    ...skill,
    weight: typeof skill.weight === 'number' && skill.weight > 0 ? skill.weight : 1,
    resources: Array.isArray(skill.resources) ? skill.resources : []
  }));
};

/**
 * Debug scoring calculation - provides detailed breakdown
 * 
 * @param {Array} matchedSkills - Matched skills
 * @param {Array} missingSkills - Missing skills  
 * @param {Array} learnedSkills - Learned skills
 * @returns {Object} Detailed scoring breakdown
 */
export const debugScoring = (matchedSkills, missingSkills, learnedSkills) => {
  const calculation = calculateCompatibilityScore(matchedSkills, missingSkills, learnedSkills);
  
  const learnedSkillsSet = new Set(learnedSkills || []);
  const learnedSkillDetails = (missingSkills || [])
    .filter(skill => learnedSkillsSet.has(skill.skill))
    .map(skill => ({ skill: skill.skill, weight: skill.weight || 1 }));
  
  return {
    ...calculation,
    breakdown: {
      matchedSkills: (matchedSkills || []).map(s => ({ skill: s.skill, weight: s.weight || 1 })),
      missingSkills: (missingSkills || []).map(s => ({ skill: s.skill, weight: s.weight || 1 })),
      learnedSkillDetails,
      learnedSkillNames: learnedSkills || []
    }
  };
};