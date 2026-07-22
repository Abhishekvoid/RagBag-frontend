import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthShell } from "@/components/ui/kit";

export default function LoginPage() {
  return (
    <AuthShell
      sideEyebrow="Welcome back"
      sideTitle="Your study hub, exactly where you left it."
      sidePoints={[
        "Grounded answers, cited to the page",
        "Flashcards and questions on demand",
        "Every source private to your account",
      ]}
      title="Sign in"
      subtitle="Enter your details to access your workspace."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="font-medium text-primary hover:text-primary/80">
            Create one
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
