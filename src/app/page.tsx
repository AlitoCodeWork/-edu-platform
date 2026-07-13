import Link from "next/link";

const CATEGORIES = [
  { label: "Programación", q: "programming tutorial" },
  { label: "Redes y Seguridad", q: "networking security" },
  { label: "IA y Datos", q: "machine learning" },
  { label: "Sistemas Operativos", q: "operating systems" },
  { label: "Bases de Datos", q: "databases" },
  { label: "Documentales", q: "computer science documentary" },
  { label: "Libros", q: "computer science" },
  { label: "Papers", q: "algorithms" },
];

export default function Home() {
  return (
    <main className="container home">
      <h1 className="home-title">Aprendé informática, gratis</h1>
      <p className="home-sub">
        Videos, libros, papers, documentales y más — de fuentes libres y legales.
      </p>

      <form className="search" action="/buscar">
        <input name="q" placeholder="¿Qué querés aprender hoy?" />
        <button type="submit">Buscar</button>
      </form>

      <h2 className="section-title">Explorá por tema</h2>
      <div className="chips">
        {CATEGORIES.map((c) => (
          <Link key={c.q} className="chip" href={`/buscar?q=${encodeURIComponent(c.q)}`}>
            {c.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
