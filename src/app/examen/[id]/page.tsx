"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Q {
  id: string;
  prompt: string;
  optionsJson: string[];
}

export default function TomarExamen({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [exam, setExam] = useState<{ title: string; questions: Q[] } | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`/api/exams/${id}`)
      .then((r) => r.json())
      .then(setExam);
  }, [id]);

  async function submit() {
    if (!exam) return;
    const arr = exam.questions.map((_, i) => (i in answers ? answers[i] : -1));
    const res = await fetch(`/api/exams/${id}/submit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answers: arr }),
    });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (!res.ok) {
      setErr("No se pudo enviar el examen.");
      return;
    }
    setResult(await res.json());
  }

  if (!exam) return <main className="container"><p className="muted">Cargando…</p></main>;

  if (result) {
    return (
      <main className="container narrow">
        <h1>{exam.title}</h1>
        <p className="score">Puntaje: {result.score} / {result.maxScore}</p>
        <a className="btn btn-primary" href="/ranking">Ver escalafón</a>
      </main>
    );
  }

  return (
    <main className="container narrow">
      <h1>{exam.title}</h1>
      {exam.questions.map((q, i) => (
        <div key={q.id} className="question">
          <p className="q-prompt">{i + 1}. {q.prompt}</p>
          {q.optionsJson.map((opt, oi) => (
            <label key={oi} className="q-option">
              <input
                type="radio"
                name={`q${i}`}
                checked={answers[i] === oi}
                onChange={() => setAnswers((a) => ({ ...a, [i]: oi }))}
              />
              {opt}
            </label>
          ))}
        </div>
      ))}
      {err && <p className="warn">{err}</p>}
      <button className="btn btn-primary" onClick={submit}>Enviar</button>
    </main>
  );
}
