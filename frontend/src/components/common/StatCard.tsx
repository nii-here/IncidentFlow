// ------------------------------------------------------------
// StatCard Component
//
// Reusable card for showing summary numbers.
//
// Examples:
// • Total Categories
// • Active Users
// • Open Tickets
// • Overdue Assets
// ------------------------------------------------------------

type StatCardProps = {
  label: string;
  value: number | string;
  helperText?: string;
};

function StatCard({ label, value, helperText }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <h2 className="mt-3 text-3xl font-bold text-slate-900">
        {value}
      </h2>

      {helperText && (
        <p className="mt-2 text-xs text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  );
}

export default StatCard;