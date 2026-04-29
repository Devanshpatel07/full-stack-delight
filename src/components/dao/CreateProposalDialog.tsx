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
    if (!getWallet()) { toast.error("Connect node first"); return; }
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wallet = getWallet();
    if (!wallet) return;
    const amount = Number(form.amount);
    const target = Number(form.target_votes);
    if (!form.title || !form.description || amount <= 0 || target <= 0) {
      toast.error("All fields required, numbers must be positive");
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
    toast.success("Proposal submitted to assembly");
    reset();
    setOpen(false);
    onCreated();
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="w-full bg-ink text-clay px-4 py-3 text-sm font-semibold uppercase tracking-wider font-mono hover:bg-ink-muted transition-colors text-center"
      >
        Initiate Proposal +
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="bg-clay border-2 border-ink max-w-lg w-full p-8 flex flex-col gap-5 shadow-brutal"
          >
            <div className="border-b-2 border-ink pb-4 -mx-8 px-8 -mt-8 pt-8 bg-clay-dark">
              <div className="text-xs text-ink-muted uppercase font-bold tracking-widest mb-1 font-mono">New Specification</div>
              <h2 className="text-2xl font-bold uppercase tracking-tight">Initiate Proposal</h2>
            </div>

            <Field label="Title">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={120}
                className="w-full bg-clay border border-ink px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange" />
            </Field>

            <Field label="Description">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3} maxLength={500}
                className="w-full bg-clay border border-ink px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange resize-none" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Amount (XLM)">
                <input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full bg-clay border border-ink px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange tabular-nums font-mono" />
              </Field>
              <Field label="Target Votes">
                <input type="number" min="1" value={form.target_votes} onChange={(e) => setForm({ ...form, target_votes: e.target.value })}
                  className="w-full bg-clay border border-ink px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange tabular-nums font-mono" />
              </Field>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setOpen(false)}
                className="flex-1 border-2 border-ink bg-clay text-ink px-4 py-3 text-sm uppercase tracking-wider font-mono font-semibold hover:bg-clay-dark transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="flex-1 bg-orange text-white px-4 py-3 text-sm font-semibold uppercase tracking-wider font-mono hover:bg-orange-dark transition-colors disabled:opacity-50">
                {submitting ? "Submitting..." : "Submit to Assembly"}
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
      <span className="text-[10px] text-ink-muted uppercase tracking-widest font-bold font-mono">{label}</span>
      {children}
    </label>
  );
}
