"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Registro() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) router.push("/perfil");
    else setErr((await res.json()).error ?? "Error");
  }

  return (
    <main className="container narrow">
      <h1>Crear cuenta</h1>
      <form className="form" onSubmit={submit}>
        <label>Nombre
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label>Email
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </label>
        <label>Contraseña
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </label>
        {err && <p className="warn">{err}</p>}
        <button className="btn btn-primary" type="submit">Registrarme</button>
      </form>
      <p className="muted">¿Ya tenés cuenta? <Link href="/login">Entrar</Link></p>
    </main>
  );
}
