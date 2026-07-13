// ------------------------------------------------------------
// PageHeader Component
//
// Reusable header for pages.
// It keeps page titles, descriptions, and action buttons
// consistent across IncidentFlow.
// ------------------------------------------------------------

type PageHeaderProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          {title}
        </h1>

        <p className="mt-1 text-slate-500">
          {description}
        </p>
      </div>

      {action && <div>{action}</div>}
    </div>
  );
}

export default PageHeader;