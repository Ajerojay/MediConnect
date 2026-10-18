import { login } from "@/actions/auth";
import { AuthForm } from "@/components/auth-form";
export default function Login() {
  return (
    <>
      <p className="text-sm font-bold text-teal-700">WELCOME BACK</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight">
        Sign in to your care portal
      </h1>
      <p className="mb-8 mt-2 text-slate-600">
        Use the email connected to your MediConnect account.
      </p>
      <AuthForm action={login} type="login" />
    </>
  );
}
