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
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          id={`${id}-heading`}
          aria-expanded={!collapsed}
          aria-controls={`${id}-panel`}
          onClick={() => onCollapsedChange(!collapsed)}
          className="flex flex-1 items-center gap-2 text-left text-xs font-semibold uppercase tracking-wide text-foreground/55 hover:text-foreground/80 transition cursor-pointer"
        >
          <span aria-hidden className="text-[10px] w-3">
            {collapsed ? "▸" : "▾"}
          </span>
          {title}
        </button>
        {headerAction}
      </div>
      {!collapsed && (
        <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-heading`} className="px-3 pb-3">
          {children}
        </div>
      )}
    </section>
  );
}
