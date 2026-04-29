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
  const treasuryCap = 42850000;
  const deployed = proposals.filter(p => p.status === "executed").reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="min-h-dvh bg-clay text-ink p-4 md:p-8 font-sans">
      <Toaster theme="light" position="bottom-right" toastOptions={{
        style: { background: "var(--clay)", border: "2px solid var(--ink)", color: "var(--ink)", fontFamily: "IBM Plex Mono, monospace", borderRadius: 0, fontSize: "13px" }
      }} />

      <div className="max-w-[1440px] mx-auto border-2 border-ink bg-clay">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b-2 border-ink gap-4">
          <div className="flex items-center gap-4">
            <div className="size-8 bg-ink text-clay flex items-center justify-center font-bold font-mono">F/</div>
            <div className="text-lg md:text-xl font-bold tracking-tight uppercase">
              StellarGrants
              <span className="text-ink-muted ml-2 font-normal text-xs md:text-sm font-mono">SYS_REQ_PROTOCOL</span>
            </div>
          </div>
          {wallet ? (
            <button
              onClick={handleDisconnect}
              className="border-2 border-ink bg-clay text-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-wider font-mono hover:bg-clay-dark transition-colors w-full sm:w-auto"
            >
              {shortAddr(wallet)} ×
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="bg-orange text-white px-6 py-3 text-sm font-semibold uppercase tracking-wider font-mono hover:bg-orange-dark transition-colors w-full sm:w-auto"
            >
              Connect Node
            </button>
          )}
        </header>

        {/* Treasury Readout */}
        <section className="grid grid-cols-1 md:grid-cols-3 border-b-2 border-ink bg-clay-dark">
          <div className="p-6 md:p-8 border-b-2 md:border-b-0 md:border-r-2 border-ink flex flex-col justify-between min-h-[140px] md:min-h-[160px]">
            <div className="text-xs text-ink-muted uppercase font-bold tracking-widest font-mono">Param 01 // Treasury Capacity</div>
            <div className="text-3xl md:text-4xl font-medium tracking-tighter tabular-nums mt-3">
              {treasuryCap.toLocaleString()} <span className="text-base text-ink-muted">XLM</span>
            </div>
          </div>
          <div className="p-6 md:p-8 border-b-2 md:border-b-0 md:border-r-2 border-ink flex flex-col justify-between min-h-[140px] md:min-h-[160px]">
            <div className="text-xs text-ink-muted uppercase font-bold tracking-widest font-mono">Param 02 // Deployed Capital</div>
            <div className="text-3xl md:text-4xl font-medium tracking-tighter tabular-nums mt-3">
              {deployed.toLocaleString()} <span className="text-base text-ink-muted">XLM</span>
            </div>
          </div>
          <div className="p-6 md:p-8 flex flex-col justify-between min-h-[140px] md:min-h-[160px] bg-orange text-white">
            <div className="text-xs uppercase font-bold tracking-widest opacity-80 font-mono">System Status</div>
            <div className="text-3xl md:text-4xl font-medium tracking-tighter mt-3">OPERATIONAL</div>
          </div>
        </section>

        {/* Main */}
        <main className="p-6 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left context */}
          <aside className="lg:col-span-4 flex flex-col gap-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 uppercase">Active Specifications</h1>
              <p className="text-ink-muted max-w-[40ch] text-pretty leading-relaxed">
                Review, audit, and authorize funding for core infrastructure proposals on the Soroban network. Connect your node to participate in consensus.
              </p>
            </div>

            <div className="bg-clay-dark p-6 border-2 border-ink">
              <div className="text-xs text-ink-muted uppercase font-bold tracking-widest mb-4 font-mono">Action Required</div>
              <p className="text-sm mb-6 leading-relaxed">Submit a new technical specification or funding request to the decentralized assembly.</p>
              <CreateProposalDialog onCreated={load} />
            </div>

            <div className="border-2 border-ink p-6">
              <div className="text-xs text-ink-muted uppercase font-bold tracking-widest mb-4 font-mono">Filter</div>
              <div className="flex flex-col gap-1">
                {(["all", "active", "passed", "executed"] as Filter[]).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`text-left px-3 py-2 text-sm font-mono uppercase tracking-wider transition-colors border-l-4 ${
                      filter === f
                        ? "bg-ink text-clay border-orange font-bold"
                        : "border-transparent hover:bg-clay-dark"
                    }`}>
                    {f}{filter === f && " ←"}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Right: Ledger */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {loading ? (
              <div className="text-ink-muted text-sm py-12 text-center font-mono uppercase tracking-widest">
                Loading ledger...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-ink-muted text-sm py-12 text-center border-2 border-dashed border-clay-border font-mono uppercase tracking-widest">
                No specs match filter
              </div>
            ) : (
              filtered.map(p => <ProposalCard key={p.id} proposal={p} onChange={load} />)
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t-2 border-ink p-6 flex flex-col sm:flex-row justify-between gap-2 text-xs text-ink-muted uppercase tracking-widest font-mono bg-clay-dark">
          <div>StellarGrants_DAO // v1.0.0 // Soroban_Compatible</div>
          <div>EOF_</div>
        </footer>
      </div>
    </div>
  );
}
