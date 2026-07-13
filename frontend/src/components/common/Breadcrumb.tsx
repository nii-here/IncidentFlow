// ------------------------------------------------------------
// Breadcrumb Component
//
// Displays the user's current location inside the platform.
//
// Example:
//
// Administration > Categories
//
// Assets > Devices
//
// Organization > Users
// ------------------------------------------------------------

import { ChevronRight } from "lucide-react";

type BreadcrumbProps = {
  items: string[];
};

function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center text-sm text-slate-500">
      {items.map((item, index) => (
        <div
          key={item}
          className="flex items-center"
        >
          <span>{item}</span>

          {index < items.length - 1 && (
            <ChevronRight
              size={16}
              className="mx-2 text-slate-400"
            />
          )}
        </div>
      ))}
    </nav>
  );
}

export default Breadcrumb;