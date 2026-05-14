export interface Schedule {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO 8601
  completed: boolean;
  createdAt: string;
}

export interface Course {
  id: string;
  name: string;
  teacher: string;
  classroom: string;
  dayOfWeek: 1 | 2 | 3 | 4 | 5;
  startPeriod: number;
  duration: 2 | 3;
  startWeek: number;
  endWeek: number;
  groupId: string;
  color: string;
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  author: string;
  content: string;
  excerpt: string;
  source: string;
  link?: string;
  publishedAt: string; // ISO 8601
  createdAt: string;
}
