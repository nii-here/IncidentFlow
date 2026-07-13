// ------------------------------------------------------------
// Action Menu Component
//
// Displays a reusable dropdown menu for table row actions.
//
// Instead of hardcoding actions such as Edit or Delete,
// the parent component passes a list of actions.
//
// This lets the same menu work across:
// • Categories
// • Departments
// • Assignment Groups
// • Users
// • Assets
// • Tickets
// ------------------------------------------------------------

import { useState, type ComponentType } from "react";
import { MoreHorizontal } from "lucide-react";

// Describes one action shown inside the dropdown menu
export type ActionMenuItem = {
  // Text shown beside the icon
  label: string;

  // Lucide icon component
  icon: ComponentType<{
    className?: string;
  }>;

  // Function that runs when the action is clicked
  onClick: () => void;

  // Makes dangerous actions red
  destructive?: boolean;

  // Optionally hide an action
  hidden?: boolean;
};

type ActionMenuProps = {
  actions: ActionMenuItem[];
};

function ActionMenu({ actions }: ActionMenuProps) {
  // Controls whether the dropdown is open
  const [open, setOpen] = useState(false);

  // Remove hidden actions before displaying the menu
  const visibleActions = actions.filter((action) => !action.hidden);

  return (
    <div className="relative inline-block text-left">
      {/* Three-dot menu button */}
      <button
        type="button"
        aria-label="Open actions menu"
        aria-expanded={open}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        className="
          rounded-lg
          p-2
          text-slate-600
          transition
          hover:bg-slate-100
          hover:text-slate-900
        "
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          className="
            absolute
            right-0
            z-50
            mt-2
            w-48
            overflow-hidden
            rounded-xl
            border
            border-slate-200
            bg-white
            py-1
            shadow-xl
          "
        >
          {visibleActions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.label}
                type="button"
                onClick={() => {
                  action.onClick();
                  setOpen(false);
                }}
                className={
                  action.destructive
                    ? "flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                    : "flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                }
              >
                <Icon className="h-4 w-4 shrink-0" />

                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ActionMenu;