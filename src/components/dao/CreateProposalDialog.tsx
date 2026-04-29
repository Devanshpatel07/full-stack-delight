import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getWallet } from "@/lib/wallet";

export function CreateProposalDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", amount: "", target_votes: "" });

  const reset = () => setForm({ title: "", description: "", amount: "", target_votes: "" });

  const handleOpen = () => {
    if (!getWallet()) { toast.error("Connect wallet first"); return; }
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wallet = getWallet();
    if (!wallet) return;
    const amount = Number(form.amount);
    const target = Number(form.target_votes);
    if (!form.title || !form.description || amount <= 0 || target <= 0) {
      toast.error("PARSE_ERROR // All fields required, numbers must be positive");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("proposals").insert({
      title: form.title,
      description: form.description,
      amount,
      target_votes: target,
      proposer_address: wallet,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("PROPOSAL_BROADCAST // Awaiting consensus");
    reset();
    setOpen(false);
    onCreated();
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="bg-phosphor text-primary-foreground px-5 py-2 text-sm font-bold hover:shadow-glow-phosphor transition-shadow uppercase tracking-wider"
      >
        ++ Init_Proposal
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="relative bg-panel border border-phosphor/40 max-w-lg w-full p-8 corner-marks flex flex-col gap-5"
          >
            <div>
              <div className="text-dim text-xs uppercase tracking-widest mb-1">&gt; New_Directive</div>
              <h2 className="text-xl font-bold uppercase tracking-tight text-foreground">Initialize Proposal</h2>
            </div>

            <Field label="Title">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={120}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:border-phosphor focus:outline-none" />
            </Field>

            <Field label="Description">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3} maxLength={500}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:border-phosphor focus:outline-none resize-none" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Amount (XLM)">
                <input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:border-phosphor focus:outline-none tabular-nums" />
              </Field>
              <Field label="Target Votes">
                <input type="number" min="1" value={form.target_votes} onChange={(e) => setForm({ ...form, target_votes: e.target.value })}
                  className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:border-phosphor focus:outline-none tabular-nums" />
              </Field>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setOpen(false)}
                className="flex-1 border border-border text-dim px-4 py-2 text-sm uppercase tracking-wider hover:text-foreground hover:border-foreground transition-colors">
                [ Cancel ]
              </button>
              <button type="submit" disabled={submitting}
                className="flex-1 bg-phosphor text-primary-foreground px-4 py-2 text-sm font-bold uppercase tracking-wider hover:shadow-glow-phosphor transition-shadow disabled:opacity-50">
                {submitting ? "Broadcasting..." : "++ Submit_To_Ledger"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] text-dim uppercase tracking-widest">&gt; {label}</span>
      {children}
    </label>
  );
}
