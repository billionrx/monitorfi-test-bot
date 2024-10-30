import {
    Connection,
    PublicKey,
    ParsedTransactionWithMeta,
    TokenBalance,
    ParsedInstruction,
  } from '@solana/web3.js';
  import { Swap, TradeType } from '../types';
  import { RPC_ENDPOINT } from '../config.js';
  
  const connection = new Connection(RPC_ENDPOINT!);
  
  const RAYDIUM_AMM_PROGRAM_ID = new PublicKey('routeUGWgWzqBWFcrCfv8tritsqukccJPu3q5GPP3xS');
  
  export async function parseRaydiumSwapTransaction(signature: string): Promise<Swap | null> {
    const transaction = await connection.getParsedTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });
  
    if (!transaction) {
      throw new Error('Transaction not found.');
    }
  
    if (!transaction.meta) {
      throw new Error('Transaction metadata not available.');
    }
  
    const isRaydiumSwap = transaction.transaction.message.instructions.some((instruction) => {
      const programId = new PublicKey(instruction.programId);
      return programId.equals(RAYDIUM_AMM_PROGRAM_ID);
    });
  
    if (!isRaydiumSwap) {
      return null;
    }
  
    const swapDetails = extractSwapDetails(transaction);
    if (!swapDetails) {
      return null; 
    }
  
    const {
      amountIn,
      amountOut,
      tokenMintIn,
      tokenMintOut,
      tokenDecimalsIn,
      type,
      poolId,
      signer,
    } = swapDetails;
  
    const swap: Swap = {
      signature,
      timestamp: (transaction.blockTime || 0) * 1000,
      tokenMint: tokenMintIn,
      tokenDecimals: tokenDecimalsIn,
      type,
      amountIn,
      amountOut,
      poolId,
      signer,
    };
  
    return swap;
  }
  
  function extractSwapDetails(transaction: ParsedTransactionWithMeta) {
    const preTokenBalances = transaction.meta?.preTokenBalances || [];
    const postTokenBalances = transaction.meta?.postTokenBalances || [];
  
    const preBalances = transaction.meta?.preBalances || [];
    const postBalances = transaction.meta?.postBalances || [];
  
    const preBalancesMap = new Map<number, TokenBalance | number>();
    preTokenBalances.forEach((tb) => {
      preBalancesMap.set(tb.accountIndex, tb);
    });
    preBalances.forEach((balance, index) => {
      if (!preBalancesMap.has(index)) {
        preBalancesMap.set(index, balance);
      }
    });
  
    const postBalancesMap = new Map<number, TokenBalance | number>();
    postTokenBalances.forEach((tb) => {
      postBalancesMap.set(tb.accountIndex, tb);
    });
    postBalances.forEach((balance, index) => {
      if (!postBalancesMap.has(index)) {
        postBalancesMap.set(index, balance);
      }
    });
  
    const balanceChanges: Array<{
      mint: string | null;
      amountChange: number;
      decimals: number; 
    }> = [];
  
    for (const [accountIndex, preBalance] of preBalancesMap.entries()) {
      const postBalance = postBalancesMap.get(accountIndex);
      if (postBalance !== undefined) {
        let amountChange = 0;
        let mint: string | null = null;
        let decimals = 0;
  
        if (typeof preBalance === 'number' && typeof postBalance === 'number') {
          amountChange = postBalance - preBalance;
          decimals = 9;
          mint = null; 
        } else if (
          typeof preBalance !== 'number' &&
          typeof postBalance !== 'number' &&
          preBalance.mint === postBalance.mint
        ) {
          amountChange =
            Number(postBalance.uiTokenAmount.amount) - Number(preBalance.uiTokenAmount.amount);
          decimals = preBalance.uiTokenAmount.decimals;
          mint = preBalance.mint;
        }
  
        balanceChanges.push({
          mint,
          amountChange,
          decimals,
        });
      }
    }
  
    let amountIn = 0;
    let amountOut = 0;
    let tokenMintIn = '';
    let tokenMintOut = '';
    let tokenDecimalsIn = 0;
    let type: TradeType;
    let solInvolved = false;
  
    balanceChanges.forEach((change) => {
      const amount = change.amountChange / Math.pow(10, change.decimals);
      if (change.amountChange < 0) {
        amountIn = -amount;
        tokenDecimalsIn = change.decimals;
  
        if (change.mint === null) {
          tokenMintIn = 'SOL';
          solInvolved = true;
        } else {
          tokenMintIn = change.mint;
        }
      } else if (change.amountChange > 0) {
        amountOut = amount;
  
        if (change.mint === null) {          
          tokenMintOut = 'SOL';
          solInvolved = true;
        } else {
          tokenMintOut = change.mint;
        }
      }
    });
  
    if (!solInvolved) {
      return null; 
    }
  
    // Determine trade type
    if (tokenMintIn === 'SOL') {
      type = 'SELL';
    } else if (tokenMintOut === 'SOL') {
      type = 'BUY'; 
    } else {
      type = 'SELL'; 
    }
  
    const poolId = getPoolIdFromTransaction(transaction);
    if (!poolId) {
      return null;
    }
  
    const signerAccount = transaction.transaction.message.accountKeys.find((account) => account.signer);
    const signer = signerAccount?.pubkey.toBase58() || '';
  
    return {
      amountIn,
      amountOut,
      tokenMintIn,
      tokenMintOut,
      tokenDecimalsIn,
      type,
      poolId,
      signer,
    };
  }
  
  function getPoolIdFromTransaction(transaction: ParsedTransactionWithMeta): string | null {
    const swapInstruction = transaction.transaction.message.instructions.find((instruction) => {
      const programId = new PublicKey(instruction.programId);
      return programId.equals(RAYDIUM_AMM_PROGRAM_ID);
    }) as ParsedInstruction | undefined;
  
    if (!swapInstruction) {
      return null;
    }
  
    if ('parsed' in swapInstruction && swapInstruction.parsed && 'info' in swapInstruction.parsed) {
      const parsedInfo = swapInstruction.parsed.info;
      const poolIdString = parsedInfo.ammId;
      return poolIdString || null;
    } else if ('accounts' in swapInstruction) {
      const accounts = swapInstruction.accounts as PublicKey[];
      const poolIdPublicKey = accounts[0];
      const poolId = poolIdPublicKey?.toBase58() || null;
      return poolId;
    }
  
    return null;
  }
  