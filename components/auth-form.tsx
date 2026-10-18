"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { FormSubmit } from "@/components/form-submit";
import type { ActionState } from "@/actions/auth";
export function AuthForm({
  action,
  type,
}: {
  action: (state: ActionState, data: FormData) => Promise<ActionState>;
  type: "login" | "register";
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4">
      {type === "register" && (
        <Field label="Full name" name="fullName" autoComplete="name" />
      )}
      <Field
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete={type === "login" ? "current-password" : "new-password"}
      />
      {state.error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}
      {state.success && (
        <p
          role="status"
          className="rounded-xl bg-teal-50 p-3 text-sm text-teal-800"
        >
          {state.success}
        </p>
      )}
      <FormSubmit className="w-full">
        {type === "login" ? "Sign in" : "Create account"}
      </FormSubmit>
      {type === "login" && (
        <Link
          className="block text-sm text-teal-700 hover:underline"
          href="/register"
        >
          Create account
        </Link>
      )}
    </form>
  );
}
function Field({
  label,
  ...props
}: React.ComponentProps<typeof Input> & { label: string }) {
  return (
    <label className="block space-y-2 text-sm font-semibold">
      <span>{label}</span>
      <Input required {...props} />
    </label>
  );
}
