// ------------------------------------------------------------
// TableSkeleton Component
//
// Reusable loading state for tables.
//
// It shows placeholder rows while data is loading.
// ------------------------------------------------------------

type TableSkeletonProps = {
  columns: number;
  rows?: number;
};

function TableSkeleton({
  columns,
  rows = 5,
}: TableSkeletonProps) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr
          key={rowIndex}
          className="border-b last:border-b-0"
        >
          {Array.from({ length: columns }).map(
            (_, columnIndex) => (
              <td
                key={columnIndex}
                className="px-6 py-4"
              >
                <div className="h-4 animate-pulse rounded bg-slate-200" />
              </td>
            )
          )}
        </tr>
      ))}
    </tbody>
  );
}

export default TableSkeleton;