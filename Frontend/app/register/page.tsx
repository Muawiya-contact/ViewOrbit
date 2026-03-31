"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { user, register, loading } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [walletType, setWalletType] = useState<"JazzCash" | "EasyPaisa">("JazzCash");
  const [walletNumber, setWalletNumber] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password.trim().length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);

    try {
      await register(email.trim(), password, walletType, walletNumber.trim());
      router.replace("/dashboard");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <h1 className="mb-6 text-2xl font-semibold">Register</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full rounded border border-gray-300 px-3 py-2 text-black"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full rounded border border-gray-300 px-3 py-2 text-black"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={6}
          required
        />
        <select
          aria-label="Wallet type"
          className="w-full rounded border border-gray-300 px-3 py-2 text-black"
          value={walletType}
          onChange={(event) => setWalletType(event.target.value as "JazzCash" | "EasyPaisa")}
          required
        >
          <option value="JazzCash">JazzCash</option>
          <option value="EasyPaisa">EasyPaisa</option>
        </select>
        <input
          type="text"
          placeholder="Wallet number"
          className="w-full rounded border border-gray-300 px-3 py-2 text-black"
          value={walletNumber}
          onChange={(event) => setWalletNumber(event.target.value)}
          required
        />
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <button
          type="submit"
          className="w-full rounded bg-blue-600 px-4 py-2 text-white"
          disabled={submitting}
        >
          {submitting ? "Creating account..." : "Register"}
        </button>
      </form>
      <p className="mt-4 text-sm">
        Already have an account? <Link className="text-blue-400" href="/login">Login</Link>
      </p>
    </main>
  );
}
