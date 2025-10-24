// User types
export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
  lastLoginAt?: Date;
}

export type UserRole = 'admin' | 'regular';

// Competition types
export interface Competition {
  year: number;
  startDate: Date;
  endDate: Date;
  status: CompetitionStatus;
  weighInDates: Date[];
  createdAt: Date;
  createdBy: string;
}

export type CompetitionStatus = 'active' | 'archived' | 'draft';

// Participant types
export interface Participant {
  userId: string;
  name: string;
  startWeight: number;
  joinedAt: Date;
  isActive: boolean;
}

// Weigh-in types
export interface WeighIn {
  weekNumber: number;
  weight: number;
  date: Date;
  timestamp: Date;
  notes?: string;
}

export interface WeighInSubmission {
  weekNumber: number;
  weight: number;
  notes?: string;
}

// Dashboard data types
export interface PersonalProgressData {
  week: number;
  weight: number;
  weightLoss: number;
  weightLossPercentage: number;
  weeklyChange: number;
}

export interface LeaderboardData {
  week: number;
  participants: {
    [userId: string]: {
      name: string;
      weightLossPercentage: number;
    };
  };
}

// Chart data types
export interface ChartDataPoint {
  week: number;
  weight: number;
  weightLossPercentage: number;
  weightLoss: number;
}

export interface ParticipantChartData {
  userId: string;
  name: string;
  data: ChartDataPoint[];
  color: string;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  
  displayName: string;
}

export interface WeighInFormData {
  weight: number;
  notes?: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Competition settings
export interface CompetitionSettings {
  startDate: Date;
  weighInDates: Date[];
  status: CompetitionStatus;
}

// Statistics types
export interface UserStats {
  userId: string;
  displayName: string;
  startWeight: number;
  currentWeight: number;
  totalWeightLoss: number;
  totalWeightLossPercentage: number;
  averageWeeklyLoss: number;
  weeksParticipated: number;
  totalWeighIns: number;
  lastWeighIn?: Date;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}
