// ------------------------------------------------------------
// Assignment Group Form
//
// Used for creating and editing assignment groups.
// ------------------------------------------------------------

import { useState } from "react";

import PrimaryButton from "../common/PrimaryButton";

import type { AssignmentGroupCreate } from "../../types/assignmentGroup";

type AssignmentGroupFormProps = {
  initialValues?: AssignmentGroupCreate;
  submitText: string;
  onCancel: () => void;
  onSubmit: (values: AssignmentGroupCreate) => Promise<void>;
};

function AssignmentGroupForm({
  initialValues,
  submitText,
  onCancel,
  onSubmit,
}: AssignmentGroupFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? ""
  );

  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    try {
      await onSubmit({
        name,
        description,
      });
    } catch {
      setError("Assignment group could not be saved.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {/* Group name */}
      <div>
        <label className="text-sm font-medium text-slate-700">
          Group Name
        </label>

        <input
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Example: Desktop Support"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-medium text-slate-700">
          Description
        </label>

        <input
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe this team's responsibilities"
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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

        <PrimaryButton type="submit">
          {submitText}
        </PrimaryButton>
      </div>
    </form>
  );
}

export default AssignmentGroupForm;