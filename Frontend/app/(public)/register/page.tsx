"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";

interface RegisterErrors {
  fullName?: string;
  email?: string;
  password?: string;
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<RegisterErrors>({});

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: RegisterErrors = {};
    if (fullName.trim().length < 3) nextErrors.fullName = "Name must be at least 3 characters.";
    if (!email.includes("@")) nextErrors.email = "Enter a valid email address.";
    if (password.length < 6) nextErrors.password = "Password must be at least 6 characters.";

    setErrors(nextErrors);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Register</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormField
              id="fullName"
              label="Full Name"
              placeholder="Your name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              error={errors.fullName}
            />
            <FormField
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={errors.email}
            />
            <FormField
              id="password"
              label="Password"
              type="password"
              placeholder="Create password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={errors.password}
            />
            <Button type="submit" className="w-full">
              Create Account
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            Already have an account? <Link href="/login" className="font-medium text-slate-900">Login</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
