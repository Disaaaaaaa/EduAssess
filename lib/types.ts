export type Language = "kz" | "ru" | "en";
export type Role = "teacher" | "evaluator" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  school_id: string | null;
}

export interface School {
  id: string;
  name: string;
}

export interface Class {
  id: string;
  name: string;
  school_id: string;
}

export interface Student {
  id: string;
  name: string;
  class_id: string;
}

export interface TeacherEvaluation {
  id: string;
  evaluator_id: string;
  teacher_id: string;
  answers: Record<number, boolean>; // { 1: true, 2: false, ... }
  score: number;
  feedback_id: string | null;
  created_at: string;
}

export interface StudentEvaluation {
  id: string;
  teacher_id: string;
  student_id: string;
  scores: Record<number, number>; // { 1: 3, 2: 2, ... }
  total: number;
  feedback_id: string | null;
  created_at: string;
}

export interface Feedback {
  id: string;
  evaluation_id: string;
  eval_type: "teacher" | "student";
  summary: string;
  strengths: string;
  weaknesses: string;
  suggestions: string;
}
