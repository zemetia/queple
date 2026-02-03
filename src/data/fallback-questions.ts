import { Question } from "@prisma/client";

const SYSTEM_CREATOR_ID = "0000000000000000000000000";

const STATIC_QUESTIONS = [
  // --- BOTH ---
  {
    content: "What is your biggest fear that you haven't told anyone?",
    forGender: "BOTH",
    level: 5,
    categoryId: "c7",
    is18Plus: false,
  },
  {
    content: "If you could change one thing about your past, what would it be?",
    forGender: "BOTH",
    level: 7,
    categoryId: "c3",
    is18Plus: false,
  },
  {
    content: "What's the most adventurous thing you've ever done in bed?",
    forGender: "BOTH",
    level: 8,
    categoryId: "c1",
    is18Plus: true,
  },
  {
    content: "Who was your first crush and why did you like them?",
    forGender: "BOTH",
    level: 3,
    categoryId: "c8",
    is18Plus: false,
  },
  {
    content: "What is a controversial opinion you hold?",
    forGender: "BOTH",
    level: 4,
    categoryId: "c7",
    is18Plus: false,
  },
  {
    content: "Describe your ideal romantic date.",
    forGender: "BOTH",
    level: 2,
    categoryId: "c8",
    is18Plus: false,
  },
  {
    content: "What is the biggest lie you've ever told your parents?",
    forGender: "BOTH",
    level: 6,
    categoryId: "c1",
    is18Plus: false,
  },
  {
    content: "Have you ever ghosted someone? Why?",
    forGender: "BOTH",
    level: 4,
    categoryId: "c6",
    is18Plus: false,
  },
  {
    content: "What turns you on the most intellectually?",
    forGender: "BOTH",
    level: 5,
    categoryId: "c7",
    is18Plus: false,
  },
  {
    content: "If you had one week left to live, how would you spend it?",
    forGender: "BOTH",
    level: 9,
    categoryId: "c4",
    is18Plus: false,
  },
  {
    content: "What is the most meaningful gift you have ever received?",
    forGender: "BOTH",
    level: 3,
    categoryId: "c8",
    is18Plus: false,
  },
  {
    content: "What is a memory that always makes you smile?",
    forGender: "BOTH",
    level: 2,
    categoryId: "c8",
    is18Plus: false,
  },

  // --- MALE ---
  {
    content: "What is a compliment you wish you received more often?",
    forGender: "MALE",
    level: 4,
    categoryId: "c7",
    is18Plus: false,
  },
  {
    content: "What does 'being a man' mean to you in today's world?",
    forGender: "MALE",
    level: 7,
    categoryId: "c7",
    is18Plus: false,
  },
  {
    content: "What's something you find confusing about women?",
    forGender: "MALE",
    level: 3,
    categoryId: "c6",
    is18Plus: false,
  },
  {
    content: "How do you prefer to be comforted when you're stressed?",
    forGender: "MALE",
    level: 5,
    categoryId: "c7",
    is18Plus: false,
  },
  {
    content: "What is your biggest insecurity in a relationship?",
    forGender: "MALE",
    level: 8,
    categoryId: "c2",
    is18Plus: false,
  },
  {
    content: "When was the last time you cried, and why?",
    forGender: "MALE",
    level: 6,
    categoryId: "c2",
    is18Plus: false,
  },
  {
    content: "What puts you in the mood instantly?",
    forGender: "MALE",
    level: 7,
    categoryId: "c2",
    is18Plus: true,
  },
  {
    content: "What is a hobby you would love to start if you had the time?",
    forGender: "MALE",
    level: 2,
    categoryId: "c8",
    is18Plus: false,
  },

  // --- FEMALE ---
  {
    content: "What's a gesture that makes you feel most loved?",
    forGender: "FEMALE",
    level: 3,
    categoryId: "c8",
    is18Plus: false,
  },
  {
    content: "What is something you wish men understood better about women?",
    forGender: "FEMALE",
    level: 5,
    categoryId: "c6",
    is18Plus: false,
  },
  {
    content: "How has your relationship with your body changed over time?",
    forGender: "FEMALE",
    level: 8,
    categoryId: "c5",
    is18Plus: false,
  },
  {
    content: "What's your biggest turn-off in a partner?",
    forGender: "FEMALE",
    level: 4,
    categoryId: "c8",
    is18Plus: false,
  },
  {
    content: "What does 'femininity' mean to you?",
    forGender: "FEMALE",
    level: 7,
    categoryId: "c7",
    is18Plus: false,
  },
  {
    content: "What is one thing you need more of in the bedroom?",
    forGender: "FEMALE",
    level: 8,
    categoryId: "c2",
    is18Plus: true,
  },
  {
    content: "Who is the strongest woman you know?",
    forGender: "FEMALE",
    level: 3,
    categoryId: "c8",
    is18Plus: false,
  },
  {
    content: "What makes you feel most empowered?",
    forGender: "FEMALE",
    level: 5,
    categoryId: "c7",
    is18Plus: false,
  },
];

export const getFallbackQuestions = (
  gender: string,
  count: number,
  excludeIds: Set<string> = new Set(),
): Question[] => {
  const filtered = STATIC_QUESTIONS.filter(
    (q) =>
      (gender === "BOTH" ? true : q.forGender === gender) &&
      !excludeIds.has(q.content), // approximate dedup by content for static
  );

  // Shuffle
  const shuffled = filtered.sort(() => 0.5 - Math.random());

  return shuffled.slice(0, count).map(
    (q, i) =>
      ({
        id: `fallback-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        content: q.content,
        forGender: q.forGender,
        level: q.level,
        is18Plus: q.is18Plus,
        categoryId: q.categoryId,
        creatorId: SYSTEM_CREATOR_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
        upvotes: 0,
        downvotes: 0,
        viewersCount: 0,
        averageTime: 0,
      }) as Question,
  );
};
