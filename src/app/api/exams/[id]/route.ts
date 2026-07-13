import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Returns the exam's questions WITHOUT the correct answers. */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { id: "asc" },
        select: { id: true, prompt: true, optionsJson: true },
      },
    },
  });
  if (!exam) return NextResponse.json({ error: "No existe" }, { status: 404 });
  return NextResponse.json({ id: exam.id, title: exam.title, questions: exam.questions });
}
