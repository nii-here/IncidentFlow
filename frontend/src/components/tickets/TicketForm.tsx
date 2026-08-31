// ------------------------------------------------------------
// Ticket Form
//
// Used by IT staff to create a support ticket.
//
// A technician can:
// - Search for an existing employee/requester
// - Add a new employee/contact if they do not exist
// - Create a ticket on that person's behalf
//
// A newly added employee does NOT automatically receive
// an IncidentFlow login account.
// ------------------------------------------------------------

import {
  useEffect,
  useMemo,
  useState,
  type ElementType,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  Check,
  ChevronDown,
  CircleUserRound,
  ClipboardList,
  Plus,
  Route,
  Search,
  UserRound,
  X,
} from "lucide-react";

import type { TicketCreate } from "../../types/ticket";
import type { Category } from "../../types/category";
import type { AssignmentGroup } from "../../types/assignmentGroup";
import type { Requester } from "../../types/user";
import type { Department } from "../../types/department";

import { getCategories } from "../../services/categoryService";
import { getAssignmentGroups } from "../../services/assignmentGroupService";
import { getRequesters } from "../../services/userService";
import { getDepartments } from "../../services/departmentService";
import { createPerson } from "../../services/personService";


type TicketFormProps = {
  onSubmit: (values: TicketCreate) => Promise<void>;
  onCancel: () => void;
};


function TicketForm({
  onSubmit,
  onCancel,
}: TicketFormProps) {
  // ----------------------------------------------------------
  // Ticket fields
  // ----------------------------------------------------------
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [priority, setPriority] =
    useState<"low" | "medium" | "high">("medium");

  const [categoryId, setCategoryId] =
    useState<number | null>(null);

  const [assignmentGroupId, setAssignmentGroupId] =
    useState<number | null>(null);


  // ----------------------------------------------------------
  // Requester selection
  // ----------------------------------------------------------
  const [requesters, setRequesters] =
    useState<Requester[]>([]);

  const [selectedRequester, setSelectedRequester] =
    useState<Requester | null>(null);

  const [requesterSearch, setRequesterSearch] =
    useState("");

  const [
    requesterDropdownOpen,
    setRequesterDropdownOpen,
  ] = useState(false);


  // ----------------------------------------------------------
  // Add Employee form
  // ----------------------------------------------------------
  const [showAddEmployee, setShowAddEmployee] =
    useState(false);

  const [newEmployeeName, setNewEmployeeName] =
    useState("");

  const [newEmployeeEmail, setNewEmployeeEmail] =
    useState("");

  const [
    newEmployeeDepartmentId,
    setNewEmployeeDepartmentId,
  ] = useState<number | null>(null);

  const [addingEmployee, setAddingEmployee] =
    useState(false);

  const [addEmployeeError, setAddEmployeeError] =
    useState<string | null>(null);


  // ----------------------------------------------------------
  // Supporting data
  // ----------------------------------------------------------
  const [categories, setCategories] =
    useState<Category[]>([]);

  const [assignmentGroups, setAssignmentGroups] =
    useState<AssignmentGroup[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [loadingOptions, setLoadingOptions] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);


  // ----------------------------------------------------------
  // Load form data
  // ----------------------------------------------------------
  useEffect(() => {
    async function loadOptions() {
      try {
        setLoadingOptions(true);

        const [
          categoryData,
          assignmentGroupData,
          requesterData,
          departmentData,
        ] = await Promise.all([
          getCategories(),
          getAssignmentGroups(),
          getRequesters(),
          getDepartments(),
        ]);

        setCategories(
          categoryData.filter(
            (category) => category.active
          )
        );

        setAssignmentGroups(
          assignmentGroupData.filter(
            (group) => group.active
          )
        );

        setRequesters(requesterData);

        setDepartments(
          departmentData.filter(
            (department) => department.active
          )
        );
      } catch (error) {
        console.error(
          "Failed to load ticket form options.",
          error
        );
      } finally {
        setLoadingOptions(false);
      }
    }

    loadOptions();
  }, []);


  // ----------------------------------------------------------
  // Filter requesters by name or email
  // ----------------------------------------------------------
  const filteredRequesters = useMemo(() => {
    const search = requesterSearch
      .trim()
      .toLowerCase();

    if (!search) {
      return [];
    }

    return requesters
      .filter((requester) => {
        return (
          requester.name
            .toLowerCase()
            .includes(search) ||
          requester.email
            .toLowerCase()
            .includes(search)
        );
      })
      .slice(0, 8);
  }, [requesters, requesterSearch]);


  // ----------------------------------------------------------
  // Find the selected requester's department
  // ----------------------------------------------------------
  const selectedDepartment = useMemo(() => {
    if (
      !selectedRequester ||
      selectedRequester.department_id === null
    ) {
      return null;
    }

    return (
      departments.find(
        (department) =>
          department.id ===
          selectedRequester.department_id
      ) ?? null
    );
  }, [departments, selectedRequester]);


  // ----------------------------------------------------------
  // Select an existing requester
  // ----------------------------------------------------------
  function handleRequesterSelect(
    requester: Requester
  ) {
    setSelectedRequester(requester);

    setRequesterSearch(
      requester.name
    );

    setRequesterDropdownOpen(false);
    setShowAddEmployee(false);
  }


  // ----------------------------------------------------------
  // Update requester search
  // ----------------------------------------------------------
  function handleRequesterSearchChange(
    value: string
  ) {
    setRequesterSearch(value);

    if (selectedRequester) {
      setSelectedRequester(null);
    }

    setRequesterDropdownOpen(true);
  }


  // ----------------------------------------------------------
  // Open Add Employee form
  // ----------------------------------------------------------
  function handleOpenAddEmployee() {
    const currentSearch =
      requesterSearch.trim();

    setRequesterDropdownOpen(false);

    if (currentSearch.includes("@")) {
      setNewEmployeeName("");
      setNewEmployeeEmail(currentSearch);
    } else {
      setNewEmployeeName(currentSearch);
      setNewEmployeeEmail("");
    }

    setNewEmployeeDepartmentId(null);
    setAddEmployeeError(null);

    setShowAddEmployee(true);
  }


  // ----------------------------------------------------------
  // Close Add Employee form
  // ----------------------------------------------------------
  function handleCancelAddEmployee() {
    setShowAddEmployee(false);
    setAddEmployeeError(null);
  }


  // ----------------------------------------------------------
  // Create a new employee/contact
  // ----------------------------------------------------------
  async function handleAddEmployee() {
    if (
      !newEmployeeName.trim() ||
      !newEmployeeEmail.trim()
    ) {
      setAddEmployeeError(
        "Name and email are required."
      );

      return;
    }

    try {
      setAddingEmployee(true);
      setAddEmployeeError(null);

      const newRequester =
        await createPerson({
          name: newEmployeeName.trim(),
          email: newEmployeeEmail
            .trim()
            .toLowerCase(),
          department_id:
            newEmployeeDepartmentId,
        });

      // Add the new person to the requester list
      // without needing to reload the page.
      setRequesters((current) => [
        ...current,
        newRequester,
      ]);

      // Automatically select the newly added
      // employee as the ticket requester.
      setSelectedRequester(
        newRequester
      );

      setRequesterSearch(
        newRequester.name
      );

      // Close and reset the Add Employee form.
      setShowAddEmployee(false);

      setNewEmployeeName("");
      setNewEmployeeEmail("");
      setNewEmployeeDepartmentId(null);
    } catch (error) {
      console.error(
        "Failed to add employee.",
        error
      );

      // The authentication token is no longer valid.
      if (
        error instanceof Error &&
        error.message === "SESSION_EXPIRED"
      ) {
        setAddEmployeeError(
          "Your session has expired. Please sign in again."
        );

        return;
      }

      // Show a useful message returned by the
      // person service when one is available.
      if (error instanceof Error) {
        setAddEmployeeError(
          error.message
        );

        return;
      }

      // Fallback for an unexpected error.
      setAddEmployeeError(
        "Employee could not be added."
      );
    } finally {
      setAddingEmployee(false);
    }
  }


  // ----------------------------------------------------------
  // Submit ticket
  // ----------------------------------------------------------
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !title.trim() ||
      !description.trim() ||
      !selectedRequester
    ) {
      return;
    }

    try {
      setSubmitting(true);

      await onSubmit({
        title: title.trim(),

        description:
          description.trim(),

        priority,

        requester_id:
          selectedRequester.id,

        category_id:
          categoryId,

        assignment_group_id:
          assignmentGroupId,
      });
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-7"
    >
      {/* ======================================================
          REQUESTER DETAILS
      ====================================================== */}
      <FormSection
        icon={CircleUserRound}
        title="Requester Details"
        description="Search for an employee or add someone who is not yet in IncidentFlow."
      >
        <div className="space-y-4">
          {/* --------------------------------------------------
              Requester Search
          -------------------------------------------------- */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Requester

              <span className="ml-1 text-red-500">
                *
              </span>
            </label>


            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />


              <input
                type="text"
                value={requesterSearch}
                disabled={
                  loadingOptions ||
                  showAddEmployee
                }
                onChange={(event) =>
                  handleRequesterSearchChange(
                    event.target.value
                  )
                }
                onFocus={() =>
                  setRequesterDropdownOpen(
                    true
                  )
                }
                placeholder={
                  loadingOptions
                    ? "Loading employees..."
                    : "Search by employee name or email..."
                }
                autoComplete="off"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-10 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50"
              />


              {selectedRequester && (
                <Check
                  size={18}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-green-600"
                />
              )}


              {/* ----------------------------------------------
                  Requester Search Results
              ---------------------------------------------- */}
              {requesterDropdownOpen &&
                requesterSearch.trim() &&
                !selectedRequester &&
                !showAddEmployee && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">

                    {/* Existing people */}
                    <div className="max-h-60 overflow-y-auto p-1.5">
                      {filteredRequesters.length >
                      0 ? (
                        filteredRequesters.map(
                          (requester) => {
                            const department =
                              departments.find(
                                (
                                  department
                                ) =>
                                  department.id ===
                                  requester.department_id
                              );

                            return (
                              <button
                                key={
                                  requester.id
                                }
                                type="button"
                                onMouseDown={(
                                  event
                                ) =>
                                  event.preventDefault()
                                }
                                onClick={() =>
                                  handleRequesterSelect(
                                    requester
                                  )
                                }
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-blue-50"
                              >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                  <UserRound
                                    size={17}
                                  />
                                </div>


                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-slate-900">
                                    {
                                      requester.name
                                    }
                                  </p>

                                  <p className="truncate text-xs text-slate-500">
                                    {
                                      requester.email
                                    }

                                    {department
                                      ? ` • ${department.name}`
                                      : ""}
                                  </p>
                                </div>
                              </button>
                            );
                          }
                        )
                      ) : (
                        <div className="px-4 py-5 text-center">
                          <p className="text-sm font-medium text-slate-700">
                            No employees found
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Add this employee if
                            they are not already
                            in IncidentFlow.
                          </p>
                        </div>
                      )}
                    </div>


                    {/* ------------------------------------------
                        Add Employee Action

                        Only appears when there are NO
                        matching employees.
                    ------------------------------------------ */}
                    {filteredRequesters.length === 0 && (
                      <div className="border-t border-slate-100 p-2">
                        <button
                          type="button"
                          onMouseDown={(
                            event
                          ) =>
                            event.preventDefault()
                          }
                          onClick={
                            handleOpenAddEmployee
                          }
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-blue-600 transition hover:bg-blue-50"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
                            <Plus
                              size={17}
                            />
                          </div>


                          <div>
                            <p className="text-sm font-semibold">
                              Add Employee
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              Add someone who is
                              not in IncidentFlow
                              yet
                            </p>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                )}
            </div>


            {!selectedRequester &&
              !showAddEmployee && (
                <p className="mt-2 text-xs text-slate-400">
                  Select the employee this
                  ticket is being created for.
                </p>
              )}
          </div>


          {/* ==================================================
              ADD EMPLOYEE FORM
          ================================================== */}
          {showAddEmployee && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-slate-900">
                    Add Employee
                  </h4>

                  <p className="mt-1 text-xs text-slate-500">
                    This creates a requester
                    contact. It does not create
                    a login account.
                  </p>
                </div>


                <button
                  type="button"
                  onClick={
                    handleCancelAddEmployee
                  }
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-700"
                  aria-label="Close add employee form"
                >
                  <X size={17} />
                </button>
              </div>


              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Name

                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={
                      newEmployeeName
                    }
                    onChange={(event) =>
                      setNewEmployeeName(
                        event.target.value
                      )
                    }
                    placeholder="Employee name"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>


                {/* Email */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email

                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="email"
                    value={
                      newEmployeeEmail
                    }
                    onChange={(event) =>
                      setNewEmployeeEmail(
                        event.target.value
                      )
                    }
                    placeholder="employee@company.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>


                {/* Department */}
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Department
                  </label>

                  <div className="relative">
                    <select
                      value={
                        newEmployeeDepartmentId ??
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        setNewEmployeeDepartmentId(
                          event.target.value
                            ? Number(
                                event.target
                                  .value
                              )
                            : null
                        )
                      }
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-900 shadow-sm outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    >
                      <option value="">
                        No department
                      </option>

                      {departments.map(
                        (
                          department
                        ) => (
                          <option
                            key={
                              department.id
                            }
                            value={
                              department.id
                            }
                          >
                            {
                              department.name
                            }
                          </option>
                        )
                      )}
                    </select>


                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>
              </div>


              {addEmployeeError && (
                <p className="mt-4 text-sm font-medium text-red-600">
                  {addEmployeeError}
                </p>
              )}


              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={
                    handleCancelAddEmployee
                  }
                  disabled={
                    addingEmployee
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>


                <button
                  type="button"
                  onClick={
                    handleAddEmployee
                  }
                  disabled={
                    addingEmployee ||
                    !newEmployeeName.trim() ||
                    !newEmployeeEmail.trim()
                  }
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addingEmployee
                    ? "Adding..."
                    : "Add Employee"}
                </button>
              </div>
            </div>
          )}


          {/* --------------------------------------------------
              Selected Requester Information
          -------------------------------------------------- */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ReadOnlyField
              label="Email"
              value={
                selectedRequester
                  ?.email ??
                "Select a requester first"
              }
            />

            <ReadOnlyField
              label="Department"
              value={
                selectedRequester
                  ? selectedDepartment
                      ?.name ??
                    "No department assigned"
                  : "Select a requester first"
              }
            />
          </div>
        </div>
      </FormSection>


      {/* ======================================================
          TICKET DETAILS
      ====================================================== */}
      <FormSection
        icon={ClipboardList}
        title="Ticket Details"
        description="Describe the issue and classify the request."
      >
        <div className="space-y-5">
          {/* Subject */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Subject

              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              placeholder="Example: Printer is not responding"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              required
            />
          </div>


          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Description

              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="Describe the issue, what happened, and any troubleshooting already attempted..."
              rows={6}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              required
            />
          </div>


          {/* Priority + Category */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Priority
              </label>

              <div className="relative">
                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(
                      event.target
                        .value as
                        | "low"
                        | "medium"
                        | "high"
                    )
                  }
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-900 shadow-sm outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="low">
                    Low
                  </option>

                  <option value="medium">
                    Medium
                  </option>

                  <option value="high">
                    High
                  </option>
                </select>


                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>


            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Category
              </label>

              <div className="relative">
                <select
                  value={
                    categoryId ?? ""
                  }
                  disabled={
                    loadingOptions
                  }
                  onChange={(event) =>
                    setCategoryId(
                      event.target.value
                        ? Number(
                            event.target
                              .value
                          )
                        : null
                    )
                  }
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-900 shadow-sm outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">
                    {loadingOptions
                      ? "Loading categories..."
                      : "Select a category"}
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {
                          category.name
                        }
                      </option>
                    )
                  )}
                </select>


                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>
          </div>
        </div>
      </FormSection>


      {/* ======================================================
          ROUTING
      ====================================================== */}
      <FormSection
        icon={Route}
        title="Routing"
        description="Determine where the ticket should go. It can be reassigned later."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Assignment Group
            </label>


            <div className="relative">
              <select
                value={
                  assignmentGroupId ??
                  ""
                }
                disabled={
                  loadingOptions
                }
                onChange={(event) =>
                  setAssignmentGroupId(
                    event.target.value
                      ? Number(
                          event.target
                            .value
                        )
                      : null
                  )
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-900 shadow-sm outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">
                  {loadingOptions
                    ? "Loading groups..."
                    : "Select an assignment group"}
                </option>

                {assignmentGroups.map(
                  (group) => (
                    <option
                      key={
                        group.id
                      }
                      value={
                        group.id
                      }
                    >
                      {
                        group.name
                      }
                    </option>
                  )
                )}
              </select>


              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>


          <ReadOnlyField
            label="Technician"
            value="Unassigned"
          />


          <ReadOnlyField
            label="Status"
            value="Open"
          />
        </div>


        <p className="mt-4 text-xs leading-5 text-slate-400">
          Technician assignment and
          ticket status can be updated
          after the ticket is created.
        </p>
      </FormSection>


      {/* ======================================================
          FORM ACTIONS
      ====================================================== */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>


        <button
          type="submit"
          disabled={
            submitting ||
            !selectedRequester ||
            !title.trim() ||
            !description.trim()
          }
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? "Creating Ticket..."
            : "Create Ticket"}
        </button>
      </div>
    </form>
  );
}


// ------------------------------------------------------------
// Form Section
// ------------------------------------------------------------
type FormSectionProps = {
  icon: ElementType;
  title: string;
  description: string;
  children: ReactNode;
};


function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <section>
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Icon className="h-4 w-4" />
        </div>


        <div>
          <h3 className="font-semibold text-slate-900">
            {title}
          </h3>

          <p className="mt-0.5 text-xs text-slate-500">
            {description}
          </p>
        </div>
      </div>


      <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-5">
        {children}
      </div>
    </section>
  );
}


// ------------------------------------------------------------
// Read-only Field
// ------------------------------------------------------------
type ReadOnlyFieldProps = {
  label: string;
  value: string;
};


function ReadOnlyField({
  label,
  value,
}: ReadOnlyFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>


      <div className="flex min-h-12 items-center rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500">
        {value}
      </div>
    </div>
  );
}


export default TicketForm;