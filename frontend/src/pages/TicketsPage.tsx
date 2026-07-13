// ------------------------------------------------------------
// Tickets Page
// Shows all tickets from the FastAPI backend.
// ------------------------------------------------------------

import { useEffect, useState } from "react";

import { getTickets } from "../services/ticketService";

import type { Ticket } from "../types/ticket";

function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTickets() {
      try {
        const data = await getTickets();
        setTickets(data);
      } catch (error) {
        console.error("Failed to load tickets.", error);
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, []);

  if (loading) {
    return <h1 className="text-2xl font-bold">Loading tickets...</h1>;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tickets</h1>
          <p className="mt-1 text-slate-500">
            View and manage support tickets.
          </p>
        </div>

        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          + New Ticket
        </button>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Assigned To</th>
            </tr>
          </thead>

          <tbody>
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                className="border-b transition last:border-b-0 hover:bg-slate-50"
              >
                <td className="px-6 py-4 font-medium text-slate-700">
                  #{ticket.id}
                </td>

                <td className="px-6 py-4 font-semibold text-slate-900">
                  {ticket.title}
                </td>

                <td className="px-6 py-4">
                  <PriorityBadge priority={ticket.priority} />
                </td>

                <td className="px-6 py-4">
                  <StatusBadge status={ticket.status} />
                </td>

                <td className="px-6 py-4 text-slate-600">
                  {ticket.assigned_to ?? "Unassigned"}
                </td>
              </tr>
            ))}

            {tickets.length === 0 && (
              <tr>
                <td className="px-6 py-8 text-center text-slate-500" colSpan={5}>
                  No tickets found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Badge for ticket priority
function PriorityBadge({ priority }: { priority: string }) {
  const styles =
    priority === "high"
      ? "bg-red-100 text-red-700"
      : priority === "medium"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-green-100 text-green-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>
      {priority}
    </span>
  );
}

// Badge for ticket status
function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "open"
      ? "bg-green-100 text-green-700"
      : status === "in_progress"
      ? "bg-yellow-100 text-yellow-700"
      : status === "resolved"
      ? "bg-blue-100 text-blue-700"
      : status === "closed"
      ? "bg-slate-100 text-slate-700"
      : "bg-zinc-200 text-zinc-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default TicketsPage;