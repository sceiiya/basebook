import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { CONTRACTS, MOCK_USDC_ABI, ESCROW_ABI } from "./contracts";

// USDC Token Hooks
export function useUSDCBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.MOCK_USDC,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACTS.MOCK_USDC,
    },
  });
}

export function useUSDCAllowance(owner: `0x${string}` | undefined, spender: `0x${string}`) {
  return useReadContract({
    address: CONTRACTS.MOCK_USDC,
    abi: MOCK_USDC_ABI,
    functionName: "allowance",
    args: owner ? [owner, spender] : undefined,
    query: {
      enabled: !!owner && !!CONTRACTS.MOCK_USDC,
    },
  });
}

export function useApproveUSDC() {
  return useWriteContract();
}

export function useFaucet() {
  return useWriteContract();
}

// Escrow Hooks
export function useSendFunds() {
  return useWriteContract();
}

export function useWithdrawFunds() {
  return useWriteContract();
}

export function useTransaction(transactionId: number | undefined) {
  return useReadContract({
    address: CONTRACTS.ESCROW,
    abi: ESCROW_ABI,
    functionName: "getTransaction",
    args: transactionId !== undefined ? [BigInt(transactionId)] : undefined,
    query: {
      enabled: transactionId !== undefined && !!CONTRACTS.ESCROW,
    },
  });
}

export function useSenderTransactions(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.ESCROW,
    abi: ESCROW_ABI,
    functionName: "getSenderTransactions",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACTS.ESCROW,
    },
  });
}

export function useRecipientTransactions(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.ESCROW,
    abi: ESCROW_ABI,
    functionName: "getRecipientTransactions",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACTS.ESCROW,
    },
  });
}

export function useIsWithdrawable(transactionId: number | undefined, recipient: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.ESCROW,
    abi: ESCROW_ABI,
    functionName: "isWithdrawable",
    args: transactionId !== undefined && recipient ? [BigInt(transactionId), recipient] : undefined,
    query: {
      enabled: transactionId !== undefined && !!recipient && !!CONTRACTS.ESCROW,
    },
  });
}

// Utility functions
export function formatUSDC(amount: bigint): string {
  return formatUnits(amount, 6);
}

export function parseUSDC(amount: string): bigint {
  return parseUnits(amount, 6);
}

export function useTransactionReceipt(hash: `0x${string}` | undefined) {
  return useWaitForTransactionReceipt({
    hash,
  });
}
