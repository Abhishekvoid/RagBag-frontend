import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthShell } from "@/components/ui/kit";

export default function RegisterPage() {
  return (
    <AuthShell
      sideEyebrow="Free to start · no card required"
      sideTitle="Get your own study hub for clarity and focus."
      sidePoints={[
        "Turn any document into a tutor",
        "Grounded answers, every one cited",
        "Auto-generated flashcards and questions",
      ]}
      title="Create an account"
      subtitle="Join StudyWise and start studying smarter."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-primary hover:text-primary/80">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
