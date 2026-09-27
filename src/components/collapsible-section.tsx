"use client";

interface CollapsibleSectionProps {
  id: string;
  title: string;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  children: React.ReactNode;
  /** Optional trailing control in the header (e.g. All days) */
  headerAction?: React.ReactNode;
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={`h-5 w-5 shrink-0 text-foreground/70 transition-transform ${
        collapsed ? "-rotate-90" : "rotate-0"
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function CollapsibleSection({
  id,
  title,
  collapsed,
  onCollapsedChange,
  children,
  headerAction,
}: CollapsibleSectionProps) {
  return (
    <section className="border-b border-foreground/10 last:border-b-0">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          id={`${id}-heading`}
          aria-expanded={!collapsed}
          aria-controls={`${id}-panel`}
          onClick={() => onCollapsedChange(!collapsed)}
          className="flex flex-1 items-center gap-2.5 text-left text-xs font-semibold uppercase tracking-wide text-foreground/55 hover:text-foreground/80 transition cursor-pointer min-h-10"
        >
          <ChevronIcon collapsed={collapsed} />
          {title}
        </button>
        {headerAction}
      </div>
      {!collapsed && (
        <div
          id={`${id}-panel`}
          role="region"
          aria-labelledby={`${id}-heading`}
          className="px-3 pb-3"
        >
          {children}
        </div>
      )}
    </section>
  );
}
