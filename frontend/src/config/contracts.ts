// Contract addresses for Avalanche Fuji Testnet organized by mode
export const CONTRACTS = {
  // Standalone Mode Contracts
  STANDALONE: {
    ENCRYPTED_ERC: "0x073667A75bA2e6b738eb5902b149cfa086F4A120",
    REGISTRATION_VERIFIER: "0x58Aca61aF54381eD9B1424d9a33B24bF2d2390bd",
    MINT_VERIFIER: "0xa68498F88FE00feab659997908981EE2D2d7de76",
    WITHDRAW_VERIFIER: "0xD4548F4b6d08852B56cdabC6be7Fd90953179d68",
    TRANSFER_VERIFIER: "0xb0d99da21Bb4fa877e3D1DCA89E6657c5e840Eb2",
    BABY_JUB_JUB: "0x9897C260A01DfC32E1C6d7aB4958bd5Ba930090e",
    REGISTRAR: "0x731e812365e3eB48B97939E433b8a212a807df2b",
  },

  // Converter Mode Contracts
  CONVERTER: {
    ENCRYPTED_ERC: "0x45865BB047E6df9ac619a351EbC33DaA2B06D9D1",
    ERC20: "0xfC27cdADD1f28D22068B30d436F9ff69D01F085a",
    REGISTRATION_VERIFIER: "0xD9f5344B70a16a8b9a0dBB605907CD9B18f69b74",
    MINT_VERIFIER: "0xb88475b9A6F9F65fE2c2b5A23C8778355176E0E2",
    WITHDRAW_VERIFIER: "0x6Ab1032F441B3405F6e854F00CFDf8c221D6d7Eb",
    TRANSFER_VERIFIER: "0x55349195784a3B613b4480845cAC4b82534bF945",
    BABY_JUB_JUB: "0x2f795E1d84dC1F4D7b9e0D77F22031E92D3717b3",
    REGISTRAR: "0x986B86864e5c0E8a6dDA367D099E8c52E89eBFd0",
  },

  // ShadowFlow contracts (mode-independent)
  CAMPAIGN_FACTORY: "0xcfe97D225eF6DB8ee6677A871aB1b6786a4AAfC4",
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
  burn: {
    wasm: "/circuits/TransferCircuit.wasm", // Burn uses transfer circuit
    zkey: "/circuits/TransferCircuit.groth16.zkey",
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

// Helper functions to get contracts based on mode
export const getContractsForMode = (mode: EERCMode) => {
  return mode === "standalone" ? CONTRACTS.STANDALONE : CONTRACTS.CONVERTER;
};

export const getEncryptedERCAddress = (mode: EERCMode) => {
  return getContractsForMode(mode).ENCRYPTED_ERC;
};

export const getVerifierAddresses = (mode: EERCMode) => {
  const contracts = getContractsForMode(mode);
  return {
    registration: contracts.REGISTRATION_VERIFIER,
    mint: contracts.MINT_VERIFIER,
    withdraw: contracts.WITHDRAW_VERIFIER,
    transfer: contracts.TRANSFER_VERIFIER,
  };
};

export const getSupportingContracts = (mode: EERCMode) => {
  const contracts = getContractsForMode(mode);
  return {
    babyJubJub: contracts.BABY_JUB_JUB,
    registrar: contracts.REGISTRAR,
  };
};

// Legacy exports for backward compatibility
export const EERC_STANDALONE = CONTRACTS.STANDALONE.ENCRYPTED_ERC;
export const EERC_CONVERTER = CONTRACTS.CONVERTER.ENCRYPTED_ERC;
export const ERC20 = CONTRACTS.CONVERTER.ERC20;
