export interface User {
  id: string;
  name: string;
  email: string;
  role: 'jobseeker' | 'recruiter' | 'admin';
  avatar?: string;
  isActive: boolean;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  salary: string;
  description: string;
  requirements: string[];
  skills: string[];
  postedDate: string;
  recruiterId: string;
  status: 'active' | 'inactive' | 'draft';
  applicants?: Applicant[];
}

export interface Applicant {
  id: string;
  userId: string;
  jobId: string;
  name: string;
  email: string;
  resume: string;
  coverLetter: string;
  status: 'applied' | 'shortlisted' | 'rejected' | 'hired';
  appliedDate: string;
  skilledScore: number;
}

export interface SkilledScore {
  overall: number;
  education: number;
  futureReadiness: number;
  skillsReadiness: number;
  geographic: number;
  topCountries: string[];
}

export interface Profile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  resume?: string;
  skilledScore: SkilledScore;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}