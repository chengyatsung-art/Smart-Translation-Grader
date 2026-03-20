export interface Question {
  id: string;
  text: string;
  standardAnswer: string;
  maxPoints: number;
}

export interface ErrorDetail {
  errorText: string;
  explanation: string;
}

export interface QuestionGrading {
  questionId: string; // Should match the Question ID
  studentAnswerTranscription: string;
  markedUpAnswer?: string; // Answer with <<error>> markers
  score: number;
  feedback: string;
  errors?: ErrorDetail[];
}

export interface GradingResult {
  submissionId: string; // Link back to the input
  studentName?: string; // AI detected or User provided
  totalScore: number;
  maxTotalScore: number;
  details: QuestionGrading[];
}

export enum GradingStatus {
  DRAFT = 'DRAFT',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface StudentSubmission {
  id: string;
  name: string;
  images: File[];
  status: GradingStatus;
  result?: GradingResult;
  error?: string;
  createdAt: number;
}

export enum AppState {
  SETUP = 'SETUP',
  DASHBOARD = 'DASHBOARD'
}