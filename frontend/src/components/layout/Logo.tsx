// ------------------------------------------------------------
// Logo Component
// This shows the IncidentFlow brand in the sidebar/header.
// Keeping it separate makes it reusable across the app.
// ------------------------------------------------------------

import { Wrench } from "lucide-react";

function Logo() {
  return (
    <div className="flex items-center gap-3">
      {/* Icon box */}
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
        <Wrench size={22} />
      </div>

      {/* App name */}
      <div>
        <h1 className="text-lg font-bold text-slate-900">
          IncidentFlow
        </h1>
        <p className="text-xs text-slate-500">
          IT Support Platform
        </p>
      </div>
    </div>
  );
}

export default Logo;