"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("Minha Empresa");
  const [slug, setSlug] = useState("minha-empresa");
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, company, slug }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Conta criada! Faça login.");
    } else {
      setMessage(data?.error?.message || "Erro");
    }
  };

  return (
    <div>
      <h2>Registrar</h2>
      <form onSubmit={onSubmit}>
        <input placeholder="Empresa" value={company} onChange={e=>setCompany(e.target.value)} /><br/>
        <input placeholder="Slug" value={slug} onChange={e=>setSlug(e.target.value)} /><br/>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} /><br/>
        <input placeholder="Senha" type="password" value={password} onChange={e=>setPassword(e.target.value)} /><br/>
        <button type="submit">Criar</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
