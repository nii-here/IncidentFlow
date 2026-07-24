// ------------------------------------------------------------
// useAssignmentGroups Hook
//
// Owns the Assignment Groups module logic.
//
// It handles:
// • Loading groups
// • Searching
// • Creating
// • Editing
// • Activating and deactivating
// • Archiving
// • Restoring
// • Opening and closing dialogs
// ------------------------------------------------------------

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  archiveAssignmentGroup,
  createAssignmentGroup,
  getArchivedAssignmentGroups,
  getAssignmentGroups,
  restoreAssignmentGroup,
  updateAssignmentGroup,
  updateAssignmentGroupStatus,
} from "../services/assignmentGroupService";

import type {
  AssignmentGroup,
  AssignmentGroupCreate,
} from "../types/assignmentGroup";

export function useAssignmentGroups() {
  const [groups, setGroups] = useState<AssignmentGroup[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showArchived, setShowArchived] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);

  const [selectedGroup, setSelectedGroup] =
    useState<AssignmentGroup | null>(null);

  // ------------------------------------------------------------
  // Load assignment groups
  // ------------------------------------------------------------
  async function loadGroups() {
    try {
      setLoading(true);

      const data = showArchived
        ? await getArchivedAssignmentGroups()
        : await getAssignmentGroups();

      setGroups(data);
    } catch (error) {
      console.error("Failed to load assignment groups.", error);
      toast.error("Assignment groups could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGroups();
  }, [showArchived]);

  // ------------------------------------------------------------
  // Derived values
  // ------------------------------------------------------------
  const activeGroups = groups.filter((group) => group.active);

  const inactiveGroups = groups.filter((group) => !group.active);

  const filteredGroups = groups.filter((group) => {
    const searchText = search.trim().toLowerCase();

    return (
      group.name.toLowerCase().includes(searchText) ||
      (group.description ?? "")
        .toLowerCase()
        .includes(searchText)
    );
  });

  // ------------------------------------------------------------
  // Create
  // ------------------------------------------------------------
  async function handleCreateGroup(
    values: AssignmentGroupCreate
  ) {
    try {
      await createAssignmentGroup(values);

      setIsCreateModalOpen(false);
      await loadGroups();

      toast.success("Assignment group created successfully.");
    } catch (error) {
      console.error("Failed to create assignment group.", error);
      toast.error("Assignment group could not be created.");
      throw error;
    }
  }

  // ------------------------------------------------------------
  // Edit
  // ------------------------------------------------------------
  function openEditModal(group: AssignmentGroup) {
    setSelectedGroup(group);
    setIsEditModalOpen(true);
  }

  function closeEditModal() {
    setIsEditModalOpen(false);
    setSelectedGroup(null);
  }

  async function handleUpdateGroup(
    values: AssignmentGroupCreate
  ) {
    if (!selectedGroup) {
      return;
    }

    try {
      await updateAssignmentGroup(
        selectedGroup.id,
        values
      );

      closeEditModal();
      await loadGroups();

      toast.success("Assignment group updated successfully.");
    } catch (error) {
      console.error("Failed to update assignment group.", error);
      toast.error("Assignment group could not be updated.");
      throw error;
    }
  }

  // ------------------------------------------------------------
  // Activate / deactivate
  // ------------------------------------------------------------
  function openStatusConfirm(group: AssignmentGroup) {
    setSelectedGroup(group);
    setStatusConfirmOpen(true);
  }

  function closeStatusConfirm() {
    setStatusConfirmOpen(false);
    setSelectedGroup(null);
  }

  async function handleConfirmStatusChange() {
    if (!selectedGroup) {
      return;
    }

    try {
      const nextActiveState = !selectedGroup.active;

      await updateAssignmentGroupStatus(
        selectedGroup.id,
        nextActiveState
      );

      await loadGroups();

      toast.success(
        nextActiveState
          ? "Assignment group reactivated successfully."
          : "Assignment group deactivated successfully."
      );

      closeStatusConfirm();
    } catch (error) {
      console.error(
        "Failed to update assignment group status.",
        error
      );

      toast.error(
        "Assignment group status could not be updated."
      );
    }
  }

  // ------------------------------------------------------------
  // Archive
  // ------------------------------------------------------------
  function openArchiveConfirm(group: AssignmentGroup) {
    setSelectedGroup(group);
    setArchiveConfirmOpen(true);
  }

  function closeArchiveConfirm() {
    setArchiveConfirmOpen(false);
    setSelectedGroup(null);
  }

  async function handleConfirmArchive() {
    if (!selectedGroup) {
      return;
    }

    try {
      await archiveAssignmentGroup(selectedGroup.id);

      await loadGroups();

      toast.success("Assignment group archived successfully.");
      closeArchiveConfirm();
    } catch (error) {
      console.error("Failed to archive assignment group.", error);
      toast.error("Assignment group could not be archived.");
    }
  }

  // ------------------------------------------------------------
  // Restore
  // ------------------------------------------------------------
  function openRestoreConfirm(group: AssignmentGroup) {
    setSelectedGroup(group);
    setRestoreConfirmOpen(true);
  }

  function closeRestoreConfirm() {
    setRestoreConfirmOpen(false);
    setSelectedGroup(null);
  }

  async function handleConfirmRestore() {
    if (!selectedGroup) {
      return;
    }

    try {
      await restoreAssignmentGroup(selectedGroup.id);

      await loadGroups();

      toast.success("Assignment group restored successfully.");
      closeRestoreConfirm();
    } catch (error) {
      console.error("Failed to restore assignment group.", error);
      toast.error("Assignment group could not be restored.");
    }
  }

  return {
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
  };
}