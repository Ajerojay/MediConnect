import { register } from "@/actions/auth";
import { AuthForm } from "@/components/auth-form";
export default function Register() {
  return (
    <>
      <p className="text-sm font-bold text-teal-700">PATIENT REGISTRATION</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight">
        Create your care account
      </h1>
      <p className="mb-8 mt-2 text-slate-600">
        Doctors and administrators are invited by your clinic.
      </p>
      <AuthForm action={register} type="register" />
    </>
  );
}
