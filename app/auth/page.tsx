import { AuthForm } from "@/components/auth/AuthForm";

export default function AuthPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg)" }}>
      <AuthForm />
    </main>
  );
}
