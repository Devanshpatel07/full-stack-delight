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
    if (!wallet) { toast.error("Connect wallet first"); return; }
    setVoting(true);
    const { error } = await supabase.from("votes").insert({
      proposal_id: proposal.id,
      voter_address: wallet,
    });
    setVoting(false);
    if (error) {
      if (error.code === "23505") toast.error("ALREADY_VOTED // Address has cast vote on this proposal");
      else toast.error(error.message);
      return;
    }
    toast.success("VOTE_RECORDED // Consensus updated");
    onChange();
  };

  const handleExecute = async () => {
    const { error } = await supabase
      .from("proposals")
      .update({ status: "executed" })
      .eq("id", proposal.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`EXECUTED // ${proposal.amount.toLocaleString()} XLM dispersed`);
    onChange();
  };

  return (
    <div className={`relative border border-border bg-panel p-6 flex flex-col gap-6 hover:border-phosphor/40 transition-colors corner-marks ${isExecuted ? "opacity-60 hover:opacity-100" : ""}`}>
      <StatusBadge status={proposal.status} />

      <div className="pr-20">
        <div className="text-dim text-xs mb-2 uppercase tracking-widest">
          ID: PROP-{String(proposal.proposal_number).padStart(4, "0")}
        </div>
        <h3 className="text-lg font-bold text-foreground leading-tight uppercase tracking-tight">
          {proposal.title}
        </h3>
      </div>

      <p className="text-dim text-xs leading-relaxed line-clamp-3">{proposal.description}</p>

      <div className="border-l-2 border-border pl-4">
        <div className="text-dim text-[10px] uppercase tracking-widest mb-1">Requested Allocation</div>
        <div className="text-2xl font-bold text-foreground tabular-nums tracking-tighter">
          {Number(proposal.amount).toLocaleString()} <span className="text-sm text-dim">XLM</span>
        </div>
      </div>

      <div className="mt-auto pt-4 flex flex-col gap-3">
        <div className="flex justify-between text-xs uppercase tracking-wide">
          <span className="text-dim">
            Consensus: <span className="text-foreground">{proposal.votes}K / {proposal.target_votes}K</span>
          </span>
          <span className={isActive ? "text-phosphor" : isExecuted ? "text-dim" : "text-cyan-glow"}>
            {pct.toFixed(1)}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-background border border-border relative overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full ${isActive ? "bg-phosphor shadow-glow-phosphor" : isExecuted ? "bg-dim" : "bg-cyan-glow"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between items-center pt-2">
          <span className="text-[10px] text-dim uppercase tracking-widest">
            by {shortAddr(proposal.proposer_address)}
          </span>
          {isActive && (
            <button
              onClick={handleVote}
              disabled={voting}
              className="px-4 py-1.5 border border-phosphor text-phosphor text-xs font-bold uppercase tracking-widest hover:bg-phosphor hover:text-primary-foreground transition-colors disabled:opacity-50"
            >
              {voting ? "..." : "++ Vote"}
            </button>
          )}
          {proposal.status === "passed" && (
            <button
              onClick={handleExecute}
              className="px-4 py-1.5 border border-cyan-glow text-cyan-glow text-xs font-bold uppercase tracking-widest hover:bg-cyan-glow hover:text-background transition-colors"
            >
              Execute &gt;&gt;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
