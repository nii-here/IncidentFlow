// ------------------------------------------------------------
// Tickets Page
//
// Main IncidentFlow ticket workspace.
//
// Supports:
//
// - role-based ticket queues
// - ticket view switching
// - ticket search
// - priority filtering
// - client-side sorting
// - ticket creation
// - opening ticket records
//
// The backend remains responsible for deciding which tickets
// the current user is actually allowed to access.
// ------------------------------------------------------------

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronDown,
  Plus,
  Search,
} from "lucide-react";

import {
  toast,
} from "sonner";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import Modal from "../components/common/Modal";

import TicketForm from "../components/tickets/TicketForm";

import {
  createTicket,
  getTickets,
} from "../services/ticketService";

import {
  useAuth,
} from "../context/AuthContext";

import type {
  Ticket,
  TicketCreate,
} from "../types/ticket";


// ============================================================
// TICKET VIEW TYPES
// ============================================================
//
// These values match the backend:
//
// GET /tickets/?view=...
// ============================================================

type TicketView =
  | "all"
  | "my_open"
  | "my"
  | "my_groups"
  | "unassigned"
  | "open"
  | "in_progress"
  | "resolved"
  | "closed"
  | "overdue"
  | "archived";


// ------------------------------------------------------------
// Ticket view dropdown option
// ------------------------------------------------------------

type TicketViewOption = {
  value: TicketView;
  label: string;
};


// ============================================================
// PRIORITY FILTER
// ============================================================

type PriorityFilter =
  | "all"
  | "high"
  | "medium"
  | "low";


// ============================================================
// SORT OPTIONS
// ============================================================

type TicketSort =
  | "newest"
  | "oldest"
  | "priority"
  | "title";


// ============================================================
// ADMIN TICKET VIEWS
// ============================================================
//
// IT admins can access every ticket queue.
// ============================================================

const adminTicketViews: TicketViewOption[] = [
  {
    value: "all",
    label: "All Tickets",
  },
  {
    value: "my_open",
    label: "My Open Tickets",
  },
  {
    value: "my",
    label: "My Tickets",
  },
  {
    value: "my_groups",
    label: "My Group's Tickets",
  },
  {
    value: "unassigned",
    label: "Unassigned Tickets",
  },
  {
    value: "open",
    label: "Open Tickets",
  },
  {
    value: "in_progress",
    label: "In Progress",
  },
  {
    value: "resolved",
    label: "Resolved Tickets",
  },
  {
    value: "closed",
    label: "Closed Tickets",
  },
  {
    value: "overdue",
    label: "SLA Overdue",
  },
  {
    value: "archived",
    label: "Archived Tickets",
  },
];


// ============================================================
// IT STAFF TICKET VIEWS
// ============================================================
//
// IT staff cannot access the organization-wide:
//
// - All Tickets
// - Archived Tickets
//
// The backend still applies assignment and group permissions.
// ============================================================

const staffTicketViews: TicketViewOption[] = [
  {
    value: "my_open",
    label: "My Open Tickets",
  },
  {
    value: "my",
    label: "My Tickets",
  },
  {
    value: "my_groups",
    label: "My Group's Tickets",
  },
  {
    value: "unassigned",
    label: "Unassigned Tickets",
  },
  {
    value: "open",
    label: "Open Tickets",
  },
  {
    value: "in_progress",
    label: "In Progress",
  },
  {
    value: "overdue",
    label: "SLA Overdue",
  },
  {
    value: "resolved",
    label: "Resolved Tickets",
  },
  {
    value: "closed",
    label: "Closed Tickets",
  },
];


// ============================================================
// TICKETS PAGE
// ============================================================

function TicketsPage() {

  const navigate =
    useNavigate();

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  // ----------------------------------------------------------
  // Logged-in user
  // ----------------------------------------------------------

  const {
    user,
    isLoading: authLoading,
  } = useAuth();


  // ----------------------------------------------------------
  // Tickets returned by the backend
  // ----------------------------------------------------------

  const [
    tickets,
    setTickets,
  ] = useState<Ticket[]>([]);


  // ----------------------------------------------------------
  // Ticket table loading state
  // ----------------------------------------------------------

  const [
    loading,
    setLoading,
  ] = useState(true);


  // ----------------------------------------------------------
  // Current backend ticket queue
  // ----------------------------------------------------------

  const [
    selectedView,
    setSelectedView,
  ] = useState<TicketView | null>(
    null
  );


  // ----------------------------------------------------------
  // Search
  // ----------------------------------------------------------

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");


  // ----------------------------------------------------------
  // Priority filter
  // ----------------------------------------------------------

  const [
    priorityFilter,
    setPriorityFilter,
  ] = useState<PriorityFilter>(
    "all"
  );


  // ----------------------------------------------------------
  // Sort
  // ----------------------------------------------------------

  const [
    sortBy,
    setSortBy,
  ] = useState<TicketSort>(
    "newest"
  );


  // ----------------------------------------------------------
  // New Ticket modal
  // ----------------------------------------------------------

  const [
    isCreateModalOpen,
    setIsCreateModalOpen,
  ] = useState(false);


  // ==========================================================
  // AVAILABLE QUEUES
  // ==========================================================

  const availableTicketViews =
    useMemo<TicketViewOption[]>(
      () => {

        if (
          user?.role === "it_admin"
        ) {
          return adminTicketViews;
        }


        if (
          user?.role === "it_staff"
        ) {
          return staffTicketViews;
        }


        // ----------------------------------------------------
        // Employee ticket access will be finalized when the
        // employee portal is built.
        // ----------------------------------------------------

        return [
          {
            value: "my",
            label: "My Tickets",
          },
        ];
      },
      [
        user?.role,
      ]
    );


  // ==========================================================
  // DEFAULT QUEUE
  // ==========================================================
  //
  // Admin
  // -> All Tickets
  //
  // IT Staff
  // -> My Open Tickets
  //
  // Employee
  // -> My Tickets
  // ==========================================================

  useEffect(() => {

    if (
      authLoading ||
      !user
    ) {
      return;
    }


    // --------------------------------------------------------
    // Check whether another page sent us to a specific queue.
    //
    // Example:
    //
    // /tickets?view=open
    // /tickets?view=in_progress
    // /tickets?view=overdue
    //
    // We only accept the requested queue if that queue is
    // actually available to the current user's role.
    // --------------------------------------------------------

    const requestedView =
        searchParams.get(
        "view"
        ) as TicketView | null;


    const requestedViewIsAllowed =
        requestedView !== null &&
        availableTicketViews.some(
        (option) =>
            option.value === requestedView
        );


    if (
        requestedViewIsAllowed
    ) {

        setSelectedView(
        requestedView
        );

        return;
    }


    // --------------------------------------------------------
    // No valid queue was requested in the URL.
    //
    // Fall back to the normal role-based starting queue.
    // --------------------------------------------------------

    if (
        user.role === "it_admin"
    ) {

        setSelectedView(
        "all"
        );

        return;
    }


    if (
        user.role === "it_staff"
    ) {

        setSelectedView(
        "my_open"
        );

        return;
    }


    setSelectedView(
        "my"
    );

    }, [
    authLoading,
    user?.id,
    user?.role,
    searchParams,
    availableTicketViews,
    ]);

  // ==========================================================
  // LOAD TICKETS
  // ==========================================================

  async function loadTickets(
    view: TicketView
  ) {

    if (!user) {
      return;
    }


    try {

      setLoading(true);


      const data =
        await getTickets(
          view
        );


      setTickets(
        data
      );

    } catch (error) {

      console.error(
        "Failed to load tickets.",
        error
      );


      setTickets([]);


      toast.error(
        "Tickets could not be loaded."
      );

    } finally {

      setLoading(false);
    }
  }


  // ==========================================================
  // RELOAD WHEN QUEUE CHANGES
  // ==========================================================

  useEffect(() => {

    if (
      authLoading ||
      !user ||
      !selectedView
    ) {
      return;
    }


    loadTickets(
      selectedView
    );

  }, [
    authLoading,
    user,
    selectedView,
  ]);


  // ==========================================================
  // CHANGE QUEUE
  // ==========================================================

  function handleViewChange(
    view: TicketView
  ) {

    setSelectedView(
      view
    );

    setSearchParams({
        view,
    });

    // --------------------------------------------------------
    // Clear local filters when moving to another queue.
    //
    // This prevents a user from switching queues and thinking
    // it is empty because an old search/filter is still active.
    // --------------------------------------------------------

    setSearchQuery("");

    setPriorityFilter(
      "all"
    );
  }


  // ==========================================================
  // CREATE TICKET
  // ==========================================================

  async function handleCreateTicket(
    values: TicketCreate
  ) {

    try {

      await createTicket(
        values
      );


      setIsCreateModalOpen(
        false
      );


      if (selectedView) {

        await loadTickets(
          selectedView
        );
      }


      toast.success(
        "Ticket created successfully."
      );

    } catch (error) {

      console.error(
        "Failed to create ticket.",
        error
      );


      toast.error(
        "Ticket could not be created."
      );


      throw error;
    }
  }


  // ==========================================================
  // CURRENT QUEUE LABEL
  // ==========================================================

  const currentViewLabel =
    availableTicketViews.find(
      (option) =>
        option.value === selectedView
    )?.label ??
    "Tickets";


  // ==========================================================
  // FILTERED + SORTED TICKETS
  // ==========================================================
  //
  // Queue security comes from the backend.
  //
  // These filters only organize the tickets already returned
  // to the frontend.
  // ==========================================================

  const visibleTickets =
    useMemo(
      () => {

        let result =
          [...tickets];


        // ----------------------------------------------------
        // SEARCH
        // ----------------------------------------------------

        const normalizedSearch =
          searchQuery
            .trim()
            .toLowerCase();


        if (normalizedSearch) {

          result =
            result.filter(
              (ticket) => {

                // --------------------------------------------
                // Build the human-readable assignment text.
                //
                // This lets users search:
                //
                // "you"
                // "Test Technician"
                // "unassigned"
                //
                // instead of needing to know internal user IDs.
                // --------------------------------------------

                const assignedToText =
                  ticket.assigned_to === null
                    ? "unassigned"
                    : ticket.assigned_to === user?.id
                      ? `you ${ticket.technician?.name ?? ""}`
                      : ticket.technician?.name ?? "assigned";


                const searchableText =
                  [
                    ticket.id,
                    ticket.title,
                    ticket.description,
                    ticket.priority,
                    ticket.status,
                    assignedToText,
                    ticket.technician?.email ?? "",
                  ]
                    .join(" ")
                    .toLowerCase();


                return searchableText.includes(
                  normalizedSearch
                );
              }
            );
        }


        // ----------------------------------------------------
        // PRIORITY
        // ----------------------------------------------------

        if (
          priorityFilter !==
          "all"
        ) {

          result =
            result.filter(
              (ticket) =>
                ticket.priority ===
                priorityFilter
            );
        }


        // ----------------------------------------------------
        // SORT
        // ----------------------------------------------------

        result.sort(
          (a, b) => {

            // Newest ticket first.
            if (
              sortBy === "newest"
            ) {

              return b.id - a.id;
            }


            // Oldest ticket first.
            if (
              sortBy === "oldest"
            ) {

              return a.id - b.id;
            }


            // Alphabetical title.
            if (
              sortBy === "title"
            ) {

              return a.title.localeCompare(
                b.title
              );
            }


            // Priority:
            // high -> medium -> low
            if (
              sortBy === "priority"
            ) {

              const priorityOrder: Record<
                string,
                number
              > = {
                high: 1,
                medium: 2,
                low: 3,
              };


              return (
                (
                  priorityOrder[
                    a.priority
                  ] ?? 99
                )
                -
                (
                  priorityOrder[
                    b.priority
                  ] ?? 99
                )
              );
            }


            return 0;
          }
        );


        return result;
      },
      [
        tickets,
        searchQuery,
        priorityFilter,
        sortBy,
        user?.id,
      ]
    );


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div>

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="mb-6 flex items-start justify-between gap-6">

        <div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Tickets
          </h1>


          <p className="mt-1 text-slate-500">
            View and manage support tickets.
          </p>

        </div>


        <button
          type="button"

          onClick={() =>
            setIsCreateModalOpen(
              true
            )
          }

          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >

          <Plus
            className="mr-2 h-4 w-4"
          />

          New Ticket

        </button>

      </div>


      {/* ======================================================
          TICKET WORKSPACE
      ====================================================== */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* ====================================================
            LIST TOOLBAR
        ==================================================== */}

        <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 xl:flex-row xl:items-center">

          {/* ------------------------------------------------
              QUEUE VIEW
          ------------------------------------------------ */}

          <div className="relative shrink-0">

            {!authLoading &&
              user &&
              selectedView ? (

                <>

                  <select
                    value={
                      selectedView
                    }

                    onChange={(event) =>
                      handleViewChange(
                        event.target.value as TicketView
                      )
                    }

                    aria-label="Ticket view"

                    className="min-w-[210px] appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-10 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >

                    {availableTicketViews.map(
                      (option) => (

                        <option
                          key={
                            option.value
                          }

                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>

                      )
                    )}

                  </select>


                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                </>

              ) : (

                <div className="h-[42px] w-[210px] animate-pulse rounded-lg bg-slate-100" />

              )}

          </div>


          {/* ------------------------------------------------
              SEARCH
          ------------------------------------------------ */}

          <div className="relative min-w-0 flex-1">

            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />


            <input
              type="search"

              value={
                searchQuery
              }

              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }

              placeholder="Search tickets..."

              aria-label="Search tickets"

              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>


          {/* ------------------------------------------------
              PRIORITY
          ------------------------------------------------ */}

          <div className="relative shrink-0">

            <select
              value={
                priorityFilter
              }

              onChange={(event) =>
                setPriorityFilter(
                  event.target.value as PriorityFilter
                )
              }

              aria-label="Filter by priority"

              className="min-w-[145px] appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm font-medium text-slate-600 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >

              <option value="all">
                All Priorities
              </option>

              <option value="high">
                High Priority
              </option>

              <option value="medium">
                Medium Priority
              </option>

              <option value="low">
                Low Priority
              </option>

            </select>


            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

          </div>


          {/* ------------------------------------------------
              SORT
          ------------------------------------------------ */}

          <div className="relative shrink-0">

            <select
              value={
                sortBy
              }

              onChange={(event) =>
                setSortBy(
                  event.target.value as TicketSort
                )
              }

              aria-label="Sort tickets"

              className="min-w-[140px] appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm font-medium text-slate-600 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >

              <option value="newest">
                Newest First
              </option>

              <option value="oldest">
                Oldest First
              </option>

              <option value="priority">
                Priority
              </option>

              <option value="title">
                Title A–Z
              </option>

            </select>


            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

          </div>

        </div>


        {/* ====================================================
            LIST INFORMATION
        ==================================================== */}

        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-2.5">

          <p className="text-xs font-medium text-slate-500">

            {currentViewLabel}

          </p>


          {!loading &&
            selectedView && (

              <p className="text-xs text-slate-500">

                {visibleTickets.length}

                {" "}

                {visibleTickets.length === 1
                  ? "ticket"
                  : "tickets"}

              </p>

            )}

        </div>


        {/* ====================================================
            TABLE
        ==================================================== */}

        <div className="overflow-x-auto">

          <table className="w-full text-left text-sm">

            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">

              <tr>

                <th className="px-6 py-3.5">
                  ID
                </th>

                <th className="px-6 py-3.5">
                  Title
                </th>

                <th className="px-6 py-3.5">
                  Priority
                </th>

                <th className="px-6 py-3.5">
                  Status
                </th>

                <th className="px-6 py-3.5">
                    SLA 
                </th>

                <th className="px-6 py-3.5">
                  Assigned To
                </th>

              </tr>

            </thead>


            <tbody>

              {(
                authLoading ||
                loading ||
                !selectedView
              ) ? (

                <tr>

                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Loading tickets...
                  </td>

                </tr>

              ) : (

                <>

                  {visibleTickets.map(
                    (ticket) => (

                      <tr
                        key={
                          ticket.id
                        }

                        onClick={() =>
                          navigate(
                            `/tickets/${ticket.id}`
                          )
                        }

                        className="cursor-pointer border-b border-slate-100 transition last:border-b-0 hover:bg-blue-50/40"
                      >

                        {/* ID */}

                        <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-600">
                          #{ticket.id}
                        </td>


                        {/* TITLE */}

                        <td className="px-6 py-4">

                          <span className="font-semibold text-slate-900">
                            {ticket.title}
                          </span>

                        </td>


                        {/* PRIORITY */}

                        <td className="whitespace-nowrap px-6 py-4">

                          <PriorityBadge
                            priority={
                              ticket.priority
                            }
                          />

                        </td>


                        {/* STATUS */}

                        <td className="whitespace-nowrap px-6 py-4">

                          <StatusBadge
                            status={
                              ticket.status
                            }
                          />

                        </td>

                        {/* SLA */}

                        <td className="whitespace-nowrap px-6 py-4">

                            <SlaBadge
                                ticket={
                                    ticket
                                }
                            />

                        </td>


                        {/* ASSIGNED TO */}

                        <td className="whitespace-nowrap px-6 py-4">

                          <AssignedTechnician
                            ticket={
                              ticket
                            }

                            currentUserId={
                              user?.id
                            }
                          />

                        </td>

                      </tr>

                    )
                  )}


                  {/* ========================================
                      EMPTY STATE
                  ======================================== */}

                  {visibleTickets.length === 0 && (

                    <tr>

                      <td
                        colSpan={6}
                        className="px-6 py-14 text-center"
                      >

                        <p className="font-medium text-slate-700">
                          No tickets found
                        </p>


                        <p className="mt-1 text-sm text-slate-500">

                          {(
                            searchQuery ||
                            priorityFilter !== "all"
                          )
                            ? "Try changing your search or filters."
                            : `There are no tickets in ${currentViewLabel}.`}

                        </p>

                      </td>

                    </tr>

                  )}

                </>

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ======================================================
          CREATE TICKET MODAL
      ====================================================== */}

      <Modal
        open={
          isCreateModalOpen
        }

        title="Create Ticket"

        onClose={() =>
          setIsCreateModalOpen(
            false
          )
        }
      >

        <TicketForm
          onCancel={() =>
            setIsCreateModalOpen(
              false
            )
          }

          onSubmit={
            handleCreateTicket
          }
        />

      </Modal>

    </div>
  );
}


// ============================================================
// ASSIGNED TECHNICIAN
// ============================================================
//
// Displays a human-readable assignment instead of exposing
// the internal database user ID.
//
// Examples:
//
// Current logged-in technician
// -> You
//
// Another technician
// -> Test Technician
//
// Nobody assigned
// -> Unassigned
// ============================================================

function AssignedTechnician({
  ticket,
  currentUserId,
}: {
  ticket: Ticket;
  currentUserId?: number;
}) {

  // ----------------------------------------------------------
  // Nobody currently owns the ticket
  // ----------------------------------------------------------

  if (
    ticket.assigned_to === null
  ) {

    return (
      <span className="text-slate-500">
        Unassigned
      </span>
    );
  }


  // ----------------------------------------------------------
  // Ticket belongs to the currently logged-in user
  // ----------------------------------------------------------

  if (
    ticket.assigned_to ===
    currentUserId
  ) {

    return (
      <span
        className="font-semibold text-blue-700"
        title={
          ticket.technician?.name ??
          "Assigned to you"
        }
      >
        You
      </span>
    );
  }


  // ----------------------------------------------------------
  // Ticket belongs to another technician
  // ----------------------------------------------------------

  if (
    ticket.technician
  ) {

    return (
      <span
        className="font-medium text-slate-700"
        title={
          ticket.technician.email
        }
      >
        {ticket.technician.name}
      </span>
    );
  }


  // ----------------------------------------------------------
  // Safety fallback
  //
  // This should be uncommon because the backend now returns
  // technician information for assigned tickets.
  // ----------------------------------------------------------

  return (
    <span className="text-slate-500">
      Assigned
    </span>
  );
}


// ============================================================
// PRIORITY BADGE
// ============================================================

function PriorityBadge({
  priority,
}: {
  priority: string;
}) {

  const styles =
    priority === "high"
      ? "bg-red-100 text-red-700"
      : priority === "medium"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-green-100 text-green-700";


  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles}`}
    >
      {priority}
    </span>
  );
}


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  status,
}: {
  status: string;
}) {

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
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles}`}
    >
      {status.replace(
        "_",
        " "
      )}
    </span>
  );
}

// ============================================================
// SLA BADGE
// ============================================================
//
// Gives technicians an immediate view of the ticket's
// SLA condition directly from the ticket list.
//
// Possible states:
//
// On Track
// -> Active ticket is still inside its SLA deadline.
//
// Overdue
// -> Active ticket has passed its SLA deadline.
//
// Met
// -> Ticket was completed before its SLA deadline.
//
// Breached
// -> Ticket was completed after its SLA deadline.
//
// —
// -> Ticket does not currently have an applicable SLA.
// ============================================================

function SlaBadge({
  ticket,
}: {
  ticket: Ticket;
}) {

  // ----------------------------------------------------------
  // No SLA deadline exists for this ticket.
  // ----------------------------------------------------------

  if (
    !ticket.sla_due_at
  ) {

    return (
      <span className="text-slate-400">
        —
      </span>
    );
  }


  const dueAt =
    new Date(
      ticket.sla_due_at
    );


  // ----------------------------------------------------------
  // Completed SLA
  //
  // Once sla_completed_at exists, the SLA clock has stopped.
  // ----------------------------------------------------------

  if (
    ticket.sla_completed_at
  ) {

    const completedAt =
      new Date(
        ticket.sla_completed_at
      );


    const breached =
      ticket.sla_breached_at !== null ||
      completedAt.getTime() >
        dueAt.getTime();


    if (breached) {

      return (
        <span
          className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
          title="This ticket exceeded its SLA deadline."
        >
          Breached
        </span>
      );
    }


    return (
      <span
        className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
        title="This ticket was completed within its SLA."
      >
        Met
      </span>
    );
  }


  // ----------------------------------------------------------
  // Archived tickets should not appear as actively overdue.
  // ----------------------------------------------------------

  if (
    ticket.status ===
    "archived"
  ) {

    return (
      <span className="text-slate-400">
        —
      </span>
    );
  }


  // ----------------------------------------------------------
  // Active SLA
  // ----------------------------------------------------------

  const now =
    new Date();


  const overdue =
    now.getTime() >
    dueAt.getTime();


  if (overdue) {

    return (
      <span
        className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
        title={`SLA deadline was ${dueAt.toLocaleString()}`}
      >
        Overdue
      </span>
    );
  }


  return (
    <span
      className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700"
      title={`SLA deadline is ${dueAt.toLocaleString()}`}
    >
      On Track
    </span>
  );
}


export default TicketsPage;