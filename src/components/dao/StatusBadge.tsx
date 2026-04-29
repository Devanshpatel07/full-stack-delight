import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["proposal_status"];

const styles: Record<Status, string> = {
  active: "text-phosphor border-phosphor/40 bg-phosphor/5",
  passed: "text-cyan-glow border-cyan-glow/40 bg-cyan-glow/5",
  executed: "text-dim border-border bg-background",
};

const labels: Record<Status, string> = {
  active: "[ ACTIVE ]",
  passed: "[ PASSED ]",
  executed: "[ EXECUTED ]",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <div className={`absolute top-0 right-0 border-l border-b px-3 py-1 text-xs font-bold uppercase tracking-wider ${styles[status]}`}>
      {labels[status]}
    </div>
  );
}
