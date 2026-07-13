// ------------------------------------------------------------
// Categories Page
//
// Displays and manages categories.
//
// Business logic lives inside:
// hooks/useCategories.ts
//
// This page focuses on displaying the user interface.
// ------------------------------------------------------------

import {
  Archive,
  ArchiveRestore,
  Ban,
  CheckCircle,
  FolderOpen,
  Pencil,
  Plus,
} from "lucide-react";

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

import CategoryForm from "../components/categories/CategoryForm";

import { useCategories } from "../hooks/useCategories";

// ------------------------------------------------------------
// Colors used for category indicators
// ------------------------------------------------------------

const colorMap: Record<string, string> = {
  blue: "#3b82f6",
  green: "#22c55e",
  red: "#ef4444",
  yellow: "#eab308",
  purple: "#a855f7",
  orange: "#f97316",
  gray: "#64748b",
};

function CategoriesPage() {
  const {
    categories,
    activeCategories,
    inactiveCategories,
    filteredCategories,

    search,
    setSearch,

    loading,

    selectedCategory,

    showArchived,
    setShowArchived,

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

    handleCreateCategory,
    handleUpdateCategory,
    handleConfirmStatusChange,
    handleConfirmArchive,
    handleConfirmRestore,
  } = useCategories();

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="space-y-3">
        <Breadcrumb items={["Administration", "Categories"]} />

        <PageHeader
          title="Categories"
          description="Create and manage ticket categories used across the platform."
          action={
            !showArchived ? (
              <PrimaryButton
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Category
              </PrimaryButton>
            ) : undefined
          }
        />
      </div>

      {/* Summary cards */}
      {!showArchived ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Total Categories"
            value={categories.length}
          />

          <StatCard
            label="Active"
            value={activeCategories.length}
          />

          <StatCard
            label="Inactive"
            value={inactiveCategories.length}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Archived Categories"
            value={categories.length}
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
              ? "Search archived categories..."
              : "Search categories..."
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

      {/* Categories table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Color</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>

          {loading ? (
            <TableSkeleton columns={5} rows={4} />
          ) : (
            <tbody>
              {filteredCategories.map((category) => (
                <tr
                  key={category.id}
                  className="border-b transition last:border-b-0 hover:bg-slate-50"
                >
                  {/* Name */}
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {category.name}
                  </td>

                  {/* Color */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-4 w-4 rounded-full border border-slate-300"
                        style={{
                          backgroundColor:
                            colorMap[category.color ?? "blue"] ??
                            colorMap.blue,
                        }}
                      />

                      <span className="capitalize text-slate-600">
                        {category.color ?? "blue"}
                      </span>
                    </div>
                  </td>

                  {/* Description */}
                  <td className="px-6 py-4 text-slate-600">
                    {category.description ?? "—"}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    {showArchived ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        <Archive className="h-3.5 w-3.5" />
                        Archived
                      </span>
                    ) : (
                      <StatusBadge active={category.active} />
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
                                  openRestoreConfirm(category),
                              },
                            ]
                          : [
                              {
                                label: "Edit",
                                icon: Pencil,
                                onClick: () =>
                                  openEditModal(category),
                              },
                              {
                                label: category.active
                                  ? "Deactivate"
                                  : "Reactivate",
                                icon: category.active
                                  ? Ban
                                  : CheckCircle,
                                onClick: () =>
                                  openStatusConfirm(category),
                              },
                              {
                                label: "Archive",
                                icon: Archive,
                                destructive: true,
                                onClick: () =>
                                  openArchiveConfirm(category),
                              },
                            ]
                      }
                    />
                  </td>
                </tr>
              ))}

              {/* Empty state */}
              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={showArchived ? Archive : FolderOpen}
                      title={
                        search
                          ? "No matching categories"
                          : showArchived
                            ? "No archived categories"
                            : "No categories yet"
                      }
                      description={
                        search
                          ? "Try a different search term."
                          : showArchived
                            ? "Archived categories will appear here."
                            : "Create your first category to begin organizing tickets."
                      }
                      action={
                        !search && !showArchived ? (
                          <PrimaryButton
                            onClick={() =>
                              setIsCreateModalOpen(true)
                            }
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            New Category
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

      {/* Create category modal */}
      <Modal
        open={isCreateModalOpen}
        title="Create Category"
        onClose={() => setIsCreateModalOpen(false)}
      >
        <CategoryForm
          submitText="Create Category"
          onCancel={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateCategory}
        />
      </Modal>

      {/* Edit category modal */}
      <Modal
        open={isEditModalOpen}
        title="Edit Category"
        onClose={closeEditModal}
      >
        {selectedCategory && (
          <CategoryForm
            initialValues={{
              name: selectedCategory.name,
              description:
                selectedCategory.description ?? "",
              color: selectedCategory.color ?? "blue",
            }}
            submitText="Save Changes"
            onCancel={closeEditModal}
            onSubmit={handleUpdateCategory}
          />
        )}
      </Modal>

      {/* Status confirmation */}
      <ConfirmDialog
        open={statusConfirmOpen}
        title={
          selectedCategory?.active
            ? "Deactivate Category"
            : "Reactivate Category"
        }
        message={
          selectedCategory?.active
            ? `Are you sure you want to deactivate "${selectedCategory.name}"? Existing tickets will keep this category, but it will not be available for new tickets.`
            : `Are you sure you want to reactivate "${selectedCategory?.name}"?`
        }
        confirmText={
          selectedCategory?.active
            ? "Deactivate"
            : "Reactivate"
        }
        destructive={selectedCategory?.active ?? false}
        onCancel={closeStatusConfirm}
        onConfirm={handleConfirmStatusChange}
      />

      {/* Archive confirmation */}
      <ConfirmDialog
        open={archiveConfirmOpen}
        title="Archive Category"
        message={`Are you sure you want to archive "${selectedCategory?.name}"? It will be removed from normal category lists, but historical records will remain intact.`}
        confirmText="Archive"
        destructive
        onCancel={closeArchiveConfirm}
        onConfirm={handleConfirmArchive}
      />

      {/* Restore confirmation */}
      <ConfirmDialog
        open={restoreConfirmOpen}
        title="Restore Category"
        message={`Are you sure you want to restore "${selectedCategory?.name}"? It will return to the normal categories list.`}
        confirmText="Restore"
        onCancel={closeRestoreConfirm}
        onConfirm={handleConfirmRestore}
      />
    </div>
  );
}

export default CategoriesPage;