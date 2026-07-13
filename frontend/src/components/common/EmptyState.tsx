// ------------------------------------------------------------
// EmptyState Component
//
// Reusable empty-state message for lists and tables.
//
// Examples:
// • No categories
// • No users
// • No tickets
// • No assets
// ------------------------------------------------------------

import type { ComponentType, ReactNode } from "react";

type EmptyStateProps = {
  // Main heading
  title: string;

  // Helpful explanation
  description: string;

  // Lucide icon passed by the parent
  icon: ComponentType<{
    className?: string;
  }>;

  // Optional action button
  action?: ReactNode;
};

function EmptyState({
  title,
  description,
  icon: Icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {/* Icon container */}
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Icon className="h-7 w-7" />
      </div>

      {/* Empty-state title */}
      <h3 className="mt-4 text-lg font-semibold text-slate-900">
        {title}
      </h3>

      {/* Empty-state description */}
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>

      {/* Optional action */}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default EmptyState;