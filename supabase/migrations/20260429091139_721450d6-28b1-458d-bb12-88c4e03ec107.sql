
CREATE TYPE proposal_status AS ENUM ('active', 'passed', 'executed');

CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_number SERIAL UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  target_votes INTEGER NOT NULL CHECK (target_votes > 0),
  votes INTEGER NOT NULL DEFAULT 0,
  status proposal_status NOT NULL DEFAULT 'active',
  proposer_address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  voter_address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (proposal_id, voter_address)
);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view proposals" ON public.proposals FOR SELECT USING (true);
CREATE POLICY "Anyone can create proposals" ON public.proposals FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update proposals" ON public.proposals FOR UPDATE USING (true);

CREATE POLICY "Anyone can view votes" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Anyone can cast votes" ON public.votes FOR INSERT WITH CHECK (true);

-- Trigger to increment vote count and flip status to passed when target reached
CREATE OR REPLACE FUNCTION public.handle_new_vote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
  target INTEGER;
BEGIN
  UPDATE public.proposals
  SET votes = votes + 1
  WHERE id = NEW.proposal_id
  RETURNING votes, target_votes INTO new_count, target;

  IF new_count >= target THEN
    UPDATE public.proposals SET status = 'passed'
    WHERE id = NEW.proposal_id AND status = 'active';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_vote_cast
AFTER INSERT ON public.votes
FOR EACH ROW EXECUTE FUNCTION public.handle_new_vote();

-- Seed
INSERT INTO public.proposals (title, description, amount, target_votes, votes, status, proposer_address) VALUES
('Zk-SNARK Verification Precompiles', 'Native zero-knowledge proof verification precompiles for Soroban to enable scalable privacy-preserving applications on Stellar.', 450000, 500, 312, 'active', 'GAXXXXX...PROPOSER1'),
('Decentralized Oracle Aggregator V2', 'Multi-source price feed aggregator with TWAP and median fallback for reliable on-chain market data.', 1200000, 1000, 1000, 'passed', 'GAXXXXX...PROPOSER2'),
('Rust SDK Core Security Audit Phase III', 'Tier-1 forensic audit of core token contract libraries by independent security firms.', 250000, 500, 850, 'executed', 'GAXXXXX...PROPOSER3'),
('Cross-Chain Bridge to Ethereum L2', 'Trust-minimized bridge implementation for asset transfers between Soroban and major Ethereum L2 networks.', 800000, 750, 124, 'active', 'GAXXXXX...PROPOSER4');
