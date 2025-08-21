// Contract addresses for Avalanche Fuji Testnet
export const CONTRACTS = {
  // eERC20 contracts (deployed by Avalanche)
  EERC_STANDALONE: "0x5E9c6F952fB9615583182e70eDDC4e6E4E0aC0e0",
  EERC_CONVERTER: "0x372dAB27c8d223Af11C858ea00037Dc03053B22E",
  ERC20: "0xb0Fe621B4Bd7fe4975f7c58E3D6ADaEb2a2A35CD",

  // ShadowFlow contracts (to be deployed)
  CAMPAIGN_FACTORY: "", // Will be set after deployment
} as const;

// Circuit configuration for eERC20 zero-knowledge proofs
export const CIRCUIT_CONFIG = {
  register: {
    wasm: "/circuits/RegistrationCircuit.wasm",
    zkey: "/circuits/RegistrationCircuit.groth16.zkey",
  },
  mint: {
    wasm: "/circuits/MintCircuit.wasm",
    zkey: "/circuits/MintCircuit.groth16.zkey",
  },
  transfer: {
    wasm: "/circuits/TransferCircuit.wasm",
    zkey: "/circuits/TransferCircuit.groth16.zkey",
  },
  withdraw: {
    wasm: "/circuits/WithdrawCircuit.wasm",
    zkey: "/circuits/WithdrawCircuit.groth16.zkey",
  },
} as const;

// Network configuration
export const AVALANCHE_FUJI = {
  id: 43113,
  name: "Avalanche Fuji",
  network: "avalanche-fuji",
  nativeCurrency: {
    decimals: 18,
    name: "Avalanche",
    symbol: "AVAX",
  },
  rpcUrls: {
    public: { http: ["https://api.avax-test.network/ext/bc/C/rpc"] },
    default: { http: ["https://api.avax-test.network/ext/bc/C/rpc"] },
  },
  blockExplorers: {
    etherscan: { name: "SnowTrace", url: "https://testnet.snowtrace.io" },
    default: { name: "SnowTrace", url: "https://testnet.snowtrace.io" },
  },
  testnet: true,
} as const;

// Explorer URLs
export const EXPLORER_BASE_URL = "https://testnet.snowtrace.io/address/";
export const EXPLORER_BASE_URL_TX = "https://testnet.snowtrace.io/tx/";

// eERC20 mode type
export type EERCMode = "standalone" | "converter";
