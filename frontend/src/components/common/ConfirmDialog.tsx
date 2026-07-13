// ------------------------------------------------------------
// ConfirmDialog Component
//
// Reusable confirmation modal for important actions.
//
// Examples:
// • Deactivate category
// • Reactivate category
// • Delete user
// • Archive ticket
// ------------------------------------------------------------

import { AlertTriangle } from "lucide-react";

import Modal from "./Modal";
import PrimaryButton from "./PrimaryButton";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  destructive?: boolean;
};

function ConfirmDialog({
  open,
  title,
  message,
  confirmText,
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <div className="space-y-6">
        <div className="flex gap-4">
          <div
            className={
              destructive
                ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600"
                : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600"
            }
          >
            <AlertTriangle className="h-5 w-5" />
          </div>

          <p className="text-sm leading-6 text-slate-600">
            {message}
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>

          {destructive ? (
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              {confirmText}
            </button>
          ) : (
            <PrimaryButton onClick={onConfirm}>
              {confirmText}
            </PrimaryButton>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;