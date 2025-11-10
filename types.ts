export interface Job {
  title: string;
  company: string;
  description: string;
  techStack: string[];
  experienceLevel: string;
  relevance: number; 
}

export enum AppView {
  JOB_MATCH = 'Job Match',
  RESUME_REVIEW = 'Resume Review',
}