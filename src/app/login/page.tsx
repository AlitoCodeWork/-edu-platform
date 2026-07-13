"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) router.push("/perfil");
    else setErr((await res.json()).error ?? "Error");
  }

  return (
    <main className="container narrow">
      <h1>Entrar</h1>
      <form className="form" onSubmit={submit}>
        <label>Email
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </label>
        <label>Contraseña
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </label>
        {err && <p className="warn">{err}</p>}
        <button className="btn btn-primary" type="submit">Entrar</button>
      </form>
      <p className="muted">¿No tenés cuenta? <Link href="/registro">Crear una</Link></p>
    </main>
  );
}
