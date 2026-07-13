import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Examenes() {
  const exams = await prisma.exam.findMany({
    include: { topic: true, _count: { select: { questions: true } } },
    orderBy: [{ isCompetition: "desc" }, { title: "asc" }],
  });

  return (
    <main className="container">
      <h1>Exámenes</h1>
      <ul className="list">
        {exams.map((e) => (
          <li key={e.id}>
            <Link href={`/examen/${e.id}`}>{e.title}</Link>
            <small>
              {e.topic.name} · {e._count.questions} preguntas
              {e.isCompetition ? " · 🏆 Reto semanal" : ""}
            </small>
          </li>
        ))}
      </ul>
      {exams.length === 0 && <p className="muted">Todavía no hay exámenes.</p>}
    </main>
  );
}
