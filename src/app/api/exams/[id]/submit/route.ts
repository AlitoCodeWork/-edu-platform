import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current";
import { scoreAttempt } from "@/lib/exam/score";
import { isoWeekKey } from "@/lib/week";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await ctx.params;
  const { answers } = await req.json();

  const questions = await prisma.question.findMany({
    where: { examId: id },
    orderBy: { id: "asc" },
    select: { correctIndex: true },
  });
  if (questions.length === 0) {
    return NextResponse.json({ error: "Examen sin preguntas" }, { status: 400 });
  }

  const correct = questions.map((q) => q.correctIndex);
  const { score, maxScore } = scoreAttempt(
    correct,
    Array.isArray(answers) ? answers : []
  );
  const week = isoWeekKey(new Date());

  await prisma.attempt.create({
    data: { userId: user.id, examId: id, score, maxScore, week },
  });

  return NextResponse.json({ score, maxScore });
}
