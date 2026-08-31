// ------------------------------------------------------------
// Logo Component
//
// Displays the IncidentFlow brand.
//
// The sidebar can use this component in:
// - expanded mode
// - collapsed mode
// ------------------------------------------------------------

import { Wrench } from "lucide-react";

type LogoProps = {
  collapsed?: boolean;
};

function Logo({
  collapsed = false,
}: LogoProps) {
  return (
    <div
      className={`flex items-center ${
        collapsed
          ? "justify-center"
          : "gap-3"
      }`}
    >
      {/* ------------------------------------------------------
          Icon
      ------------------------------------------------------ */}

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
        <Wrench size={20} />
      </div>


      {/* ------------------------------------------------------
          Brand text
          
          Hide this when sidebar is collapsed.
      ------------------------------------------------------ */}

      {!collapsed && (
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-slate-900">
            IncidentFlow
          </h1>

          <p className="truncate text-xs text-slate-500">
            IT Support Platform
          </p>
        </div>
      )}
    </div>
  );
}

export default Logo;