// ------------------------------------------------------------
// Assignment Groups Page
//
// Displays and manages administrator-defined teams.
//
// Business logic lives inside:
// hooks/useAssignmentGroups.ts
// ------------------------------------------------------------

import {
  Archive,
  ArchiveRestore,
  Ban,
  CheckCircle,
  Pencil,
  Plus,
  UsersRound,
} from "lucide-react";

import AssignmentGroupForm from "../components/assignment-groups/AssignmentGroupForm";

import ActionMenu from "../components/common/ActionMenu";
import Breadcrumb from "../components/common/Breadcrumb";
import ConfirmDialog from "../components/common/ConfirmDialog";
import EmptyState from "../components/common/EmptyState";
import Modal from "../components/common/Modal";
import PageHeader from "../components/common/PageHeader";
import PrimaryButton from "../components/common/PrimaryButton";
import SearchBar from "../components/common/SearchBar";
import StatCard from "../components/common/StatCard";
import StatusBadge from "../components/common/StatusBadge";
import TableSkeleton from "../components/common/TableSkeleton";

import { useAssignmentGroups } from "../hooks/useAssignmentGroups";

function AssignmentGroupsPage() {
  const {
    groups,
    activeGroups,
    inactiveGroups,
    filteredGroups,

    search,
    setSearch,

    loading,

    showArchived,
    setShowArchived,

    selectedGroup,

    isCreateModalOpen,
    setIsCreateModalOpen,

    isEditModalOpen,
    openEditModal,
    closeEditModal,

    statusConfirmOpen,
    openStatusConfirm,
    closeStatusConfirm,

    archiveConfirmOpen,
    openArchiveConfirm,
    closeArchiveConfirm,

    restoreConfirmOpen,
    openRestoreConfirm,
    closeRestoreConfirm,

    handleCreateGroup,
    handleUpdateGroup,
    handleConfirmStatusChange,
    handleConfirmArchive,
    handleConfirmRestore,
  } = useAssignmentGroups();

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="space-y-3">
        <Breadcrumb
          items={["Administration", "Assignment Groups"]}
        />

        <PageHeader
          title="Assignment Groups"
          description="Create and manage teams responsible for receiving and handling work."
          action={
            !showArchived ? (
              <PrimaryButton
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Assignment Group
              </PrimaryButton>
            ) : undefined
          }
        />
      </div>

      {/* Summary cards */}
      {!showArchived ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Total Groups"
            value={groups.length}
          />

          <StatCard
            label="Active"
            value={activeGroups.length}
          />

          <StatCard
            label="Inactive"
            value={inactiveGroups.length}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Archived Groups"
            value={groups.length}
          />
        </div>
      )}

      {/* Search and view toggle */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={
            showArchived
              ? "Search archived assignment groups..."
              : "Search assignment groups..."
          }
        />

        <div className="flex overflow-hidden rounded-lg border border-slate-300">
          <button
            type="button"
            onClick={() => setShowArchived(false)}
            className={`px-4 py-2 text-sm font-medium transition ${
              !showArchived
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            Active
          </button>

          <button
            type="button"
            onClick={() => setShowArchived(true)}
            className={`px-4 py-2 text-sm font-medium transition ${
              showArchived
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Assignment groups table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4">Group Name</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>

          {loading ? (
            <TableSkeleton columns={4} rows={4} />
          ) : (
            <tbody>
              {filteredGroups.map((group) => (
                <tr
                  key={group.id}
                  className="border-b transition last:border-b-0 hover:bg-slate-50"
                >
                  {/* Group name */}
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <UsersRound className="h-4 w-4" />
                      </div>

                      {group.name}
                    </div>
                  </td>

                  {/* Description */}
                  <td className="px-6 py-4 text-slate-600">
                    {group.description ?? "—"}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    {showArchived ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        <Archive className="h-3.5 w-3.5" />
                        Archived
                      </span>
                    ) : (
                      <StatusBadge active={group.active} />
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <ActionMenu
                      actions={
                        showArchived
                          ? [
                              {
                                label: "Restore",
                                icon: ArchiveRestore,
                                onClick: () =>
                                  openRestoreConfirm(group),
                              },
                            ]
                          : [
                              {
                                label: "Edit",
                                icon: Pencil,
                                onClick: () =>
                                  openEditModal(group),
                              },
                              {
                                label: group.active
                                  ? "Deactivate"
                                  : "Reactivate",
                                icon: group.active
                                  ? Ban
                                  : CheckCircle,
                                onClick: () =>
                                  openStatusConfirm(group),
                              },
                              {
                                label: "Archive",
                                icon: Archive,
                                destructive: true,
                                onClick: () =>
                                  openArchiveConfirm(group),
                              },
                            ]
                      }
                    />
                  </td>
                </tr>
              ))}

              {/* Empty state */}
              {filteredGroups.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      icon={
                        showArchived
                          ? Archive
                          : UsersRound
                      }
                      title={
                        search
                          ? "No matching assignment groups"
                          : showArchived
                            ? "No archived assignment groups"
                            : "No assignment groups yet"
                      }
                      description={
                        search
                          ? "Try a different search term."
                          : showArchived
                            ? "Archived assignment groups will appear here."
                            : "Create your first assignment group to begin routing work."
                      }
                      action={
                        !search && !showArchived ? (
                          <PrimaryButton
                            onClick={() =>
                              setIsCreateModalOpen(true)
                            }
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            New Assignment Group
                          </PrimaryButton>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          )}
        </table>
      </div>

      {/* Create modal */}
      <Modal
        open={isCreateModalOpen}
        title="Create Assignment Group"
        onClose={() => setIsCreateModalOpen(false)}
      >
        <AssignmentGroupForm
          submitText="Create Assignment Group"
          onCancel={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateGroup}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={isEditModalOpen}
        title="Edit Assignment Group"
        onClose={closeEditModal}
      >
        {selectedGroup && (
          <AssignmentGroupForm
            initialValues={{
              name: selectedGroup.name,
              description:
                selectedGroup.description ?? "",
            }}
            submitText="Save Changes"
            onCancel={closeEditModal}
            onSubmit={handleUpdateGroup}
          />
        )}
      </Modal>

      {/* Status confirmation */}
      <ConfirmDialog
        open={statusConfirmOpen}
        title={
          selectedGroup?.active
            ? "Deactivate Assignment Group"
            : "Reactivate Assignment Group"
        }
        message={
          selectedGroup?.active
            ? `Are you sure you want to deactivate "${selectedGroup.name}"? It will no longer be available for new ticket assignments.`
            : `Are you sure you want to reactivate "${selectedGroup?.name}"?`
        }
        confirmText={
          selectedGroup?.active
            ? "Deactivate"
            : "Reactivate"
        }
        destructive={selectedGroup?.active ?? false}
        onCancel={closeStatusConfirm}
        onConfirm={handleConfirmStatusChange}
      />

      {/* Archive confirmation */}
      <ConfirmDialog
        open={archiveConfirmOpen}
        title="Archive Assignment Group"
        message={`Are you sure you want to archive "${selectedGroup?.name}"? Historical records will remain intact.`}
        confirmText="Archive"
        destructive
        onCancel={closeArchiveConfirm}
        onConfirm={handleConfirmArchive}
      />

      {/* Restore confirmation */}
      <ConfirmDialog
        open={restoreConfirmOpen}
        title="Restore Assignment Group"
        message={`Are you sure you want to restore "${selectedGroup?.name}"? It will return to the normal assignment-groups list.`}
        confirmText="Restore"
        onCancel={closeRestoreConfirm}
        onConfirm={handleConfirmRestore}
      />
    </div>
  );
}

export default AssignmentGroupsPage;