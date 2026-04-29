import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["proposal_status"];

const styles: Record<Status, string> = {
  active: "bg-orange text-white",
  passed: "bg-pass text-white",
  executed: "bg-ink-muted text-clay",
};

const labels: Record<Status, string> = {
  active: "Active",
  passed: "Passed",
  executed: "Executed",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider font-mono ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
