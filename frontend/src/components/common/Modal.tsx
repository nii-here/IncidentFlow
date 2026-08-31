// ------------------------------------------------------------
// Modal Component
//
// Reusable modal dialog for the entire platform.
//
// Examples:
// • Create Category
// • Edit Category
// • Create User
// • Create Department
// • Create Asset
// ------------------------------------------------------------

import type { ReactNode } from "react";
import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

function Modal({
  open,
  title,
  onClose,
  children,
}: ModalProps) {
  if (!open) return null;

  return (
    <>
      {/* Dark Background */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <div
          className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b p-6">
            <h2 className="text-xl font-semibold text-slate-900">
              {title}
            </h2>

            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

export default Modal;