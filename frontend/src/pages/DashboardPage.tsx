// ---------------------------------------------------------------------
// Dashboard Page
// Loads ticket metrics from the backend and displays dashboard cards.
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";

import { getTicketMetrics } from "../services/dashboardService";

import type { TicketMetrics } from "../types/dashboard";

function DashboardPage() {
  const [metrics, setMetrics] = useState<TicketMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await getTicketMetrics();
        setMetrics(data);
      } catch (error) {
        console.error("Failed to load dashboard metrics.", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return <h1 className="text-2xl font-bold">Loading dashboard...</h1>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="mt-1 text-slate-500">
          Monitor ticket activity across your organization.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Open Tickets" value={metrics?.open_tickets ?? 0} />
        <MetricCard title="In Progress" value={metrics?.in_progress_tickets ?? 0} />
        <MetricCard title="Resolved" value={metrics?.resolved_tickets ?? 0} />
        <MetricCard title="High Priority" value={metrics?.high_priority_tickets ?? 0} />
        <MetricCard title="SLA Overdue" value={metrics?.overdue_tickets ?? 0} />
      </div>
    </div>
  );
}

type MetricCardProps = {
  title: string;
  value: number;
};

function MetricCard({ title, value }: MetricCardProps) {
  return (
    <div className="min-h-[170px] rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md">
      <p className="text-base font-medium text-slate-500">
        {title}
      </p>

      <h2 className="mt-6 text-5xl font-bold text-slate-900">
        {value}
      </h2>
    </div>
  );
}

export default DashboardPage;