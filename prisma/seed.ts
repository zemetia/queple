import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const mockQuestions = [
  {
    id: "1",
    content: "What is your biggest fear that you haven't told anyone?",
    forGender: "BOTH",
    level: 5,
    is18Plus: false,
    category: { id: "c7", name: "Personality" },
  },
  {
    id: "2",
    content: "If you could change one thing about your past, what would it be?",
    forGender: "BOTH",
    level: 7,
    is18Plus: false,
    category: { id: "c3", name: "What If" },
  },
  {
    id: "3",
    content: "What's the most adventurous thing you've ever done in bed?",
    forGender: "BOTH",
    level: 8,
    is18Plus: true,
    category: { id: "c1", name: "Secret" },
  },
  {
    id: "4",
    content: "Who was your first crush and why did you like them?",
    forGender: "BOTH",
    level: 3,
    is18Plus: false,
    category: { id: "c8", name: "Favorites" },
  },
  {
    id: "5",
    content: "What is a controversial opinion you hold?",
    forGender: "BOTH",
    level: 4,
    is18Plus: false,
    category: { id: "c7", name: "Personality" },
  },
  {
    id: "6",
    content: "Describe your ideal romantic date.",
    forGender: "BOTH",
    level: 2,
    is18Plus: false,
    category: { id: "c8", name: "Favorites" },
  },
  {
    id: "7",
    content: "What is the biggest lie you've ever told your parents?",
    forGender: "BOTH",
    level: 6,
    is18Plus: false,
    category: { id: "c1", name: "Secret" },
  },
  {
    id: "8",
    content: "Have you ever ghosted someone? Why?",
    forGender: "BOTH",
    level: 4,
    is18Plus: false,
    category: { id: "c6", name: "Case Study" },
  },
  {
    id: "9",
    content: "What turns you on the most intellectually?",
    forGender: "BOTH",
    level: 5,
    is18Plus: false,
    category: { id: "c7", name: "Personality" },
  },
  {
    id: "10",
    content: "If you had one week left to live, how would you spend it?",
    forGender: "BOTH",
    level: 9,
    is18Plus: false,
    category: { id: "c4", name: "Future" },
  },
  // --- MALE QUESTIONS ---
  {
    id: "11",
    content: "What is a compliment you wish you received more often?",
    forGender: "MALE",
    level: 4,
    is18Plus: false,
    category: { id: "c7", name: "Personality" },
  },
  {
    id: "12",
    content: "What does 'being a man' mean to you in today's world?",
    forGender: "MALE",
    level: 7,
    is18Plus: false,
    category: { id: "c7", name: "Personality" },
  },
  {
    id: "13",
    content: "What's something you find confusing about women?",
    forGender: "MALE",
    level: 3,
    is18Plus: false,
    category: { id: "c6", name: "Case Study" },
  },
  {
    id: "14",
    content: "How do you prefer to be comforted when you're stressed?",
    forGender: "MALE",
    level: 5,
    is18Plus: false,
    category: { id: "c7", name: "Personality" },
  },
  {
    id: "15",
    content: "What is your biggest insecurity in a relationship?",
    forGender: "MALE",
    level: 8,
    is18Plus: false,
    category: { id: "c2", name: "Privacy" },
  },

  // --- FEMALE QUESTIONS ---
  {
    id: "16",
    content: "What's a gesture that makes you feel most loved?",
    forGender: "FEMALE",
    level: 3,
    is18Plus: false,
    category: { id: "c8", name: "Favorites" },
  },
  {
    id: "17",
    content: "What is something you wish men understood better about women?",
    forGender: "FEMALE",
    level: 5,
    is18Plus: false,
    category: { id: "c6", name: "Case Study" },
  },
  {
    id: "18",
    content: "How has your relationship with your body changed over time?",
    forGender: "FEMALE",
    level: 8,
    is18Plus: false,
    category: { id: "c5", name: "Family" }, // Or Personality, fitting loosely
  },
  {
    id: "19",
    content: "What's your biggest turn-off in a partner?",
    forGender: "FEMALE",
    level: 4,
    is18Plus: false,
    category: { id: "c8", name: "Favorites" },
  },
  {
    id: "20",
    content: "What does 'femininity' mean to you?",
    forGender: "FEMALE",
    level: 7,
    is18Plus: false,
    category: { id: "c7", name: "Personality" },
  },
];

async function main() {
  console.log("Start seeding ...");

  // 1. Upsert System User
  const systemUser = await prisma.user.upsert({
    where: { id: "0000000000000000000000000" },
    update: {},
    create: {
      id: "0000000000000000000000000",
      email: "system@queple.com",
      image: "https://queple.com/logo.png",
      name: "Queple AI",
      location: "Internet",
      firebaseUid: "system-firebase-uid",
    },
  });

  console.log(`System user upserted: ${systemUser.name}`);

  // 2. Upsert Categories
  // Ensure all defined categories exist
  // Secret, Privacy, What If, Future, Family, Case Study, Personality, Favorites
  const categoriesList = [
    { id: "c1", name: "Secret" },
    { id: "c2", name: "Privacy" },
    { id: "c3", name: "What If" },
    { id: "c4", name: "Future" },
    { id: "c5", name: "Family" },
    { id: "c6", name: "Case Study" },
    { id: "c7", name: "Personality" },
    { id: "c8", name: "Favorites" },
  ];

  for (const cat of categoriesList) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name },
      create: { id: cat.id, name: cat.name },
    });
  }
  console.log(`Categories synced.`);

  // 3. Upsert Questions
  for (const q of mockQuestions) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {
        content: q.content,
        forGender: q.forGender, // "MALE", "FEMALE", "BOTH"
        level: q.level,
        is18Plus: q.is18Plus,
        categoryId: q.category.id,
        creatorId: systemUser.id,
      },
      create: {
        id: q.id,
        content: q.content,
        forGender: q.forGender,
        level: q.level,
        is18Plus: q.is18Plus,
        categoryId: q.category.id,
        creatorId: systemUser.id,
      },
    });
  }

  console.log(`Seeding finished. Added ${mockQuestions.length} questions.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
