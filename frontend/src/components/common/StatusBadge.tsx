// ------------------------------------------------------------
// StatusBadge Component
//
// Reusable badge for active/inactive states.
// We will use this across admin pages.
// ------------------------------------------------------------

type StatusBadgeProps = {
  active: boolean;
};

function StatusBadge({ active }: StatusBadgeProps) {
  return (
    <span
      className={
        active
          ? "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
          : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
      }
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default StatusBadge;