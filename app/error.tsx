"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="grid min-h-[60vh] place-items-center p-6 text-center">
      <div>
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="my-4 text-slate-500">
          Please try again. If the issue continues, check that the backend is
          running.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
