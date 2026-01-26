export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export interface Athlete {
  id: string;
  athlete_name: string;
  date_of_birth?: string;
  gender?: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  height_cm?: number;
  dominant_hand?: 'left' | 'right';
  profile_image_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Shot {
  id: string;
  session_id: string;
  shot_number: number;
  timestamp: string;
  landing_position_x: number;
  landing_position_y: number;
  target_position_x: number;
  target_position_y: number;
  accuracy_cm: number;
  accuracy_percent: number;
  velocity_kmh?: number;
  was_successful: boolean;
  court_zone?: string;
  detection_confidence?: number;
  in_box?: boolean;
  target_position_index?: number;
}

export interface TrainingSession {
  id: string;
  athlete: Athlete;
  coach: User;
  start_time: string;
  end_time?: string;
  status: 'active' | 'completed' | 'cancelled' | 'paused';
  total_shots: number;
  successful_shots: number;
  average_accuracy_percent?: number;
  average_shot_velocity_kmh?: number;
  target_zone?: string;
  session_notes?: string;
  session_rating?: number;
  shots?: Shot[];
  template_id?: string;
}

export interface ShotData {
  shotNumber: number;
  timestamp: string;
  targetPosition: { x: number; y: number };
  landingPosition: { x: number; y: number };
  velocity?: number;
  accuracy: number;
  inBox?: boolean;
  targetPositionIndex?: number;
}

// Target Templates Types
export interface TargetPosition {
  positionIndex: number;
  box: { x1: number; y1: number; x2: number; y2: number };
  dot: { x: number; y: number };
  label?: string;
}

export interface TargetTemplate {
  id: string;
  name: string;
  description?: string;
  positions: TargetPosition[];
}

