export type Subject = "语文" | "数学" | "英语";

export const SUBJECTS: Subject[] = ["语文", "数学", "英语"];

export interface User {
  id: number;
  email: string;
  nickname: string;
  createdAt: string;
}

export interface Mistake {
  id: number;
  userId: number;
  subject: Subject;
  questionText: string;
  questionImages: string[]; // parsed from JSON
  explanationText: string;
  explanationImages: string[]; // parsed from JSON
  isMastered: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MistakeWithStats extends Mistake {
  totalPractices: number;
  totalCorrect: number;
  totalWrong: number;
  consecutiveCorrect: number;
  correctRate: number; // percentage
}

export interface PracticeSession {
  id: number;
  userId: number;
  name: string;
  isRandom: boolean;
  randomRules: RandomRules | null;
  status: "in_progress" | "submitted" | "graded";
  gradedBy: number | null;
  createdAt: string;
  updatedAt: string;
  items?: PracticeSessionItem[];
}

export interface PracticeSessionItem {
  id: number;
  sessionId: number;
  mistakeId: number;
  userAnswer: string;
  isCorrect: boolean | null;
  createdAt: string;
  mistake?: Mistake;
}

export interface RandomRules {
  count: number;
  orderBy: "practices" | "errors" | "random";
  orderDir: "asc" | "desc";
  subject?: Subject; // optional filter by subject
}

export interface CreateMistakeInput {
  subject: Subject;
  questionText: string;
  questionImages: string[];
  explanationText: string;
  explanationImages: string[];
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
}

export interface MistakeStats {
  mistakeId: number;
  totalPractices: number;
  totalCorrect: number;
  totalWrong: number;
  consecutiveCorrect: number;
  correctRate: number;
}
