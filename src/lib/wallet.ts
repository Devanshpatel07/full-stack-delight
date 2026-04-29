// Mock Stellar wallet — generates a deterministic-looking G... address.
// Swap with @stellar/freighter-api once the Soroban contract is deployed.
const KEY = "stellargrants:wallet";

function randomG(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let out = "G";
  for (let i = 0; i < 55; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function getWallet(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function connectWallet(): string {
  const existing = getWallet();
  if (existing) return existing;
  const addr = randomG();
  localStorage.setItem(KEY, addr);
  return addr;
}

export function disconnectWallet() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function shortAddr(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}
