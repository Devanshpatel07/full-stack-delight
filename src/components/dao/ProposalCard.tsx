import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StatusBadge } from "./StatusBadge";
import { getWallet, shortAddr } from "@/lib/wallet";
import type { Database } from "@/integrations/supabase/types";

type Proposal = Database["public"]["Tables"]["proposals"]["Row"];

export function ProposalCard({ proposal, onChange }: { proposal: Proposal; onChange: () => void }) {
  const [voting, setVoting] = useState(false);
  const pct = Math.min(100, (proposal.votes / proposal.target_votes) * 100);
  const isActive = proposal.status === "active";
  const isExecuted = proposal.status === "executed";

  const handleVote = async () => {
    const wallet = getWallet();
    if (!wallet) { toast.error("Connect node first"); return; }
    setVoting(true);
    const { error } = await supabase.from("votes").insert({
      proposal_id: proposal.id,
      voter_address: wallet,
    });
    setVoting(false);
    if (error) {
      if (error.code === "23505") toast.error("Already signed this spec");
      else toast.error(error.message);
      return;
    }
    toast.success("Signature recorded");
    onChange();
  };

  const handleExecute = async () => {
    const { error } = await supabase
      .from("proposals")
      .update({ status: "executed" })
      .eq("id", proposal.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Executed — ${Number(proposal.amount).toLocaleString()} XLM dispersed`);
    onChange();
  };

  return (
    <article className={`bg-clay border-2 border-ink p-6 ${isActive ? "shadow-brutal-hover" : ""} ${isExecuted ? "opacity-70" : ""}`}>
      <div className="flex justify-between items-start mb-6 border-b border-clay-border pb-4 font-mono">
        <div className="flex items-center gap-3">
          <StatusBadge status={proposal.status} />
          <span className="text-ink-muted text-sm">REQ-{String(proposal.proposal_number).padStart(4, "0")}</span>
        </div>
        <div className="text-lg font-bold tabular-nums">{Number(proposal.amount).toLocaleString()} XLM</div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2 leading-tight">{proposal.title}</h2>
        <p className="text-ink-muted text-sm leading-relaxed">{proposal.description}</p>
      </div>

      <div className="bg-clay-dark p-4 border border-clay-border">
        <div className="flex justify-between text-sm mb-2 font-mono">
          <span className="font-bold">Consensus Target: {proposal.target_votes.toLocaleString()} Votes</span>
          <span className={`font-bold tabular-nums ${isActive ? "text-orange" : isExecuted ? "text-ink-muted" : "text-pass"}`}>
            {pct.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-clay border border-ink h-4 mb-2">
          <div
            className={`h-full ${isActive ? "bg-orange" : isExecuted ? "bg-ink-muted" : "bg-pass"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-ink-muted uppercase font-mono">
          <span>Current: {proposal.votes.toLocaleString()}</span>
          <span>by {shortAddr(proposal.proposer_address)}</span>
        </div>
      </div>

      {(isActive || proposal.status === "passed") && (
        <div className="mt-6 flex gap-3">
          {isActive && (
            <button
              onClick={handleVote}
              disabled={voting}
              className="flex-1 bg-ink text-clay px-4 py-3 text-sm font-semibold uppercase tracking-wider font-mono hover:bg-ink-muted transition-colors disabled:opacity-50"
            >
              {voting ? "Signing..." : "+ Sign Spec"}
            </button>
          )}
          {proposal.status === "passed" && (
            <button
              onClick={handleExecute}
              className="flex-1 bg-pass text-white px-4 py-3 text-sm font-semibold uppercase tracking-wider font-mono hover:opacity-90 transition-opacity"
            >
              Execute Disbursement →
            </button>
          )}
        </div>
      )}
    </article>
  );
}
