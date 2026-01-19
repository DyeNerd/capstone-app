export interface TestAthlete {
  athlete_name: string;
  date_of_birth: string;
  gender: string;
  skill_level: string;
  dominant_hand: string;
}

export const testAthletes: Record<string, TestAthlete> = {
  beginner: {
    athlete_name: 'John Doe',
    date_of_birth: '2000-01-01',
    gender: 'male',
    skill_level: 'beginner',
    dominant_hand: 'right',
  },
  intermediate: {
    athlete_name: 'Sarah Johnson',
    date_of_birth: '1999-06-15',
    gender: 'female',
    skill_level: 'intermediate',
    dominant_hand: 'right',
  },
  advanced: {
    athlete_name: 'Jane Smith',
    date_of_birth: '1998-05-15',
    gender: 'female',
    skill_level: 'advanced',
    dominant_hand: 'left',
  },
  expert: {
    athlete_name: 'Michael Chen',
    date_of_birth: '1997-03-22',
    gender: 'male',
    skill_level: 'expert',
    dominant_hand: 'right',
  },
};

/**
 * Generate a unique test athlete for each test run
 */
export function generateTestAthlete(skillLevel: string = 'beginner'): TestAthlete {
  const timestamp = Date.now();
  return {
    athlete_name: `Test Athlete ${timestamp}`,
    date_of_birth: '2000-01-01',
    gender: 'male',
    skill_level: skillLevel,
    dominant_hand: 'right',
  };
}
