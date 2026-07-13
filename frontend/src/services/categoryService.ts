// ------------------------------------------------------------
// Category Service
// Handles category API calls.
// ------------------------------------------------------------

import api from "./api";

import type { Category, CategoryCreate } from "../types/category";

// Get all active categories
export async function getCategories(): Promise<Category[]> {
  const response = await api.get<Category[]>("/categories/");
  return response.data;
}

// Create a new category
export async function createCategory(
  categoryData: CategoryCreate
): Promise<Category> {
  const response = await api.post<Category>("/categories/", categoryData);
  return response.data;
}

export async function updateCategory(
  categoryId: number,
  categoryData: CategoryCreate
): Promise<Category> {
  const response = await api.put<Category>(
    `/categories/${categoryId}`,
    categoryData
  );

  return response.data;
}

export async function updateCategoryStatus(
  categoryId: number,
  active: boolean
): Promise<Category> {
  const response = await api.patch<Category>(
    `/categories/${categoryId}/status`,
    null,
    {
      params: {
        active,
      },
    }
  );

  return response.data;
}

// Archive a category. The category stays in the database for historical records
export async function archiveCategory(
  categoryId: number
): Promise<Category> {
  const response = await api.patch<Category>(
    `/categories/${categoryId}/archive`
  );

  return response.data;
}

// ------------------------------------------------------------
// Get archived categories
// ------------------------------------------------------------
export async function getArchivedCategories(): Promise<Category[]> {
  const response = await api.get<Category[]>("/categories/archived");
  return response.data;
}

// ------------------------------------------------------------
// Restore an archived category
// ------------------------------------------------------------
export async function restoreCategory(
  categoryId: number
): Promise<Category> {
  const response = await api.patch<Category>(
    `/categories/${categoryId}/restore`
  );

  return response.data;
}