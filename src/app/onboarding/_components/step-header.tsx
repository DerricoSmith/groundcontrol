export function StepHeader({
  eyebrow,
  title,
  description,
  effort,
}: {
  eyebrow: string;
  title: string;
  description: string;
  effort?: "Quick" | "Moderate" | "Detailed";
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-brand">{eyebrow}</p>
        {effort && (
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">{effort}</span>
        )}
      </div>
      <h1 className="mt-2 font-serif text-[26px] font-medium tracking-tight text-text-primary sm:text-[30px]">{title}</h1>
      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-text-secondary">{description}</p>
    </div>
  );
}
