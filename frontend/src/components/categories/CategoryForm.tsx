// ------------------------------------------------------------
// CategoryForm Component
// Reusable form for creating and editing categories.
// ------------------------------------------------------------

import { useState, type FormEvent } from "react";

import PrimaryButton from "../common/PrimaryButton";

type CategoryFormValues = {
  name: string;
  description: string;
  color: string;
};

type CategoryFormProps = {
  initialValues?: CategoryFormValues;
  submitText: string;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
  onCancel: () => void;
};

function CategoryForm({
  initialValues,
  submitText,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? ""
  );
  const [color, setColor] = useState(initialValues?.color ?? "blue");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      await onSubmit({
        name,
        description,
        color,
      });
    } catch {
      setError("Category could not be saved.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700">
          Category Name
        </label>

        <input
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Example: Equipment"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">
          Description
        </label>

        <input
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Example: Physical devices and equipment"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">
          Category Color
        </label>

        <select
          value={color}
          onChange={(event) => setColor(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="blue">Blue</option>
          <option value="green">Green</option>
          <option value="red">Red</option>
          <option value="yellow">Yellow</option>
          <option value="purple">Purple</option>
          <option value="orange">Orange</option>
          <option value="gray">Gray</option>
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Cancel
        </button>

        <PrimaryButton type="submit">{submitText}</PrimaryButton>
      </div>
    </form>
  );
}

export default CategoryForm;