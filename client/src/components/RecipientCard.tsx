import type { Recipient } from "../types";

interface Props {
  recipient: Recipient;
  onClick?: () => void;
  selected?: boolean;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function RecipientCard({ recipient, onClick, selected }: Props) {
  const clickable = Boolean(onClick);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`w-full flex items-center gap-3.5 text-left rounded-md border px-4 py-3.5 transition-colors duration-150 ${
        selected
          ? "border-ink bg-surface-soft"
          : "border-border bg-surface hover:bg-surface-soft"
      } ${!clickable ? "cursor-default" : ""}`}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-beige flex items-center justify-center text-sm font-medium text-ink">
        {initials(recipient.name)}
      </div>
      <div className="min-w-0">
        <p className="text-[15px] font-medium text-ink truncate">
          {recipient.name}
          {recipient.profession && (
            <span className="text-ink-soft font-normal"> · {recipient.profession}</span>
          )}
        </p>
        <p className="text-sm text-ink-soft truncate">{recipient.upi_id}</p>
      </div>
    </button>
  );
}
