import { prisma } from "@/lib/db";
import { isoWeekKey } from "@/lib/week";
import { rankWeekly } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export default async function Ranking() {
  const week = isoWeekKey(new Date());

  const attempts = await prisma.attempt.findMany({
    where: { week },
    select: { userId: true, examId: true, score: true, week: true },
  });
  const ranked = rankWeekly(attempts, week);

  const users = await prisma.user.findMany({
    where: { id: { in: ranked.map((r) => r.userId) } },
    select: { id: true, name: true },
  });
  const nameOf = new Map(users.map((u) => [u.id, u.name]));

  return (
    <main className="container">
      <h1>Escalafón semanal <small className="muted">({week})</small></h1>
      <ol className="rank">
        {ranked.map((r) => (
          <li key={r.userId}>
            <span className="rank-pos">#{r.rank}</span>
            <span className="rank-name">{nameOf.get(r.userId) ?? "—"}</span>
            <b className="rank-total">{r.total}</b>
          </li>
        ))}
      </ol>
      {ranked.length === 0 && (
        <p className="muted">Todavía nadie puntuó esta semana. ¡Hacé un examen y liderá!</p>
      )}
    </main>
  );
}
