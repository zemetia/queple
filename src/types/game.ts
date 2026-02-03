export type Gender = "MALE" | "FEMALE" | "BOTH";

export interface Topic {
  id: string;
  name: string;
}

export interface Question {
  id: string;
  content: string;
  forGender: Gender;
  level: number;
  is18Plus: boolean;
  topic?: Topic;
  topicId?: string;
  category?: Topic;
  creatorId?: string;
  viewersCount?: number;
  upvotes?: number;
  downvotes?: number;
}
