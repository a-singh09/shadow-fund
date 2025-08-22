import React, { useState } from "react";
import { ArrowRightLeft, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { CONTRACTS } from "@/config/contracts";
import { useEERC } from "@avalabs/eerc-sdk";

const ProperTokenConverter: React.FC = () => {
  const [convertAmount, setConvertAmount] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();
  const { isConnected, address } = useAccount();
  const { writeContract } = useWriteContract();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Circuit URLs - these should be served from your public folder
  const circuitURLs = {
    register: {
      wasm: "/circuits/RegistrationCircuit.wasm",
      zkey: "/circuits/RegistrationCircuit.groth16.zkey",
    },
    transfer: {
      wasm: "/circuits/TransferCircuit.wasm",
      zkey: "/circuits/TransferCircuit.groth16.zkey",
    },
    mint: {
      wasm: "/circuits/MintCircuit.wasm",
      zkey: "/circuits/MintCircuit.groth16.zkey",
    },
    withdraw: {
      wasm: "/circuits/WithdrawCircuit.wasm",
      zkey: "/circuits/WithdrawCircuit.groth16.zkey",
    },
    burn: {
      wasm: "/circuits/TransferCircuit.wasm", // Burn uses transfer circuit
      zkey: "/circuits/TransferCircuit.groth16.zkey",
    },
  };

  // Get stored decryption key
  const getStoredKey = () => {
    if (!address) return undefined;
    return localStorage.getItem(`eerc-key-converter-${address}`) || undefined;
  };

  // Initialize eERC SDK
  const eercSDK = useEERC(
    publicClient,
    walletClient,
    CONTRACTS.CONVERTER.ENCRYPTED_ERC,
    circuitURLs,
    getStoredKey(),
  );

  const {
    isInitialized,
    isRegistered,
    useEncryptedBalance,
    generateDecryptionKey,
    register,
  } = eercSDK;

  // Get encrypted balance hook for the ERC20 token
  const encryptedBalanceHook =
    useEncryptedBalance && isRegistered && isInitialized
      ? useEncryptedBalance(CONTRACTS.CONVERTER.ERC20)
      : null;

  const { deposit, decryptedBalance, decimals } = encryptedBalanceHook || {};

  // Read ERC20 balance
  const { data: erc20Balance } = useReadContract({
    address: CONTRACTS.CONVERTER.ERC20 as `0x${string}`,
    abi: [
      {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
      },
    ],
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Read ERC20 decimals
  const { data: erc20Decimals } = useReadContract({
    address: CONTRACTS.CONVERTER.ERC20 as `0x${string}`,
    abi: [
      {
        name: "decimals",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint8" }],
      },
    ],
    functionName: "decimals",
  });

  // Read ERC20 symbol
  const { data: erc20Symbol } = useReadContract({
    address: CONTRACTS.CONVERTER.ERC20 as `0x${string}`,
    abi: [
      {
        name: "symbol",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
      },
    ],
    functionName: "symbol",
  });

  const handleGenerateKey = async () => {
    if (!generateDecryptionKey) return;

    try {
      const key = await generateDecryptionKey();
      if (address) {
        localStorage.setItem(`eerc-key-converter-${address}`, key);
      }
      toast({
        title: "Key Generated",
        description: "Decryption key generated successfully.",
      });
    } catch (error) {
      console.error("Key generation failed:", error);
      toast({
        title: "Key Generation Failed",
        description:
          error instanceof Error ? error.message : "Failed to generate key",
        variant: "destructive",
      });
    }
  };

  const handleRegister = async () => {
    if (!register) return;

    try {
      const result = await register();
      if (address) {
        localStorage.setItem(`eerc-key-converter-${address}`, result.key);
      }
      toast({
        title: "Registration Successful",
        description: "You are now registered with eERC20.",
      });
    } catch (error) {
      console.error("Registration failed:", error);
      toast({
        title: "Registration Failed",
        description:
          error instanceof Error ? error.message : "Registration failed",
        variant: "destructive",
      });
    }
  };

  const handleConvert = async () => {
    if (!convertAmount || parseFloat(convertAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to convert.",
        variant: "destructive",
      });
      return;
    }

    if (!deposit) {
      toast({
        title: "Deposit Function Not Available",
        description:
          "Please ensure you're registered and the system is initialized.",
        variant: "destructive",
      });
      return;
    }

    setIsConverting(true);

    try {
      const decimalsToUse = erc20Decimals || 18;
      const amount = parseUnits(convertAmount, decimalsToUse);

      // Check if user has sufficient balance
      if (erc20Balance && amount > erc20Balance) {
        throw new Error("Insufficient ERC20 balance");
      }

      // First approve the eERC20 contract to spend ERC20 tokens
      toast({
        title: "Approval Required",
        description: "Please approve the token spending in your wallet.",
      });

      await writeContract({
        address: CONTRACTS.CONVERTER.ERC20 as `0x${string}`,
        abi: [
          {
            name: "approve",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [
              { name: "spender", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            outputs: [{ name: "", type: "bool" }],
          },
        ],
        functionName: "approve",
        args: [CONTRACTS.CONVERTER.ENCRYPTED_ERC, amount],
      });

      // Wait for approval to be mined
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Now deposit (convert) the tokens using the eERC SDK
      toast({
        title: "Converting Tokens",
        description: "Converting your ERC20 tokens to eERC20...",
      });

      console.log("Calling deposit with amount:", amount.toString());

      // Call the deposit function from the SDK
      // According to the docs, deposit takes (amount, message?)
      const result = await deposit(amount, "Token conversion");

      console.log("Deposit result:", result);

      toast({
        title: "Conversion Successful!",
        description: `Successfully converted ${convertAmount} ${erc20Symbol} to eERC20 tokens.`,
      });

      // Reset form
      setConvertAmount("");
    } catch (error) {
      console.error("Conversion failed:", error);
      let errorMsg =
        error instanceof Error ? error.message : "Conversion failed";

      if (errorMsg.includes("User rejected")) {
        errorMsg = "Transaction was rejected.";
      } else if (errorMsg.includes("insufficient allowance")) {
        errorMsg = "Token approval failed. Please try again.";
      }

      toast({
        title: "Conversion Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const formatBalance = (
    balance: bigint | undefined,
    decimalsToUse: number = 18,
  ): string => {
    if (!balance) return "0.00";
    return parseFloat(formatUnits(balance, decimalsToUse)).toFixed(2);
  };

  const formatEERCBalance = (balance: bigint | null): string => {
    if (!balance || !decimals) return "0.00";
    return parseFloat(formatUnits(balance, Number(decimals))).toFixed(2);
  };

  if (!isConnected) {
    return (
      <div className="p-6 glass rounded-2xl border border-gray-700">
        <div className="flex items-center space-x-2 text-yellow-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Connect wallet to convert tokens</span>
        </div>
      </div>
    );
  }

  if (!publicClient || !walletClient) {
    return (
      <div className="p-6 glass rounded-2xl border border-gray-700">
        <div className="flex items-center space-x-2 text-yellow-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Initializing wallet clients...</span>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="p-6 glass rounded-2xl border border-gray-700">
        <div className="flex items-center space-x-2 text-yellow-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Initializing eERC20 system...</span>
        </div>
      </div>
    );
  }

  if (!getStoredKey()) {
    return (
      <div className="p-6 glass rounded-2xl border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">
          Generate Decryption Key
        </h3>
        <p className="text-gray-300 text-sm mb-4">
          You need to generate a decryption key to use eERC20 features.
        </p>
        <Button
          onClick={handleGenerateKey}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Generate Key
        </Button>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="p-6 glass rounded-2xl border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">
          Register with eERC20
        </h3>
        <p className="text-gray-300 text-sm mb-4">
          You need to register with the eERC20 system to convert tokens.
        </p>
        <Button
          onClick={handleRegister}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          Register
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 glass rounded-2xl border border-gray-700">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
        <ArrowRightLeft className="w-5 h-5 mr-2 text-blue-400" />
        Convert to eERC20
      </h3>

      <div className="space-y-4">
        {/* Balance Display */}
        <div className="grid grid-cols-1 gap-3">
          <div className="p-3 bg-gray-800/50 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">ERC20 Balance:</span>
              <span className="text-white font-medium">
                {formatBalance(erc20Balance, erc20Decimals)} {erc20Symbol}
              </span>
            </div>
          </div>

          <div className="p-3 bg-gray-800/50 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">eERC20 Balance:</span>
              <span className="text-white font-medium">
                {formatEERCBalance(decryptedBalance)} e{erc20Symbol}
              </span>
            </div>
          </div>
        </div>

        {/* Conversion Amount */}
        <div>
          <label className="text-sm text-gray-400 mb-2 block">
            Amount to Convert
          </label>
          <Input
            type="number"
            placeholder="0.00"
            value={convertAmount}
            onChange={(e) => setConvertAmount(e.target.value)}
            disabled={isConverting}
            className="bg-gray-800/50 border-gray-600 text-white focus:border-blue-500/50 disabled:opacity-50"
          />
          {erc20Balance && erc20Decimals && (
            <button
              onClick={() =>
                setConvertAmount(formatBalance(erc20Balance, erc20Decimals))
              }
              className="text-xs text-blue-400 hover:text-blue-300 mt-1"
              disabled={isConverting}
            >
              Use Max
            </button>
          )}
        </div>

        {/* Convert Button */}
        <Button
          onClick={handleConvert}
          disabled={
            isConverting ||
            !convertAmount ||
            parseFloat(convertAmount) <= 0 ||
            !erc20Balance ||
            parseUnits(convertAmount, erc20Decimals || 18) > erc20Balance ||
            !deposit
          }
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConverting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Converting...
            </>
          ) : (
            <>
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Convert to eERC20
            </>
          )}
        </Button>

        <div className="text-xs text-gray-500">
          <p>
            • This will convert your regular {erc20Symbol} tokens to encrypted
            eERC20 tokens
          </p>
          <p>
            • You'll need to approve the spending first, then confirm the
            conversion
          </p>
          <p>• Converted tokens will appear in your encrypted balance</p>
        </div>
      </div>
    </div>
  );
};

export default ProperTokenConverter;
