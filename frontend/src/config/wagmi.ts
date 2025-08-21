import { createConfig, http } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

// Get project ID from environment variables
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "";

export const config = createConfig({
  chains: [avalancheFuji],
  connectors: [
    injected(),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  transports: {
    [avalancheFuji.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
