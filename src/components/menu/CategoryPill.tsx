import { forwardRef, type ReactNode } from "react";

export const CategoryPill = forwardRef<
  HTMLButtonElement,
  { active: boolean; onClick: () => void; children: ReactNode }
>(({ active, onClick, children }, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    className={`focus-ring relative z-10 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
      active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
    }`}
  >
    {children}
  </button>
));
