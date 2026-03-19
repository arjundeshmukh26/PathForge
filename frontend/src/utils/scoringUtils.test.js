/**
 * Tests for scoring utilities to ensure consistent and correct calculations
 */
import { calculateCompatibilityScore, updateMissingSkills, debugScoring } from './scoringUtils';

// Test data setup
const mockMatchedSkills = [
  { skill: 'JavaScript', weight: 3 },
  { skill: 'React', weight: 4 }
];

const mockMissingSkills = [
  { skill: 'TypeScript', weight: 3 },
  { skill: 'Node.js', weight: 4 },
  { skill: 'Docker', weight: 2 }
];

describe('Scoring Utils', () => {
  describe('calculateCompatibilityScore', () => {
    test('calculates correct score with no learned skills', () => {
      const result = calculateCompatibilityScore(mockMatchedSkills, mockMissingSkills, []);
      
      // Total weight: 3+4 (matched) + 3+4+2 (missing) = 16
      // Matched weight: 3+4 = 7
      // Score: (7/16) * 100 = 43.75 ≈ 43.8
      expect(result.score).toBe(43.8);
      expect(result.totalWeight).toBe(16);
      expect(result.matchedWeight).toBe(7);
      expect(result.learnedWeight).toBe(0);
    });

    test('calculates correct score with learned skills', () => {
      const learnedSkills = ['TypeScript', 'Docker'];
      const result = calculateCompatibilityScore(mockMatchedSkills, mockMissingSkills, learnedSkills);
      
      // Total weight: 16 (same as above)
      // Matched weight: 7 (original)
      // Learned weight: 3 (TypeScript) + 2 (Docker) = 5
      // Total matched: 7 + 5 = 12
      // Score: (12/16) * 100 = 75
      expect(result.score).toBe(75);
      expect(result.totalWeight).toBe(16);
      expect(result.matchedWeight).toBe(7);
      expect(result.learnedWeight).toBe(5);
      expect(result.totalMatchedWeight).toBe(12);
    });

    test('never exceeds 100% score', () => {
      const allSkills = ['TypeScript', 'Node.js', 'Docker'];
      const result = calculateCompatibilityScore(mockMatchedSkills, mockMissingSkills, allSkills);
      
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.score).toBe(100); // Should be exactly 100% when all skills learned
    });

    test('handles edge cases correctly', () => {
      // Empty arrays
      expect(calculateCompatibilityScore([], [], []).score).toBe(0);
      
      // Null/undefined inputs
      expect(calculateCompatibilityScore(null, undefined, null).score).toBe(0);
      
      // Invalid learned skills (not in missing)
      const result = calculateCompatibilityScore(mockMatchedSkills, mockMissingSkills, ['InvalidSkill']);
      expect(result.learnedWeight).toBe(0);
    });
  });

  describe('updateMissingSkills', () => {
    test('removes learned skills from missing skills', () => {
      const learnedSkills = ['TypeScript', 'Docker'];
      const result = updateMissingSkills(mockMissingSkills, learnedSkills);
      
      expect(result).toHaveLength(1);
      expect(result[0].skill).toBe('Node.js');
    });

    test('handles edge cases', () => {
      // Empty learned skills
      expect(updateMissingSkills(mockMissingSkills, [])).toEqual(mockMissingSkills);
      
      // Empty missing skills
      expect(updateMissingSkills([], ['anything'])).toEqual([]);
      
      // Invalid inputs
      expect(updateMissingSkills(null, null)).toEqual([]);
    });
  });

  describe('debugScoring', () => {
    test('provides detailed breakdown', () => {
      const learnedSkills = ['TypeScript'];
      const result = debugScoring(mockMatchedSkills, mockMissingSkills, learnedSkills);
      
      expect(result).toHaveProperty('breakdown');
      expect(result.breakdown).toHaveProperty('matchedSkills');
      expect(result.breakdown).toHaveProperty('missingSkills');
      expect(result.breakdown).toHaveProperty('learnedSkillDetails');
      expect(result.breakdown.learnedSkillDetails).toHaveLength(1);
      expect(result.breakdown.learnedSkillDetails[0].skill).toBe('TypeScript');
    });
  });

  describe('score consistency', () => {
    test('score should always increase or stay same when learning skills', () => {
      const initialScore = calculateCompatibilityScore(mockMatchedSkills, mockMissingSkills, []).score;
      
      // Learn one skill
      const scoreAfterOne = calculateCompatibilityScore(mockMatchedSkills, mockMissingSkills, ['TypeScript']).score;
      expect(scoreAfterOne).toBeGreaterThanOrEqual(initialScore);
      
      // Learn another skill
      const scoreAfterTwo = calculateCompatibilityScore(mockMatchedSkills, mockMissingSkills, ['TypeScript', 'Docker']).score;
      expect(scoreAfterTwo).toBeGreaterThanOrEqual(scoreAfterOne);
    });

    test('weight-based vs count-based produces different results', () => {
      // High weight skill
      const highWeightMissing = [{ skill: 'Senior Skill', weight: 10 }];
      const lowWeightMissing = Array(10).fill(0).map((_, i) => ({ skill: `Skill${i}`, weight: 1 }));
      
      const matched = [{ skill: 'Basic Skill', weight: 1 }];
      
      // Learning the high-weight skill should give better score than learning multiple low-weight skills
      const highWeightResult = calculateCompatibilityScore(matched, highWeightMissing, ['Senior Skill']);
      const lowWeightResult = calculateCompatibilityScore(matched, lowWeightMissing, ['Skill0', 'Skill1']);
      
      // With weight-based calculation, learning the high-weight skill should be more impactful
      expect(highWeightResult.score).toBeGreaterThan(lowWeightResult.score);
    });
  });
});