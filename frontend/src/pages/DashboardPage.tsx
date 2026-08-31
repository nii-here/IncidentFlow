// ---------------------------------------------------------------------
// Dashboard Page
//
// Displays a high-level overview of ticket activity using real metrics
// returned from the FastAPI backend.
//
// The dashboard is designed to become actionable over time:
//
// - Metric cards can take users directly to filtered ticket queues.
// - SLA issues should be easy to identify and investigate.
// - Future dashboard behavior will take inspiration from
//   ServiceNow and Freshservice while keeping IncidentFlow's
//   interface simpler and more focused.
// ---------------------------------------------------------------------

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  CircleDot,
  Clock3,
  Inbox,
  LoaderCircle,
  TicketCheck,
  Tickets,
  UserX,
} from "lucide-react";

import {
  getTicketMetrics,
} from "../services/dashboardService";

import type {
  TicketMetrics,
} from "../types/dashboard";


// ---------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------

function DashboardPage() {

  // -------------------------------------------------------------------
  // Navigation
  //
  // Used to send the user directly from a dashboard metric
  // to the related ticket queue.
  // -------------------------------------------------------------------

  const navigate =
    useNavigate();


  // -------------------------------------------------------------------
  // Ticket metrics returned by the backend
  // -------------------------------------------------------------------

  const [
    metrics,
    setMetrics,
  ] = useState<TicketMetrics | null>(
    null
  );


  // -------------------------------------------------------------------
  // Controls the loading state
  // -------------------------------------------------------------------

  const [
    loading,
    setLoading,
  ] = useState(true);


  // -------------------------------------------------------------------
  // Stores a friendly error message if loading fails
  // -------------------------------------------------------------------

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );


  // -------------------------------------------------------------------
  // Load dashboard metrics
  // -------------------------------------------------------------------

  useEffect(() => {

    async function loadDashboard() {

      try {

        setLoading(
          true
        );

        setError(
          null
        );


        const data =
          await getTicketMetrics();


        setMetrics(
          data
        );

      } catch (error) {

        console.error(
          "Failed to load dashboard metrics.",
          error
        );


        setError(
          "Dashboard metrics could not be loaded."
        );

      } finally {

        setLoading(
          false
        );
      }
    }


    loadDashboard();

  }, []);


  // -------------------------------------------------------------------
  // Derived values
  //
  // These are calculated from the metrics we already receive.
  // No additional backend request is needed.
  // -------------------------------------------------------------------

  const activeWorkload =
    useMemo(() => {

      if (!metrics) {
        return 0;
      }


      return (
        metrics.open_tickets +
        metrics.in_progress_tickets
      );

    }, [
      metrics,
    ]);


  const priorityTotal =
    useMemo(() => {

      if (!metrics) {
        return 0;
      }


      return (
        metrics.high_priority_tickets +
        metrics.medium_priority_tickets +
        metrics.low_priority_tickets
      );

    }, [
      metrics,
    ]);


  // -------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------

  if (loading) {

    return (
      <DashboardSkeleton />
    );
  }


  // -------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------

  if (
    error ||
    !metrics
  ) {

    return (
      <div className="space-y-6">

        <DashboardHeader />


        <div className="rounded-2xl border border-red-200 bg-red-50 p-8">

          <div className="flex items-start gap-3">

            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />


            <div>

              <h2 className="font-semibold text-red-900">
                Unable to load dashboard
              </h2>


              <p className="mt-1 text-sm text-red-700">

                {error ??
                  "Dashboard metrics are currently unavailable."}

              </p>

            </div>

          </div>

        </div>

      </div>
    );
  }


  // -------------------------------------------------------------------
  // Dashboard
  // -------------------------------------------------------------------

  return (
    <div className="space-y-8">

      {/* --------------------------------------------------------------
          Page heading
      -------------------------------------------------------------- */}

      <DashboardHeader />


      {/* --------------------------------------------------------------
          Main metric cards
      -------------------------------------------------------------- */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">

        <MetricCard
          title="Total Tickets"
          value={
            metrics.total_tickets
          }
          icon={
            Tickets
          }
          helperText="View all tickets"
          onClick={() => {
            navigate(
                "/tickets?view=all"
            );
          }}
        />


        <MetricCard
          title="Open Tickets"
          value={
            metrics.open_tickets
          }
          icon={
            Inbox
          }
          helperText="View open tickets"
          onClick={() => {
            navigate("/tickets?view=open");
          }}
        />


        <MetricCard
          title="In Progress"
          value={
            metrics.in_progress_tickets
          }
          icon={
            Clock3
          }
          helperText="View in-progress tickets"
          onClick={() => {
            navigate(
                "/tickets?view=in_progress"
            );
            }}
        />


        <MetricCard
          title="Resolved"
          value={
            metrics.resolved_tickets
          }
          icon={
            CheckCircle2
          }
          helperText="View resolved tickets"
          onClick={() => {
            navigate(
                "/tickets?view=resolved"
            );
          }}
        />

        <MetricCard
          title="Unassigned"
          value={
            metrics.unassigned_tickets
          }
          icon={
            UserX
          }
          helperText="View unassigned tickets"
          alert={
            metrics.unassigned_tickets > 0
          }
          onClick={() => {
            navigate(
                "/tickets?view=unassigned"
            );
          }}
        />
        


        {/* ------------------------------------------------------------
            SLA OVERDUE

            This is the first actionable dashboard card.

            Clicking it sends the user to:
            /tickets?view=overdue

            The Tickets page will read that view and load the
            backend overdue queue.
        ------------------------------------------------------------ */}

        <MetricCard
          title="SLA Overdue"
          value={
            metrics.overdue_tickets
          }
          icon={
            AlertTriangle
          }
          helperText="View overdue tickets"
          alert={
            metrics.overdue_tickets >
            0
          }
          onClick={() => {

            navigate(
              "/tickets?view=overdue"
            );

          }}
        />

      </div>


      {/* --------------------------------------------------------------
          Secondary dashboard content
      -------------------------------------------------------------- */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">


        {/* ------------------------------------------------------------
            Ticket status breakdown
        ------------------------------------------------------------ */}

        <DashboardPanel
          title="Ticket Status"
          description="Current workload by ticket status."
        >

          <div className="space-y-5">

            <BreakdownRow
              label="Open"
              value={
                metrics.open_tickets
              }
              total={
                metrics.total_tickets
              }
              icon={
                CircleDot
              }
            />


            <BreakdownRow
              label="In Progress"
              value={
                metrics.in_progress_tickets
              }
              total={
                metrics.total_tickets
              }
              icon={
                LoaderCircle
              }
            />


            <BreakdownRow
              label="Resolved"
              value={
                metrics.resolved_tickets
              }
              total={
                metrics.total_tickets
              }
              icon={
                TicketCheck
              }
            />


            <BreakdownRow
              label="Closed"
              value={
                metrics.closed_tickets
              }
              total={
                metrics.total_tickets
              }
              icon={
                CheckCircle2
              }
            />


            <BreakdownRow
              label="Archived"
              value={
                metrics.archived_tickets
              }
              total={
                metrics.total_tickets
              }
              icon={
                Archive
              }
            />

          </div>

        </DashboardPanel>


        {/* ------------------------------------------------------------
            Priority breakdown
        ------------------------------------------------------------ */}

        <DashboardPanel
          title="Priority Breakdown"
          description="Tickets grouped by urgency."
        >

          <div className="space-y-5">

            <PriorityRow
              label="High Priority"
              value={
                metrics.high_priority_tickets
              }
              total={
                priorityTotal
              }
              level="high"
            />


            <PriorityRow
              label="Medium Priority"
              value={
                metrics.medium_priority_tickets
              }
              total={
                priorityTotal
              }
              level="medium"
            />


            <PriorityRow
              label="Low Priority"
              value={
                metrics.low_priority_tickets
              }
              total={
                priorityTotal
              }
              level="low"
            />

          </div>

        </DashboardPanel>

      </div>


      {/* --------------------------------------------------------------
          Workload overview
      -------------------------------------------------------------- */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        <OverviewCard
          label="Active Workload"
          value={
            activeWorkload
          }
          description="Open and in-progress tickets that still require attention."
        />


        <OverviewCard
          label="Completed"
          value={
            metrics.resolved_tickets +
            metrics.closed_tickets
          }
          description="Tickets that have been resolved or fully closed."
        />


        <OverviewCard
          label="Archived"
          value={
            metrics.archived_tickets
          }
          description="Historical tickets removed from normal workflows."
        />

      </div>

    </div>
  );
}


// ---------------------------------------------------------------------
// Dashboard Header
// ---------------------------------------------------------------------

function DashboardHeader() {

  return (
    <div>

      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        Dashboard
      </h1>


      <p className="mt-1 text-slate-500">
        Monitor ticket activity and support workload across
        your organization.
      </p>

    </div>
  );
}


// ---------------------------------------------------------------------
// Main Metric Card
// ---------------------------------------------------------------------

type MetricCardProps = {

  title: string;

  value: number;

  icon:
    React.ElementType;

  helperText: string;

  alert?: boolean;

  // Optional action.
  //
  // When present, the card behaves like an interactive
  // dashboard shortcut.
  onClick?: () => void;
};


function MetricCard({
  title,
  value,
  icon: Icon,
  helperText,
  alert = false,
  onClick,
}: MetricCardProps) {

  return (
    <div

      onClick={
        onClick
      }

      role={
        onClick
          ? "button"
          : undefined
      }

      tabIndex={
        onClick
          ? 0
          : undefined
      }

      onKeyDown={(event) => {

        if (!onClick) {
          return;
        }


        if (
          event.key ===
          "Enter" ||
          event.key ===
          " "
        ) {

          event.preventDefault();

          onClick();
        }

      }}

      className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
        onClick
          ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-50"
          : ""
      } ${
        alert
          ? "border-red-200"
          : "border-slate-200"
      }`}
    >

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>


          <p
            className={`mt-3 text-3xl font-bold ${
              alert
                ? "text-red-600"
                : "text-slate-900"
            }`}
          >
            {value}
          </p>

        </div>


        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            alert
              ? "bg-red-50 text-red-600"
              : "bg-blue-50 text-blue-600"
          }`}
        >

          <Icon className="h-5 w-5" />

        </div>

      </div>


      <p
        className={`mt-4 text-xs ${
          onClick
            ? alert
              ? "font-medium text-red-500"
              : "font-medium text-blue-600"
            : "text-slate-400"
        }`}
      >
        {helperText}
      </p>

    </div>
  );
}


// ---------------------------------------------------------------------
// Dashboard Panel
// ---------------------------------------------------------------------

type DashboardPanelProps = {

  title: string;

  description: string;

  children:
    React.ReactNode;
};


function DashboardPanel({
  title,
  description,
  children,
}: DashboardPanelProps) {

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="mb-6">

        <h2 className="text-lg font-semibold text-slate-900">
          {title}
        </h2>


        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>

      </div>


      {children}

    </div>
  );
}


// ---------------------------------------------------------------------
// Status Breakdown Row
// ---------------------------------------------------------------------

type BreakdownRowProps = {

  label: string;

  value: number;

  total: number;

  icon:
    React.ElementType;
};


function BreakdownRow({
  label,
  value,
  total,
  icon: Icon,
}: BreakdownRowProps) {

  const percentage =
    total > 0
      ? Math.round(
          (
            value /
            total
          ) * 100
        )
      : 0;


  return (
    <div>

      <div className="mb-2 flex items-center justify-between gap-4">

        <div className="flex items-center gap-2">

          <Icon className="h-4 w-4 text-slate-500" />


          <span className="text-sm font-medium text-slate-700">
            {label}
          </span>

        </div>


        <div className="flex items-center gap-3">

          <span className="text-sm font-semibold text-slate-900">
            {value}
          </span>


          <span className="w-10 text-right text-xs text-slate-400">
            {percentage}%
          </span>

        </div>

      </div>


      <div className="h-2 overflow-hidden rounded-full bg-slate-100">

        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{
            width:
              `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}


// ---------------------------------------------------------------------
// Priority Breakdown Row
// ---------------------------------------------------------------------

type PriorityRowProps = {

  label: string;

  value: number;

  total: number;

  level:
    | "high"
    | "medium"
    | "low";
};


function PriorityRow({
  label,
  value,
  total,
  level,
}: PriorityRowProps) {

  const percentage =
    total > 0
      ? Math.round(
          (
            value /
            total
          ) * 100
        )
      : 0;


  const styles = {

    high: {
      dot:
        "bg-red-500",

      bar:
        "bg-red-500",
    },

    medium: {
      dot:
        "bg-amber-500",

      bar:
        "bg-amber-500",
    },

    low: {
      dot:
        "bg-emerald-500",

      bar:
        "bg-emerald-500",
    },

  };


  const style =
    styles[level];


  return (
    <div>

      <div className="mb-2 flex items-center justify-between gap-4">

        <div className="flex items-center gap-3">

          <span
            className={`h-2.5 w-2.5 rounded-full ${style.dot}`}
          />


          <span className="text-sm font-medium text-slate-700">
            {label}
          </span>

        </div>


        <div className="flex items-center gap-3">

          <span className="text-sm font-semibold text-slate-900">
            {value}
          </span>


          <span className="w-10 text-right text-xs text-slate-400">
            {percentage}%
          </span>

        </div>

      </div>


      <div className="h-2 overflow-hidden rounded-full bg-slate-100">

        <div
          className={`h-full rounded-full transition-all ${style.bar}`}
          style={{
            width:
              `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}


// ---------------------------------------------------------------------
// Overview Card
// ---------------------------------------------------------------------

type OverviewCardProps = {

  label: string;

  value: number;

  description: string;
};


function OverviewCard({
  label,
  value,
  description,
}: OverviewCardProps) {

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>


      <p className="mt-3 text-3xl font-bold text-slate-900">
        {value}
      </p>


      <p className="mt-3 text-sm leading-6 text-slate-500">
        {description}
      </p>

    </div>
  );
}


// ---------------------------------------------------------------------
// Dashboard Loading Skeleton
// ---------------------------------------------------------------------

function DashboardSkeleton() {

  return (
    <div className="space-y-8 animate-pulse">

      <div>

        <div className="h-8 w-44 rounded bg-slate-200" />

        <div className="mt-3 h-4 w-80 rounded bg-slate-100" />

      </div>


      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">

        {Array.from({
          length: 6,
        }).map(
          (
            _,
            index
          ) => (

            <div
              key={
                index
              }
              className="h-36 rounded-2xl border border-slate-200 bg-white"
            />

          )
        )}

      </div>


      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        <div className="h-96 rounded-2xl border border-slate-200 bg-white" />

        <div className="h-96 rounded-2xl border border-slate-200 bg-white" />

      </div>

    </div>
  );
}


export default DashboardPage;