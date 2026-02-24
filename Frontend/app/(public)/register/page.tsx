"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/design-system/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/design-system/Card";
import { Input } from "@/components/design-system/Input";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useToastStore } from "@/lib/store/useToastStore";

interface RegisterErrors {
  email?: string;
  password?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<RegisterErrors>({});

  const register = useAuthStore((state) => state.register);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const getRoleHomeRoute = useAuthStore((state) => state.getRoleHomeRoute);
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace(getRoleHomeRoute());
    }
  }, [getRoleHomeRoute, hasHydrated, isAuthenticated, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: RegisterErrors = {};
    if (!email.includes("@")) nextErrors.email = "Enter a valid email address.";
    if (password.length < 6) nextErrors.password = "Password must be at least 6 characters.";

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);

    const result = register({
      email,
      password,
    });

    if (!result.success) {
      showToast(result.message, "error");
      setIsSubmitting(false);
      return;
    }

    showToast(result.message, "success");
    router.replace(getRoleHomeRoute());
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Register</CardTitle>
          <CardDescription>Create your account in seconds to start earning points.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={errors.email}
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Create password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={errors.password}
            />
            <Button type="submit" className="w-full" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account? <Link href="/login" className="font-medium text-foreground">Login</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
