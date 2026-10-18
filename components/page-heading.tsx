export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-sky-950">
          {title}
        </h1>
        <p className="mt-1 text-slate-600">{description}</p>
      </div>
      {action}
    </div>
  );
}
