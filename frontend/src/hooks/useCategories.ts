// ------------------------------------------------------------
// useCategories Hook
//
// This custom hook owns the Categories module logic.
//
// It handles:
// • Loading categories
// • Searching categories
// • Creating categories
// • Editing categories
// • Activating and deactivating categories
// • Archiving categories
// • Restoring archived categories
// • Opening and closing dialogs
// ------------------------------------------------------------

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  archiveCategory,
  createCategory,
  getArchivedCategories,
  getCategories,
  restoreCategory,
  updateCategory,
  updateCategoryStatus,
} from "../services/categoryService";

import type {
  Category,
  CategoryCreate,
} from "../types/category";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Controls whether normal or archived categories are shown
  const [showArchived, setShowArchived] = useState(false);

  // Modal and dialog state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);

  // Category currently being edited or acted on
  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);

  // ------------------------------------------------------------
  // Load categories
  // ------------------------------------------------------------
  async function loadCategories() {
    try {
      setLoading(true);

      const data = showArchived
        ? await getArchivedCategories()
        : await getCategories();

      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories.", error);
      toast.error("Categories could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, [showArchived]);

  // ------------------------------------------------------------
  // Derived values
  // ------------------------------------------------------------
  const activeCategories = categories.filter(
    (category) => category.active
  );

  const inactiveCategories = categories.filter(
    (category) => !category.active
  );

  const filteredCategories = categories.filter((category) => {
    const searchText = search.trim().toLowerCase();

    return (
      category.name.toLowerCase().includes(searchText) ||
      (category.description ?? "")
        .toLowerCase()
        .includes(searchText)
    );
  });

  // ------------------------------------------------------------
  // Create
  // ------------------------------------------------------------
  async function handleCreateCategory(values: CategoryCreate) {
    try {
      await createCategory(values);

      setIsCreateModalOpen(false);
      await loadCategories();

      toast.success("Category created successfully.");
    } catch (error) {
      console.error("Failed to create category.", error);
      toast.error("Category could not be created.");
      throw error;
    }
  }

  // ------------------------------------------------------------
  // Edit
  // ------------------------------------------------------------
  function openEditModal(category: Category) {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  }

  function closeEditModal() {
    setIsEditModalOpen(false);
    setSelectedCategory(null);
  }

  async function handleUpdateCategory(values: CategoryCreate) {
    if (!selectedCategory) {
      return;
    }

    try {
      await updateCategory(selectedCategory.id, values);

      closeEditModal();
      await loadCategories();

      toast.success("Category updated successfully.");
    } catch (error) {
      console.error("Failed to update category.", error);
      toast.error("Category could not be updated.");
      throw error;
    }
  }

  // ------------------------------------------------------------
  // Activate / deactivate
  // ------------------------------------------------------------
  function openStatusConfirm(category: Category) {
    setSelectedCategory(category);
    setStatusConfirmOpen(true);
  }

  function closeStatusConfirm() {
    setStatusConfirmOpen(false);
    setSelectedCategory(null);
  }

  async function handleConfirmStatusChange() {
    if (!selectedCategory) {
      return;
    }

    try {
      const nextActiveState = !selectedCategory.active;

      await updateCategoryStatus(
        selectedCategory.id,
        nextActiveState
      );

      await loadCategories();

      toast.success(
        nextActiveState
          ? "Category reactivated successfully."
          : "Category deactivated successfully."
      );

      closeStatusConfirm();
    } catch (error) {
      console.error(
        "Failed to update category status.",
        error
      );

      toast.error("Category status could not be updated.");
    }
  }

  // ------------------------------------------------------------
  // Archive
  // ------------------------------------------------------------
  function openArchiveConfirm(category: Category) {
    setSelectedCategory(category);
    setArchiveConfirmOpen(true);
  }

  function closeArchiveConfirm() {
    setArchiveConfirmOpen(false);
    setSelectedCategory(null);
  }

  async function handleConfirmArchive() {
    if (!selectedCategory) {
      return;
    }

    try {
      await archiveCategory(selectedCategory.id);

      await loadCategories();

      toast.success("Category archived successfully.");
      closeArchiveConfirm();
    } catch (error) {
      console.error("Failed to archive category.", error);
      toast.error("Category could not be archived.");
    }
  }

  // ------------------------------------------------------------
  // Restore
  // ------------------------------------------------------------
  function openRestoreConfirm(category: Category) {
    setSelectedCategory(category);
    setRestoreConfirmOpen(true);
  }

  function closeRestoreConfirm() {
    setRestoreConfirmOpen(false);
    setSelectedCategory(null);
  }

  async function handleConfirmRestore() {
    if (!selectedCategory) {
      return;
    }

    try {
      await restoreCategory(selectedCategory.id);

      await loadCategories();

      toast.success("Category restored successfully.");
      closeRestoreConfirm();
    } catch (error) {
      console.error("Failed to restore category.", error);
      toast.error("Category could not be restored.");
    }
  }

  return {
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
  };
}