import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { connectWallet, disconnectWallet, getWallet, shortAddr } from "@/lib/wallet";
import { ProposalCard } from "@/components/dao/ProposalCard";
import { CreateProposalDialog } from "@/components/dao/CreateProposalDialog";
import type { Database } from "@/integrations/supabase/types";

type Proposal = Database["public"]["Tables"]["proposals"]["Row"];
type Filter = "all" | "active" | "passed" | "executed";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [wallet, setWallet] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("proposals").select("*").order("created_at", { ascending: false });
    setProposals(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    setWallet(getWallet());
    load();
    const channel = supabase
      .channel("proposals-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "proposals" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleConnect = () => setWallet(connectWallet());
  const handleDisconnect = () => { disconnectWallet(); setWallet(null); };

  const filtered = proposals.filter(p => filter === "all" || p.status === filter);
  const treasury = proposals.filter(p => p.status === "executed").reduce((s, p) => s + Number(p.amount), 0);
  const activeCount = proposals.filter(p => p.status === "active").length;

  return (
    <div className="min-h-dvh p-4 md:p-8">
      <Toaster theme="dark" position="bottom-right" toastOptions={{
        style: { background: "oklch(0.16 0 0)", border: "1px solid oklch(0.26 0 0)", color: "oklch(0.92 0 0)", fontFamily: "JetBrains Mono, monospace", borderRadius: 0 }
      }} />

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border pb-4 mb-8 gap-4 sticky top-0 bg-background/90 backdrop-blur-sm z-30 py-3">
        <div className="flex items-center gap-3">
          <div className="size-3 bg-phosphor animate-pulse shadow-glow-phosphor" />
          <h1 className="text-foreground font-bold tracking-tighter uppercase text-lg">
            StellarGrants <span className="text-dim font-normal">// DAO</span>
          </h1>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="hidden md:block text-xs text-dim uppercase tracking-widest">
            Net: <span className="text-phosphor">Soroban_Testnet</span>
          </div>
          {wallet ? (
            <button
              onClick={handleDisconnect}
              className="border border-border text-foreground px-4 py-2 text-xs uppercase tracking-widest hover:border-destructive hover:text-destructive transition-colors w-full sm:w-auto"
            >
              [ {shortAddr(wallet)} ] ×
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="border border-phosphor text-phosphor px-5 py-2 text-xs uppercase tracking-widest font-bold hover:bg-phosphor hover:text-primary-foreground transition-colors w-full sm:w-auto"
            >
              [ Connect_Wallet ]
            </button>
          )}
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto">
        <div className="text-xs text-dim mb-4 uppercase tracking-widest flex flex-col gap-1">
          <div>&gt; Initializing consensus protocol... <span className="text-phosphor">OK</span></div>
          <div>&gt; Fetching treasury state from ledger... <span className="text-phosphor">OK</span></div>
          <div className="text-phosphor text-glow-phosphor">&gt; Ready for proposal submission.</div>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-12">
          <div className="lg:col-span-3 relative border border-border bg-panel p-6 md:p-10 corner-marks">
            <h2 className="text-4xl md:text-6xl font-extrabold uppercase tracking-tighter mb-6 text-foreground leading-none">
              Deploy Capital.<br />
              <span className="text-transparent" style={{ WebkitTextStroke: "1px var(--phosphor)" }}>
                Fund Builders.
              </span>
            </h2>
            <p className="text-dim text-sm md:text-base max-w-[65ch] uppercase leading-relaxed">
              Permissionless capital allocation for the Soroban ecosystem. Stake your XLM. Vote on protocol upgrades. Execute community grants directly via DAO governance. No intermediaries. Just code and consensus.
            </p>
          </div>

          <div className="border border-border bg-panel p-6 flex flex-col justify-between gap-6">
            <div>
              <div className="text-xs text-dim uppercase mb-2 border-b border-border pb-2 tracking-widest">Dispersed_Capital</div>
              <div className="text-3xl text-phosphor font-bold tabular-nums tracking-tighter text-glow-phosphor">
                {(treasury / 1000).toFixed(1)}K
              </div>
              <div className="text-xs text-dim uppercase mt-1 tracking-wider">XLM Funded To-Date</div>
            </div>
            <div>
              <div className="text-xs text-dim uppercase mb-2 border-b border-border pb-2 tracking-widest">Network_Load</div>
              <div className="flex items-end gap-2">
                <div className="text-xl text-foreground font-bold tabular-nums">{activeCount}</div>
                <div className="text-xs text-dim uppercase mb-1 tracking-wider">Active Props</div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-border pb-3 mb-6 gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold uppercase text-foreground tracking-tighter">Ledger_Proposals</h2>
              <div className="flex gap-1">
                {(["all", "active", "passed", "executed"] as Filter[]).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 text-[10px] uppercase tracking-widest border transition-colors ${
                      filter === f
                        ? "border-phosphor text-phosphor bg-phosphor/5"
                        : "border-border text-dim hover:text-foreground hover:border-foreground"
                    }`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <CreateProposalDialog onCreated={load} />
          </div>

          {loading ? (
            <div className="text-dim text-xs uppercase tracking-widest py-12 text-center">&gt; Loading ledger state...</div>
          ) : filtered.length === 0 ? (
            <div className="text-dim text-xs uppercase tracking-widest py-12 text-center border border-dashed border-border">
              &gt; No proposals match filter. Initialize one above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(p => <ProposalCard key={p.id} proposal={p} onChange={load} />)}
            </div>
          )}
        </section>

        <footer className="mt-16 pt-6 border-t border-border text-[10px] text-dim uppercase tracking-widest flex flex-col sm:flex-row justify-between gap-2">
          <div>&gt; StellarGrants_DAO // v1.0.0 // Soroban_Compatible</div>
          <div>EOF_</div>
        </footer>
      </main>
    </div>
  );
}
