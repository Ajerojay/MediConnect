import { cn } from "@/lib/utils";
export function Badge({
  children,
  status,
  className,
}: {
  children: React.ReactNode;
  status?: string;
  className?: string;
}) {
  const tone =
    status === "APPROVED"
      ? "bg-sky-100 text-sky-800"
      : status === "COMPLETED"
        ? "bg-teal-100 text-teal-800"
        : status === "CANCELLED"
          ? "bg-red-100 text-red-800"
          : "bg-amber-100 text-amber-800";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-bold",
        tone,
        className,
      )}
    >
      {children}
    </span>
  );
}
