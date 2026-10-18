"use client";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
export function FormSubmit({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button className={className} disabled={pending}>
      {pending ? "Please wait…" : children}
    </Button>
  );
}
