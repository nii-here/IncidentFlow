// ------------------------------------------------------------
// Administration Page
//
// This is the control center for platform configuration.
// Admins can open each administration module from here.
// ------------------------------------------------------------

import { Link } from "react-router-dom";

function AdministrationPage() {
  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Administration
        </h1>

        <p className="mt-1 text-slate-500">
          Manage platform settings, users, departments, and ticket configuration.
        </p>
      </div>

      {/* Administration module cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <AdminCard
          title="Users"
          description="Manage users, roles, and access."
          path="/administration/users"
        />

        <AdminCard
          title="Departments"
          description="Manage organizational departments."
          path="/administration/departments"
        />

        <AdminCard
          title="Categories"
          description="Manage ticket categories."
          path="/administration/categories"
        />

        <AdminCard
          title="Assignment Groups"
          description="Manage teams responsible for work."
          path="/administration/assignment-groups"
        />

        <AdminCard
          title="Priorities"
          description="Configure ticket priority levels."
          path="/administration/priorities"
        />

        <AdminCard
          title="Statuses"
          description="Configure ticket workflow statuses."
          path="/administration/statuses"
        />
      </div>
    </div>
  );
}

type AdminCardProps = {
  title: string;
  description: string;
  path: string;
};

function AdminCard({
  title,
  description,
  path,
}: AdminCardProps) {
  return (
    <Link
      to={path}
      className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
    >
      <h2 className="text-lg font-semibold text-slate-900">
        {title}
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        {description}
      </p>
    </Link>
  );
}

export default AdministrationPage;