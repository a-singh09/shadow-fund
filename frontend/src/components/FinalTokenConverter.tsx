import React, { useState } from "react";
import { ArrowRightLeft, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { CONTRACTS } from "@/config/contracts";
import { useEERCWithKey } from "@/hooks/useEERCWithKey";

// Component that only renders when fully ready and calls useEncryptedBalance
const ReadyTokenConverter: React.FC<{
  eercSDK: any;
  erc20Balance: bigint | undefined;
  erc20Decimals: number | undefined;
  erc20Symbol: string | undefined;
}> = ({ eercSDK, erc20Balance, erc20Decimals, erc20Symbol }) => {
  const [convertAmount, setConvertAmount] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();
  const { writeContract } = useWriteContract();

  const { useEncryptedBalance, isInitialized, isRegistered } = eercSDK;

  // Double-check that everything is ready before calling useEncryptedBalance
  if (!isInitialized || !isRegistered || !useEncryptedBalance) {
    return (
      <div className="p-6 glass rounded-2xl border border-gray-700">
        <div className="flex items-center space-x-2 text-yellow-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Finalizing eERC20 initialization...</span>
        </div>
      </div>
    );
  }

  // Now it should be safe to call useEncryptedBalance
  let encryptedBalanceHook = null;
  let deposit = null;
  let decryptedBalance = null;
  let decimals = null;

  try {
    encryptedBalanceHook = useEncryptedBalance(CONTRACTS.CONVERTER.ERC20);
    if (encryptedBalanceHook) {
      deposit = encryptedBalanceHook.deposit;
      decryptedBalance = encryptedBalanceHook.decryptedBalance;
      decimals = encryptedBalanceHook.decimals;
    }
  } catch (error) {
    console.error("Error calling useEncryptedBalance:", error);
    return (
      <div className="p-6 glass rounded-2xl border border-gray-700">
        <div className="flex items-center space-x-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>
            Error initializing eERC20 balance. Please refresh the page.
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Error: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      </div>
    );
  }

  const handleConvert = async () => {
    if (!convertAmount || parseFloat(convertAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to convert.",
        variant: "destructive",
      });
      return;
    }

    if (!deposit || typeof deposit !== "function") {
      toast({
        title: "Deposit Function Not Available",
        description:
          "eERC SDK is not properly initialized. Please refresh the page and try again.",
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

      writeContract({
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
        ] as const,
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
      const result = await deposit(amount);
      console.log("Deposit result:", result);

      toast({
        title: "Conversion Successful!",
        description: `Successfully converted ${convertAmount} ${erc20Symbol || "TOKEN"} to eERC20 tokens.`,
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

  const isValidAmount = (amount: string): boolean => {
    if (!amount || amount.trim() === "") return false;
    const parsed = parseFloat(amount);
    return !isNaN(parsed) && parsed > 0;
  };

  const hasInsufficientBalance = (): boolean => {
    if (!convertAmount || !erc20Balance || !isValidAmount(convertAmount))
      return false;
    try {
      const amount = parseUnits(convertAmount, erc20Decimals || 18);
      return amount > erc20Balance;
    } catch {
      return true;
    }
  };

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
                {formatBalance(erc20Balance, erc20Decimals)}{" "}
                {erc20Symbol || "TOKEN"}
              </span>
            </div>
          </div>

          <div className="p-3 bg-gray-800/50 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">eERC20 Balance:</span>
              <span className="text-white font-medium">
                {formatEERCBalance(decryptedBalance)} e{erc20Symbol || "TOKEN"}
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
            !isValidAmount(convertAmount) ||
            !erc20Balance ||
            hasInsufficientBalance() ||
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
            • This will convert your regular {erc20Symbol || "TOKEN"} tokens to
            encrypted eERC20 tokens
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

// Wrapper component that handles ERC20 data fetching
const TokenConverterContent: React.FC = () => {
  const { address } = useAccount();

  // Use the hook that properly handles key management
  const eercSDK = useEERCWithKey("converter");
  const { toast } = useToast();

  // Always call hooks first, before any conditional returns
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

  // Safety check for eercSDK - now after all hooks are called
  if (!eercSDK) {
    return (
      <div className="p-6 glass rounded-2xl border border-gray-700">
        <div className="flex items-center space-x-2 text-yellow-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading eERC SDK...</span>
        </div>
      </div>
    );
  }

  // If not loaded yet, show loading
  if (!eercSDK.keyLoaded) {
    return (
      <div className="p-6 glass rounded-2xl border border-gray-700">
        <div className="flex items-center space-x-2 text-yellow-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading eERC20 keys...</span>
        </div>
      </div>
    );
  }

  // If no key is stored, show key generation
  if (!eercSDK.hasStoredKey()) {
    return (
      <div className="p-6 glass rounded-2xl border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">
          Generate Decryption Key
        </h3>
        <p className="text-gray-300 text-sm mb-4">
          You need to generate a decryption key to use eERC20 features.
        </p>
        <Button
          onClick={async () => {
            try {
              await eercSDK.generateAndStoreKey();
              toast({
                title: "Key Generated",
                description:
                  "Decryption key generated successfully. You can now register with eERC20.",
              });
            } catch (error) {
              console.error("Key generation failed:", error);
              toast({
                title: "Key Generation Failed",
                description:
                  error instanceof Error
                    ? error.message
                    : "Failed to generate key",
                variant: "destructive",
              });
            }
          }}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Generate Key
        </Button>
      </div>
    );
  }

  // If not registered, show registration
  if (!eercSDK.isRegistered) {
    return (
      <div className="p-6 glass rounded-2xl border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">
          Register with eERC20
        </h3>
        <p className="text-gray-300 text-sm mb-4">
          You need to register with the eERC20 system to convert tokens.
        </p>
        <Button
          onClick={async () => {
            try {
              await eercSDK.registerWithKey();
              toast({
                title: "Registration Successful",
                description:
                  "You are now registered with eERC20 and can convert tokens.",
              });
            } catch (error) {
              console.error("Registration failed:", error);
              toast({
                title: "Registration Failed",
                description:
                  error instanceof Error
                    ? error.message
                    : "Registration failed",
                variant: "destructive",
              });
            }
          }}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          Register
        </Button>
      </div>
    );
  }

  // If everything is ready, show the converter
  return (
    <ReadyTokenConverter
      eercSDK={eercSDK}
      erc20Balance={erc20Balance}
      erc20Decimals={erc20Decimals}
      erc20Symbol={erc20Symbol}
    />
  );
};

const FinalTokenConverter: React.FC = () => {
  const { isConnected } = useAccount();

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

  return <TokenConverterContent />;
};

export default FinalTokenConverter;
