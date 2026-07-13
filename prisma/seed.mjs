import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function isoWeekKey(d) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

async function ensureExam(topicId, title, questions, opts = {}) {
  let exam = await prisma.exam.findFirst({ where: { title, topicId } });
  if (!exam) {
    exam = await prisma.exam.create({
      data: { title, topicId, isCompetition: !!opts.isCompetition, week: opts.week ?? null },
    });
    await prisma.question.createMany({
      data: questions.map((q) => ({
        examId: exam.id,
        prompt: q.prompt,
        optionsJson: q.options,
        correctIndex: q.correct,
      })),
    });
  }
  return exam;
}

async function main() {
  const cat = await prisma.category.upsert({
    where: { slug: "programacion" },
    update: {},
    create: { slug: "programacion", name: "Programación", sortOrder: 1 },
  });

  let topic = await prisma.topic.findFirst({
    where: { name: "Fundamentos de Python", categoryId: cat.id },
  });
  if (!topic) {
    topic = await prisma.topic.create({
      data: { name: "Fundamentos de Python", categoryId: cat.id },
    });
  }

  await ensureExam(topic.id, "Python básico", [
    { prompt: "¿Qué palabra clave define una función en Python?", options: ["func", "def", "function", "lambda"], correct: 1 },
    { prompt: "¿Cuál es el tipo de 3 / 2 en Python 3?", options: ["int", "float", "str", "error"], correct: 1 },
    { prompt: "¿Cómo se comenta una línea en Python?", options: ["// comentario", "-- comentario", "# comentario", "/* comentario */"], correct: 2 },
  ]);

  const week = isoWeekKey(new Date());
  const comp = await ensureExam(
    topic.id,
    `Reto semanal ${week}`,
    [
      { prompt: "¿Qué estructura NO permite duplicados en Python?", options: ["list", "tuple", "set", "dict values"], correct: 2 },
      { prompt: "¿Qué devuelve len('hola')?", options: ["3", "4", "5", "error"], correct: 1 },
      { prompt: "¿Qué operador es potencia en Python?", options: ["^", "**", "//", "%"], correct: 1 },
    ],
    { isCompetition: true, week }
  );

  await prisma.competition.upsert({
    where: { week },
    update: { examId: comp.id, title: `Reto semanal ${week}` },
    create: { week, examId: comp.id, title: `Reto semanal ${week}` },
  });

  console.log(`Seed OK — categoria, topic, examen y reto semanal (${week}) listos.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
