import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Perfil() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const attempts = await prisma.attempt.findMany({
    where: { userId: user.id },
    include: { exam: { include: { topic: true } } },
    orderBy: { createdAt: "desc" },
  });

  const total = attempts.length;
  const avg = total
    ? Math.round((attempts.reduce((s, a) => s + a.score / a.maxScore, 0) / total) * 100)
    : 0;
  const topics = new Set(attempts.map((a) => a.exam.topic.name)).size;

  return (
    <main className="container">
      <h1>Hola, {user.name}</h1>
      <div className="stats">
        <div className="stat"><b>{total}</b><span>exámenes</span></div>
        <div className="stat"><b>{avg}%</b><span>promedio</span></div>
        <div className="stat"><b>{topics}</b><span>temas</span></div>
      </div>

      <h2 className="section-title">Historial</h2>
      <ul className="list">
        {attempts.map((a) => (
          <li key={a.id}>
            <span>{a.exam.title}</span>
            <small>{a.score}/{a.maxScore} · {a.week}</small>
          </li>
        ))}
      </ul>
      {total === 0 && <p className="muted">Todavía no hiciste ningún examen.</p>}

      <form action="/api/auth/logout" method="post" style={{ marginTop: 24 }}>
        <button className="btn" type="submit">Cerrar sesión</button>
      </form>
    </main>
  );
}
