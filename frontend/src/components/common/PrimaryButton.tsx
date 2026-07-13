// ------------------------------------------------------------
// PrimaryButton Component
//
// Standard button used throughout IncidentFlow.
// Keeps all primary actions looking consistent.
// ------------------------------------------------------------

type PrimaryButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled = false,
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="
        inline-flex
        items-center
        justify-center
        rounded-lg
        bg-blue-600
        px-5
        py-2.5
        text-sm
        font-semibold
        text-white
        transition
        hover:bg-blue-700
        disabled:cursor-not-allowed
        disabled:opacity-50
      "
    >
      {children}
    </button>
  );
}

export default PrimaryButton;